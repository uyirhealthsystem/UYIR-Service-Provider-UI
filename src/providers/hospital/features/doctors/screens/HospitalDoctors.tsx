import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkInDoctor, checkOutDoctor, assignDoctorToSeat, removeDoctorFromSeat, setDoctorActive } from "../../../api/hospital";
import { Avatar, Banner, C, Button, Card, Chip, Empty, Pill, Screen, SectionTitle } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { useHospitalStore } from "../../provider-state/store";

type Row = ReturnType<typeof useHospitalData>["rows"][number];
type SectionKey = "AVAILABLE" | "NOT_AVAILABLE" | "NO_SEAT";
type StatusFilter = "ALL" | SectionKey | "REMOVED";

// Doctors are grouped by what the hospital needs to act on: who is taking patients now,
// who is seated but checked out, and who still needs a seat before patients can book them.
const SECTIONS: [SectionKey, string][] = [
  ["AVAILABLE", "Available now"],
  ["NOT_AVAILABLE", "In a seat · not available"],
  ["NO_SEAT", "No seat"],
];
const STATUS_FILTERS: [StatusFilter, string][] = [
  ["ALL", "All"],
  ["AVAILABLE", "Available"],
  ["NOT_AVAILABLE", "Not available"],
  ["NO_SEAT", "No seat"],
  ["REMOVED", "Removed"],
];

export default function HospitalDoctors({ navigation }: any) {
  const { hospitalId } = useHospitalStore();
  const { rows, seats, loading, error, reload } = useHospitalData();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [specialty, setSpecialty] = useState("");
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionKey, boolean>>>({});

  const emptySeat = seats?.seats.find((s) => !s.doctorId);

  // Specialties in use, A-Z (from all doctors, so the chips don't jump around while filtering).
  const specialties = useMemo(
    () => Array.from(new Set(rows.map((r) => r.specialty).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  // Search + specialty first; the status chips then show counts within that.
  const q = search.trim().toLowerCase();
  const matched = useMemo(
    () => rows
      .filter((r) => (!q || `${r.name} ${r.specialty}`.toLowerCase().includes(q)) && (!specialty || r.specialty === specialty))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, q, specialty],
  );
  const activeList = matched.filter((r) => r.active);
  const removedList = matched.filter((r) => !r.active);
  const groups: Record<SectionKey, Row[]> = {
    AVAILABLE: activeList.filter((r) => r.seated && r.onDuty),
    NOT_AVAILABLE: activeList.filter((r) => r.seated && !r.onDuty),
    NO_SEAT: activeList.filter((r) => !r.seated),
  };
  const counts: Record<StatusFilter, number> = {
    ALL: activeList.length,
    AVAILABLE: groups.AVAILABLE.length,
    NOT_AVAILABLE: groups.NOT_AVAILABLE.length,
    NO_SEAT: groups.NO_SEAT.length,
    REMOVED: removedList.length,
  };
  const sections = SECTIONS
    .filter(([key]) => status === "ALL" || status === key)
    .map(([key, title]) => ({ key, title, items: groups[key] }));
  const shown = counts[status];
  const filtersOn = !!q || !!specialty || status !== "ALL";
  const clearFilters = () => { setSearch(""); setSpecialty(""); setStatus("ALL"); };
  const toggleSection = (key: SectionKey) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const buySeat = () => navigation.navigate("HospitalAssign", { buy: true });

  // Adding doctors is not limited by seats — any number can be added. Seats only control who is bookable.
  const onAdd = () => navigation.navigate("HospitalDoctorForm");

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try { await fn(); await reload(); }
    catch (e: any) { Alert.alert("Could not update", e?.message || "Please try again."); }
    finally { setBusyId(""); }
  };

  const toggleAvailable = (r: (typeof rows)[number], on: boolean) => {
    if (!r.seated) {
      Alert.alert("Seat needed", "Put this doctor in a seat before turning availability on.", [{ text: "OK" }]);
      return;
    }
    if (!hospitalId) {
      Alert.alert("Please wait", "Hospital profile is still loading. Try again in a moment.");
      return;
    }
    // ON = check-in (POST /doctors/{id}/check-in), OFF = check-out. Does NOT deactivate the doctor.
    run(r.id, async () => { if (on) await checkInDoctor(r.id, hospitalId); else await checkOutDoctor(r.id); });
  };

  const assignSeat = (r: (typeof rows)[number]) => {
    if (!emptySeat) {
      Alert.alert("No free seat", "Buy a seat to place this doctor.", [{ text: "Cancel", style: "cancel" }, { text: "Buy a seat", onPress: buySeat }]);
      return;
    }
    run(r.id, async () => { await assignDoctorToSeat(emptySeat.id, r.id); });
  };

  const remove = (r: (typeof rows)[number]) => {
    Alert.alert(
      `Remove ${r.name}?`,
      "The doctor is taken off their seat (the seat becomes free for another doctor) and patients can no longer book them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: () => run(r.id, async () => {
            if (r.onDuty) { try { await checkOutDoctor(r.id); } catch { /* best effort */ } }
            if (r.seatId) await removeDoctorFromSeat(r.seatId); // 409 while upcoming appointments exist
            await setDoctorActive(r.id, false);
          }),
        },
      ],
    );
  };

  const renderDoctor = (r: Row) => (
    <Card key={r.id}>
      <View style={styles.top}>
        <Avatar name={r.name} />
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate("HospitalDoctorDashboard", { doctorId: r.id, raw: r.raw })}>
          <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{r.specialty}{r.fee ? ` · ₹${r.fee}` : ""}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            {r.seated ? <Pill text={r.seatType === "FREE" ? "Free seat" : "Paid seat"} tone="primary" /> : <Pill text="No seat" tone="warn" />}
            <Pill text="View dashboard ›" tone="gray" />
          </View>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => navigation.navigate("HospitalDoctorForm", { doctor: r.raw })} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={20} color={C.primary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => remove(r)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color={C.danger} />
        </Pressable>
      </View>

      <View style={styles.availRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.availTitle}>{r.onDuty ? "Available" : "Not available"}</Text>
          <Text style={styles.availSub}>
            {r.seated ? (r.onDuty ? "Checked in · receives emergency (SOS) requests" : "Checked out · no emergency requests") : "Place in a seat to enable"}
          </Text>
        </View>
        {r.seated ? (
          <Switch
            value={r.onDuty} disabled={busyId === r.id}
            onValueChange={(on) => toggleAvailable(r, on)}
            trackColor={{ true: C.success, false: "#CBD5E1" }} thumbColor="#fff"
          />
        ) : (
          <Button small title="Assign seat" variant="secondary" loading={busyId === r.id} onPress={() => assignSeat(r)} />
        )}
      </View>

      <View style={styles.footRow}>
        <Text style={styles.foot}>
          Today: <Text style={styles.footBold}>{r.booked}</Text>{r.limit != null ? ` / ${r.limit}` : ""} tokens
        </Text>
        <Pressable onPress={() => navigation.navigate("HospitalSlots", { doctorId: r.id })}>
          <Text style={styles.link}>Token limit</Text>
        </Pressable>
      </View>
    </Card>
  );

  const renderRemoved = (r: Row) => (
    <Card key={r.id} style={{ opacity: 0.9 }}>
      <View style={styles.top}>
        <Avatar name={r.name} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{r.specialty}</Text>
        </View>
        <Button small variant="secondary" title="Restore" loading={busyId === r.id} onPress={() => restore(r)} />
      </View>
    </Card>
  );

  const restore = (r: (typeof rows)[number]) => run(r.id, async () => {
    await setDoctorActive(r.id, true);
    if (emptySeat) await assignDoctorToSeat(emptySeat.id, r.id);
    else Alert.alert("Doctor restored", "No free seat right now. Buy a seat so patients can book this doctor.", [
      { text: "Later", style: "cancel" }, { text: "Buy a seat", onPress: buySeat },
    ]);
  });

  return (
    <Screen
      title="Doctors" subtitle={seats ? `${seats.occupied} of ${seats.total} seats used` : undefined}
      onRefresh={reload} refreshing={loading}
      right={<Button small title="Add" icon="add" onPress={onAdd} />}
    >
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}

      {/* Seats summary */}
      <Card style={styles.seatCard}>
        <View style={styles.seatIcon}><Ionicons name="grid" size={20} color={C.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.seatTitle}>
            {seats ? (seats.empty > 0 ? `${seats.empty} empty seat${seats.empty === 1 ? "" : "s"}` : "No empty seats") : "Seats"}
          </Text>
          <Text style={styles.seatSub}>Add as many doctors as you like. Only doctors in a seat can be booked. 1 seat is free. Extra seats are paid{seats?.price ? ` · ₹${seats.price} each` : ""}.</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Button small title="Buy seats" icon="card-outline" onPress={buySeat} />
          <Button small variant="secondary" title="Manage" onPress={() => navigation.navigate("HospitalAssign")} />
        </View>
      </Card>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={C.gray} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search name or specialty" placeholderTextColor="#9AA6B7" style={styles.searchInput} />
        {search ? (
          <Pressable hitSlop={8} onPress={() => setSearch("")} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={C.gray} />
          </Pressable>
        ) : null}
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_FILTERS.map(([key, label]) => (
          <Chip key={key} label={`${label} (${counts[key]})`} active={status === key} onPress={() => setStatus(key)} />
        ))}
      </ScrollView>

      {/* Specialty filter: only worth showing when there is more than one */}
      {specialties.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All specialties" active={!specialty} onPress={() => setSpecialty("")} />
          {specialties.map((s) => <Chip key={s} label={s} active={specialty === s} onPress={() => setSpecialty(specialty === s ? "" : s)} />)}
        </ScrollView>
      ) : null}

      {filtersOn ? (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{`${shown} doctor${shown === 1 ? "" : "s"} found`}</Text>
          <Pressable onPress={clearFilters}><Text style={styles.link}>Clear filters</Text></Pressable>
        </View>
      ) : null}

      {rows.length === 0 && !loading ? (
        <Empty icon="people-outline" title="No doctors yet" hint="Tap Add to register your first doctor." />
      ) : rows.length > 0 && shown === 0 ? (
        <Empty icon="search-outline" title="No doctors match" hint="Try another name, specialty or filter." />
      ) : null}

      {status === "REMOVED"
        ? removedList.map(renderRemoved)
        : sections.map((sec) => sec.items.length === 0 ? null : (
          <View key={sec.key}>
            <SectionTitle
              title={`${sec.title} (${sec.items.length})`}
              right={
                <Pressable hitSlop={8} onPress={() => toggleSection(sec.key)}>
                  <Text style={styles.link}>{collapsed[sec.key] ? "Show" : "Hide"}</Text>
                </Pressable>
              }
            />
            {collapsed[sec.key] ? null : sec.items.map(renderDoctor)}
          </View>
        ))}

      {status === "ALL" && removedList.length > 0 ? (
        <Pressable onPress={() => setStatus("REMOVED")} style={styles.removedLink}>
          <Text style={styles.link}>{`Removed doctors (${removedList.length}) ›`}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seatCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  seatIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  seatTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  seatSub: { fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 16 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 11, color: C.ink, fontSize: 15 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  availRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line },
  availTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  availSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  foot: { fontSize: 12.5, color: C.muted },
  footBold: { fontWeight: "800", color: C.ink },
  link: { color: C.primary, fontWeight: "700", fontSize: 13 },
  chips: { gap: 8, paddingBottom: 10 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  resultText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  removedLink: { alignItems: "center", paddingVertical: 14 },
});
