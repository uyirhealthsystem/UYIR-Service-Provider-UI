import { Text, View } from "react-native";
export default function EarningsSummary({
  bookings,
  reports,
  earnings,
}: {
  bookings: number;
  reports: number;
  earnings: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
      {[
        [String(bookings), "Bookings"],
        [String(reports), "Reports Sent"],
        [`₹${earnings}`, "Booked Value"],
      ].map(([value, label]) => (
        <View
          key={label}
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#173FD1" }}>
            {value}
          </Text>
          <Text style={{ fontSize: 9, color: "#687386", marginTop: 4 }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
