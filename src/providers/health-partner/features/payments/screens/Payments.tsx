import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getPaymentHistory, getWallet, getWithdrawals, withdraw } from "../../../api/payments";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  IconBadge,
  ListRow,
  LoadingView,
  Pill,
  Screen,
  ScreenHeader,
  Segmented,
} from "../../../ui/components";
import { formatDateTime, listFrom, money, toNumber, withdrawalStatus } from "../../../ui/format";

// GET /payments            -> { walletBalance }
// GET /payments/history    -> reward credits [{ id, type, amount, description, createdAt }]
// GET /payments/withdrawals -> [{ id, amount, status, createdAt, processedAt }]
// POST /payments/withdraw  { amount } -> needs a saved bank account and enough balance.

type Tab = "rewards" | "withdrawals";

export default function Payments({ navigation }: any) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("rewards");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      setError("");
      const [walletData, historyData, withdrawalData] = await Promise.all([getWallet(), getPaymentHistory(), getWithdrawals()]);
      setBalance(toNumber(walletData?.walletBalance));
      setHistory(listFrom(historyData));
      setWithdrawals(listFrom(withdrawalData));
      loaded.current = true;
    } catch (loadError: any) {
      console.log("HP payment error:", loadError);
      setError(loadError?.message || "Unable to load your wallet.");
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

  const totalEarned = useMemo(() => history.reduce((sum, item) => sum + toNumber(item.amount), 0), [history]);
  const withdrawn = useMemo(
    () => withdrawals.filter((item) => withdrawalStatus(item.status).tone !== "red").reduce((sum, item) => sum + toNumber(item.amount), 0),
    [withdrawals],
  );

  if (loading && !loaded.current) return <LoadingView label="Loading your wallet..." />;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <ScreenHeader title="Wallet" subtitle="Your referral rewards and withdrawals." />
      {error ? <ErrorBanner message={error} onRetry={() => load(true)} /> : null}

      {/* Balance hero */}
      <View style={{ backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl, overflow: "hidden", ...shadow.card }}>
        <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, right: -70, top: -90, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <Text style={[typography.overline, { color: colors.brandOnDark }]}>AVAILABLE BALANCE</Text>
        <Text style={{ marginTop: spacing.sm, color: colors.white, fontSize: 34, fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
          {money(balance)}
        </Text>
        <View style={{ flexDirection: "row", marginTop: spacing.lg, gap: spacing.lg }}>
          <HeroStat label="Total earned" value={money(totalEarned)} />
          <HeroStat label="Withdrawn" value={money(withdrawn)} />
        </View>
        <Button
          label="Withdraw to bank"
          icon="arrow-up-circle-outline"
          variant="light"
          disabled={balance <= 0}
          onPress={() => setSheetOpen(true)}
          style={{ marginTop: spacing.lg }}
        />
        {balance <= 0 ? (
          <Text style={{ marginTop: spacing.sm, color: colors.brandOnDark, fontSize: 12, textAlign: "center" }}>
            Earn rewards from referrals to withdraw.
          </Text>
        ) : null}
      </View>

      {/* Account actions */}
      <Card padded={false} style={{ marginTop: spacing.md }}>
        <ListRow icon="card-outline" title="Bank account" subtitle="Where your withdrawals are sent" onPress={() => navigation.navigate("BankDetails")} />
        <ListRow
          icon="help-buoy-outline"
          tone="amber"
          title="Payment help"
          subtitle="A reward or withdrawal looks wrong?"
          onPress={() => navigation.navigate("PaymentIssue")}
          last
        />
      </Card>

      {/* History */}
      <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "rewards", label: `Rewards (${history.length})` },
            { value: "withdrawals", label: `Withdrawals (${withdrawals.length})` },
          ]}
        />
      </View>

      {tab === "rewards" ? (
        history.length ? (
          <Card padded={false}>
            {history.map((item, index) => (
              <TxRow
                key={item.id || index}
                icon="gift-outline"
                tone="green"
                title={item.description || "Referral reward"}
                time={formatDateTime(item.createdAt)}
                amount={`+${money(item.amount)}`}
                amountColor={colors.green}
                last={index === history.length - 1}
              />
            ))}
          </Card>
        ) : (
          <EmptyState icon="gift-outline" title="No rewards yet" message="Rewards appear here when your referrals complete." />
        )
      ) : withdrawals.length ? (
        <Card padded={false}>
          {withdrawals.map((item, index) => {
            const status = withdrawalStatus(item.status);
            return (
              <TxRow
                key={item.id || index}
                icon="arrow-up-circle-outline"
                tone="brand"
                title="Withdrawal to bank"
                time={formatDateTime(item.createdAt)}
                amount={`-${money(item.amount)}`}
                amountColor={colors.text}
                pill={<Pill label={status.label} tone={status.tone} />}
                last={index === withdrawals.length - 1}
              />
            );
          })}
        </Card>
      ) : (
        <EmptyState icon="arrow-up-circle-outline" title="No withdrawals yet" message="Withdrawals you request will show here with their status." />
      )}

      <WithdrawSheet
        visible={sheetOpen}
        balance={balance}
        onClose={() => setSheetOpen(false)}
        onAddBank={() => {
          setSheetOpen(false);
          navigation.navigate("BankDetails");
        }}
        onDone={() => {
          setSheetOpen(false);
          setTab("withdrawals");
          load();
        }}
      />
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.md, padding: spacing.md }}>
      <Text style={{ color: colors.brandOnDark, fontSize: 12 }}>{label}</Text>
      <Text style={{ marginTop: 2, color: colors.white, fontSize: 16, fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function TxRow({
  icon,
  tone,
  title,
  time,
  amount,
  amountColor,
  pill,
  last,
}: {
  icon: "gift-outline" | "arrow-up-circle-outline";
  tone: "green" | "brand";
  title: string;
  time: string;
  amount: string;
  amountColor: string;
  pill?: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}, ${amount}, ${time}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
      }}
    >
      <IconBadge icon={icon} tone={tone} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={typography.label} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.caption, { marginTop: 2 }]}>{time}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ color: amountColor, fontWeight: "800", fontSize: 15 }}>{amount}</Text>
        {pill}
      </View>
    </View>
  );
}

function WithdrawSheet({
  visible,
  balance,
  onClose,
  onAddBank,
  onDone,
}: {
  visible: boolean;
  balance: number;
  onClose: () => void;
  onAddBank: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [needsBank, setNeedsBank] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const value = Number(amount);
  const quick = [50, 100, 500].filter((n) => n < balance);

  const reset = () => {
    setAmount("");
    setError("");
    setNeedsBank(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    Keyboard.dismiss();
    if (!amount || !Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than ₹0.");
      return;
    }
    if (value > balance) {
      setError(`You can withdraw up to ${money(balance)}.`);
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setNeedsBank(false);
      await withdraw(Math.round(value * 100) / 100);
      reset();
      Alert.alert("Withdrawal requested", `${money(value)} will be sent to your bank account. You can track it under Withdrawals.`);
      onDone();
    } catch (e: any) {
      const message = String(e?.message || "Unable to withdraw. Please try again.");
      if (/bank account/i.test(message)) {
        setNeedsBank(true);
        setError("Add your bank account first, then try again.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(15,31,43,0.4)" }} onPress={close} accessibilityLabel="Close" />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          }}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.lg }} />
          <Text style={typography.title}>Withdraw to bank</Text>
          <Text style={[typography.body, { marginTop: 4, marginBottom: spacing.lg }]}>Available: {money(balance)}</Text>

          <Field
            label="Amount"
            required
            icon="cash-outline"
            value={amount}
            onChangeText={(text) => {
              setAmount(text.replace(/[^0-9.]/g, ""));
              setError("");
            }}
            placeholder="0"
            keyboardType="decimal-pad"
            error={error && !needsBank ? error : undefined}
            autoFocus
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.lg }}>
            {quick.map((n) => (
              <Button key={n} label={money(n, { decimals: 0 })} variant="ghost" compact onPress={() => setAmount(String(n))} />
            ))}
            <Button label="Full balance" variant="secondary" compact onPress={() => setAmount(String(balance))} />
          </View>

          {needsBank ? (
            <Banner tone="amber" message={error} actionLabel="Add bank" onAction={onAddBank} style={{ marginBottom: spacing.lg }} />
          ) : null}

          <Button label={value > 0 ? `Withdraw ${money(value)}` : "Withdraw"} onPress={submit} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
