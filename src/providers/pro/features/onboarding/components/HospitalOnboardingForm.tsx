import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { BackHandler } from "react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hospitalFields, type HospitalField } from "../data/hospitalFields";
import { SPECIALTY_OPTIONS, EMERGENCY_OPTIONS } from "../data/onboardingOptions";

type StaffMember = {
  name: string;
  mobile: string;
  designation: string;
  designationOther?: string;
};

const LAB_FACILITY_OPTIONS = ["Haematology", "Biochemistry", "Microbiology", "Pathology", "Histopathology", "Serology", "Clinical Pathology", "Blood Bank"];
const DOCTOR_QUALIFICATION_OPTIONS = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "Diploma (PG)", "FRCS", "MRCP", "BDS", "MDS", "BSMS (Siddha)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BUMS (Unani)", "BNYS"];
const UDHS_DESIGNATION_OPTIONS = ["Medical Officer", "Duty Doctor", "Staff Nurse", "Nursing Superintendent", "Hospital Administrator", "Front Office", "Ambulance Coordinator"];

export default function HospitalOnboardingForm() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [sectionIndex, setSectionIndex] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({ websiteProtocol: "https://", udhsStaff: [{ name: "", mobile: "", designation: "", designationOther: "" }, { name: "", mobile: "", designation: "", designationOther: "" }] });
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobMonth, setDobMonth] = useState(new Date(1990, 0, 1));
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const specialtyOptions = SPECIALTY_OPTIONS.map((item) => ({ value: item.code, label: item.name, category: item.category }));
  const emergencyOptions = EMERGENCY_OPTIONS.map((item) => ({ value: item.code, label: item.name, icon: item.icon }));
  const [countryCode, setCountryCode] = useState("+91");
  const [selectField, setSelectField] = useState<HospitalField | null>(null);
  const [selectSearch, setSelectSearch] = useState("");
  const [staffDesignationIndex, setStaffDesignationIndex] = useState<number | null>(null);



  const blue = "#1747D1";
  const section = hospitalFields[sectionIndex];
  const monthStart = new Date(dobMonth.getFullYear(), dobMonth.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(1 - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => { const day = new Date(calendarStart); day.setDate(calendarStart.getDate() + index); return day; });

  const updateField = (key: string, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const isVisible = (field: HospitalField) => {
    if (!field.showWhen) return true;
    const [key, expected] = field.showWhen;
    return form[key] === expected;
  };

  const getList = (key: string): string[] => {
    const values = Array.isArray(form[key]) ? [...form[key]] : [];
    if (key === "doctorQualifications") {
      const order = ["MBBS", "MS", "MD", "MCh", "DM", "DNB", "Diploma (PG)", "FRCS", "MRCP", "BDS", "MDS", "BSMS (Siddha)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BUMS (Unani)", "BNYS", "Other"];
      return values.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    return values;
  };

  const updateListItem = (key: string, index: number, value: string) => {
    const list = [...getList(key)];
    list[index] = value;
    updateField(key, list);
  };

  const addListItem = (key: string) => {
    updateField(key, [...getList(key), ""]);
  };

  const removeListItem = (key: string, index: number) => {
    updateField(
      key,
      getList(key).filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const getStaff = (key: string): StaffMember[] => {
    return Array.isArray(form[key]) ? form[key] : [];
  };

  const updateStaff = (
    key: string,
    index: number,
    field: keyof StaffMember,
    value: string,
  ) => {
    const staff = [...getStaff(key)];
    staff[index] = {
      name: staff[index]?.name || "",
      mobile: staff[index]?.mobile || "",
      designation: staff[index]?.designation || "",
      designationOther: staff[index]?.designationOther || "",
      ...staff[index],
      [field]: field === "mobile"
        ? value.replace(/\D/g, "").slice(0, 10)
        : value,
    };
    updateField(key, staff);
  };

  const addStaff = (key: string) => {
    updateField(key, [
      ...getStaff(key),
      { name: "", mobile: "", designation: "", designationOther: "" },
    ]);
  };

  const removeStaff = (key: string, index: number) => {
    updateField(
      key,
      getStaff(key).filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const isValidPhone = (value: string) => /^\d{10}$/.test(value);

  const isValidInteger = (value: string) => /^\d+$/.test(value);

  const isValidDecimal = (value: string) =>
    /^-?\d+(\.\d+)?$/.test(value);

  const isValidWebsite = (value: string) =>
    /^https?:\/\/[^\s]+$/i.test(value);

  const fetchPincodeDetails = async (value: string) => {
    const pincode = value.replace(/\D/g, "").slice(0, 6);
    updateField("pincode", pincode);

    if (pincode.length !== 6) return;

    try {
      setPincodeLoading(true);
      setError("");

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await response.json();
      const postOffice = data?.[0]?.PostOffice?.[0];

      if (!postOffice) {
        throw new Error("Pincode not found");
      }

      updateField("district", postOffice.District || "");
      updateField("state", postOffice.State || "");
      updateField("country", postOffice.Country || "India");

      if (!form.city && postOffice.Block) {
        updateField("city", postOffice.Block);
      }
    } catch (lookupError: any) {
      console.log("Pincode lookup error:", lookupError);
      setError("Unable to find this pincode. Please check the pincode.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setError("");

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Location permission was not granted");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      updateField("latitude", latitude.toFixed(6));
      updateField("longitude", longitude.toFixed(6));

      // Reverse-geocode GPS coordinates to prefill address fields.
      // The address line intentionally remains manual so the PRO can enter
      // the exact hospital/building address instead of a broad map result.
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = addresses?.[0];
      if (place) {
        const city = place.city || place.district || place.subregion || place.region || "";
        const district = place.district || place.subregion || place.city || "";
        if (city) updateField("city", city);
        if (district) updateField("district", district);
        if (place.region) updateField("state", place.region);
        if (place.country) updateField("country", place.country);
        if (place.postalCode) updateField("pincode", place.postalCode.replace(/\D/g, "").slice(0, 6));
      }
    } catch (locationError: any) {
      console.log("Current location error:", locationError);
      setError(locationError?.message || "Unable to get current location");
    } finally {
      setLocationLoading(false);
    }
  };


  const geocodeHospitalAddress = async () => {
    const address = [form.addressLine, form.city, form.district, form.state, form.pincode, form.country || "India"].filter(Boolean).join(", ");
    if (!form.addressLine || !form.city || !form.state) { setError("Enter the hospital address, city and state before finding coordinates."); return; }
    try {
      setLocationLoading(true); setError("");
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, { headers: { Accept: "application/json", "User-Agent": "UyirServiceProvider/1.0" } });
      const results = await response.json();
      if (!response.ok || !Array.isArray(results) || !results[0]) throw new Error("No map location found. Please refine the address or enter coordinates manually.");
      updateField("latitude", String(results[0].lat));
      updateField("longitude", String(results[0].lon));
    } catch (e: any) { setError(e?.message || "Unable to find the hospital on the map."); }
    finally { setLocationLoading(false); }
  };

  const validateSection = () => {
    for (const field of section.fields) {
      if (!isVisible(field)) continue;

      const value = form[field.key];

      if (field.type === "multiSelect") {
        const selected = getList(field.key);
        if (field.required && selected.filter((item) => item !== "Other").length === 0 && !String(form[field.otherKey || `${field.key}Other`] || "").trim()) { setError(`${field.label} is required`); return false; }
        if (selected.includes("Other") && !String(form[field.otherKey || `${field.key}Other`] || "").trim()) { setError(`Enter the other ${field.label.toLowerCase()}`); return false; }
        continue;
      }

      if (field.type === "list") {
        const list = getList(field.key)
          .map((item) => item.trim())
          .filter(Boolean);

        if (field.required && list.length === 0) {
          setError(`${field.label} is required`);
          return false;
        }

        if (list.length !== getList(field.key).length) {
          setError(`Please complete all ${field.label.toLowerCase()}`);
          return false;
        }

        continue;
      }

      if (field.type === "staffList") {
        const staff = getStaff(field.key);

        if (field.required && staff.length < 2) {
          setError("Please add details for at least 2 UDHS staff members");
          return false;
        }

        for (const member of staff) {
          if (
            !member.name.trim() ||
            !member.mobile.trim() ||
            !member.designation.trim() ||
            (member.designation === "Other" && !String(member.designationOther || "").trim())
          ) {
            setError("Please complete all UDHS staff details");
            return false;
          }

          if (!isValidPhone(member.mobile.trim())) {
            setError("UDHS staff mobile number must contain 10 digits");
            return false;
          }
        }

        continue;
      }

      const textValue =
        value === undefined || value === null ? "" : String(value).trim();

      if (
        field.required &&
        (value === undefined || value === null || textValue === "")
      ) {
        setError(`${field.label} is required`);
        return false;
      }

      if (textValue === "") continue;
      if (value === "Other" && !String(form[`${field.key}Other`] || "").trim()) { setError(`Enter the other ${field.label.toLowerCase()}`); return false; }

      if (field.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue)) { setError("Enter a valid email address"); return false; }

      if (field.key === "website" && textValue && !/^[^\s.]+(?:\.[^\s.]+)+(?::\d+)?(?:\/[^\s]*)?$/i.test(textValue.replace(/^https?:\/\//i, ""))) {
        setError("Enter a valid website address");
        return false;
      }

      if (field.type === "phone" && !isValidPhone(textValue)) {
        setError(`${field.label} must contain exactly 10 digits`);
        return false;
      }

      if (field.key === "pincode" && !/^\d{6}$/.test(textValue)) {
        setError("Pincode must contain exactly 6 digits");
        return false;
      }

      if (field.type === "number" && !isValidInteger(textValue)) {
        setError(`${field.label} must contain numbers only`);
        return false;
      }

      if (field.type === "decimal" && !isValidDecimal(textValue)) {
        setError(`${field.label} must contain a valid number`);
        return false;
      }

      if (field.key === "longitude") {
        const longitude = Number(textValue);
        if (longitude < -180 || longitude > 180) {
          setError("Longitude must be between -180 and 180");
          return false;
        }
      }

      if (field.key === "latitude") {
        const latitude = Number(textValue);
        if (latitude < -90 || latitude > 90) {
          setError("Latitude must be between -90 and 90");
          return false;
        }
      }
    }

    setError("");
    return true;
  };

  const getKeyboardType = (field: HospitalField) => {
    if (field.type === "number") return "number-pad";
    if (field.type === "phone") return "phone-pad";
    if (field.type === "decimal") return "decimal-pad";
    return "default";
  };

  const nextSection = () => {
    if (!validateSection()) return;

    if (sectionIndex < hospitalFields.length - 1) {
      setSectionIndex((current) => current + 1);
      return;
    }

    navigation.navigate("OnboardingPreview", {
      form,
      proHospitalId: route.params?.proHospitalId,
      hospitalPoolId: route.params?.hospitalPoolId,
    });
  };

  const previousSection = () => {
    setError("");

    if (sectionIndex > 0) {
      setSectionIndex((current) => current - 1);
    } else {
      Alert.alert("Leave hospital form?", "Your entered details will be lost if you leave this form.", [{ text: "Continue editing", style: "cancel" }, { text: "Leave form", style: "destructive", onPress: () => navigation.goBack() }]);
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectField || showDobPicker) { setSelectField(null); setShowDobPicker(false); return true; }
      if (sectionIndex > 0) { setSectionIndex((current) => Math.max(0, current - 1)); setError(""); return true; }
      Alert.alert("Leave hospital form?", "Your entered details will be lost if you leave this form.", [{ text: "Continue editing", style: "cancel" }, { text: "Leave form", style: "destructive", onPress: () => navigation.goBack() }]);
      return true;
    });
    return () => subscription.remove();
  }, [sectionIndex, selectField, showDobPicker, navigation]);

  const progress = ((sectionIndex + 1) / hospitalFields.length) * 100;

  const inputStyle = {
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F2",
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#17233F",
  } as const;

  const openSelect = (field: HospitalField) => {
    setSelectSearch("");
    setSelectField(field);
  };

  const getSelectOptions = (field: HospitalField) => {
    if (field.optionsSource === "specialties") {
      const values = specialtyOptions.map((item: any) => ({ value: field.key === "doctorDepartment" ? item.label : item.value, label: item.category ? `${item.category} · ${item.label}` : item.label }));
      if (field.key !== "doctorSex" && field.key !== "websiteProtocol") values.push({ value: "Other", label: "Other" });
      return values;
    }
    if (field.optionsSource === "emergencyConditions") return emergencyOptions;
    if (field.optionsSource === "labFacilities") return LAB_FACILITY_OPTIONS.map((item) => ({ value: item, label: item }));
    if (field.optionsSource === "doctorQualifications") return DOCTOR_QUALIFICATION_OPTIONS.map((item) => ({ value: item, label: item }));
    if (field.optionsSource === "designations") return UDHS_DESIGNATION_OPTIONS.map((item) => ({ value: item, label: item }));
    const options = (field.options || []).map((item) => ({ value: item, label: item.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
    if (!options.some((item) => item.value === "Other") && field.key !== "doctorSex" && field.key !== "websiteProtocol") options.push({ value: "Other", label: "Other" });
    return options;
  };

  const openStaffDesignation = (index: number) => {
    setStaffDesignationIndex(index);
    setSelectSearch("");
    setSelectField({ key: "__staffDesignation", label: "Staff designation", type: "select", options: [...UDHS_DESIGNATION_OPTIONS, "Other"] });
  };

  const getMultiOptions = (field: HospitalField) => {
    let options: { value: string; label: string }[] = [];
    if (field.optionsSource === "specialties") options = specialtyOptions.map((item: any) => ({ value: item.value, label: item.category ? `${item.category} · ${item.label}` : item.label }));
    else if (field.optionsSource === "emergencyConditions") options = emergencyOptions;
    else if (field.optionsSource === "labFacilities") options = LAB_FACILITY_OPTIONS.map((item) => ({ value: item, label: item }));
    else if (field.optionsSource === "doctorQualifications") options = DOCTOR_QUALIFICATION_OPTIONS.map((item) => ({ value: item, label: item }));
    else options = (field.options || []).map((item) => ({ value: item, label: item.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
    if (!options.some((item) => item.value === "Other")) options.push({ value: "Other", label: "Other" });
    if (field.key === "doctorEmergencyConditions") {
      const hospitalConditions = getList("specialtyEmergencyConditionsHandled");
      options = options.filter((item) => item.value === "Other" || hospitalConditions.includes(item.value));
    }
    if (field.key === "doctorQualifications") {
      const order = ["MBBS", "MS", "MD", "MCh", "DM", "DNB", "Diploma (PG)", "FRCS", "MRCP", "BDS", "MDS", "BSMS (Siddha)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BUMS (Unani)", "BNYS", "Other"];
      options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
    }
    return options;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F7FD" }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 17,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          borderBottomWidth: 1,
          borderBottomColor: "#E7EEF8",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={previousSection}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: "#F0F5FF",
              borderWidth: 1,
              borderColor: "#E1EAFE",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 22, color: "#171A2B", marginTop: -2 }}>
              ‹
            </Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#10254B", letterSpacing: -0.4 }}>
              Hospital onboarding
            </Text>
            <Text style={{ fontSize: 12, color: "#75839A", marginTop: 4 }}>
              Let’s add your hospital information
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#EAF1FF",
              borderRadius: 12,
              paddingHorizontal: 11,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: blue }}>
              {sectionIndex + 1} / {hospitalFields.length}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 5,
            backgroundColor: "#E5EAF3",
            borderRadius: 3,
            marginTop: 14,
          }}
        >
          <View
            style={{
              height: 6,
              width: `${progress}%`,
              backgroundColor: "#2463EB",
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 150 + insets.bottom,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: "#171A2B",
            marginBottom: 16,
          }}
        >
          {section.title}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: "#7A879D", marginBottom: 18 }}>
          {section.title === "Basic Information" ? "Start with the hospital’s official details." : section.title === "Address" ? "Use GPS to fill location details, then enter the exact address." : section.title === "Contact Details" ? "Add the best way to reach this hospital." : section.title === "Facilities" ? "Tell us what services and facilities are available." : section.title === "Emergency Services" ? "Choose the emergency services this hospital supports." : "Complete the information below to continue."}
        </Text>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#E4ECF7", padding: 16, shadowColor: "#163B73", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
          <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center", marginRight: 11 }}><Text style={{ fontSize: 18, color: blue }}>{section.title === "Address" ? "⌖" : section.title === "Contact Details" ? "☎" : section.title === "Facilities" ? "✚" : section.title === "Emergency Services" ? "＋" : "▦"}</Text></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "800", color: "#18315A" }}>{section.title}</Text><Text style={{ fontSize: 11, color: "#8A96AA", marginTop: 3 }}>Fields marked * are required</Text></View>
        </View>

        {section.title === "Address" ? (
          <Pressable
            onPress={fetchCurrentLocation}
            disabled={locationLoading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 54,
              paddingHorizontal: 14,
              marginBottom: 18,
              borderRadius: 15,
              backgroundColor: "#EAF2FF",
              borderWidth: 1,
              borderColor: "#C8D9FF",
            }}
          >
            {locationLoading ? (
              <ActivityIndicator color={blue} />
            ) : (
              <Text style={{ fontSize: 16, color: blue }}>⌖</Text>
            )}
            <Text style={{ fontSize: 13, fontWeight: "700", color: blue }}>
              {locationLoading ? "Finding location and filling details…" : "Use GPS to fill location details"}
            </Text>
          </Pressable>
        ) : null}

        {section.title === "Address" && form.latitude && form.longitude ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE8F7", borderRadius: 18, padding: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "#E8F8F0", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Text style={{ fontSize: 18, color: "#128456" }}>⌖</Text></View>
              <View style={{ flex: 1 }}><Text style={{ color: "#19345C", fontWeight: "800", fontSize: 14 }}>GPS location captured</Text><Text style={{ color: "#71829A", fontSize: 11, marginTop: 3 }}>Confirm this is the hospital location</Text></View>
              <View style={{ backgroundColor: "#E8F8F0", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: "#128456", fontWeight: "700", fontSize: 10 }}>Located</Text></View>
            </View>
            <View style={{ height: 74, backgroundColor: "#EEF4FB", borderRadius: 13, overflow: "hidden", marginBottom: 12, justifyContent: "center", alignItems: "center" }}>
              <View style={{ position: "absolute", height: 1, left: 0, right: 0, top: 24, backgroundColor: "#D5E2F2" }} /><View style={{ position: "absolute", height: 1, left: 0, right: 0, top: 49, backgroundColor: "#D5E2F2" }} /><View style={{ position: "absolute", width: 1, top: 0, bottom: 0, left: "32%", backgroundColor: "#D5E2F2" }} /><View style={{ position: "absolute", width: 1, top: 0, bottom: 0, left: "68%", backgroundColor: "#D5E2F2" }} />
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#DCE9FF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }}><Text style={{ color: "#1759E8", fontSize: 19 }}>●</Text></View>
              <Text style={{ position: "absolute", bottom: 6, right: 9, color: "#657A98", fontSize: 9 }}>GPS preview</Text>
            </View>
            <Text style={{ color: "#71829A", fontSize: 12 }}>Location coordinates saved securely with the hospital address.</Text>
          </View>
        ) : null}

        {section.fields.map((field) => {
          if (!isVisible(field)) return null;

          const value = form[field.key];

          return (
            <View key={field.key} style={{ marginBottom: 19 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#344563",
                  marginBottom: 8,
                }}
              >
                {field.label}
                {field.required ? " *" : ""}
              </Text>

              {field.type === "boolean" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => updateField(field.key, true)}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 14,
                      backgroundColor: value === true ? "#EAF1FF" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: value === true ? "#2463EB" : "#DCE5F2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: value === true ? "#1747D1" : "#596A83",
                      }}
                    >
                      Yes
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateField(field.key, false)}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 14,
                      backgroundColor: value === false ? "#EAF1FF" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: value === false ? "#2463EB" : "#DCE5F2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: value === false ? "#1747D1" : "#596A83",
                      }}
                    >
                      No
                    </Text>
                  </Pressable>
                </View>
              ) : field.type === "select" ? (
                <View>
                <Pressable
                  onPress={() => openSelect(field)}
                  style={{ minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#DCE5F2", backgroundColor: "#FFFFFF", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Text style={{ flex: 1, fontSize: 14, color: value ? "#17233F" : "#9AA8BC", fontWeight: value ? "600" : "400" }}>
                    {value ? (field.optionsSource === "specialties" ? (specialtyOptions.find((item) => item.value === value || item.label === value)?.label || String(value)) : String(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())) : `Select ${field.label.toLowerCase()}`}
                  </Text>
                  <Text style={{ fontSize: 17, color: "#55709A", marginLeft: 10 }}>⌄</Text>
                </Pressable>
                {value === "Other" && field.key !== "doctorSex" && field.key !== "websiteProtocol" ? <TextInput value={String(form[`${field.key}Other`] || "")} onChangeText={(text) => updateField(`${field.key}Other`, text)} placeholder={`Enter other ${field.label.toLowerCase()}`} placeholderTextColor="#9AA1B2" style={{ ...inputStyle, marginTop: 9 }} /> : null}
                </View>
              ) : field.type === "multiSelect" ? (
                <View>
                  <Pressable onPress={() => openSelect(field)} style={{ minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#DCE5F2", backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ flex: 1, fontSize: 13, color: getList(field.key).length ? "#17233F" : "#9AA8BC" }}>{getList(field.key).length ? `${getList(field.key).filter((item) => item !== "Other").length + (getList(field.key).includes("Other") ? 1 : 0)} selected` : `Choose ${field.label.toLowerCase()}`}</Text>
                    <Text style={{ color: blue, fontSize: 18, marginLeft: 10 }}>⌄</Text>
                  </Pressable>
                  {getList(field.key).length > 0 && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 }}>{getList(field.key).map((selectedValue) => {
                    const selectedOption = getMultiOptions(field).find((option) => option.value === selectedValue);
                    return <View key={selectedValue} style={{ backgroundColor: "#EAF1FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 5 }}><Text style={{ color: blue, fontSize: 11, fontWeight: "700" }}>{selectedOption?.label || selectedValue}</Text><Pressable onPress={() => updateField(field.key, getList(field.key).filter((item) => item !== selectedValue))}><Text style={{ color: blue, fontWeight: "800" }}>×</Text></Pressable></View>;
                  })}</View>}
                  {getList(field.key).includes("Other") && <TextInput value={String(form[field.otherKey || `${field.key}Other`] || "")} onChangeText={(text) => updateField(field.otherKey || `${field.key}Other`, text)} placeholder={`Enter other ${field.label.toLowerCase()}`} placeholderTextColor="#9AA1B2" style={{ ...inputStyle, marginTop: 10 }} />}
                </View>
              ) : field.type === "list" ? (
                <View>
                  {getList(field.key).length === 0 ? (
                    <TextInput
                      value=""
                      onChangeText={(text) => updateField(field.key, [text])}
                      placeholder={`Enter ${field.itemLabel || "item"}`}
                      placeholderTextColor="#9AA1B2"
                      style={inputStyle}
                    />
                  ) : (
                    getList(field.key).map((item, index) => (
                      <View
                        key={`${field.key}-${index}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <TextInput
                          value={item}
                          onChangeText={(text) =>
                            updateListItem(field.key, index, text)
                          }
                          placeholder={`Enter ${field.itemLabel || "item"}`}
                          placeholderTextColor="#9AA1B2"
                          style={{ ...inputStyle, flex: 1 }}
                        />

                        <Pressable
                          onPress={() => removeListItem(field.key, index)}
                          style={{
                            width: 38,
                            height: 46,
                            marginLeft: 7,
                            borderRadius: 9,
                            backgroundColor: "#FFF0F1",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: "#C62828",
                            }}
                          >
                            ×
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  )}

                  <Pressable
                    onPress={() => addListItem(field.key)}
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 8,
                      backgroundColor: "#EAF1FF",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: blue }}>
                      + Add {field.itemLabel || "Item"}
                    </Text>
                  </Pressable>
                </View>
              ) : field.type === "staffList" ? (
                <View>
                  {getStaff(field.key).map((member, index) => (
                    <View
                      key={`${field.key}-${index}`}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E1E5ED",
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#596074",
                          }}
                        >
                          Staff {index + 1}
                        </Text>

                        <Pressable onPress={() => { if (getStaff(field.key).length <= 2) { setError("At least 2 UDHS staff members are required"); return; } removeStaff(field.key, index); }}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: "#C62828",
                            }}
                          >
                            ×
                          </Text>
                        </Pressable>
                      </View>

                      <TextInput
                        value={member.name}
                        onChangeText={(text) =>
                          updateStaff(field.key, index, "name", text)
                        }
                        placeholder="Staff name"
                        placeholderTextColor="#9AA1B2"
                        style={inputStyle}
                      />

                      <TextInput
                        value={member.mobile}
                        onChangeText={(text) =>
                          updateStaff(field.key, index, "mobile", text)
                        }
                        placeholder="Mobile number"
                        placeholderTextColor="#9AA1B2"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={{ ...inputStyle, marginTop: 8 }}
                      />

                      <Pressable onPress={() => openStaffDesignation(index)} style={{ ...inputStyle, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ color: member.designation ? "#17233F" : "#9AA1B2", fontSize: 14, flex: 1 }}>{member.designation || "Select designation"}</Text><Text style={{ color: blue, fontSize: 18 }}>⌄</Text>
                      </Pressable>
                      {member.designation === "Other" && <TextInput value={member.designationOther || ""} onChangeText={(text) => updateStaff(field.key, index, "designationOther", text)} placeholder="Enter designation" placeholderTextColor="#9AA1B2" style={{ ...inputStyle, marginTop: 8 }} />}
                    </View>
                  ))}

                  <Pressable
                    onPress={() => addStaff(field.key)}
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 8,
                      backgroundColor: "#EAF1FF",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: blue }}>
                      + Add Staff
                    </Text>
                  </Pressable>
                </View>
              ) : field.type === "phone" ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      height: 46,
                      paddingHorizontal: 11,
                      backgroundColor: "#F5F7FB",
                      borderWidth: 1,
                      borderColor: "#E1E5ED",
                      borderTopLeftRadius: 9,
                      borderBottomLeftRadius: 9,
                      justifyContent: "center",
                    }}
                  >
                    <Pressable onPress={() => Alert.alert("Country code", "Choose country code", [{ text: "India +91", onPress: () => { setCountryCode("+91"); updateField("phoneCountryCode", "+91"); } }, { text: "United States +1", onPress: () => { setCountryCode("+1"); updateField("phoneCountryCode", "+1"); } }, { text: "United Kingdom +44", onPress: () => { setCountryCode("+44"); updateField("phoneCountryCode", "+44"); } }, { text: "Cancel", style: "cancel" }])}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#34394A" }}>{countryCode} ▾</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    value={value || ""}
                    onChangeText={(text) =>
                      updateField(
                        field.key,
                        (() => { let digits = text.replace(/\D/g, ""); const codeDigits = countryCode.replace(/\D/g, ""); if (digits.startsWith(codeDigits) && digits.length > 10) digits = digits.slice(codeDigits.length); return digits.slice(0, 10); })(),
                      )
                    }
                    placeholder="10 digit number"
                    placeholderTextColor="#9AA1B2"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      borderLeftWidth: 0,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                </View>
              ) : field.key === "pincode" ? (
                <View>
                  <TextInput
                    value={value || ""}
                    onChangeText={fetchPincodeDetails}
                    placeholder="6 digit pincode"
                    placeholderTextColor="#9AA1B2"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={inputStyle}
                  />

                  {pincodeLoading ? (
                    <Text style={{ fontSize: 10, color: blue, marginTop: 5 }}>
                      Fetching district and state...
                    </Text>
                  ) : null}
                </View>
              ) : field.key === "doctorDob" ? (
                <View>
                  <Pressable onPress={() => { const initial = value ? new Date(value) : new Date(1990, 0, 1); setDobMonth(new Date(initial.getFullYear(), initial.getMonth(), 1)); setShowDobPicker(true); }} style={{ ...inputStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ color: value ? "#17233F" : "#9AA1B2", fontSize: 14 }}>{value || "Choose date of birth"}</Text>
                    <Text style={{ color: blue, fontSize: 18 }}>▦</Text>
                  </Pressable>
                </View>
              ) : field.key === "website" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => { const next = form.websiteProtocol === "http://" ? "https://" : "http://"; updateField("websiteProtocol", next); }} style={{ minWidth: 105, justifyContent: "center", paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: "#DCE5F2", backgroundColor: "#F4F7FC" }}><Text style={{ color: blue, fontWeight: "700" }}>{form.websiteProtocol || "https://"} ▾</Text></Pressable>
                  <TextInput value={value || ""} onChangeText={(text) => updateField("website", text.replace(/^https?:\/\//i, ""))} placeholder="hospitalwebsite.com" placeholderTextColor="#9AA1B2" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={{ ...inputStyle, flex: 1 }} />
                </View>
              ) : field.key === "email" ? (
                <TextInput value={value === undefined || value === null ? "" : String(value)} onChangeText={(text) => updateField(field.key, text.trimStart())} placeholder="Enter hospital email" placeholderTextColor="#9AA1B2" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" importantForAutofill="yes" selectionColor={blue} style={{ ...inputStyle, minHeight: 54, color: "#17233F", opacity: 1 }} />
              ) : (
                <TextInput
                  value={
                    value === undefined || value === null ? "" : String(value)
                  }
                  onChangeText={(text) => updateField(field.key, text)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor="#9AA1B2"
                  multiline={field.type === "textarea"}
                  textAlignVertical={
                    field.type === "textarea" ? "top" : "center"
                  }
                  keyboardType={getKeyboardType(field) as any}
                  autoCapitalize={field.type === "email" ? "none" : "sentences"}
                  autoCorrect={field.type !== "email"}
                  selectionColor={blue}
                  style={{
                    ...inputStyle,
                    minHeight: field.type === "textarea" ? 100 : 46,
                    paddingVertical: field.type === "textarea" ? 12 : 0,
                  }}
                />
              )}
            </View>
          );
        })}

        </View>



        {error ? (
          <View
            style={{
              backgroundColor: "#FFF0F1",
              borderRadius: 9,
              padding: 10,
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: "#C62828",
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5ECF6",
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 14 + insets.bottom,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          shadowColor: "#17365F",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
          flexDirection: "row",
          gap: 10,
        }}
      >
        {sectionIndex > 0 && (
          <Pressable
            onPress={previousSection}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 15,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#D5DFEF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#596074" }}>
              Back
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={nextSection}
          style={{
            flex: 1,
            height: 54,
            borderRadius: 15,
            backgroundColor: "#1759E8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            {sectionIndex === hospitalFields.length - 1
              ? "Review Details"
              : "Next"}
          </Text>
        </Pressable>
      </View>

      <Modal visible={!!selectField} transparent animationType="slide" onRequestClose={() => setSelectField(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(12,27,53,0.42)", justifyContent: "flex-end" }}>
          <View style={{ maxHeight: "78%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 + insets.bottom }}>
            <View style={{ width: 42, height: 4, borderRadius: 3, backgroundColor: "#D8E0ED", alignSelf: "center", marginBottom: 18 }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flex: 1 }}><Text style={{ fontSize: 20, fontWeight: "800", color: "#14294D" }}>Select {selectField?.label.toLowerCase()}</Text><Text style={{ fontSize: 12, color: "#78879D", marginTop: 4 }}>{selectField?.type === "multiSelect" ? "Select all that apply, then tap Done" : "Choose one option below"}</Text></View>
              <Pressable onPress={() => setSelectField(null)} style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "#F1F5FB", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#50617C", fontSize: 22 }}>×</Text></Pressable>
            </View>
            <TextInput value={selectSearch} onChangeText={setSelectSearch} placeholder={`Search ${selectField?.label.toLowerCase()}…`} placeholderTextColor="#96A3B7" style={{ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#DCE5F2", paddingHorizontal: 15, fontSize: 14, color: "#17233F", marginBottom: 12, backgroundColor: "#F9FBFE" }} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {(selectField ? (selectField.type === "multiSelect" ? getMultiOptions(selectField) : getSelectOptions(selectField)) : []).filter((option) => option.label.toLowerCase().includes(selectSearch.toLowerCase())).map((option) => {
                const selected = !!selectField && (selectField.type === "multiSelect" ? getList(selectField.key).includes(option.value) : selectField.key === "__staffDesignation" ? getStaff("udhsStaff")[staffDesignationIndex ?? -1]?.designation === option.value : form[selectField.key] === option.value);
                return <Pressable key={option.value} onPress={() => {
                  if (!selectField) return;
                  if (selectField.type === "multiSelect") {
                    const current = getList(selectField.key);
                    updateField(selectField.key, selected ? current.filter((item) => item !== option.value) : [...current, option.value]);
                  } else if (selectField.key === "__staffDesignation") {
                    if (staffDesignationIndex !== null) updateStaff("udhsStaff", staffDesignationIndex, "designation", option.value);
                    setSelectField(null); setStaffDesignationIndex(null);
                  } else { updateField(selectField.key, option.value); setSelectField(null); }
                }} style={{ minHeight: 50, borderRadius: 13, paddingHorizontal: 14, marginBottom: 7, backgroundColor: selected ? "#EAF1FF" : "#FFFFFF", borderWidth: 1, borderColor: selected ? "#8DB1FF" : "#E5EBF4", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={{ color: selected ? "#1747D1" : "#334561", fontSize: 14, fontWeight: selected ? "700" : "500", flex: 1 }}>{option.label}</Text>{selected ? <Text style={{ color: "#1747D1", fontWeight: "800" }}>✓</Text> : <Text style={{ color: "#A6B3C5" }}>{selectField?.type === "multiSelect" ? "＋" : ""}</Text>}</Pressable>;
              })}
              {selectField?.type === "multiSelect" && <Pressable onPress={() => setSelectField(null)} style={{ height: 52, borderRadius: 14, backgroundColor: blue, alignItems: "center", justifyContent: "center", marginTop: 8 }}><Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>Done · {getList(selectField.key).length} selected</Text></Pressable>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={() => setShowDobPicker(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(12,27,53,0.45)", justifyContent: "center", padding: 22 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#14294D", marginBottom: 14 }}>Date of birth</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Pressable onPress={() => setDobMonth(new Date(dobMonth.getFullYear(), dobMonth.getMonth() - 1, 1))} style={{ padding: 9 }}><Text style={{ color: blue, fontSize: 20 }}>‹</Text></Pressable>
              <Text style={{ color: "#17233F", fontSize: 15, fontWeight: "700" }}>{dobMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
              <Pressable onPress={() => { const next = new Date(dobMonth.getFullYear(), dobMonth.getMonth() + 1, 1); if (next <= new Date()) setDobMonth(next); }} style={{ padding: 9 }}><Text style={{ color: blue, fontSize: 20 }}>›</Text></Pressable>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <Text key={day} style={{ width: "13.8%", textAlign: "center", color: "#78879D", fontSize: 11, fontWeight: "700" }}>{day}</Text>)}</View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{calendarDays.map((day) => { const sameMonth = day.getMonth() === dobMonth.getMonth(); const future = day > new Date(); const selected = String(form.doctorDob || "") === `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,"0")}-${String(day.getDate()).padStart(2,"0")}`; return <Pressable key={day.toISOString()} disabled={!sameMonth || future} onPress={() => { updateField("doctorDob", `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,"0")}-${String(day.getDate()).padStart(2,"0")}`); setShowDobPicker(false); }} style={{ width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: selected ? blue : "transparent", opacity: sameMonth && !future ? 1 : 0.25 }}><Text style={{ color: selected ? "#FFFFFF" : "#243754", fontSize: 13, fontWeight: selected ? "800" : "500" }}>{day.getDate()}</Text></Pressable>; })}</View>
            <Pressable onPress={() => setShowDobPicker(false)} style={{ marginTop: 12, height: 46, borderRadius: 13, backgroundColor: "#F1F5FB", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#435675", fontWeight: "700" }}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
