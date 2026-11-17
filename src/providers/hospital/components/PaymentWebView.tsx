import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { C } from "./ui";

/** How the checkout ended: "paid" | "failed" | "cancelled" as Razorpay reports it, or "closed" by the user. */
export type CheckoutResult = "paid" | "failed" | "cancelled" | "closed";

const APP_SCHEME = "serviceprovider://";

// Razorpay redirects to the payment-service's success URL with these query params appended
// (razorpay_payment_link_status=paid|cancelled|...). Seeing them means the checkout is over,
// whatever that success URL is, so we never need to load it.
function resultFromUrl(url: string): CheckoutResult | null {
  if (url.startsWith(APP_SCHEME)) return statusOf(url) ?? "paid";
  if (/[?&]razorpay_payment_link_status=/.test(url)) return statusOf(url) ?? "paid";
  return null;
}

function statusOf(url: string): CheckoutResult | null {
  const m = url.match(/[?&]razorpay_payment_link_status=([^&#]+)/);
  if (!m) return null;
  const s = decodeURIComponent(m[1]).toLowerCase();
  if (s === "paid") return "paid";
  if (s === "cancelled" || s === "expired") return "cancelled";
  return "failed";
}

// UPI apps (GPay, PhonePe, Paytm, BHIM...) are opened through upi://, intent:// or app-specific schemes.
// A WebView can't open those itself, so hand them to Android.
async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    const fallback = url.match(/S\.browser_fallback_url=([^;]+)/);
    if (fallback) {
      try { await Linking.openURL(decodeURIComponent(fallback[1])); return; } catch { /* fall through */ }
    }
    Alert.alert("App not installed", "Choose another payment method, such as a different UPI app or a card.");
  }
}

/** Full-screen Razorpay checkout inside the app. Calls onDone once, when the payment ends or the user closes it. */
export default function PaymentWebView({ url, onDone }: { url: string | null; onDone: (result: CheckoutResult) => void }) {
  const insets = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const finished = useRef(false);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Reset for each new checkout.
  const lastUrl = useRef<string | null>(null);
  if (url !== lastUrl.current) { lastUrl.current = url; finished.current = false; }

  const finish = (result: CheckoutResult) => {
    if (finished.current) return;
    finished.current = true;
    onDone(result);
  };

  const askClose = () => Alert.alert("Leave payment?", "If you already paid, your seats will still be added.", [
    { text: "Stay", style: "cancel" },
    { text: "Leave", style: "destructive", onPress: () => finish("closed") },
  ]);

  const onBackPress = () => (canGoBack ? web.current?.goBack() : askClose());

  const shouldLoad = (req: { url: string }) => {
    const result = resultFromUrl(req.url);
    if (result) { finish(result); return false; }
    if (!/^(https?|about|data|blob|javascript):/i.test(req.url)) { openExternal(req.url); return false; }
    return true;
  };

  // Backup for redirects that don't go through shouldLoad.
  const onNav = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    const result = resultFromUrl(nav.url);
    if (result) finish(result);
  };

  return (
    <Modal visible={!!url} animationType="slide" onRequestClose={onBackPress}>
      <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={askClose} hitSlop={12} style={styles.close} accessibilityLabel="Close payment">
            <Ionicons name="close" size={24} color={C.ink} />
          </Pressable>
          <Ionicons name="lock-closed" size={15} color={C.success} />
          <Text style={styles.title}>Secure payment</Text>
        </View>
        {url ? (
          <WebView
            ref={web}
            source={{ uri: url }}
            originWhitelist={["*"]}
            onShouldStartLoadWithRequest={shouldLoad}
            onNavigationStateChange={onNav}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            setSupportMultipleWindows={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
          />
        ) : null}
        {loading ? (
          <View style={[styles.loading, { top: insets.top + 52 }]} pointerEvents="none">
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.card },
  header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 52, borderBottomWidth: 1, borderBottomColor: C.line },
  close: { padding: 4, marginRight: 8 },
  title: { color: C.ink, fontSize: 16, fontWeight: "800" },
  loading: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
});
