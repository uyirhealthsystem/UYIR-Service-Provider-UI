import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkInDoctor, checkOutDoctor, assignDoctorToSeat, removeDoctorFromSeat, setDoctorActive } from "../../../api/hospital";
import { Avatar, Banner, C, Button, Card, Empty, Pill, Screen, SectionTitle } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { useHospitalStore } from "../../provider-state/store";

export default function HospitalDoctors({ navigation }: any) {
  const { hospitalId } = useHospitalStore();
  const { rows, seats, loading, error, reload } = useHospitalData();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showRemoved, setShowRemoved] = useState(false);

  const emptySeat = seats?.seats.find((s) => !s.doctorId);
  const q = search.trim().toLowerCase();
  const match = (r: { name: string; specialty: string }) => !q || `${r.name} ${r.specialty}`.toLowerCase().includes(q);
  const active = rows.filter((r) => r.active && match(r));
  const removed = rows.filter((r) => !r.active && match(r));

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
      </View>

      {active.length === 0 && !loading ? (
        <Empty icon="people-outline" title={search ? "No doctors match your search" : "No doctors yet"} hint={search ? undefined : "Tap Add to register your first doctor."} />
      ) : null}

      {active.map((r) => (
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
      ))}

      {removed.length > 0 ? (
        <>
          <SectionTitle
            title={`Removed doctors (${removed.length})`}
            right={<Pressable onPress={() => setShowRemoved((v) => !v)}><Text style={styles.link}>{showRemoved ? "Hide" : "Show"}</Text></Pressable>}
          />
          {showRemoved ? removed.map((r) => (
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
          )) : null}
        </>
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
});
