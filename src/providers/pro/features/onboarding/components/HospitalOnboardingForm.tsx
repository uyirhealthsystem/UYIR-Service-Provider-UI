import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow, spacing, typography } from "../../../theme";
import { Button } from "../../../ui/components";
import { ENUM_FIELDS, optionLabel, splitHospitalName } from "../../../ui/format";
import { DISTRICTS_BY_STATE, hospitalFields, type HospitalField } from "../data/hospitalFields";
import { normalizeDistrict, resolvePincodeDistrict } from "../data/pincodeDistricts";
import DobPicker from "./DobPicker";
import ScheduleEditor, { isSchedule, scheduleError } from "./ScheduleEditor";
import SignaturePad from "./SignaturePad";
import { EMERGENCY_OPTIONS, SPECIALTY_OPTIONS } from "../data/onboardingOptions";

// Hospital onboarding form (9 steps, defined in data/hospitalFields.ts).
// The submit payload is built in api/onboarding.ts (buildHospitalPayload /
// buildDoctorPayload) and validated by the hospital service's HospitalRequest
// and DoctorRequest - enum fields therefore never offer a free-text "Other".
// Progress is kept as a draft per bucket entry, so leaving doesn't lose work.

type StaffMember = { name: string; mobile: string; designation: string; designationOther?: string };
type Option = { value: string; label: string };

const LAB_FACILITY_OPTIONS = ["Haematology", "Biochemistry", "Microbiology", "Pathology", "Histopathology", "Serology", "Clinical Pathology", "Blood Bank"];
const DOCTOR_QUALIFICATION_OPTIONS = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "Diploma (PG)", "FRCS", "MRCP", "BDS", "MDS", "BSMS (Siddha)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BUMS (Unani)", "BNYS"];
const QUALIFICATION_ORDER = ["MBBS", "MS", "MD", "MCh", "DM", "DNB", "Diploma (PG)", "FRCS", "MRCP", "BDS", "MDS", "BSMS (Siddha)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BUMS (Unani)", "BNYS", "Other"];
const UDHS_DESIGNATION_OPTIONS = ["Medical Officer", "Duty Doctor", "Staff Nurse", "Nursing Superintendent", "Hospital Administrator", "Front Office", "Ambulance Coordinator"];
const COUNTRY_CODES: Option[] = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
];

/** Counts shown as a − / + stepper instead of a keyboard field. */
const STEPPER_KEYS = new Set(["generalBeds", "icuBeds", "nicuBeds", "nursingStaffCount", "supportiveStaffCount", "operationTheatreCount", "doctorExperience"]);
/** Single choices with this many options or fewer render as chips. */
const INLINE_CHOICE_MAX = 6;
/** Multi choices with this many options or fewer render as chips. */
const INLINE_MULTI_MAX = 10;

const SECTION_META: Record<string, { icon: any; hint: string }> = {
  "Basic Information": { icon: "id-card-outline", hint: "Start with the hospital's official details." },
  Address: { icon: "location-outline", hint: "Capture the location on site, then type the exact building address." },
  "Contact Details": { icon: "call-outline", hint: "How patients and Uyir can reach the hospital." },
  Facilities: { icon: "medkit-outline", hint: "Beds, departments, lab and scan facilities." },
  "Emergency Services": { icon: "pulse-outline", hint: "Emergency conditions handled and ambulance support." },
  "Staff Details": { icon: "people-outline", hint: "Staff numbers and at least two UDHS contacts." },
  Operations: { icon: "settings-outline", hint: "Pharmacy, software, insurance and scans." },
  "Surgical Network": { icon: "cut-outline", hint: "Operation theatres and surgical equipment." },
  "Doctor Details": { icon: "person-add-outline", hint: "The first doctor to register with this hospital." },
};

const emptyStaff = (): StaffMember => ({ name: "", mobile: "", designation: "", designationOther: "" });
const draftKey = (proHospitalId?: string) => `pro:onboarding:draft:${proHospitalId || "new"}`;

/** GPS / pincode lookups say "Pondicherry", "TAMILNADU" and so on - map onto the two states Uyir covers. */
function normalizeState(raw?: string): string {
  const text = String(raw || "").toLowerCase().replace(/[^a-z]/g, "");
  if (text.includes("tamil")) return "Tamil Nadu";
  if (text.includes("puducherry") || text.includes("pondicherry")) return "Puducherry";
  return "";
}
export default function HospitalOnboardingForm() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const proHospitalId: string | undefined = route.params?.proHospitalId;

  const [sectionIndex, setSectionIndex] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({ websiteProtocol: "https://", phoneCountryCode: "+91", country: "India", udhsStaff: [emptyStaff(), emptyStaff()] });
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [sheet, setSheet] = useState<HospitalField | null>(null);
  const [sheetSearch, setSheetSearch] = useState("");
  const [staffDesignationIndex, setStaffDesignationIndex] = useState<number | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftLoaded = useRef(false);
  const latest = useRef({ form, sectionIndex });
  latest.current = { form, sectionIndex };
  const scrollRef = useRef<ScrollView>(null);

  const section = hospitalFields[sectionIndex];
  const specialtyOptions = SPECIALTY_OPTIONS.map((item) => ({ value: item.code, label: item.name, category: item.category }));
  const emergencyOptions: Option[] = EMERGENCY_OPTIONS.map((item) => ({ value: item.code, label: item.name }));
  const poolHospital = route.params?.hospital;
  const poolName = poolHospital?.hospitalPool?.name || poolHospital?.name || "";
  const hospitalTitle = poolName ? splitHospitalName(poolName).title : "";

  // ── Draft: restore once, then save (debounced) on every change ────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(draftKey(proHospitalId));
        if (saved && !cancelled) {
          const draft = JSON.parse(saved);
          if (draft?.form) {
            setForm((current) => ({ ...current, ...draft.form, country: "India" }));
            if (typeof draft.sectionIndex === "number") setSectionIndex(Math.min(draft.sectionIndex, hospitalFields.length - 1));
            setDraftRestored(true);
          }
        } else if (hospitalTitle && !cancelled) {
          setForm((current) => (current.hospitalName ? current : { ...current, hospitalName: hospitalTitle }));
        }
      } catch {
        // A corrupt draft is ignored; the PRO starts fresh.
      } finally {
        draftLoaded.current = true;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proHospitalId]);

  const saveDraft = useCallback(() => {
    if (!draftLoaded.current) return;
    const { form: f, sectionIndex: i } = latest.current;
    AsyncStorage.setItem(draftKey(proHospitalId), JSON.stringify({ form: f, sectionIndex: i, savedAt: Date.now() })).catch((e) => console.log("Draft save failed:", e));
  }, [proHospitalId]);

  useEffect(() => {
    const id = setTimeout(saveDraft, 400);
    return () => clearTimeout(id);
  }, [form, sectionIndex, saveDraft]);

  // Leaving the screen (back, review, closing the app) must not drop the last
  // keystrokes still waiting on the debounce above - write the draft at once.
  useFocusEffect(useCallback(() => saveDraft, [saveDraft]));
  useEffect(() => saveDraft, [saveDraft]);

  // Each step starts at the top.
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [sectionIndex]);

  // "Edit" on the review screen sends us back here with the step to open.
  useEffect(() => {
    const jumpTo = route.params?.jumpTo;
    if (typeof jumpTo === "number" && jumpTo >= 0 && jumpTo < hospitalFields.length) {
      setSectionIndex(jumpTo);
      clearError();
    }
  }, [route.params?.jumpTo, route.params?.jumpAt]);

  // ── Form state helpers ─────────────────────────────────────────────────────
  const clearError = () => { setError(""); setErrorKey(null); };
  const updateField = (key: string, value: any) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "state" && !(DISTRICTS_BY_STATE[value] || []).includes(current.district)) next.district = "";
      return next;
    });
    if (error) clearError();
  };
  const isVisible = (field: HospitalField) => {
    if (!field.showWhen) return true;
    const [key, expected] = field.showWhen;
    return form[key] === expected;
  };
  const getList = (key: string): string[] => {
    const values = Array.isArray(form[key]) ? [...form[key]] : [];
    if (key === "doctorQualifications") values.sort((a, b) => QUALIFICATION_ORDER.indexOf(a) - QUALIFICATION_ORDER.indexOf(b));
    return values;
  };
  const toggleInList = (key: string, value: string) => {
    const current = getList(key);
    updateField(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };
  const getStaff = (key: string): StaffMember[] => (Array.isArray(form[key]) ? form[key] : []);
  const updateStaff = (key: string, index: number, field: keyof StaffMember, value: string) => {
    const staff = [...getStaff(key)];
    staff[index] = { ...emptyStaff(), ...staff[index], [field]: field === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value };
    updateField(key, staff);
  };
  const otherKeyOf = (field: HospitalField) => field.otherKey || `${field.key}Other`;

  // ── Location helpers ───────────────────────────────────────────────────────
  const fetchPincodeDetails = async (value: string) => {
    const pincode = value.replace(/\D/g, "").slice(0, 6);
    updateField("pincode", pincode);
    if (pincode.length !== 6) return;
    try {
      setPincodeLoading(true);
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      const postOffices = Array.isArray(data?.[0]?.PostOffice) ? data[0].PostOffice : [];
      const postOffice = postOffices[0];
      if (!postOffice) throw new Error("Pincode not found");
      const state = normalizeState(postOffice.State);
      if (!state) {
        setError(`This pincode is in ${postOffice.State}. Uyir onboards hospitals in Tamil Nadu and Puducherry only.`);
        setErrorKey("pincode");
        return;
      }
      setForm((current) => ({
        ...current,
        state,
        // India Post still lists pre-split districts (627804 -> Tirunelveli, really Tenkasi): resolve by taluk.
        district: resolvePincodeDistrict(postOffices, state) || (current.state === state ? current.district : "") || "",
        country: "India",
        city: current.city || postOffice.Block || "",
      }));
    } catch (lookupError) {
      console.log("Pincode lookup error:", lookupError);
      setError("We couldn't find this pincode. Check it, or fill district and state yourself.");
      setErrorKey("pincode");
    } finally {
      setPincodeLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      clearError();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location permission was not granted");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const next: Record<string, any> = { latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) };
      // Prefill the area from GPS. The address line stays manual so the PRO
      // types the exact building address rather than a broad map result.
      try {
        const place = (await Location.reverseGeocodeAsync({ latitude, longitude }))?.[0];
        if (place) {
          const city = place.city || place.district || place.subregion || place.region || "";
          const district = place.district || place.subregion || place.city || "";
          const state = normalizeState(place.region || undefined);
          if (city) next.city = city;
          if (state) {
            next.state = state;
            const matched = normalizeDistrict(district, state);
            if (matched) next.district = matched;
          }
          if (place.postalCode) next.pincode = place.postalCode.replace(/\D/g, "").slice(0, 6);
        }
      } catch (geocodeError) {
        console.log("Reverse geocode error:", geocodeError);
      }
      setForm((current) => ({ ...current, ...next }));
    } catch (locationError: any) {
      setError(locationError?.message || "Unable to get the current location");
    } finally {
      setLocationLoading(false);
    }
  };

  /** No GPS fix (e.g. indoors)? Find coordinates from the typed address instead. */
  const geocodeHospitalAddress = async () => {
    const address = [form.addressLine, form.city, form.district, form.state, form.pincode, form.country || "India"].filter(Boolean).join(", ");
    if (!form.addressLine || !form.city || !form.state) {
      setError("Enter the address line, city and state first, then find it on the map.");
      return;
    }
    try {
      setLocationLoading(true);
      clearError();
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, { headers: { Accept: "application/json", "User-Agent": "UyirServiceProvider/1.0" } });
      const results = await response.json();
      if (!response.ok || !Array.isArray(results) || !results[0]) throw new Error("No map location found for this address. Refine the address or capture GPS on site.");
      setForm((current) => ({ ...current, latitude: String(results[0].lat), longitude: String(results[0].lon) }));
    } catch (e: any) {
      setError(e?.message || "Unable to find the hospital on the map.");
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Validation (same rules as before, now pointing at the failing field) ──
  const validateSection = () => {
    for (const field of section.fields) {
      if (!isVisible(field)) continue;
      const fail = (message: string) => { setError(message); setErrorKey(field.key); return false; };
      const value = form[field.key];

      if (field.type === "multiSelect") {
        const selected = getList(field.key);
        const other = String(form[otherKeyOf(field)] || "").trim();
        if (field.required && selected.filter((item) => item !== "Other").length === 0 && !other) return fail(`Choose at least one: ${field.label.toLowerCase()}`);
        if (selected.includes("Other") && !other) return fail(`Type the other ${field.label.toLowerCase()}`);
        continue;
      }
      if (field.type === "list") {
        const list = getList(field.key).map((item) => item.trim()).filter(Boolean);
        if (field.required && list.length === 0) return fail(`${field.label} is required`);
        if (list.length !== getList(field.key).length) return fail(`Complete or remove the empty ${field.itemLabel || "item"}`);
        continue;
      }
      if (field.key === "doctorSchedule") {
        const problem = scheduleError(value);
        if (problem) return fail(problem);
        continue;
      }
      if (field.key === "doctorESignature") continue;
      if (field.type === "staffList") {
        const staff = getStaff(field.key);
        if (field.required && staff.length < 2) return fail("Add at least 2 UDHS staff members");
        for (const [i, member] of staff.entries()) {
          if (!member.name.trim() || !member.mobile.trim() || !member.designation.trim() || (member.designation === "Other" && !String(member.designationOther || "").trim())) return fail(`Complete all details for staff member ${i + 1}`);
          if (!/^\d{10}$/.test(member.mobile.trim())) return fail(`Staff member ${i + 1}: mobile number must have 10 digits`);
        }
        continue;
      }

      const textValue = value === undefined || value === null ? "" : String(value).trim();
      if (field.required && textValue === "") return fail(field.type === "boolean" ? `Answer: ${field.label}` : `${field.label} is required`);
      if (textValue === "") continue;
      if (value === "Other" && !String(form[`${field.key}Other`] || "").trim()) return fail(`Type the other ${field.label.toLowerCase()}`);
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue)) return fail("Enter a valid email address");
      if (field.key === "website" && !/^[^\s.]+(?:\.[^\s.]+)+(?::\d+)?(?:\/[^\s]*)?$/i.test(textValue.replace(/^https?:\/\//i, ""))) return fail("Enter a valid website address");
      if (field.type === "phone" && !/^\d{10}$/.test(textValue)) return fail(`${field.label} must have exactly 10 digits`);
      if (field.key === "pincode" && !/^\d{6}$/.test(textValue)) return fail("Pincode must have exactly 6 digits");
      if (field.type === "number" && !/^\d+$/.test(textValue)) return fail(`${field.label} must be a whole number`);
      if (field.type === "decimal" && !/^-?\d+(\.\d+)?$/.test(textValue)) return fail(`${field.label} must be a number`);
    }
    clearError();
    return true;
  };

  const nextSection = () => {
    if (!validateSection()) return;
    if (sectionIndex < hospitalFields.length - 1) {
      setSectionIndex((current) => current + 1);
      return;
    }
    navigation.navigate("OnboardingPreview", { form, proHospitalId, hospitalPoolId: route.params?.hospitalPoolId });
  };

  const confirmLeave = () =>
    Alert.alert("Leave the form?", "Your answers are saved as a draft. You can continue from your bucket.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Leave", onPress: () => navigation.goBack() },
    ]);

  const previousSection = () => {
    clearError();
    if (sectionIndex > 0) setSectionIndex((current) => current - 1);
    else confirmLeave();
  };

  // Only while this screen is on top. Before, Android back on the review screen
  // ran this handler too: it stepped the hidden form backwards and, at step 1,
  // offered to leave - instead of simply closing the review.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (sheet || showDobPicker) { setSheet(null); setShowDobPicker(false); return true; }
        if (sectionIndex > 0) { setSectionIndex((current) => Math.max(0, current - 1)); clearError(); return true; }
        confirmLeave();
        return true;
      });
      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionIndex, sheet, showDobPicker, navigation]),
  );

  // ── Options ────────────────────────────────────────────────────────────────
  const getSelectOptions = (field: HospitalField): Option[] => {
    if (field.key === "__staffDesignation") return [...UDHS_DESIGNATION_OPTIONS, "Other"].map((item) => ({ value: item, label: item }));
    if (field.key === "__countryCode") return COUNTRY_CODES;
    if (field.optionsSource === "specialties") {
      const values = specialtyOptions.map((item) => ({ value: field.key === "doctorDepartment" ? item.label : item.value, label: item.category ? `${item.category} · ${item.label}` : item.label }));
      if (!ENUM_FIELDS.has(field.key)) values.push({ value: "Other", label: "Other" });
      return values;
    }
    if (field.optionsSource === "emergencyConditions") return emergencyOptions;
    if (field.optionsSource === "labFacilities") return LAB_FACILITY_OPTIONS.map((item) => ({ value: item, label: item }));
    if (field.optionsSource === "doctorQualifications") return DOCTOR_QUALIFICATION_OPTIONS.map((item) => ({ value: item, label: item }));
    if (field.optionsSource === "designations") return UDHS_DESIGNATION_OPTIONS.map((item) => ({ value: item, label: item }));
    const source = field.key === "district" ? DISTRICTS_BY_STATE[form.state] || [] : field.options || [];
    const options = source.map((item) => ({ value: item, label: optionLabel(item) }));
    // Enum fields must not get a free-text "Other": the hospital service rejects unknown values.
    if (!ENUM_FIELDS.has(field.key) && !field.noOther && !options.some((item) => item.value === "Other")) options.push({ value: "Other", label: "Other" });
    return options;
  };

  const getMultiOptions = (field: HospitalField): Option[] => {
    let options: Option[];
    if (field.optionsSource === "specialties") options = specialtyOptions.map((item) => ({ value: item.value, label: item.category ? `${item.category} · ${item.label}` : item.label }));
    else if (field.optionsSource === "emergencyConditions") options = [...emergencyOptions];
    else if (field.optionsSource === "labFacilities") options = LAB_FACILITY_OPTIONS.map((item) => ({ value: item, label: item }));
    else if (field.optionsSource === "doctorQualifications") options = DOCTOR_QUALIFICATION_OPTIONS.map((item) => ({ value: item, label: item }));
    else options = (field.options || []).map((item) => ({ value: item, label: optionLabel(item) }));
    if (!ENUM_FIELDS.has(field.key) && !options.some((item) => item.value === "Other")) options.push({ value: "Other", label: "Other" });
    if (field.key === "doctorEmergencyConditions") {
      // A doctor can only handle conditions the hospital itself handles.
      const hospitalConditions = getList("specialtyEmergencyConditionsHandled");
      options = options.filter((item) => item.value === "Other" || hospitalConditions.includes(item.value));
    }
    if (field.key === "doctorQualifications") options.sort((a, b) => QUALIFICATION_ORDER.indexOf(a.value) - QUALIFICATION_ORDER.indexOf(b.value));
    return options;
  };

  const openSheet = (field: HospitalField) => { setSheetSearch(""); setSheet(field); };
  const openStaffDesignation = (index: number) => {
    setStaffDesignationIndex(index);
    openSheet({ key: "__staffDesignation", label: "Designation", type: "select" });
  };

  const sheetOptions = sheet ? (sheet.type === "multiSelect" ? getMultiOptions(sheet) : getSelectOptions(sheet)) : [];
  const isSheetSelected = (value: string) => {
    if (!sheet) return false;
    if (sheet.type === "multiSelect") return getList(sheet.key).includes(value);
    if (sheet.key === "__staffDesignation") return getStaff("udhsStaff")[staffDesignationIndex ?? -1]?.designation === value;
    if (sheet.key === "__countryCode") return (form.phoneCountryCode || "+91") === value;
    return form[sheet.key] === value;
  };
  const pickFromSheet = (value: string) => {
    if (!sheet) return;
    if (sheet.type === "multiSelect") { toggleInList(sheet.key, value); return; }
    if (sheet.key === "__staffDesignation") {
      if (staffDesignationIndex !== null) updateStaff("udhsStaff", staffDesignationIndex, "designation", value);
      setStaffDesignationIndex(null);
    } else if (sheet.key === "__countryCode") {
      updateField("phoneCountryCode", value);
    } else {
      updateField(sheet.key, value);
    }
    setSheet(null);
  };

  // ── Field renderers ────────────────────────────────────────────────────────
  const renderOtherInput = (key: string, label: string) => (
    <Input value={String(form[key] || "")} onChangeText={(text) => updateField(key, text)} placeholder={`Type the other ${label.toLowerCase()}`} icon="create-outline" style={{ marginTop: spacing.sm }} />
  );

  const renderField = (field: HospitalField) => {
    const value = form[field.key];
    const invalid = errorKey === field.key;

    if (field.type === "boolean") return <YesNo value={value} invalid={invalid} onChange={(next) => updateField(field.key, next)} />;

    if (STEPPER_KEYS.has(field.key)) return <Stepper value={value} onChange={(next) => updateField(field.key, next)} invalid={invalid} suffix={field.key === "doctorExperience" ? "years" : undefined} />;

    if (field.key === "country") {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, height: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="flag-outline" size={18} color={colors.muted} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>India</Text>
          <Ionicons name="lock-closed-outline" size={15} color={colors.muted} />
        </View>
      );
    }

    if (field.key === "district" && !DISTRICTS_BY_STATE[form.state]) {
      return <PickerButton label="Choose the state first" filled={false} invalid={invalid} icon="map-outline" onPress={() => { setError("Choose the state first"); setErrorKey("state"); }} />;
    }

    if (field.key === "doctorSchedule") return <ScheduleEditor value={value} invalid={invalid} onChange={(next) => updateField("doctorSchedule", next)} />;

    if (field.key === "doctorESignature") {
      const tele = form.doctorTeleconsultation === true;
      return (
        <View>
          <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: tele ? colors.amberSoft : colors.surfaceMuted, borderWidth: tele ? 1 : 0, borderColor: "#F5C98B" }}>
            <Ionicons name={tele ? "warning" : "information-circle-outline"} size={18} color={tele ? colors.amber : colors.muted} />
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, fontWeight: tele ? "700" : "500", color: tele ? colors.amber : colors.textSecondary }}>
              {tele
                ? "This doctor provides teleconsultation, so an e-signature is a must for signing e-prescriptions. Collect it now if you can - it can also be added later."
                : "Optional. An e-signature is a must only for doctors who provide teleconsultation (to sign e-prescriptions)."}
            </Text>
          </View>
          <SignaturePad value={value} required={tele} onChange={(next) => updateField("doctorESignature", next)} />
        </View>
      );
    }

    if (field.type === "select") {
      const options = getSelectOptions(field);
      const chips = !field.optionsSource && options.length <= INLINE_CHOICE_MAX;
      return (
        <View>
          {chips ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {options.map((option) => (
                <Chip key={option.value} label={option.label} selected={value === option.value} invalid={invalid} onPress={() => updateField(field.key, option.value)} />
              ))}
            </View>
          ) : (
            <PickerButton
              label={value ? (field.optionsSource === "specialties" ? specialtyOptions.find((item) => item.value === value || item.label === value)?.label || String(value) : optionLabel(value)) : `Choose ${field.label.toLowerCase()}`}
              filled={!!value}
              invalid={invalid}
              icon={field.key === "district" ? "map-outline" : "list-outline"}
              onPress={() => openSheet(field)}
            />
          )}
          {value === "Other" && !ENUM_FIELDS.has(field.key) && !field.noOther ? renderOtherInput(`${field.key}Other`, field.label) : null}
        </View>
      );
    }

    if (field.type === "multiSelect") {
      const options = getMultiOptions(field);
      const selected = getList(field.key);
      const inline = options.length <= INLINE_MULTI_MAX;
      return (
        <View>
          {field.key === "doctorEmergencyConditions" && options.length <= 1 ? (
            <Text style={[typography.caption, { marginBottom: spacing.sm }]}>Only conditions the hospital handles (Emergency Services step) can be chosen here.</Text>
          ) : null}
          {inline ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {options.map((option) => (
                <Chip key={option.value} label={option.label} selected={selected.includes(option.value)} invalid={invalid} multi onPress={() => toggleInList(field.key, option.value)} />
              ))}
            </View>
          ) : (
            <>
              <PickerButton label={selected.length ? `${selected.length} selected · tap to change` : `Choose ${field.label.toLowerCase()}`} filled={selected.length > 0} invalid={invalid} icon="checkbox-outline" onPress={() => openSheet(field)} />
              {selected.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm }}>
                  {selected.map((item) => (
                    <Chip key={item} label={options.find((o) => o.value === item)?.label || item} selected removable onPress={() => toggleInList(field.key, item)} />
                  ))}
                </View>
              ) : null}
            </>
          )}
          {selected.includes("Other") ? renderOtherInput(otherKeyOf(field), field.label) : null}
        </View>
      );
    }

    if (field.type === "list") {
      const list = getList(field.key);
      const rows = list.length ? list : [""];
      return (
        <View style={{ gap: spacing.sm }}>
          {rows.map((item, index) => (
            <View key={`${field.key}-${index}`} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Input value={item} onChangeText={(text) => { const next = [...rows]; next[index] = text; updateField(field.key, next); }} placeholder={`${field.itemLabel || "Item"} ${index + 1}`} style={{ flex: 1 }} invalid={invalid && !item.trim()} />
              {list.length > 0 ? <IconButton icon="trash-outline" tone="red" label={`Remove ${field.itemLabel || "item"}`} onPress={() => updateField(field.key, list.filter((_, i) => i !== index))} /> : null}
            </View>
          ))}
          <AddButton label={`Add ${field.itemLabel || "item"}`} onPress={() => updateField(field.key, [...rows, ""])} />
        </View>
      );
    }

    if (field.type === "staffList") {
      const staff = getStaff(field.key);
      return (
        <View style={{ gap: spacing.md }}>
          {staff.map((member, index) => (
            <View key={`${field.key}-${index}`} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.surfaceMuted }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>{index + 1}</Text>
                </View>
                <Text style={[typography.label, { flex: 1, marginLeft: spacing.sm }]}>{member.name.trim() || `Staff member ${index + 1}`}</Text>
                {staff.length > 2 ? (
                  <IconButton icon="trash-outline" tone="red" label={`Remove staff member ${index + 1}`} onPress={() => updateField(field.key, staff.filter((_, i) => i !== index))} />
                ) : null}
              </View>
              <Input value={member.name} onChangeText={(text) => updateStaff(field.key, index, "name", text)} placeholder="Full name" icon="person-outline" autoCapitalize="words" />
              <Input value={member.mobile} onChangeText={(text) => updateStaff(field.key, index, "mobile", text)} placeholder="10-digit mobile number" icon="call-outline" keyboardType="phone-pad" maxLength={10} style={{ marginTop: spacing.sm }} />
              <PickerButton label={member.designation || "Choose designation"} filled={!!member.designation} icon="briefcase-outline" onPress={() => openStaffDesignation(index)} style={{ marginTop: spacing.sm }} />
              {member.designation === "Other" ? (
                <Input value={member.designationOther || ""} onChangeText={(text) => updateStaff(field.key, index, "designationOther", text)} placeholder="Type the designation" icon="create-outline" style={{ marginTop: spacing.sm }} />
              ) : null}
            </View>
          ))}
          <AddButton label="Add staff member" onPress={() => updateField(field.key, [...staff, emptyStaff()])} />
          {staff.length <= 2 ? <Text style={typography.caption}>At least 2 UDHS contacts are required.</Text> : null}
        </View>
      );
    }

    if (field.type === "phone") {
      const code = form.phoneCountryCode || "+91";
      return (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable onPress={() => openSheet({ key: "__countryCode", label: "Country code", type: "select" })} accessibilityLabel="Country code" style={{ height: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontWeight: "700", color: colors.text }}>{code}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.muted} />
          </Pressable>
          <Input
            value={value || ""}
            onChangeText={(text) => {
              let digits = text.replace(/\D/g, "");
              const codeDigits = code.replace(/\D/g, "");
              if (digits.startsWith(codeDigits) && digits.length > 10) digits = digits.slice(codeDigits.length);
              updateField(field.key, digits.slice(0, 10));
            }}
            placeholder="10-digit number"
            icon="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            invalid={invalid}
            style={{ flex: 1 }}
            right={String(value || "").length === 10 ? <Ionicons name="checkmark-circle" size={18} color={colors.green} /> : null}
          />
        </View>
      );
    }

    if (field.key === "pincode") {
      return (
        <View>
          <Input value={value || ""} onChangeText={fetchPincodeDetails} placeholder="6-digit pincode" icon="mail-outline" keyboardType="number-pad" maxLength={6} invalid={invalid} right={pincodeLoading ? <ActivityIndicator size="small" color={colors.brand} /> : String(value || "").length === 6 && !invalid ? <Ionicons name="checkmark-circle" size={18} color={colors.green} /> : null} />
          <Text style={[typography.caption, { marginTop: 6 }]}>{pincodeLoading ? "Looking up district and state…" : "District and state fill in automatically from the pincode."}</Text>
        </View>
      );
    }

    if (field.key === "doctorDob") {
      return (
        <PickerButton
          label={value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Choose date of birth"}
          filled={!!value}
          invalid={invalid}
          icon="calendar-outline"
          onPress={() => setShowDobPicker(true)}
        />
      );
    }

    if (field.key === "website") {
      return (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable onPress={() => updateField("websiteProtocol", form.websiteProtocol === "http://" ? "https://" : "http://")} accessibilityLabel="Toggle http or https" style={{ height: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, justifyContent: "center" }}>
            <Text style={{ fontWeight: "700", color: colors.brand }}>{form.websiteProtocol || "https://"}</Text>
          </Pressable>
          <Input value={value || ""} onChangeText={(text) => updateField("website", text.replace(/^https?:\/\//i, ""))} placeholder="hospitalwebsite.com" icon="globe-outline" autoCapitalize="none" keyboardType="url" invalid={invalid} style={{ flex: 1 }} />
        </View>
      );
    }

    const keyboard: KeyboardTypeOptions = field.type === "number" ? "number-pad" : field.type === "decimal" ? "decimal-pad" : field.type === "email" ? "email-address" : "default";
    return (
      <Input
        value={value === undefined || value === null ? "" : String(value)}
        onChangeText={(text) => updateField(field.key, field.type === "email" ? text.trim() : text)}
        placeholder={field.key === "email" ? "name@hospital.com" : field.key === "doctorFee" ? "e.g. 300" : `Enter ${field.label.toLowerCase()}`}
        icon={field.type === "email" ? "mail-outline" : field.key === "doctorFee" ? "cash-outline" : field.key === "tnmcNumber" || field.key === "registrationNumber" ? "document-text-outline" : undefined}
        keyboardType={keyboard}
        autoCapitalize={field.type === "email" ? "none" : field.key === "hospitalName" || field.key === "doctorName" ? "words" : "sentences"}
        multiline={field.type === "textarea"}
        invalid={invalid}
      />
    );
  };

  const visibleFields = section.fields.filter(isVisible);
  const requiredLeft = visibleFields.filter((field) => {
    if (!field.required) return false;
    const v = form[field.key];
    if (field.type === "multiSelect" || field.type === "list") return getList(field.key).length === 0;
    if (field.type === "staffList") return getStaff(field.key).some((m) => !m.name.trim() || !m.mobile.trim() || !m.designation.trim());
    if (field.key === "doctorSchedule") return !isSchedule(v);
    return v === undefined || v === null || String(v).trim() === "";
  }).length;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton icon="arrow-back" label="Back" onPress={previousSection} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={typography.overline}>STEP {sectionIndex + 1} OF {hospitalFields.length}</Text>
            <Text style={[typography.heading, { marginTop: 1 }]} numberOfLines={1}>{section.title}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.greenSoft }}>
            <Ionicons name="cloud-done-outline" size={13} color={colors.green} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.green }}>Draft saved</Text>
          </View>
        </View>
        {hospitalTitle ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm }}>
            <Ionicons name="business" size={13} color={colors.brand} />
            <Text style={[typography.caption, { color: colors.brand, fontWeight: "700", flex: 1 }]} numberOfLines={1}>{hospitalTitle}</Text>
          </View>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: spacing.md }}>
          {hospitalFields.map((s, i) => {
            const done = i < sectionIndex;
            const current = i === sectionIndex;
            return (
              <Pressable
                key={s.title}
                // Going back is always allowed; going forward needs each step to validate.
                onPress={() => { if (i < sectionIndex) { clearError(); setSectionIndex(i); } else if (i === sectionIndex + 1) nextSection(); }}
                accessibilityLabel={`Step ${i + 1}: ${s.title}`}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm + 2, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: current ? colors.brand : done ? colors.greenSoft : colors.surfaceMuted }}
              >
                <Ionicons name={done ? "checkmark-circle" : SECTION_META[s.title]?.icon || "ellipse-outline"} size={13} color={current ? colors.white : done ? colors.green : colors.muted} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: current ? colors.white : done ? colors.green : colors.muted }}>{s.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 + insets.bottom }}>
        {draftRestored ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.greenSoft, marginBottom: spacing.md }}>
            <Ionicons name="refresh-circle" size={18} color={colors.green} />
            <Text style={{ flex: 1, color: colors.green, fontSize: 13, fontWeight: "600" }}>We restored your saved draft for this hospital.</Text>
            <Pressable onPress={() => setDraftRestored(false)} hitSlop={8}><Ionicons name="close" size={16} color={colors.green} /></Pressable>
          </View>
        ) : null}

        {/* Step intro */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginRight: spacing.md }}>
            <Ionicons name={SECTION_META[section.title]?.icon || "document-text-outline"} size={24} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.label}>{SECTION_META[section.title]?.hint || "Complete the details below."}</Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>
              {requiredLeft ? `${requiredLeft} required field${requiredLeft > 1 ? "s" : ""} left` : "All required fields done"}
            </Text>
          </View>
        </View>

        {section.title === "Address" ? (
          <LocationCard
            latitude={form.latitude}
            longitude={form.longitude}
            loading={locationLoading}
            onUseGps={fetchCurrentLocation}
            onFindFromAddress={geocodeHospitalAddress}
          />
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xl, ...shadow.card }}>
          {visibleFields.map((field) => (
            <FieldShell key={field.key} label={field.label} hint={field.hint} required={field.required} error={errorKey === field.key ? error : ""}>
              {renderField(field)}
            </FieldShell>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md + insets.bottom, borderTopWidth: 1, borderTopColor: colors.divider, ...shadow.floating }}>
        {error && !errorKey ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.redSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={{ flex: 1, color: colors.red, fontSize: 13, fontWeight: "600", lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}
        {error && errorKey ? (
          <Text style={{ color: colors.red, fontSize: 12, fontWeight: "700", textAlign: "center", marginBottom: spacing.sm }}>Fix the highlighted field to continue</Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {sectionIndex > 0 ? <Button label="Back" icon="arrow-back" variant="ghost" onPress={previousSection} style={{ paddingHorizontal: spacing.xl }} /> : null}
          <Button
            label={sectionIndex === hospitalFields.length - 1 ? "Review details" : `Next: ${hospitalFields[sectionIndex + 1]?.title || ""}`}
            icon={sectionIndex === hospitalFields.length - 1 ? "eye-outline" : "arrow-forward"}
            onPress={nextSection}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* Picker sheet */}
      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(15,27,51,0.45)" }} onPress={() => setSheet(null)} />
        <View style={{ maxHeight: "80%", backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl + insets.bottom }}>
          <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.lg }} />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={typography.title}>{sheet?.label}</Text>
              <Text style={typography.caption}>{sheet?.type === "multiSelect" ? "Select all that apply" : "Choose one"}</Text>
            </View>
            <IconButton icon="close" label="Close" onPress={() => setSheet(null)} />
          </View>
          {sheetOptions.length > 8 ? (
            <Input value={sheetSearch} onChangeText={setSheetSearch} placeholder="Search…" icon="search" style={{ marginBottom: spacing.md }} />
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {sheetOptions
              .filter((option) => option.label.toLowerCase().includes(sheetSearch.trim().toLowerCase()))
              .map((option) => {
                const selected = isSheetSelected(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => pickFromSheet(option.value)}
                    style={({ pressed }) => ({ minHeight: 50, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: 6, backgroundColor: selected ? colors.brandSoft : pressed ? colors.surfaceMuted : colors.surface, borderWidth: 1, borderColor: selected ? colors.brand : colors.divider, flexDirection: "row", alignItems: "center", gap: spacing.md })}
                  >
                    <Ionicons
                      name={sheet?.type === "multiSelect" ? (selected ? "checkbox" : "square-outline") : selected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={selected ? colors.brand : colors.muted}
                    />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: selected ? "700" : "500", color: selected ? colors.brand : colors.text }}>{option.label}</Text>
                  </Pressable>
                );
              })}
          </ScrollView>
          {sheet?.type === "multiSelect" ? (
            <Button label={`Done · ${getList(sheet.key).length} selected`} icon="checkmark" onPress={() => setSheet(null)} style={{ marginTop: spacing.md }} />
          ) : null}
        </View>
      </Modal>

      {/* Date of birth */}
      <DobPicker visible={showDobPicker} value={form.doctorDob} onChange={(iso) => updateField("doctorDob", iso)} onClose={() => setShowDobPicker(false)} />
    </KeyboardAvoidingView>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────────

function FieldShell({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <View>
      <Text style={[typography.label, { marginBottom: hint ? 2 : spacing.sm }]}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : <Text style={{ color: colors.muted, fontWeight: "500" }}> (optional)</Text>}
      </Text>
      {hint ? <Text style={[typography.caption, { marginBottom: spacing.sm }]}>{hint}</Text> : null}
      {children}
      {error ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
          <Ionicons name="alert-circle" size={14} color={colors.red} />
          <Text style={{ flex: 1, color: colors.red, fontSize: 12, fontWeight: "600" }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Input({
  icon,
  right,
  invalid,
  style,
  multiline,
  ...props
}: ComponentProps<typeof TextInput> & { icon?: any; right?: ReactNode; invalid?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        {
          minHeight: multiline ? 100 : 52,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          borderWidth: focused || invalid ? 1.5 : 1,
          borderColor: invalid ? colors.red : focused ? colors.brand : colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        },
        style as any,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={invalid ? colors.red : focused ? colors.brand : colors.muted} style={multiline ? { marginTop: 14 } : undefined} /> : null}
      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor={colors.muted}
        selectionColor={colors.brand}
        autoCorrect={false}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: multiline ? 12 : 0, minHeight: multiline ? 100 : 50 }}
      />
      {right}
    </View>
  );
}

function PickerButton({ label, filled, invalid, icon, onPress, style }: { label: string; filled: boolean; invalid?: boolean; icon: any; onPress: () => void; style?: any }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ minHeight: 52, borderRadius: radius.md, borderWidth: invalid ? 1.5 : 1, borderColor: invalid ? colors.red : colors.border, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }, style]}
    >
      <Ionicons name={icon} size={18} color={filled ? colors.brand : colors.muted} />
      <Text style={{ flex: 1, fontSize: 15, color: filled ? colors.text : colors.muted, fontWeight: filled ? "600" : "400" }} numberOfLines={1}>{label}</Text>
      <Ionicons name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Chip({ label, selected, onPress, invalid, multi, removable }: { label: string; selected: boolean; onPress: () => void; invalid?: boolean; multi?: boolean; removable?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={removable ? `Remove ${label}` : label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: removable ? 6 : 10,
        borderRadius: radius.pill,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.brand : invalid ? colors.red : colors.border,
        backgroundColor: selected ? colors.brandSoft : colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {multi && !removable ? <Ionicons name={selected ? "checkmark-circle" : "add-circle-outline"} size={16} color={selected ? colors.brand : colors.muted} /> : null}
      <Text style={{ fontSize: removable ? 12 : 13, fontWeight: selected ? "700" : "600", color: selected ? colors.brand : colors.textSecondary }}>{label}</Text>
      {removable ? <Ionicons name="close-circle" size={15} color={colors.brand} /> : null}
    </Pressable>
  );
}

function YesNo({ value, onChange, invalid }: { value: unknown; onChange: (next: boolean) => void; invalid?: boolean }) {
  const option = (answer: boolean) => {
    const on = value === answer;
    const tone = answer ? { fg: colors.green, bg: colors.greenSoft } : { fg: colors.red, bg: colors.redSoft };
    return (
      <Pressable
        key={String(answer)}
        onPress={() => onChange(answer)}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={answer ? "Yes" : "No"}
        style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: radius.md, borderWidth: on ? 1.5 : 1, borderColor: on ? tone.fg : invalid ? colors.red : colors.border, backgroundColor: on ? tone.bg : colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, opacity: pressed ? 0.85 : 1 })}
      >
        <Ionicons name={answer ? "checkmark-circle" : "close-circle"} size={19} color={on ? tone.fg : colors.muted} />
        <Text style={{ fontSize: 15, fontWeight: on ? "800" : "600", color: on ? tone.fg : colors.textSecondary }}>{answer ? "Yes" : "No"}</Text>
      </Pressable>
    );
  };
  return <View style={{ flexDirection: "row", gap: spacing.sm }}>{option(true)}{option(false)}</View>;
}

/** − value + for counts. Stores a string (the form validates whole numbers). */
function Stepper({ value, onChange, invalid, suffix }: { value: unknown; onChange: (next: string) => void; invalid?: boolean; suffix?: string }) {
  const n = Number.parseInt(String(value ?? ""), 10);
  const current = Number.isFinite(n) ? n : 0;
  const set = (next: number) => onChange(String(Math.max(0, Math.min(9999, next))));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <StepButton icon="remove" label="Decrease" onPress={() => set(current - 1)} disabled={current <= 0} />
      <View style={{ minWidth: 88, height: 40, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: invalid ? 1.5 : 1, borderColor: invalid ? colors.red : colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <TextInput
          value={value === undefined || value === null ? "" : String(value)}
          onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 4))}
          placeholder="0"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={{ fontSize: 16, fontWeight: "800", color: colors.text, textAlign: "center", minWidth: 36, padding: 0 }}
        />
        {suffix ? <Text style={[typography.caption, { fontWeight: "600" }]}>{suffix}</Text> : null}
      </View>
      <StepButton icon="add" label="Increase" onPress={() => set(current + 1)} />
    </View>
  );
}

function StepButton({ icon, label, onPress, disabled }: { icon: any; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : pressed ? 0.75 : 1 })}>
      <Ionicons name={icon} size={18} color={colors.brand} />
    </Pressable>
  );
}

function IconButton({ icon, label, onPress, tone }: { icon: any; label: string; onPress: () => void; tone?: "red" }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: tone === "red" ? colors.redSoft : pressed ? colors.surfaceMuted : "transparent", borderWidth: tone === "red" ? 0 : 1, borderColor: colors.border })}>
      <Ionicons name={icon} size={18} color={tone === "red" ? colors.red : colors.text} />
    </Pressable>
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 46, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.brand, backgroundColor: pressed ? colors.brandSoft : "transparent" })}>
      <Ionicons name="add" size={18} color={colors.brand} />
      <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function LocationCard({ latitude, longitude, loading, onUseGps, onFindFromAddress }: { latitude?: string; longitude?: string; loading: boolean; onUseGps: () => void; onFindFromAddress: () => void }) {
  const located = !!latitude && !!longitude;
  return (
    <View style={{ backgroundColor: located ? colors.greenSoft : colors.brandSoft, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: located ? "#BFE6CF" : "#CBD8FF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          {loading ? <ActivityIndicator color={colors.brand} /> : <Ionicons name={located ? "location" : "navigate"} size={22} color={located ? colors.green : colors.brand} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: located ? colors.green : colors.brand }]}>
            {loading ? "Finding the location…" : located ? "Hospital location captured" : "Capture the hospital location"}
          </Text>
          <Text style={[typography.caption, { marginTop: 2 }]}>
            {located ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : "Stand at the hospital and use GPS. City, district, state and pincode fill in automatically."}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <Button label={located ? "Recapture GPS" : "Use GPS"} icon="locate" compact onPress={onUseGps} disabled={loading} variant={located ? "ghost" : "primary"} style={{ flex: 1 }} />
        <Button label="From address" icon="map-outline" compact onPress={onFindFromAddress} disabled={loading} variant="ghost" style={{ flex: 1 }} />
      </View>
    </View>
  );
}
