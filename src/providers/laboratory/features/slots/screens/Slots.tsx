import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLabTestCatalogs, getLabTests, getProviderAppointments, getProviderContext, updateLabTest } from "../../../api/laboratory";

type CatalogTest = { testCatalogId: string; code?: string; name?: string; description?: string; category?: string; sampleType?: string; status?: string };
type LabTest = { labTestId: string; testCatalogId?: string; testCatalog?: CatalogTest; price?: number | string; turnaroundTime?: number | string; status?: string };
type Booking = { appointmentId: string; bookingId?: string; patient?: { name?: string }; appointmentDate?: string; startTime?: string; endTime?: string; status?: string; tests?: any[]; services?: any[]; appointmentType?: string };
const BLUE = "#075DE8";
const NAVY = "#10254B";
const MUTED = "#78869C";
const BORDER = "#E5ECF5";
const PALE = "#F4F7FC";
const TIMES = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM"];
const TABS = ["Catalogue", "My Tests", "Booked Times"] as const;
type Tab = typeof TABS[number];

export default function Slots() {
  const [catalog, setCatalog] = useState<CatalogTest[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labId, setLabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<Tab>("Catalogue");
  const [selected, setSelected] = useState<string[]>([]);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [tatDraft, setTatDraft] = useState<Record<string, string>>({});
  const [activeDraft, setActiveDraft] = useState<Record<string, boolean>>({});
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [step, setStep] = useState<"catalogue" | "configure" | "times">("catalogue");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [context, catalogResponse, appointmentResult] = await Promise.all([getProviderContext(), getLabTestCatalogs(), getProviderAppointments()]);
      const id = context.lab?.labId || null;
      setLabId(id);
      const testsResponse = id ? await getLabTests(id) : null;
      const availableCatalog = Array.isArray(catalogResponse?.data) ? catalogResponse.data.filter((x: CatalogTest) => !x.status || String(x.status).toUpperCase() === "ACTIVE") : [];
      const configured = Array.isArray(testsResponse?.data) ? testsResponse.data : [];
      setCatalog(availableCatalog);
      setLabTests(configured);
      const appointmentData = Array.isArray(appointmentResult?.response?.data) ? appointmentResult.response.data : [];
      setBookings(appointmentData);
      setPriceDraft((prev) => { const next = { ...prev }; configured.forEach((x: LabTest) => { if (next[x.labTestId] === undefined) next[x.labTestId] = String(x.price ?? ""); }); return next; });
      setTatDraft((prev) => { const next = { ...prev }; configured.forEach((x: LabTest) => { if (next[x.labTestId] === undefined) next[x.labTestId] = String(x.turnaroundTime ?? "24"); }); return next; });
      setActiveDraft((prev) => { const next = { ...prev }; configured.forEach((x: LabTest) => { if (next[x.labTestId] === undefined) next[x.labTestId] = String(x.status || "ACTIVE").toUpperCase() === "ACTIVE"; }); return next; });
    } catch (error: any) {
      console.log("Lab Slots API error:", error);
      Alert.alert("Unable to load slots and tests", error?.message || "Please check your connection and try again.");
    } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const categories = useMemo(() => ["All", ...Array.from(new Set(catalog.map((x) => x.category).filter(Boolean) as string[]))], [catalog]);
  const filtered = useMemo(() => catalog.filter((item) => {
    const text = `${item.name || ""} ${item.code || ""} ${item.description || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "All" || item.category === category);
  }), [catalog, query, category]);
  const configuredCatalogIds = new Set(labTests.map((x) => x.testCatalogId || x.testCatalog?.testCatalogId).filter(Boolean));
  const selectedCatalog = catalog.filter((item) => selected.includes(item.testCatalogId));

  const toggleSelected = (id: string) => {
    if (configuredCatalogIds.has(id)) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleTime = (time: string) => setSelectedTimes((prev) => prev.includes(time) ? prev.filter((x) => x !== time) : [...prev, time]);
  const configureSelected = () => {
    if (!selected.length) return Alert.alert("Choose tests", "Tap + on each test your lab offers, then continue.");
    setStep("configure");
  };
  const saveExistingTest = async (item: LabTest) => {
    if (!labId) return Alert.alert("Lab not found", "Your provider profile did not return a lab ID.");
    const price = Number(priceDraft[item.labTestId]);
    const tat = Number(tatDraft[item.labTestId]);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(tat) || tat < 0) return Alert.alert("Check test details", "Enter a valid price and turnaround time.");
    setSavingId(item.labTestId);
    try {
      await updateLabTest(labId, item.labTestId, { price, turnaroundTime: tat, status: activeDraft[item.labTestId] ? "ACTIVE" : "INACTIVE" });
      Alert.alert("Test updated", "Your configured lab test was updated successfully.");
      await load();
    } catch (error: any) { Alert.alert("Could not update test", error?.message || "Please try again."); }
    finally { setSavingId(null); }
  };
  const nextToTimes = () => {
    if (!selected.length) return Alert.alert("Choose tests", "Select at least one catalogue test.");
    setStep("times");
  };
  const saveSlots = () => {
    if (!selectedTimes.length) return Alert.alert("Choose time slots", "Select one or more available times first.");
    Alert.alert("Availability API needed", `You selected ${selectedCatalog.length} test(s) and ${selectedTimes.length} time slot(s) for ${selectedDate.toLocaleDateString("en-IN")}. The current backend documentation does not define a save-availability endpoint, so these slot selections are not yet saved on the server.`);
  };
  const changeDate = (offset: number) => { const next = new Date(selectedDate); next.setDate(next.getDate() + offset); setSelectedDate(next); };
  const dateLabel = selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const statusColor = (status?: string) => String(status || "").toUpperCase() === "COMPLETED" ? "#159447" : String(status || "").toUpperCase() === "CANCELLED" ? "#D92D43" : BLUE;

  return <SafeAreaView style={{ flex:  1, backgroundColor: PALE }} edges={["top"]}>
    <View style={{ backgroundColor: BLUE, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View><Text style={{ color: "#DCE9FF", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>LAB MANAGEMENT</Text><Text style={{ color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 4 }}>{step === "times" ? "Set Time Slots" : step === "configure" ? "Select Tests" : "Slots & Tests"}</Text><Text style={{ color: "#E8F0FF", fontSize: 11, marginTop: 4 }}>{step === "times" ? "Choose when patients can book your selected tests" : step === "configure" ? "Review the tests you want to offer" : "Catalogue, configured tests and bookings"}</Text></View><View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={26} color="#FFFFFF"/></View></View>
      {step === "catalogue" ? <View style={{ flexDirection: "row", backgroundColor: "#E7EEFC", borderRadius: 13, padding: 4, marginTop: 16 }}>{TABS.map((item) => <Pressable key={item} onPress={() => setTab(item)} style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", backgroundColor: tab === item ? "#FFFFFF" : "transparent" }}><Text style={{ color: tab === item ? BLUE : "#62738E", fontSize: 10, fontWeight: "900" }}>{item}</Text></Pressable>)}</View> : <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>{[{ label: "Catalogue", value: "catalogue" }, { label: "Configure", value: "configure" }, { label: "Time slots", value: "times" }].map((item) => <View key={item.value} style={{ flex: 1, backgroundColor: step === item.value ? "#FFFFFF" : "rgba(255,255,255,0.17)", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}><Text style={{ color: step === item.value ? BLUE : "#FFFFFF", fontSize: 10, fontWeight: "800" }}>{item.label}</Text></View>)}</View>}
    </View>

    {loading ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={BLUE}/><Text style={{ color: MUTED, marginTop: 10 }}>Loading live lab data…</Text></View> : <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 26 }} showsVerticalScrollIndicator={false}>
      {step === "catalogue" && tab === "Catalogue" ? <>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, marginBottom: 12, marginTop: 2 }}><Ionicons name="search-outline" size={18} color={MUTED}/><TextInput value={query} onChangeText={setQuery} placeholder="Search test name or code" placeholderTextColor="#9AA6B8" style={{ flex: 1, padding: 12, color: NAVY, fontSize: 12 }}/><Ionicons name="options-outline" size={18} color={BLUE}/></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>{categories.map((c) => <Pressable key={c} onPress={() => setCategory(c)} style={{ backgroundColor: category === c ? BLUE : "#FFFFFF", borderColor: category === c ? BLUE : BORDER, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 22 }}><Text style={{ color: category === c ? "#FFFFFF" : "#53627A", fontWeight: "800", fontSize: 10 }}>{c}</Text></Pressable>)}</ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Text style={{ fontSize: 15, fontWeight: "900", color: NAVY }}>Available tests</Text><Text style={{ color: MUTED, fontSize: 10 }}>{filtered.length} tests</Text></View>
        {filtered.map((item) => { const alreadyAdded = Boolean(configuredCatalogIds.has(item.testCatalogId)); const isSelected = selected.includes(item.testCatalogId); return <View key={item.testCatalogId} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: isSelected ? BLUE : BORDER, padding: 13, marginBottom: 10 }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={22} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11, marginRight: 8 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>{item.name || "Unnamed test"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{item.code || "No code"} · {item.category || "General"}</Text></View><View style={{ backgroundColor: alreadyAdded ? "#E7F8EF" : "#EAF1FF", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 }}><Text style={{ color: alreadyAdded ? "#159447" : BLUE, fontSize: 8, fontWeight: "900" }}>{alreadyAdded ? "ADDED" : "ACTIVE"}</Text></View></View><Text style={{ color: "#65748B", fontSize: 10, lineHeight: 15, marginTop: 10 }}>{item.description || `Sample type: ${item.sampleType || "Not specified"}`}</Text><View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}><Ionicons name="water-outline" size={13} color={MUTED}/><Text style={{ color: MUTED, fontSize: 9, marginLeft: 4, flex: 1 }}>Sample: {item.sampleType || "Not specified"}</Text><Pressable disabled={alreadyAdded} onPress={() => toggleSelected(item.testCatalogId)} style={{ backgroundColor: alreadyAdded ? "#E9F8EF" : isSelected ? "#EAF1FF" : BLUE, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 8, flexDirection: "row", alignItems: "center" }}><Ionicons name={alreadyAdded ? "checkmark" : isSelected ? "checkmark" : "add"} size={15} color={alreadyAdded ? "#159447" : isSelected ? BLUE : "#FFFFFF"}/><Text style={{ color: alreadyAdded ? "#159447" : isSelected ? BLUE : "#FFFFFF", fontSize: 10, fontWeight: "900", marginLeft: 4 }}>{alreadyAdded ? "Added" : isSelected ? "Selected" : "Add"}</Text></Pressable></View></View>; })}
        {filtered.length === 0 ? <EmptyState title="No tests found" message="Try a different test name or category."/> : null}
        {selected.length ? <Pressable onPress={configureSelected} style={{ backgroundColor: BLUE, borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4 }}><Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900" }}>Configure selected tests ({selected.length})</Text><Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={{ marginLeft: 8 }}/></Pressable> : null}
        <Text style={{ color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 12 }}>Catalogue data is loaded from the backend. Adding a new catalogue test permanently requires the lab-test association API.</Text>
      </> : null}

      {step === "catalogue" && tab === "My Tests" ? <>
        <Text style={{ color: NAVY, fontSize: 16, fontWeight: "900", marginBottom: 4 }}>My configured tests</Text><Text style={{ color: MUTED, fontSize: 11, marginBottom: 13 }}>Edit the price, turnaround time and availability for tests already linked to your lab.</Text>
        {labTests.map((item) => <View key={item.labTestId} style={{ backgroundColor: "#FFFFFF", borderRadius: 15, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={20} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>{item.testCatalog?.name || catalog.find((x) => x.testCatalogId === item.testCatalogId)?.name || "Lab test"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{item.testCatalog?.code || "Configured test"}</Text></View><Pressable onPress={() => setActiveDraft((prev) => ({ ...prev, [item.labTestId]: !(prev[item.labTestId] ?? String(item.status).toUpperCase() === "ACTIVE") }))} style={{ backgroundColor: activeDraft[item.labTestId] ? "#E5F8EE" : "#FDECEF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}><Text style={{ color: activeDraft[item.labTestId] ? "#159447" : "#D92D43", fontSize: 9, fontWeight: "900" }}>{activeDraft[item.labTestId] ? "ACTIVE" : "INACTIVE"}</Text></Pressable></View><View style={{ flexDirection: "row", gap: 10, marginTop: 13 }}><View style={{ flex: 1 }}><Text style={{ color: MUTED, fontSize: 10, marginBottom: 5 }}>Price (₹)</Text><TextInput value={priceDraft[item.labTestId] ?? String(item.price ?? "")} onChangeText={(v) => setPriceDraft((p) => ({ ...p, [item.labTestId]: v }))} keyboardType="decimal-pad" style={inputStyle}/></View><View style={{ flex: 1 }}><Text style={{ color: MUTED, fontSize: 10, marginBottom: 5 }}>Turnaround (hours)</Text><TextInput value={tatDraft[item.labTestId] ?? String(item.turnaroundTime ?? "24")} onChangeText={(v) => setTatDraft((p) => ({ ...p, [item.labTestId]: v }))} keyboardType="number-pad" style={inputStyle}/></View></View><Pressable disabled={savingId === item.labTestId} onPress={() => saveExistingTest(item)} style={{ marginTop: 11, backgroundColor: savingId === item.labTestId ? "#AAB8D0" : BLUE, borderRadius: 10, padding: 11, alignItems: "center" }}>{savingId === item.labTestId ? <ActivityIndicator color="#FFFFFF"/> : <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900" }}>Save test settings</Text>}</Pressable></View>)}
        {!labTests.length ? <EmptyState title="No configured tests yet" message="Select tests from Catalogue to prepare your lab's test list."/> : null}
      </> : null}

      {step === "catalogue" && tab === "Booked Times" ? <>
        <Text style={{ color: NAVY, fontSize: 16, fontWeight: "900", marginBottom: 4 }}>Booked appointment times</Text><Text style={{ color: MUTED, fontSize: 11, marginBottom: 12 }}>Actual appointment times returned by the appointment API.</Text>
        {bookings.slice().sort((a, b) => new Date(a.appointmentDate || 0).getTime() - new Date(b.appointmentDate || 0).getTime()).map((item) => <View key={item.appointmentId} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 13, marginBottom: 9, flexDirection: "row", alignItems: "center" }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="calendar-outline" size={20} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>{item.patient?.name || "Patient appointment"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{formatDate(item.appointmentDate)} · {formatTime(item.startTime)}–{formatTime(item.endTime)}</Text><Text style={{ color: statusColor(item.status), fontSize: 9, fontWeight: "900", marginTop: 5 }}>{String(item.status || "BOOKED").replace(/_/g, " ")}</Text></View></View>)}
        {!bookings.length ? <EmptyState title="No booked times" message="Booked appointment times will appear here when the API returns appointments."/> : null}
      </> : null}

      {step === "configure" ? <>
        <Pressable onPress={() => setStep("catalogue")} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}><Ionicons name="chevron-back" size={18} color={BLUE}/><Text style={{ color: BLUE, fontSize: 11, fontWeight: "900", marginLeft: 3 }}>Back to catalogue</Text></Pressable>
        <Text style={{ color: NAVY, fontSize: 17, fontWeight: "900" }}>Selected tests ({selectedCatalog.length})</Text><Text style={{ color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 13 }}>Review your selection before choosing the appointment times.</Text>
        {selectedCatalog.map((item) => <View key={item.testCatalogId} style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center" }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={20} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>{item.name}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{item.code || "Catalogue test"} · {item.category || "General"}</Text></View><Pressable onPress={() => toggleSelected(item.testCatalogId)}><Ionicons name="close-circle" size={22} color="#D92D43"/></Pressable></View>)}
        <View style={{ backgroundColor: "#FFF8E8", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "flex-start", marginTop: 3 }}><Ionicons name="information-circle-outline" size={18} color="#A66A00"/><Text style={{ color: "#8C620E", fontSize: 10, lineHeight: 15, flex: 1, marginLeft: 7 }}>The current backend docs do not include the endpoint to associate these new catalogue tests with your lab. You can continue setting up the time selection UI, but permanent saving needs that API.</Text></View>
        <Pressable onPress={nextToTimes} style={{ backgroundColor: BLUE, borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 15 }}><Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900" }}>Next: Set Time Slots</Text><Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={{ marginLeft: 8 }}/></Pressable>
      </> : null}

      {step === "times" ? <>
        <Pressable onPress={() => setStep("configure")} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}><Ionicons name="chevron-back" size={18} color={BLUE}/><Text style={{ color: BLUE, fontSize: 11, fontWeight: "900", marginLeft: 3 }}>Back to selected tests</Text></Pressable>
        <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Pressable onPress={() => changeDate(-1)} style={dateButton}><Ionicons name="chevron-back" size={17} color={BLUE}/></Pressable><View style={{ alignItems: "center" }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>{dateLabel}</Text><Text style={{ color: MUTED, fontSize: 9, marginTop: 3 }}>Selected date</Text></View><Pressable onPress={() => changeDate(1)} style={dateButton}><Ionicons name="chevron-forward" size={17} color={BLUE}/></Pressable></View>
        <View style={{ backgroundColor: "#EAF1FF", borderRadius: 12, padding: 12, marginTop: 11 }}><Text style={{ color: BLUE, fontSize: 10, fontWeight: "900" }}>SELECTED TESTS</Text><Text style={{ color: NAVY, fontSize: 11, fontWeight: "800", marginTop: 5 }}>{selectedCatalog.map((x) => x.name).join(", ") || "Configured lab tests"}</Text></View>
        {[{ title: "Morning", slots: TIMES.slice(0, 6) }, { title: "Afternoon", slots: TIMES.slice(6, 14) }, { title: "Evening", slots: TIMES.slice(14) }].map((group) => <View key={group.title} style={{ marginTop: 17 }}><Text style={{ color: NAVY, fontSize: 13, fontWeight: "900", marginBottom: 9 }}>{group.title}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{group.slots.map((time) => { const chosen = selectedTimes.includes(time); return <Pressable key={time} onPress={() => toggleTime(time)} style={{ width: "31%", minHeight: 42, alignItems: "center", justifyContent: "center", backgroundColor: chosen ? BLUE : "#FFFFFF", borderWidth: 1, borderColor: chosen ? BLUE : BORDER, borderRadius: 10, paddingHorizontal: 3 }}><Text style={{ color: chosen ? "#FFFFFF" : NAVY, fontSize: 10, fontWeight: "900" }}>{time}</Text><Text style={{ color: chosen ? "#DCE9FF" : "#159447", fontSize: 8, marginTop: 3 }}>{chosen ? "Selected" : "Available"}</Text></Pressable>; })}</View></View>)}
        <View style={{ backgroundColor: "#FFF8E8", borderRadius: 12, padding: 12, marginTop: 18, flexDirection: "row", alignItems: "flex-start" }}><Ionicons name="information-circle-outline" size={18} color="#A66A00"/><Text style={{ color: "#8C620E", fontSize: 10, lineHeight: 15, flex: 1, marginLeft: 7 }}>Time slots are selectable in this screen. Your current API documentation does not define an availability-slot save endpoint, so selections are not yet persisted to the backend.</Text></View>
        <Pressable onPress={saveSlots} style={{ backgroundColor: BLUE, borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 13 }}><Ionicons name="save-outline" size={17} color="#FFFFFF"/><Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", marginLeft: 8 }}>Save Time Slots ({selectedTimes.length})</Text></Pressable>
      </> : null}
    </ScrollView>}
  </SafeAreaView>;
}

const inputStyle = { backgroundColor: "#F8FAFE", borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, color: NAVY, fontSize: 12 } as const;
const dateButton = { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF4FF", alignItems: "center" as const, justifyContent: "center" as const };
function EmptyState({ title, message }: { title: string; message: string }) { return <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 15, padding: 22, alignItems: "center", marginTop: 8 }}><Ionicons name="flask-outline" size={28} color="#9BAAC0"/><Text style={{ color: NAVY, fontSize: 13, fontWeight: "900", marginTop: 9 }}>{title}</Text><Text style={{ color: MUTED, fontSize: 10, textAlign: "center", lineHeight: 16, marginTop: 5 }}>{message}</Text></View>; }
function formatDate(value?: string) { if (!value) return "Date not set"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function formatTime(value?: string) { if (!value) return "--"; if (/^\d{1,2}:\d{2}/.test(value) && !value.includes("T")) { const [h, m] = value.split(":"); const hour = Number(h); return `${hour % 12 || 12}:${m.slice(0, 2)} ${hour >= 12 ? "PM" : "AM"}`; } const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
