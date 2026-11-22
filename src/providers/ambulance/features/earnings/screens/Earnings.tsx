import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getEarningsSummary } from "../../../api/bookings";
import { tripHistoryErrorMessage } from "../../../api/errors";
import { dropAddress, formatMoney, formatTripDate } from "../../../domain/trip";
import { colors, radius, spacing, typography } from "../../../theme";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  InfoRow,
  ScreenHeader,
  SectionTitle,
} from "../../../ui/components";

type Summary = Awaited<ReturnType<typeof getEarningsSummary>>;

export default function Earnings() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setSummary(await getEarningsSummary());
      setError("");
    } catch (loadError) {
      setError(tripHistoryErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function refresh() {
    setRefreshing(true);
    void load();
  }

  function retry() {
    setLoading(true);
    void load();
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <ScreenHeader title="Earnings" subtitle="Fares from your paid trips" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading && !summary ? (
          <ActivityIndicator style={styles.loading} color={colors.blue} />
        ) : null}

        {error && !summary && !loading ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Unable to load earnings"
            message={error}
            action={<Button title="Try again" variant="secondary" compact onPress={retry} />}
          />
        ) : null}

        {summary ? (
          <>
            {error ? <ErrorBanner message={error} /> : null}

            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total earned</Text>
              <Text style={styles.heroValue}>{formatMoney(summary.totalEarnings)}</Text>
              <View style={styles.periods}>
                <Period label="Today" value={summary.periods.today} />
                <Period label="Last 7 days" value={summary.periods.last7Days} />
                <Period label="This month" value={summary.periods.thisMonth} />
              </View>
            </View>

            <SectionTitle title="Summary" />
            <Card style={styles.rows}>
              <InfoRow
                icon="checkmark-circle-outline"
                label="Paid trips"
                value={String(summary.completedTrips)}
              />
              <InfoRow
                icon="time-outline"
                label={`Awaiting payment (${summary.pendingTrips})`}
                value={formatMoney(summary.pendingAmount)}
              />
              <InfoRow
                icon="car-outline"
                label="All trips"
                value={String(summary.totalTrips)}
                last
              />
            </Card>

            <SectionTitle title="Recent paid trips" />
            {summary.recentTrips.length === 0 ? (
              <Card>
                <EmptyState
                  icon="wallet-outline"
                  title="No paid trips yet"
                  message="Your earnings will appear here after a patient pays."
                />
              </Card>
            ) : (
              <Card style={styles.rows}>
                {summary.recentTrips.map((trip, index) => (
                  <View
                    key={trip.id}
                    style={[
                      styles.trip,
                      index < summary.recentTrips.length - 1 ? styles.tripDivider : null,
                    ]}
                  >
                    <View style={styles.tripText}>
                      <Text style={typography.label} numberOfLines={1}>
                        {dropAddress(trip.drop)}
                      </Text>
                      <Text style={typography.caption}>{formatTripDate(trip)}</Text>
                    </View>
                    <Text style={styles.tripFare}>{formatMoney(trip.fare)}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Period({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.period}>
      <Text style={styles.periodValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value)}
      </Text>
      <Text style={styles.periodLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  loading: { marginTop: spacing.xxl },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroLabel: { fontSize: 14, lineHeight: 20, color: "#C4D0E0" },
  heroValue: { ...typography.display, color: colors.white, marginTop: 2 },
  periods: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
  },
  period: { flex: 1 },
  periodValue: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: colors.white },
  periodLabel: { fontSize: 12, lineHeight: 16, color: "#C4D0E0" },
  rows: { paddingVertical: spacing.xs },
  trip: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  tripDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tripText: { flex: 1 },
  tripFare: { ...typography.label, color: colors.green },
});
