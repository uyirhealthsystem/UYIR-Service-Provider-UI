import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { assignDoctorToSeat, createDoctor, getDoctorSeats, getEmergencyConditions, getSpecialties, updateDoctor } from "../../../api/hospital";
import Sheet from "../../../components/Sheet";
import { Button, C, Card, Chip, ErrorText, Field, Screen, SectionTitle } from "../../../components/ui";
import { allowedEmergencies } from "../../../config/specialtyEmergencies";
import { normSeats } from "../../../utils/derive";
import { asList } from "../../../utils/format";
import { useHospitalStore } from "../../provider-state/store";

const SEXES = ["MALE", "FEMALE", "OTHER"];

type Specialty = { code: string; name: string; category: string };

export default function HospitalDoctorForm({ navigation, route }: any) {
  const { hospitalId } = useHospitalStore();
  const doctor = route?.params?.doctor;
  const editing = !!doctor?.id;

  const [name, setName] = useState(doctor?.name || "");
  const [age, setAge] = useState(doctor?.age != null ? String(doctor.age) : "");
  const [sex, setSex] = useState<string>(doctor?.sex || "");
  const [tnmc, setTnmc] = useState(doctor?.tnmcNumber || "");
  const [specialty, setSpecialty] = useState((doctor?.specialties || [])[0] || "");
  const [qualification, setQualification] = useState((doctor?.qualifications || []).join(", "));
  const [experience, setExperience] = useState(doctor?.yearsOfExperience != null ? String(doctor.yearsOfExperience) : "");
  const [fee, setFee] = useState(doctor?.consultationFee != null ? String(doctor.consultationFee) : "");
  const [timings, setTimings] = useState(doctor?.availability?.customTimings || "Mon-Fri 09:00-17:00");
  const [phone, setPhone] = useState(doctor?.contactDetails?.phone || "");
  const [email, setEmail] = useState(doctor?.contactDetails?.email || "");
  const [emergencyCodes, setEmergencyCodes] = useState<string[]>(doctor?.emergencyConditionsHandled || []);

  const [specialtyList, setSpecialtyList] = useState<Specialty[]>([]);
  const [conditions, setConditions] = useState<{ code: string; name: string }[]>([]);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSpecialties().then((d: any) => {
      const list: Specialty[] = asList(d).flatMap((cat: any) =>
        (cat.specialties || []).map((s: any) => ({ code: String(s.code ?? ""), name: String(s.name ?? s), category: String(cat.category ?? "") })),
      ).filter((s: Specialty) => s.name);
      // A name can appear in two categories (e.g. Hemato-Oncology); keep the first.
      const seen = new Set<string>();
      setSpecialtyList(list.filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true))));
    }).catch(() => {});
    getEmergencyConditions().then((d: any) => {
      setConditions(asList(d).map((c: any) => ({ code: String(c.code ?? c.id), name: c.name ?? c.label ?? c.description ?? String(c.code ?? c.id) })));
    }).catch(() => {});
  }, []);

  const selected = specialtyList.find((s) => s.name.toLowerCase() === specialty.trim().toLowerCase());
  // null = every emergency (Emergency & Critical Care).
  const allowed = selected ? allowedEmergencies(selected.code) : [];
  const allowedConditions = allowed === null ? conditions : conditions.filter((c) => allowed.includes(c.code));
  const isAllowed = (code: string) => allowed === null || allowed.includes(code);

  // Specialty list grouped by category, filtered by the search box.
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, Specialty[]>();
    for (const s of specialtyList) {
      if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) continue;
      map.set(s.category, [...(map.get(s.category) || []), s]);
    }
    return [...map.entries()];
  }, [specialtyList, search]);

  const pickSpecialty = (s: Specialty) => {
    setSpecialty(s.name);
    // Drop emergencies the new specialty can't handle.
    const rule = allowedEmergencies(s.code);
    setEmergencyCodes((codes) => (rule === null ? codes : codes.filter((c) => rule.includes(c))));
    setPicking(false); setSearch("");
  };

  const toggleCode = (code: string) => setEmergencyCodes((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]));

  const save = async () => {
    if (!name.trim() || !tnmc.trim() || !specialty.trim() || !age.trim() || !sex) {
      setError("Please fill name, age, sex, TNMC number and specialty.");
      return;
    }
    if (specialtyList.length > 0 && !selected) {
      setError("Please choose the specialty from the list.");
      return;
    }
    if (!hospitalId) { setError("Hospital profile is still loading. Try again in a moment."); return; }
    setSaving(true); setError("");
    const feeNum = Number(fee || 0);
    const otherAssoc = (doctor?.hospitalAssociations || []).filter((a: any) => String(a.hospitalId) !== hospitalId);
    const body = {
      name: name.trim(),
      age: Number(age),
      sex,
      tnmcNumber: tnmc.trim(),
      qualifications: qualification.split(",").map((x: string) => x.trim()).filter(Boolean),
      specialties: [specialty.trim()],
      emergencyConditionsHandled: emergencyCodes.filter(isAllowed),
      yearsOfExperience: Number(experience || 0),
      consultationFee: feeNum,
      availability: { type: "CUSTOM_TIMINGS", customTimings: timings.trim() },
      engagementType: doctor?.engagementType || "REGULAR",
      doctorCategory: doctor?.doctorCategory || "PRIMARY",
      contactDetails: { phone: phone.trim(), email: email.trim() },
      hospitalAssociations: [
        ...otherAssoc,
        { hospitalId, department: specialty.trim(), consultationFee: feeNum, active: true },
      ],
    };
    try {
      if (editing) {
        await updateDoctor(doctor.id, body);
        Alert.alert("Saved", "Doctor details updated.");
      } else {
        // Adding is never blocked by seats. If a seat is free, place the new doctor in it straight away.
        const created = await createDoctor(body);
        let seated = false;
        try {
          const free = normSeats(await getDoctorSeats()).seats.find((s) => !s.doctorId);
          if (free && created?.id) { await assignDoctorToSeat(free.id, String(created.id)); seated = true; }
        } catch { /* doctor is still added, just without a seat */ }
        if (seated) Alert.alert("Doctor added", "Doctor added and seated. Switch Available on to start taking bookings.");
        else {
          Alert.alert("Doctor added", "No free seat right now. Buy a seat so patients can book this doctor.", [
            { text: "Later", style: "cancel" },
            { text: "Buy a seat", onPress: () => navigation.navigate("HospitalAssign", { buy: true }) },
          ]);
        }
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message || "Unable to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title={editing ? "Edit Doctor" : "Add Doctor"} onBack={() => navigation.goBack()}
      footer={<Button title={editing ? "Save changes" : "Add doctor"} loading={saving} onPress={save} />}
    >
      <Card>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Dr. Anitha Raman" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="41" /></View>
          <View style={{ flex: 1 }}><Field label="Experience (yrs)" value={experience} onChangeText={setExperience} keyboardType="number-pad" placeholder="15" /></View>
        </View>
        <Text style={{ color: "#66758B", fontWeight: "600", fontSize: 13, marginBottom: 8 }}>Sex</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {SEXES.map((s) => <Chip key={s} label={s[0] + s.slice(1).toLowerCase()} active={sex === s} onPress={() => setSex(s)} />)}
        </View>
        <Field label="TNMC registration number" value={tnmc} onChangeText={setTnmc} autoCapitalize="characters" />
        <Text style={styles.label}>Specialty</Text>
        <Pressable style={styles.dropdown} onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel="Choose specialty">
          <Text style={[styles.dropdownText, !specialty && { color: "#9AA6B7" }]} numberOfLines={1}>
            {specialty || "Select a specialty"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={C.muted} />
        </Pressable>
        <Field label="Qualifications (comma separated)" value={qualification} onChangeText={setQualification} placeholder="MBBS, MD" />
        <Field label="Consultation fee (₹)" value={fee} onChangeText={setFee} keyboardType="number-pad" />
        <Field label="Timings" value={timings} onChangeText={setTimings} placeholder="Mon-Fri 10am-1pm" />
      </Card>

      <Card>
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </Card>

      {conditions.length > 0 ? (
        <>
          <SectionTitle title="Emergencies this doctor handles" />
          <Card>
            {!selected ? (
              <Text style={styles.hint}>Choose a specialty first. Only emergencies that match the specialty can be selected.</Text>
            ) : allowedConditions.length === 0 ? (
              <Text style={styles.hint}>{selected.name} doctors don't handle emergencies, so emergency patients won't be sent to this doctor.</Text>
            ) : (
              <>
                <Text style={styles.hint}>
                  Emergencies a {selected.name} doctor can handle. Patients are only routed to you for emergencies a doctor on duty can handle.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {allowedConditions.map((c) => <Chip key={c.code} label={c.name} active={emergencyCodes.includes(c.code)} onPress={() => toggleCode(c.code)} />)}
                </View>
              </>
            )}
          </Card>
        </>
      ) : null}
      <ErrorText text={error} />

      <Sheet visible={picking} title="Choose specialty" onClose={() => { setPicking(false); setSearch(""); }}>
        <TextInput
          value={search} onChangeText={setSearch} placeholder="Search, e.g. Cardiology" placeholderTextColor="#9AA6B7"
          style={styles.search} autoCorrect={false}
        />
        {groups.length === 0 ? <Text style={styles.hint}>{specialtyList.length ? "No specialty matches your search." : "Loading specialties…"}</Text> : null}
        {groups.map(([category, items]) => (
          <View key={category} style={{ marginBottom: 6 }}>
            <Text style={styles.category}>{category}</Text>
            {items.map((s) => {
              const on = s.name === selected?.name;
              return (
                <Pressable key={s.code || s.name} style={styles.option} onPress={() => pickSpecialty(s)}>
                  <Text style={[styles.optionText, on && { color: C.primary, fontWeight: "800" }]}>{s.name}</Text>
                  {on ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
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
  label: { color: "#66758B", fontWeight: "600", fontSize: 13, marginBottom: 6 },
  dropdown: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
    borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#fff",
  },
  dropdownText: { flex: 1, color: C.ink, fontSize: 15, marginRight: 8 },
  hint: { color: "#66758B", fontSize: 12.5, marginBottom: 10, lineHeight: 17 },
  search: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.ink, marginBottom: 10 },
  category: { color: C.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginTop: 8, marginBottom: 2 },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F2F4F7" },
  optionText: { color: C.ink, fontSize: 15 },
});
