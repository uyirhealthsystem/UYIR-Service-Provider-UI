import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";

import { useAuth } from "../../../../../auth/store";
import { getProfile } from "../../../api/profile";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import { Avatar, Button, Card, ErrorBanner, ListRow, LoadingView, Pill, Screen, ScreenHeader } from "../../../ui/components";
import { formatDate, initials } from "../../../ui/format";

// GET /profile -> HP profile incl. referralCode, status, district / block /
// village names (health-partner.query.ts).

export default function Profile({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      setError("");
      setProfile(await getProfile());
      loaded.current = true;
    } catch (loadError: any) {
      console.log("HP profile error:", loadError);
      setError(loadError?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmLogout = () =>
    Alert.alert("Log out?", "You'll need your email, password and a login code to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);

  if (loading && !loaded.current) return <LoadingView label="Loading your profile..." />;

  const name = profile?.fullName || "Health Partner";
  const active = String(profile?.status || "ACTIVE").toUpperCase() === "ACTIVE";
  const location = [profile?.villageName, profile?.blockName, profile?.districtName].filter(Boolean).join(", ");

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <ScreenHeader title="Profile" />
      {error ? <ErrorBanner message={error} onRetry={() => load(true)} /> : null}

      {/* Identity card */}
      <View style={{ backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl, overflow: "hidden", ...shadow.card }}>
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, right: -60, top: -80, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <Avatar label={initials(name)} size={64} onDark />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontSize: 20, fontWeight: "800" }} numberOfLines={2}>
              {name}
            </Text>
            <Text style={{ color: colors.brandOnDark, fontSize: 13, marginTop: 2 }}>Health Partner</Text>
            <View style={{ marginTop: spacing.sm }}>
              <Pill label={active ? "Active" : "Inactive"} tone={active ? "green" : "neutral"} icon={active ? "checkmark-circle" : "pause-circle"} />
            </View>
          </View>
        </View>
        {profile?.referralCode ? (
          <View
            style={{
              marginTop: spacing.lg,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text style={{ color: colors.brandOnDark, fontSize: 12 }}>Referral code</Text>
            <Text selectable style={{ color: colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 2 }}>
              {profile.referralCode}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Contact summary */}
      <Card padded={false} style={{ marginTop: spacing.md }}>
        <ListRow icon="call-outline" title={profile?.phone || "No phone added"} subtitle="Mobile number" />
        <ListRow icon="mail-outline" title={profile?.email || "No email added"} subtitle="Email" />
        <ListRow icon="location-outline" title={location || "No area set"} subtitle="Working area" />
        <ListRow icon="calendar-outline" title={formatDate(profile?.createdAt)} subtitle="Partner since" last />
      </Card>

      <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>ACCOUNT</Text>
      <Card padded={false}>
        <ListRow icon="create-outline" title="Edit personal details" subtitle="Name, phone, address, area" onPress={() => navigation.navigate("EditProfile")} />
        <ListRow icon="card-outline" title="Bank account" subtitle="Where withdrawals are sent" onPress={() => navigation.navigate("BankDetails")} last />
      </Card>

      <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>EARN & SUPPORT</Text>
      <Card padded={false}>
        <ListRow icon="gift-outline" tone="violet" title="Refer & earn" subtitle="Share your referral code" onPress={() => navigation.navigate("ReferHub")} />
        <ListRow icon="help-buoy-outline" tone="amber" title="Payment help" subtitle="Questions about rewards or withdrawals" onPress={() => navigation.navigate("PaymentIssue")} last />
      </Card>

      <Button label="Log out" icon="log-out-outline" variant="danger" onPress={confirmLogout} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}
