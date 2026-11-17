import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelAppointment,
  rescheduleAppointment,
} from "../../../api/laboratory";

function toIsoDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("T")) return trimmed;
  return new Date(`${trimmed}T00:00:00`).toISOString();
}

function toIsoTime(date: string, time: string) {
  const cleanDate = date.trim();
  const cleanTime = time.trim();
  if (!cleanDate || !cleanTime) return "";
  if (cleanTime.includes("T")) return cleanTime;
  return new Date(`${cleanDate}T${cleanTime}:00`).toISOString();
}

export default function CancelReschedule({ route, navigation }: any) {
  const mode = route.params?.mode || "cancel";
  const appointmentId = route.params?.appointmentId;
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  const reasons = [
    "Patient requested",
    "Patient not available",
    "Incorrect booking details",
    "Lab unavailable",
    "Other",
  ];

  const submit = async () => {
    if (!appointmentId) {
      Alert.alert("Error", "Appointment ID is missing.");
      return;
    }

    if (!reason) {
      Alert.alert("Required", "Please select a reason.");
      return;
    }

    if (mode === "reschedule" && (!date || !startTime || !endTime)) {
      Alert.alert("Required", "Enter the new date and time.");
      return;
    }

    setSaving(true);

    try {
      if (mode === "cancel") {
        await cancelAppointment({ appointmentId });

        Alert.alert("Cancelled", "The appointment was cancelled successfully.", [
          { text: "OK", onPress: () => navigation.pop(2) },
        ]);
      } else {
        const newDate = toIsoDate(date);
        const newStartTime = toIsoTime(date, startTime);
        const newEndTime = toIsoTime(date, endTime);

        if (!newDate || !newStartTime || !newEndTime) {
          Alert.alert("Invalid date", "Please enter a valid date and time.");
          return;
        }

        await rescheduleAppointment({
          appointmentId,
          newDate,
          newStartTime,
          newEndTime,
        });

        Alert.alert(
          "Rescheduled",
          "The appointment was rescheduled successfully.",
          [{ text: "OK", onPress: () => navigation.pop(2) }],
        );
      }
    } catch (error: any) {
      console.log("Appointment update error:", error);
      Alert.alert(
        "Unable to update",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 14,
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#172033" />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            marginRight: 24,
            fontSize: 18,
            fontWeight: "800",
            color: "#172033",
          }}
        >
          {mode === "cancel" ? "Cancel Booking" : "Reschedule Booking"}
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#172033" }}>
            Reason
          </Text>

          {reasons.map((item) => (
            <Pressable
              key={item}
              onPress={() => setReason(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: reason === item ? "#173FD1" : "#B8C0CE",
                  backgroundColor: reason === item ? "#173FD1" : "transparent",
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#343D4D", fontSize: 13 }}>{item}</Text>
            </Pressable>
          ))}

          {mode === "reschedule" ? (
            <>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="New date (YYYY-MM-DD)"
                autoCapitalize="none"
                style={inputStyle}
              />
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="Start time (HH:mm)"
                autoCapitalize="none"
                style={inputStyle}
              />
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="End time (HH:mm)"
                autoCapitalize="none"
                style={inputStyle}
              />
            </>
          ) : (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes (optional)"
              multiline
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
            />
          )}

          <Pressable
            disabled={saving}
            onPress={submit}
            style={{
              marginTop: 16,
              backgroundColor: mode === "cancel" ? "#E92D3B" : "#173FD1",
              borderRadius: 12,
              padding: 15,
              alignItems: "center",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {saving
                ? "Saving..."
                : mode === "cancel"
                  ? "Confirm Cancellation"
                  : "Confirm Reschedule"}
            </Text>
          </Pressable>

          <Text
            style={{
              marginTop: 10,
              fontSize: 10,
              color: "#7B8190",
              textAlign: "center",
            }}
          >
            The latest backend API updates the appointment status/date/time.
            The selected reason is currently kept only in the app because the
            provided API has no reason field.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const inputStyle = {
  marginTop: 8,
  borderWidth: 1,
  borderColor: "#E1E5EC",
  borderRadius: 12,
  padding: 12,
  backgroundColor: "#fff",
  fontSize: 12,
} as const;
