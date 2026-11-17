import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, C, KV, Panel, Pill, Screen } from "../../../components/ui";
import { fmtDateTime } from "../../../utils/format";
import { useHospitalStore } from "../../provider-state/store";
import { HOSPITAL_TYPES, OWNERSHIP_TYPES, labelOf } from "../constants";

const yes = (v?: boolean) => (v ? "Yes" : "No");
const join = (v?: string[]) => (v && v.length ? v.join(", ") : "—");

/** Read-only view of GET /me with an Edit entry per section. */
export default function HospitalProfile({ navigation }: any) {
  const { hospital: h, refreshHospital } = useHospitalStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = async () => { setRefreshing(true); await refreshHospital(); setRefreshing(false); };
  const edit = (step: number) => navigation.navigate("HospitalProfileForm", { step });

  if (!h) return <Screen title="Hospital profile" onBack={() => navigation.goBack()}><Text style={styles.muted}>Loading…</Text></Screen>;

  const a = h.address || {}, c = h.contactDetails || {}, f = h.facilities || {}, e = h.emergencyServices || {};
  const st = h.staffDetails || {}, o = h.operations || {}, sn = h.surgicalNetwork || {};
  const beds = f.bedCapacity || {};
  const scans = o.scansAvailable || {};
  const scanList = [scans.usg && "USG", scans.xray && "X-Ray", scans.ct && "CT", scans.mri && "MRI", ...(scans.other || [])].filter(Boolean) as string[];
  const editBtn = (step: number) => <Text style={styles.edit} onPress={() => edit(step)}>Edit</Text>;

  return (
    <Screen title="Hospital profile" onBack={() => navigation.goBack()} onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="business" size={26} color="#fff" /></View>
        <Text style={styles.heroName}>{h.hospitalName}</Text>
        <Text style={styles.heroSub}>{labelOf(HOSPITAL_TYPES, h.hospitalType)} · {labelOf(OWNERSHIP_TYPES, h.ownershipType)}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Pill text={h.active === false ? "INACTIVE" : "ACTIVE"} tone={h.active === false ? "danger" : "success"} />
          {e.handlesEmergencies ? <Pill text="EMERGENCY" tone="danger" /> : null}
          {sn.joinedSurgicalNetwork ? <Pill text="SURGICAL NETWORK" tone="primary" /> : null}
        </View>
      </View>

      <Panel title="Registration" icon="document-text-outline" right={editBtn(0)}>
        <View style={styles.grid}>
          <KV label="Registration no." value={h.registrationNumber} />
          <KV label="Hospital ID" value={h.id} />
          <KV label="Registered" value={h.createdAt ? fmtDateTime(h.createdAt) : null} />
          <KV label="Last updated" value={h.updatedAt ? fmtDateTime(h.updatedAt) : null} />
        </View>
      </Panel>

      <Panel title="Address & contact" icon="location-outline" right={editBtn(1)}>
        <View style={styles.grid}>
          <KV wide label="Address" value={[a.addressLine, a.city, a.district, a.state, a.pincode].filter(Boolean).join(", ")} />
          <KV label="Phone" value={c.phone} />
          <KV label="Emergency hotline" value={c.emergencyHotline} />
          <KV label="Email" value={c.email} />
          <KV label="Website" value={c.website} />
          <KV label="Map location" value={a.location?.coordinates ? "Pinned" : "Not set"} />
        </View>
      </Panel>

      <Panel title="Facilities" icon="bed-outline" right={editBtn(2)}>
        <View style={styles.beds}>
          {[["General", beds.general], ["ICU", beds.icu], ["NICU", beds.nicu]].map(([l, v]) => (
            <View key={String(l)} style={styles.bed}><Text style={styles.bedVal}>{v ?? 0}</Text><Text style={styles.bedLabel}>{l} beds</Text></View>
          ))}
        </View>
        <View style={styles.grid}>
          <KV wide label="Departments" value={join(f.specialtyDepartments)} />
          <KV label="Lab" value={yes(f.diagnosticUnits?.lab)} />
          <KV label="Scan centre" value={yes(f.diagnosticUnits?.scanCentre)} />
          <KV label="Pathology" value={yes(f.diagnosticUnits?.pathology)} />
          <KV label="Lab name" value={f.labDetails?.labName} />
        </View>
      </Panel>

      <Panel title="Emergency & ambulance" icon="medkit-outline" right={editBtn(3)}>
        <View style={styles.grid}>
          <KV label="Handles emergencies" value={yes(e.handlesEmergencies)} />
          <KV label="Ambulance" value={e.ambulanceAvailable ? join(e.ambulanceTypes) : "No"} />
          <KV label="24×7 ambulance" value={yes(e.ambulance24x7Available)} />
          <KV label="Attach to UDHS" value={yes(e.willingToAttachAmbulanceToUdhs)} />
          <KV wide label="Conditions handled" value={join(e.specialtyEmergencyConditionsHandled)} />
        </View>
      </Panel>

      <Panel title="Staff & operations" icon="people-outline" right={editBtn(4)}>
        <View style={styles.grid}>
          <KV label="Nursing staff" value={st.nursingStaffCount} />
          <KV label="Supportive staff" value={st.supportiveStaffCount} />
          <KV wide label="UDHS contacts" value={(st.udhsStaff || []).map((s: any) => `${s.name} (${s.designation || "—"}) ${s.mobileNumber}`).join("\n") || "—"} />
          <KV label="Insured" value={yes(o.hospitalInsured)} />
          <KV label="Pharmacy" value={yes(o.dedicatedPharmacyAvailable)} />
          <KV wide label="Scans" value={join(scanList)} />
          <KV wide label="Empanelled insurers" value={join(o.empanelledInsuranceCompanies)} />
        </View>
      </Panel>

      <Panel title="Surgical network" icon="cut-outline" right={editBtn(5)}>
        {sn.joinedSurgicalNetwork ? (
          <View style={styles.grid}>
            <KV label="Operation theatres" value={sn.operationTheatreCount} />
            <KV label="Laser" value={yes(sn.laserEquipmentAvailable)} />
            <KV label="Minimally invasive" value={yes(sn.minimallyInvasiveEquipmentAvailable)} />
            <KV label="Post-op recovery" value={yes(sn.postOpRecoveryRoomAvailable)} />
            <KV label="Endoscopy" value={yes(sn.endoscopyAvailable)} />
            <KV label="Laparoscopy" value={yes(sn.laparoscopyUnitsAvailable)} />
          </View>
        ) : <Text style={[styles.muted, { paddingVertical: 6 }]}>Not part of the surgical network.</Text>}
      </Panel>

      <Button title="Edit full profile" icon="create-outline" variant="secondary" onPress={() => edit(0)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: C.muted, fontSize: 13 },
  hero: { alignItems: "center", backgroundColor: C.primary, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  heroName: { color: "#fff", fontSize: 19, fontWeight: "800", marginTop: 10, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 3 },
  edit: { color: C.primary, fontWeight: "800", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  beds: { flexDirection: "row", gap: 8, marginBottom: 6 },
  bed: { flex: 1, backgroundColor: C.bg, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  bedVal: { fontSize: 20, fontWeight: "800", color: C.ink },
  bedLabel: { fontSize: 11.5, color: C.muted, marginTop: 2 },
});
