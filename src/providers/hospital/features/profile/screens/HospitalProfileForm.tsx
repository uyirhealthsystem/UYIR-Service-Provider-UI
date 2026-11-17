import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getEmergencyConditions, getSpecialties, updateHospital } from "../../../api/hospital";
import Sheet from "../../../components/Sheet";
import { Button, C, ChipSelect, ErrorText, Field, Panel, Screen, SwitchRow } from "../../../components/ui";
import { asList } from "../../../utils/format";
import { useHospitalStore } from "../../provider-state/store";
import { AMBULANCE_TYPES, DISTRICTS, HOSPITAL_TYPES, OWNERSHIP_TYPES } from "../constants";

const STEPS = [
  { key: "basics", title: "Basics", icon: "business-outline" },
  { key: "contact", title: "Address", icon: "location-outline" },
  { key: "facilities", title: "Facilities", icon: "bed-outline" },
  { key: "emergency", title: "Emergency", icon: "medkit-outline" },
  { key: "staff", title: "Staff & Ops", icon: "people-outline" },
  { key: "surgical", title: "Surgical", icon: "cut-outline" },
] as const;

type Staff = { name: string; mobileNumber: string; designation: string };

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Build form state from a HospitalResponse. */
function initial(h: any) {
  const a = h?.address || {}, c = h?.contactDetails || {}, f = h?.facilities || {}, e = h?.emergencyServices || {};
  const st = h?.staffDetails || {}, o = h?.operations || {}, sn = h?.surgicalNetwork || {};
  const coords: number[] = a.location?.coordinates || [];
  return {
    hospitalName: str(h?.hospitalName), registrationNumber: str(h?.registrationNumber),
    ownershipType: h?.ownershipType || "", hospitalType: h?.hospitalType || "",
    addressLine: str(a.addressLine), city: str(a.city), district: str(a.district), state: str(a.state) || "Tamil Nadu",
    country: str(a.country) || "India", pincode: str(a.pincode),
    lng: coords.length === 2 ? coords[0] : null as number | null, lat: coords.length === 2 ? coords[1] : null as number | null,
    phone: str(c.phone), alternatePhone: str(c.alternatePhone), email: str(c.email), emergencyHotline: str(c.emergencyHotline), website: str(c.website),
    general: str(f.bedCapacity?.general), icu: str(f.bedCapacity?.icu), nicu: str(f.bedCapacity?.nicu),
    specialtyDepartments: (f.specialtyDepartments || []) as string[],
    lab: !!f.diagnosticUnits?.lab, scanCentre: !!f.diagnosticUnits?.scanCentre, pathology: !!f.diagnosticUnits?.pathology,
    labName: str(f.labDetails?.labName), labQualification: str(f.labDetails?.qualification),
    labFacilities: (f.labDetails?.facilities || []).join(", "), scanCentreName: str(f.labDetails?.scanCentreName),
    pcpndt: str(f.labDetails?.pcpndtRegistrationNumber),
    handlesEmergencies: !!e.handlesEmergencies, conditions: (e.specialtyEmergencyConditionsHandled || []) as string[],
    ambulanceAvailable: !!e.ambulanceAvailable, ambulanceTypes: (e.ambulanceTypes || []) as string[],
    ambulance24x7: !!e.ambulance24x7Available, attachUdhs: !!e.willingToAttachAmbulanceToUdhs,
    nursing: str(st.nursingStaffCount), supportive: str(st.supportiveStaffCount),
    udhsStaff: ((st.udhsStaff || []) as Staff[]).length ? (st.udhsStaff as Staff[]) : [{ name: "", mobileNumber: "", designation: "" }],
    insured: !!o.hospitalInsured, pharmacy: !!o.dedicatedPharmacyAvailable, software: !!o.hospitalManagementSoftwareInUse,
    insurers: (o.empanelledInsuranceCompanies || []).join(", "),
    usg: !!o.scansAvailable?.usg, xray: !!o.scansAvailable?.xray, ct: !!o.scansAvailable?.ct, mri: !!o.scansAvailable?.mri,
    otherScans: (o.scansAvailable?.other || []).join(", "),
    joinedSurgical: !!sn.joinedSurgicalNetwork, otCount: str(sn.operationTheatreCount),
    laser: !!sn.laserEquipmentAvailable, mis: !!sn.minimallyInvasiveEquipmentAvailable, postOp: !!sn.postOpRecoveryRoomAvailable,
    endoscopy: !!sn.endoscopyAvailable, laparoscopy: !!sn.laparoscopyUnitsAvailable,
  };
}
type Form = ReturnType<typeof initial>;

/** HospitalRequest body. PUT is a full replace, so every group is always sent. */
function toBody(f: Form) {
  return {
    hospitalName: f.hospitalName.trim(), registrationNumber: f.registrationNumber.trim(),
    ownershipType: f.ownershipType, hospitalType: f.hospitalType,
    address: {
      addressLine: f.addressLine.trim(), city: f.city.trim(), district: f.district || null, state: f.state.trim(),
      country: f.country.trim(), pincode: f.pincode.trim(),
      location: f.lat != null && f.lng != null ? { type: "Point", coordinates: [f.lng, f.lat] } : null,
    },
    contactDetails: {
      phone: f.phone.trim(), alternatePhone: f.alternatePhone.trim() || null, email: f.email.trim() || null,
      emergencyHotline: f.emergencyHotline.trim() || null, website: f.website.trim() || null,
    },
    facilities: {
      bedCapacity: { general: num(f.general), icu: num(f.icu), nicu: num(f.nicu) },
      specialtyDepartments: f.specialtyDepartments,
      diagnosticUnits: { lab: f.lab, scanCentre: f.scanCentre, pathology: f.pathology },
      labDetails: {
        labName: f.labName.trim() || null, qualification: f.labQualification.trim() || null, facilities: list(f.labFacilities),
        scanCentreName: f.scanCentreName.trim() || null, pcpndtRegistrationNumber: f.pcpndt.trim() || null,
      },
    },
    emergencyServices: {
      handlesEmergencies: f.handlesEmergencies,
      specialtyEmergencyConditionsHandled: f.handlesEmergencies ? f.conditions : [],
      ambulanceAvailable: f.ambulanceAvailable, ambulanceTypes: f.ambulanceAvailable ? f.ambulanceTypes : [],
      ambulance24x7Available: f.ambulanceAvailable && f.ambulance24x7, willingToAttachAmbulanceToUdhs: f.attachUdhs,
    },
    staffDetails: {
      nursingStaffCount: num(f.nursing), supportiveStaffCount: num(f.supportive),
      udhsStaff: f.udhsStaff.filter((s) => s.name.trim() || s.mobileNumber.trim()).map((s) => ({
        name: s.name.trim(), mobileNumber: s.mobileNumber.trim(), designation: s.designation.trim(),
      })),
    },
    operations: {
      hospitalInsured: f.insured, dedicatedPharmacyAvailable: f.pharmacy, hospitalManagementSoftwareInUse: f.software,
      empanelledInsuranceCompanies: list(f.insurers),
      scansAvailable: { usg: f.usg, xray: f.xray, ct: f.ct, mri: f.mri, other: list(f.otherScans) },
    },
    // Opting out clears the equipment flags explicitly (PUT doesn't clear omitted values).
    surgicalNetwork: f.joinedSurgical ? {
      joinedSurgicalNetwork: true, operationTheatreCount: num(f.otCount), laserEquipmentAvailable: f.laser,
      minimallyInvasiveEquipmentAvailable: f.mis, postOpRecoveryRoomAvailable: f.postOp,
      endoscopyAvailable: f.endoscopy, laparoscopyUnitsAvailable: f.laparoscopy,
    } : { joinedSurgicalNetwork: false, operationTheatreCount: null, laserEquipmentAvailable: false,
      minimallyInvasiveEquipmentAvailable: false, postOpRecoveryRoomAvailable: false, endoscopyAvailable: false, laparoscopyUnitsAvailable: false },
  };
}

/** Which step each required field lives on, so errors jump to the right page. */
function validate(f: Form): { step: number; msg: string } | null {
  if (!f.hospitalName.trim()) return { step: 0, msg: "Hospital name is required." };
  if (!f.registrationNumber.trim()) return { step: 0, msg: "Registration number is required." };
  if (!f.ownershipType) return { step: 0, msg: "Choose the ownership type." };
  if (!f.hospitalType) return { step: 0, msg: "Choose the hospital type." };
  if (!f.addressLine.trim() || !f.city.trim() || !f.state.trim() || !f.country.trim()) return { step: 1, msg: "Complete the address (line, city, state, country)." };
  if (!/^\d{6}$/.test(f.pincode.trim())) return { step: 1, msg: "Enter a 6-digit pincode." };
  if (!f.phone.trim()) return { step: 1, msg: "Phone number is required." };
  if (f.email.trim() && !EMAIL.test(f.email.trim())) return { step: 1, msg: "Enter a valid email address." };
  if (f.handlesEmergencies && f.conditions.length === 0) return { step: 3, msg: "Pick at least one emergency condition you handle, or turn emergency handling off." };
  return null;
}

export default function HospitalProfileForm({ navigation, route }: any) {
  const { hospital, setHospital } = useHospitalStore();

  const [f, setF] = useState<Form>(() => initial(hospital));
  const [step, setStep] = useState(route?.params?.step ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [specialties, setSpecialties] = useState<{ category: string; names: string[] }[]>([]);
  const [conditions, setConditions] = useState<{ code: string; name: string }[]>([]);
  const [pickSpecialty, setPickSpecialty] = useState(false);
  const [pickDistrict, setPickDistrict] = useState(false);
  const [query, setQuery] = useState("");

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    getSpecialties().then((d: any) => setSpecialties(asList(d).map((c: any) => ({
      category: c.category, names: (c.specialties || []).map((s: any) => s.name),
    })))).catch(() => {});
    getEmergencyConditions().then((d: any) => setConditions(asList(d).map((c: any) => ({ code: c.code, name: c.name })))).catch(() => {});
  }, []);

  const filteredSpecialties = useMemo(() => {
    const q = query.trim().toLowerCase();
    return specialties.map((c) => ({ ...c, names: c.names.filter((n) => !q || n.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) }))
      .filter((c) => c.names.length);
  }, [specialties, query]);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") { Alert.alert("Location permission needed", "Allow location so patients can find your hospital nearby."); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setF((p) => ({ ...p, lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) }));
    } catch (e: any) {
      Alert.alert("Could not get location", e?.message || "Make sure location services are on.");
    } finally { setLocating(false); }
  };

  const submit = async () => {
    const bad = validate(f);
    if (bad) { setStep(bad.step); setError(bad.msg); return; }
    setSaving(true); setError("");
    try {
      const saved = await updateHospital(String(hospital.id), toBody(f));
      setHospital(saved);
      Alert.alert("Profile updated", "Your hospital details are saved.");
      navigation.goBack();
    } catch (e: any) {
      setError(e?.status === 409 ? "This registration number is already used by another hospital." : e?.message || "Could not save. Please try again.");
    } finally { setSaving(false); }
  };

  const last = step === STEPS.length - 1;
  const updateStaff = (i: number, k: keyof Staff, v: string) =>
    set("udhsStaff", f.udhsStaff.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  return (
    <Screen
      title="Edit hospital profile"
      subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step].title}`}
      onBack={() => navigation.goBack()}
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          {step > 0 ? <Button style={{ flex: 1 }} variant="ghost" title="Back" onPress={() => { setError(""); setStep(step - 1); }} /> : null}
          {!last ? <Button style={{ flex: 1 }} variant="secondary" title="Save" loading={saving} onPress={submit} /> : null}
          <Button
            style={{ flex: 1.4 }} title={last ? "Save changes" : "Continue"}
            icon={last ? "checkmark-circle-outline" : undefined} loading={last && saving}
            onPress={last ? submit : () => { setError(""); setStep(step + 1); }}
          />
        </View>
      }
    >
      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <Pressable key={s.key} style={styles.stepItem} onPress={() => setStep(i)} hitSlop={4}>
            <View style={[styles.stepDot, i <= step && styles.stepDotOn]}>
              {i < step ? <Ionicons name="checkmark" size={13} color="#fff" /> : <Ionicons name={s.icon as any} size={13} color={i === step ? "#fff" : C.gray} />}
            </View>
            <Text style={[styles.stepText, i === step && { color: C.primary }]} numberOfLines={1}>{s.title}</Text>
          </Pressable>
        ))}
      </View>

      <ErrorText text={error} />

      {step === 0 ? (
        <Panel title="Hospital details" icon="business-outline">
          <Field label="Hospital name *" value={f.hospitalName} onChangeText={(v) => set("hospitalName", v)} placeholder="Uyir Multi-Speciality Hospital" />
          <Field label="Registration number *" value={f.registrationNumber} onChangeText={(v) => set("registrationNumber", v)} placeholder="REG-TN-2024-00123" autoCapitalize="characters" />
          <ChipSelect label="Ownership *" options={OWNERSHIP_TYPES} value={f.ownershipType} onChange={(v) => set("ownershipType", v)} />
          <ChipSelect label="Hospital type *" options={HOSPITAL_TYPES} value={f.hospitalType} onChange={(v) => set("hospitalType", v)} />
        </Panel>
      ) : null}

      {step === 1 ? (
        <>
          <Panel title="Address" icon="location-outline">
            <Field label="Address line *" value={f.addressLine} onChangeText={(v) => set("addressLine", v)} placeholder="12, Anna Salai" />
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="City *" value={f.city} onChangeText={(v) => set("city", v)} /></View>
              <View style={{ flex: 1 }}><Field label="Pincode *" value={f.pincode} onChangeText={(v) => set("pincode", v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" /></View>
            </View>
            <Text style={styles.label}>District</Text>
            <Pressable style={styles.select} onPress={() => setPickDistrict(true)}>
              <Text style={[styles.selectText, !f.district && { color: "#9AA6B7" }]}>{f.district || "Select district"}</Text>
              <Ionicons name="chevron-down" size={18} color={C.muted} />
            </Pressable>
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="State *" value={f.state} onChangeText={(v) => set("state", v)} /></View>
              <View style={{ flex: 1 }}><Field label="Country *" value={f.country} onChangeText={(v) => set("country", v)} /></View>
            </View>
            <View style={styles.locBox}>
              <Ionicons name="navigate-circle-outline" size={22} color={f.lat != null ? C.success : C.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locTitle}>{f.lat != null ? "Location pinned" : "Map location"}</Text>
                <Text style={styles.locSub}>{f.lat != null ? `${f.lat}, ${f.lng}` : "Needed to appear in nearby and SOS search"}</Text>
              </View>
              <Button small variant="secondary" title={f.lat != null ? "Update" : "Use current"} loading={locating} onPress={useMyLocation} />
            </View>
          </Panel>
          <Panel title="Contact" icon="call-outline">
            <Field label="Phone *" value={f.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" placeholder="+91-9876543210" />
            <Field label="Alternate phone" value={f.alternatePhone} onChangeText={(v) => set("alternatePhone", v)} keyboardType="phone-pad" />
            <Field label="Emergency hotline" value={f.emergencyHotline} onChangeText={(v) => set("emergencyHotline", v)} keyboardType="phone-pad" />
            <Field label="Email" value={f.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" placeholder="contact@hospital.in" />
            <Field label="Website" value={f.website} onChangeText={(v) => set("website", v)} autoCapitalize="none" placeholder="https://" />
          </Panel>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Panel title="Bed capacity" icon="bed-outline">
            <View style={styles.two}>
              {([["general", "General"], ["icu", "ICU"], ["nicu", "NICU"]] as const).map(([k, l]) => (
                <View key={k} style={{ flex: 1 }}><Field label={l} value={f[k]} onChangeText={(v) => set(k, v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="0" /></View>
              ))}
            </View>
          </Panel>
          <Panel title="Specialty departments" icon="medical-outline" right={<Text style={styles.count}>{f.specialtyDepartments.length}</Text>}>
            <View style={styles.tags}>
              {f.specialtyDepartments.map((s) => (
                <Pressable key={s} style={styles.tag} onPress={() => set("specialtyDepartments", f.specialtyDepartments.filter((x) => x !== s))}>
                  <Text style={styles.tagText}>{s}</Text><Ionicons name="close" size={13} color={C.primary} />
                </Pressable>
              ))}
            </View>
            <Button small variant="ghost" icon="add" title="Add departments" onPress={() => setPickSpecialty(true)} style={{ alignSelf: "flex-start", marginVertical: 6 }} />
          </Panel>
          <Panel title="Diagnostics" icon="flask-outline">
            <SwitchRow label="In-house lab" value={f.lab} onChange={(v) => set("lab", v)} />
            <SwitchRow label="Scan centre" value={f.scanCentre} onChange={(v) => set("scanCentre", v)} />
            <SwitchRow label="Pathology" value={f.pathology} onChange={(v) => set("pathology", v)} />
            {f.lab || f.scanCentre || f.pathology ? (
              <View style={{ marginTop: 8 }}>
                <Field label="Lab name" value={f.labName} onChangeText={(v) => set("labName", v)} />
                <Field label="Accreditation / qualification" value={f.labQualification} onChangeText={(v) => set("labQualification", v)} placeholder="NABL Accredited" />
                <Field label="Lab facilities (comma separated)" value={f.labFacilities} onChangeText={(v) => set("labFacilities", v)} placeholder="Blood Bank, Biochemistry" />
                {f.scanCentre ? (
                  <>
                    <Field label="Scan centre name" value={f.scanCentreName} onChangeText={(v) => set("scanCentreName", v)} />
                    <Field label="PCPNDT registration no." value={f.pcpndt} onChangeText={(v) => set("pcpndt", v)} autoCapitalize="characters" />
                  </>
                ) : null}
              </View>
            ) : null}
          </Panel>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Panel title="Emergency handling" icon="medkit-outline">
            <SwitchRow label="We handle emergencies" hint="Shows your hospital in patient SOS search" value={f.handlesEmergencies} onChange={(v) => set("handlesEmergencies", v)} />
            {f.handlesEmergencies ? (
              <View style={{ marginTop: 6 }}>
                <ChipSelect multi label="Emergency conditions handled *" value={f.conditions} onChange={(v) => set("conditions", v)}
                  options={conditions.map((c) => ({ value: c.name, label: c.name }))} />
                <Text style={styles.hint}>A doctor who handles the condition must be on duty for you to receive that emergency.</Text>
              </View>
            ) : null}
          </Panel>
          <Panel title="Ambulance" icon="car-outline">
            <SwitchRow label="Ambulance available" value={f.ambulanceAvailable} onChange={(v) => set("ambulanceAvailable", v)} />
            {f.ambulanceAvailable ? (
              <>
                <ChipSelect multi label="Ambulance types" options={AMBULANCE_TYPES} value={f.ambulanceTypes} onChange={(v) => set("ambulanceTypes", v)} />
                <SwitchRow label="Available 24×7" value={f.ambulance24x7} onChange={(v) => set("ambulance24x7", v)} />
              </>
            ) : null}
            <SwitchRow label="Willing to attach ambulance to UDHS" value={f.attachUdhs} onChange={(v) => set("attachUdhs", v)} />
          </Panel>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Panel title="Staff" icon="people-outline">
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="Nursing staff" value={f.nursing} onChangeText={(v) => set("nursing", v.replace(/\D/g, ""))} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label="Supportive staff" value={f.supportive} onChangeText={(v) => set("supportive", v.replace(/\D/g, ""))} keyboardType="number-pad" /></View>
            </View>
          </Panel>
          <Panel title="UDHS nodal staff" icon="id-card-outline" right={<Text style={styles.hint}>2 recommended</Text>}>
            {f.udhsStaff.map((s, i) => (
              <View key={i} style={styles.staff}>
                <View style={styles.staffHead}>
                  <Text style={styles.staffTitle}>Contact {i + 1}</Text>
                  {f.udhsStaff.length > 1 ? (
                    <Pressable hitSlop={8} onPress={() => set("udhsStaff", f.udhsStaff.filter((_, j) => j !== i))}>
                      <Ionicons name="trash-outline" size={17} color={C.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <Field label="Name" value={s.name} onChangeText={(v) => updateStaff(i, "name", v)} />
                <View style={styles.two}>
                  <View style={{ flex: 1 }}><Field label="Mobile" value={s.mobileNumber} onChangeText={(v) => updateStaff(i, "mobileNumber", v)} keyboardType="phone-pad" /></View>
                  <View style={{ flex: 1 }}><Field label="Designation" value={s.designation} onChangeText={(v) => updateStaff(i, "designation", v)} /></View>
                </View>
              </View>
            ))}
            <Button small variant="ghost" icon="person-add-outline" title="Add contact" onPress={() => set("udhsStaff", [...f.udhsStaff, { name: "", mobileNumber: "", designation: "" }])} style={{ alignSelf: "flex-start", marginBottom: 6 }} />
          </Panel>
          <Panel title="Operations" icon="settings-outline">
            <SwitchRow label="Hospital insured" value={f.insured} onChange={(v) => set("insured", v)} />
            <SwitchRow label="Dedicated pharmacy" value={f.pharmacy} onChange={(v) => set("pharmacy", v)} />
            <SwitchRow label="Hospital management software" value={f.software} onChange={(v) => set("software", v)} />
            <View style={{ marginTop: 8 }}>
              <Field label="Empanelled insurers (comma separated)" value={f.insurers} onChangeText={(v) => set("insurers", v)} placeholder="Star Health, ICICI Lombard" />
            </View>
            <Text style={styles.label}>Scans available</Text>
            <View style={styles.tags}>
              {([["usg", "USG"], ["xray", "X-Ray"], ["ct", "CT"], ["mri", "MRI"]] as const).map(([k, l]) => (
                <Pressable key={k} onPress={() => set(k, !f[k])} style={[styles.check, f[k] && styles.checkOn]}>
                  <Ionicons name={f[k] ? "checkbox" : "square-outline"} size={17} color={f[k] ? C.primary : C.gray} />
                  <Text style={[styles.checkText, f[k] && { color: C.primary }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Field label="Other scans (comma separated)" value={f.otherScans} onChangeText={(v) => set("otherScans", v)} placeholder="Doppler" />
            </View>
          </Panel>
        </>
      ) : null}

      {step === 5 ? (
        <Panel title="Surgical network" icon="cut-outline">
          <SwitchRow label="Join the Uyir surgical network" hint="Receive surgical referrals from the network" value={f.joinedSurgical} onChange={(v) => set("joinedSurgical", v)} />
          {f.joinedSurgical ? (
            <View style={{ marginTop: 8 }}>
              <Field label="Operation theatres" value={f.otCount} onChangeText={(v) => set("otCount", v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="0" />
              <SwitchRow label="Laser equipment" value={f.laser} onChange={(v) => set("laser", v)} />
              <SwitchRow label="Minimally invasive surgical equipment" value={f.mis} onChange={(v) => set("mis", v)} />
              <SwitchRow label="Post-op recovery room" value={f.postOp} onChange={(v) => set("postOp", v)} />
              <SwitchRow label="Endoscopy" value={f.endoscopy} onChange={(v) => set("endoscopy", v)} />
              <SwitchRow label="Laparoscopy units" value={f.laparoscopy} onChange={(v) => set("laparoscopy", v)} />
            </View>
          ) : null}
        </Panel>
      ) : null}

      <Sheet visible={pickDistrict} title="Select district" onClose={() => setPickDistrict(false)}>
        {DISTRICTS.map((d) => (
          <Pressable key={d} style={styles.option} onPress={() => { set("district", d); setPickDistrict(false); }}>
            <Text style={[styles.optionText, f.district === d && { color: C.primary, fontWeight: "800" }]}>{d}</Text>
            {f.district === d ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
          </Pressable>
        ))}
      </Sheet>

      <Sheet visible={pickSpecialty} title="Specialty departments" onClose={() => { setPickSpecialty(false); setQuery(""); }}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search specialties" placeholderTextColor="#9AA6B7" style={styles.search} />
        {filteredSpecialties.length === 0 ? <Text style={styles.hint}>{specialties.length ? "No match." : "Loading specialties…"}</Text> : null}
        {filteredSpecialties.map((c) => (
          <View key={c.category}>
            <Text style={styles.group}>{c.category}</Text>
            {c.names.map((n) => {
              const on = f.specialtyDepartments.includes(n);
              return (
                <Pressable key={n} style={styles.option} onPress={() => set("specialtyDepartments", on ? f.specialtyDepartments.filter((x) => x !== n) : [...f.specialtyDepartments, n])}>
                  <Text style={[styles.optionText, on && { color: C.primary, fontWeight: "700" }]}>{n}</Text>
                  <Ionicons name={on ? "checkbox" : "square-outline"} size={19} color={on ? C.primary : C.gray} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  stepItem: { alignItems: "center", flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.graySoft, alignItems: "center", justifyContent: "center" },
  stepDotOn: { backgroundColor: C.primary },
  stepText: { fontSize: 10, fontWeight: "700", color: C.muted, marginTop: 4 },
  two: { flexDirection: "row", gap: 10 },
  label: { color: C.muted, fontWeight: "600", fontSize: 13, marginBottom: 6 },
  hint: { fontSize: 12, color: C.muted, lineHeight: 17 },
  count: { fontSize: 12, fontWeight: "800", color: C.primary },
  select: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFD", borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 12 },
  selectText: { flex: 1, fontSize: 15, color: C.ink },
  locBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: C.bg, marginBottom: 6 },
  locTitle: { fontSize: 13.5, fontWeight: "700", color: C.ink },
  locSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 12.5, fontWeight: "700", color: C.primary },
  staff: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, marginBottom: 10 },
  staffHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  staffTitle: { fontSize: 13, fontWeight: "800", color: C.ink },
  check: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  checkOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  checkText: { fontSize: 13, fontWeight: "700", color: C.muted },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  optionText: { fontSize: 14.5, color: C.ink },
  group: { fontSize: 11.5, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, marginBottom: 2 },
  search: { backgroundColor: C.bg, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, fontSize: 15, color: C.ink, marginBottom: 6 },
});
