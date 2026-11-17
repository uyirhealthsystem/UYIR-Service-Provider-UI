import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { teleconsultationApi } from "../../../api/client";

const BLUE = "#0866E8", NAVY = "#14233D", MUTED = "#8490A3", LINE = "#E9EEF5";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"];

function to24Hour(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export default function ScheduleScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [duration, setDuration] = useState("30");
  const [doctorId, setDoctorId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [busy, setBusy] = useState(false);
  const [availabilityId, setAvailabilityId] = useState("");
  const [availabilityActive, setAvailabilityActive] = useState(true);
  const [generatedSlots, setGeneratedSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const monthTitle = visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}`, date: null as Date | null })),
      ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, date: new Date(year, month, index + 1) })),
    ];
  }, [visibleMonth]);
  const isPastDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() < new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()).getTime();
  const isToday = (date: Date) => date.getFullYear() === currentTime.getFullYear() && date.getMonth() === currentTime.getMonth() && date.getDate() === currentTime.getDate();
  const visibleTimes = TIMES.filter((time) => {
    if (!isToday(selectedDate)) return true;
    const value = to24Hour(time);
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute > currentTime.getHours() * 60 + currentTime.getMinutes();
  });
  useEffect(() => {
    if (isToday(selectedDate)) {
      setSelectedSlots((current) => current.filter((slot) => visibleTimes.includes(slot)));
    }
  }, [selectedDate, currentTime]);

  const toggleSlot = (slot: string) => setSelectedSlots((current) => current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot].sort((a, b) => TIMES.indexOf(a) - TIMES.indexOf(b)));
  const changeMonth = (amount: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
    const currentMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
    if (next < currentMonth) return;
    setVisibleMonth(next);
    const firstSelectable = next.getFullYear() === currentTime.getFullYear() && next.getMonth() === currentTime.getMonth()
      ? new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
      : new Date(next.getFullYear(), next.getMonth(), 1);
    setSelectedDate(firstSelectable);
    setSelectedSlots([]);
    setGeneratedSlots([]);
  };

  const save = async () => {
    if (!doctorId.trim() || !hospitalId.trim()) {
      Alert.alert("Profile identifiers required", "Enter the Doctor ID and Hospital ID provided by your backend team.");
      return;
    }
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 5 || selectedSlots.length === 0) {
      Alert.alert("Check availability", "Choose at least one slot and a valid duration of 5 minutes or more.");
      return;
    }
    const dayOfWeek = selectedDate.getDay();
    const starts = selectedSlots.map(to24Hour).filter(Boolean).sort();
    const first = starts[0];
    const lastStart = starts[starts.length - 1];
    const [h, m] = lastStart.split(":").map(Number);
    const endTotal = h * 60 + m + minutes;
    const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
    try {
      setBusy(true);
      const response: any = await teleconsultationApi("/teleconsultation/doctoravailability", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctorId.trim(),
          hospitalId: hospitalId.trim(),
          dayOfWeek: [dayOfWeek],
          startTime: first,
          endTime,
          slotDurationMinutes: minutes,
        }),
      });
      const created = Array.isArray(response?.data) ? response.data[0] : response?.data;
      if (created?.availabilityId) setAvailabilityId(created.availabilityId);
      Alert.alert("Availability saved", `Your ${DAYS[dayOfWeek]} schedule was submitted.`);
    } catch (error: any) {
      Alert.alert("Could not save schedule", error?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const updateAvailability = async () => {
    if (!availabilityId) {
      Alert.alert("No saved availability", "Create availability first. The API response provides the availability ID needed for updates.");
      return;
    }
    const minutes = Number(duration);
    const starts = selectedSlots.map(to24Hour).filter(Boolean).sort();
    if (!starts.length || !Number.isInteger(minutes) || minutes < 5) {
      Alert.alert("Check availability", "Choose at least one time and a valid slot duration.");
      return;
    }
    const last = starts[starts.length - 1].split(":").map(Number);
    const endTotal = last[0] * 60 + last[1] + minutes;
    const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
    try {
      setBusy(true);
      await teleconsultationApi(`/teleconsultation/doctoravailability/${encodeURIComponent(availabilityId)}`, {
        method: "PUT",
        body: JSON.stringify({ days: [selectedDate.getDay()], startTime: starts[0], endTime, slotDurationMinutes: minutes }),
      });
      Alert.alert("Availability updated", "Your existing availability was updated.");
    } catch (error: any) {
      Alert.alert("Could not update availability", error?.message || "Please try again.");
    } finally { setBusy(false); }
  };

  const toggleAvailabilityStatus = async () => {
    if (!availabilityId) { Alert.alert("Availability ID required", "Create availability first so the API returns its availabilityId."); return; }
    try {
      setBusy(true);
      await teleconsultationApi(`/teleconsultation/doctoravailability/${encodeURIComponent(availabilityId)}/status`, {
        method: "PATCH", body: JSON.stringify({ isActive: !availabilityActive }),
      });
      setAvailabilityActive(!availabilityActive);
      Alert.alert("Availability status updated", !availabilityActive ? "Your availability is active." : "Your availability is paused.");
    } catch (error: any) { Alert.alert("Could not change status", error?.message || "Please try again."); }
    finally { setBusy(false); }
  };

  const loadAvailableSlots = async () => {
    if (!doctorId.trim()) {
      Alert.alert("Doctor ID required", "Enter the Doctor ID to fetch available slots.");
      return;
    }
    const date = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,"0")}-${String(selectedDate.getDate()).padStart(2,"0")}`;
    try {
      setLoadingSlots(true);
      const response: any = await teleconsultationApi(`/teleconsultation/doctor/slots?date=${date}`, { method: "GET", userRole: "PATIENT" });
      setGeneratedSlots(Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.slots) ? response.data.slots : []);
      if (!Array.isArray(response?.data) || response.data.length === 0) Alert.alert("No slots", "No available slots were returned for this date.");
    } catch (error: any) { Alert.alert("Could not load slots", error?.message || "Please try again."); }
    finally { setLoadingSlots(false); }
  };

  const field = (label: string, value: string, onChangeText: (value: string) => void, placeholder: string) => (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: MUTED, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} autoCapitalize="none" placeholderTextColor="#AAB4C2" style={{ backgroundColor: "#F8FAFD", borderWidth: 1, borderColor: LINE, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: NAVY, fontSize: 13 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View><Text style={{ color: NAVY, fontSize: 26, fontWeight: "800" }}>My Schedule</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>Manage your consultation availability</Text></View>
          <View style={{ width: 43, height: 43, borderRadius: 14, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="calendar-outline" size={21} color={BLUE} /></View>
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: LINE, padding: 15, marginTop: 19 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: NAVY, fontSize: 15, fontWeight: "800" }}>{monthTitle}</Text>
            <View style={{ flexDirection: "row" }}>
              <Pressable disabled={visibleMonth.getFullYear() === currentTime.getFullYear() && visibleMonth.getMonth() === currentTime.getMonth()} onPress={() => changeMonth(-1)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F5F7FB", alignItems: "center", justifyContent: "center", opacity: visibleMonth.getFullYear() === currentTime.getFullYear() && visibleMonth.getMonth() === currentTime.getMonth() ? 0.35 : 1 }}><Ionicons name="chevron-back" size={17} color={NAVY} /></Pressable>
              <Pressable onPress={() => changeMonth(1)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F5F7FB", alignItems: "center", justifyContent: "center", marginLeft: 7 }}><Ionicons name="chevron-forward" size={17} color={NAVY} /></Pressable>
            </View>
          </View>
          <View style={{ flexDirection: "row", marginTop: 15, marginBottom: 7 }}>
            {DAYS.map((day) => <View key={day} style={{ width: `${100 / 7}%`, alignItems: "center" }}><Text style={{ color: MUTED, fontSize: 10, fontWeight: "700" }}>{day}</Text></View>)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays.map((item) => {
              if (!item.date) return <View key={item.key} style={{ width: `${100 / 7}%`, height: 42 }} />;
              const date = item.date;
              const active = date.toDateString() === selectedDate.toDateString();
              const past = isPastDate(date);
              const todayDate = isToday(date);
              return <Pressable key={item.key} disabled={past} onPress={() => { setSelectedDate(date); setSelectedSlots([]); setGeneratedSlots([]); }} style={{ width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: active ? BLUE : "transparent", borderWidth: todayDate && !active ? 1 : 0, borderColor: BLUE, opacity: past ? 0.28 : 1 }}>
                  <Text style={{ color: active ? "#FFFFFF" : NAVY, fontSize: 13, fontWeight: active || todayDate ? "800" : "500" }}>{date.getDate()}</Text>
                </View>
              </Pressable>;
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 10 }}>
          <View><Text style={{ color: NAVY, fontSize: 17, fontWeight: "800" }}>Available time slots</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{selectedSlots.length} slots selected</Text></View>
          <Pressable onPress={() => setSelectedSlots(visibleTimes)}><Text style={{ color: BLUE, fontSize: 12, fontWeight: "800" }}>Select all</Text></Pressable>
        </View>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: LINE, paddingHorizontal: 14 }}>
          {visibleTimes.length === 0 ? <Text style={{ color: MUTED, fontSize: 12, textAlign: "center", paddingVertical: 20 }}>No remaining time slots for today.</Text> : visibleTimes.map((time, index) => {
            const active = selectedSlots.includes(time);
            return <Pressable key={time} onPress={() => toggleSlot(time)} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: index === visibleTimes.length - 1 ? 0 : 1, borderBottomColor: "#F0F2F6" }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: active ? "#EAF2FF" : "#F5F7FA", alignItems: "center", justifyContent: "center" }}><Ionicons name="time-outline" size={16} color={active ? BLUE : MUTED} /></View>
              <Text style={{ color: NAVY, fontSize: 13, fontWeight: "700", flex: 1, marginLeft: 10 }}>{time}</Text>
              <View style={{ width: 42, height: 24, borderRadius: 14, backgroundColor: active ? BLUE : "#D6DDE7", justifyContent: "center", paddingHorizontal: 3, alignItems: active ? "flex-end" : "flex-start" }}><View style={{ width: 18, height: 18, borderRadius: 10, backgroundColor: "#FFFFFF" }} /></View>
            </Pressable>;
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <Pressable onPress={loadAvailableSlots} disabled={loadingSlots} style={{ backgroundColor: "#EAF2FF", borderRadius: 12, padding: 13, alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
            {loadingSlots ? <ActivityIndicator color={BLUE} /> : <Ionicons name="refresh-outline" size={17} color={BLUE} />}
            <Text style={{ color: BLUE, fontWeight: "800", fontSize: 12, marginLeft: 7 }}>Load available slots for selected date</Text>
          </Pressable>
          {generatedSlots.map((slot, index) => <View key={`${slot.startAt}-${index}`} style={{ backgroundColor: "#FFFFFF", borderRadius: 10, padding: 11, marginTop: 7, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: NAVY, fontSize: 12 }}>{new Date(slot.startAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.endAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</Text>
            <Text style={{ color: slot.available ? "#16834A" : "#B45B45", fontSize: 11, fontWeight: "700" }}>{slot.available ? "Available" : "Booked"}</Text>
          </View>)}
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: LINE, padding: 15, marginTop: 17 }}>
          <Text style={{ color: NAVY, fontSize: 15, fontWeight: "800" }}>Consultation settings</Text>
          {field("Slot duration (minutes)", duration, setDuration, "30")}
          {field("Doctor ID", doctorId, setDoctorId, "Enter doctor UUID")}
          {field("Hospital ID", hospitalId, setHospitalId, "Enter hospital UUID")}
          <Text style={{ color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 10 }}>The supplied API saves one weekly availability range using the first selected slot through the end of the last selected slot. Individual gaps between selected times cannot be represented by this API.</Text>
        </View>
        <Pressable disabled={busy} onPress={save} style={{ backgroundColor: BLUE, borderRadius: 14, minHeight: 52, marginTop: 17, alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: busy ? 0.7 : 1 }}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" /><Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginLeft: 8 }}>Save availability</Text></>}
        </Pressable>
        <Pressable disabled={busy} onPress={updateAvailability} style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BLUE, borderRadius: 14, minHeight: 48, marginTop: 10, alignItems: "center", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
          <Text style={{ color: BLUE, fontSize: 13, fontWeight: "800" }}>Update saved availability</Text>
          {availabilityId ? <Text style={{ color: MUTED, fontSize: 9, marginTop: 3 }}>Saved ID: {availabilityId}</Text> : null}
        </Pressable>
        <Pressable disabled={busy || !availabilityId} onPress={toggleAvailabilityStatus} style={{ backgroundColor: availabilityActive ? "#FFF1F2" : "#E7F7EF", borderRadius: 14, minHeight: 46, marginTop: 10, alignItems: "center", justifyContent: "center", opacity: busy || !availabilityId ? 0.55 : 1 }}><Text style={{ color: availabilityActive ? "#C33A48" : "#168653", fontSize: 12, fontWeight: "900" }}>{availabilityActive ? "Pause saved availability" : "Activate saved availability"}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
