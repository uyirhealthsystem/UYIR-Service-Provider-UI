import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTripHistory } from "../../../api/bookings";
import { tripHistoryErrorMessage } from "../../../api/errors";
import {
  dropAddress,
  emergencyLabel,
  formatMoney,
  formatTripDate,
  pickupAddress,
  statusLabel,
  statusTone,
} from "../../../domain/trip";
import { colors, radius, spacing, typography } from "../../../theme";
import type { Booking, BookingStatus } from "../../../types";
import { Badge, Button, Card, EmptyState, ErrorBanner, ScreenHeader } from "../../../ui/components";

const PAGE_SIZE = 20;

const FILTERS: { label: string; status?: BookingStatus }[] = [
  { label: "All" },
  { label: "Completed", status: "COMPLETED" },
  { label: "Awaiting payment", status: "PAYMENT_PENDING" },
  { label: "Cancelled", status: "CANCELLED" },
];

export default function Bookings() {
  const [filter, setFilter] = useState<BookingStatus | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const nextPage = useRef(0);
  // Answers for a filter the driver has already left are ignored.
  const latestRequest = useRef(0);

  const loadFirstPage = useCallback(async (status: BookingStatus | undefined) => {
    latestRequest.current += 1;
    const request = latestRequest.current;
    try {
      const result = await getTripHistory({ page: 0, size: PAGE_SIZE, status });
      if (request !== latestRequest.current) return;
      setBookings(result.bookings);
      setTotal(result.totalBookings);
      nextPage.current = 1;
      setError("");
    } catch (loadError) {
      if (request === latestRequest.current) setError(tripHistoryErrorMessage(loadError));
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage(filter);
    }, [filter, loadFirstPage]),
  );

  function selectFilter(status: BookingStatus | undefined) {
    if (status === filter) return;
    setBookings([]);
    setTotal(0);
    setError("");
    setLoading(true);
    setFilter(status);
  }

  async function loadMore() {
    if (loadingMore || loading || refreshing || bookings.length >= total) return;
    const request = latestRequest.current;
    try {
      setLoadingMore(true);
      const result = await getTripHistory({
        page: nextPage.current,
        size: PAGE_SIZE,
        status: filter,
      });
      if (request !== latestRequest.current) return;
      nextPage.current += 1;
      setTotal(result.totalBookings);
      setBookings((current) => {
        const known = new Set(current.map((booking) => booking.id));
        return [...current, ...result.bookings.filter((booking) => !known.has(booking.id))];
      });
    } catch (loadError) {
      if (request === latestRequest.current) setError(tripHistoryErrorMessage(loadError));
    } finally {
      setLoadingMore(false);
    }
  }

  function refresh() {
    setRefreshing(true);
    void loadFirstPage(filter);
  }

  function retry() {
    setLoading(true);
    setError("");
    void loadFirstPage(filter);
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <ScreenHeader
        title="Trips"
        subtitle={loading ? " " : total === 1 ? "1 trip" : `${total} trips`}
      />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map(({ label, status }) => {
            const selected = status === filter;
            return (
              <Pressable
                key={label}
                onPress={() => selectFilter(status)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.filter, selected ? styles.filterSelected : null]}
              >
                <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(booking) => booking.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <TripCard booking={item} />}
        ListHeaderComponent={
          error && bookings.length > 0 ? <ErrorBanner message={error} /> : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={colors.blue} />
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Unable to load trips"
              message={error}
              action={<Button title="Try again" variant="secondary" compact onPress={retry} />}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="No trips here"
              message="Trips you accept will appear in this list."
            />
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.blue} /> : null
        }
      />
    </SafeAreaView>
  );
}

function TripCard({ booking }: { booking: Booking }) {
  const reason = emergencyLabel(booking.emergencyType);

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={typography.label} numberOfLines={1}>
            {booking.contactName || "Patient"}
          </Text>
          <Text style={typography.caption}>{formatTripDate(booking)}</Text>
        </View>
        <Badge label={statusLabel(booking.status)} tone={statusTone(booking.status)} />
      </View>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={[styles.dot, styles.dotPickup]} />
          <View style={styles.line} />
          <View style={[styles.dot, styles.dotDrop]} />
        </View>
        <View style={styles.addresses}>
          <Text style={typography.body} numberOfLines={2}>
            {pickupAddress(booking.pickup)}
          </Text>
          <Text style={typography.body} numberOfLines={2}>
            {dropAddress(booking.drop)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={typography.caption} numberOfLines={1}>
          {reason ?? (booking.type === "SCHEDULED" ? "Scheduled trip" : "Emergency")}
        </Text>
        <Text style={styles.fare}>{formatMoney(booking.fare)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filter: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextSelected: { color: colors.white },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
  },
  loading: { marginTop: spacing.xxl },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardTitle: { flex: 1 },
  route: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  timeline: { alignItems: "center", paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotPickup: { backgroundColor: colors.blue },
  dotDrop: { backgroundColor: colors.green },
  line: { flex: 1, width: 2, minHeight: 14, backgroundColor: colors.border, marginVertical: 2 },
  addresses: { flex: 1, gap: spacing.md },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  fare: { ...typography.heading },
});
