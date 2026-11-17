import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function EmptyState({ ready }: { ready: boolean }) {
  const GREEN = "#17B26A";
  const MUTED = "#6B7890";
  const TEXT = "#10233F";

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 30,
        alignItems: "center",
      }}
    >
      <Ionicons
        name={ready ? "checkmark-done-circle-outline" : "pause-circle-outline"}
        size={44}
        color={ready ? GREEN : MUTED}
      />
      <Text style={{ color: TEXT, fontSize: 15, fontWeight: "900", marginTop: 10 }}>
        {ready ? "No new requests" : "You are offline"}
      </Text>
      <Text
        style={{
          color: MUTED,
          fontSize: 11,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {ready
          ? "Stay available. A new patient booking will appear here."
          : "Turn on availability to start receiving patient bookings."}
      </Text>
    </View>
  );
}
