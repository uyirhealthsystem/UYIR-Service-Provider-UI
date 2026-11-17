import { Text, View } from "react-native";
export default function CollectionSummary({ appointments }: { appointments: any[] }) {
  const counts = [
    ["PENDING", "Pending"],
    ["ASSIGNED", "Assigned"],
    ["IN_TRANSIT", "In Transit"],
    ["RECEIVED", "Received"],
  ];
  return <View style={{ flexDirection: "row", gap: 7, marginTop: 14 }}>{counts.map(([status, label]) => <View key={status} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#E8ECF3" }}><Text style={{ fontSize: 15, fontWeight: "900", color: "#173FD1" }}>{appointments.filter((x) => (x.homeCollection?.status || "PENDING") === status).length}</Text><Text style={{ fontSize: 8.5, color: "#687386", marginTop: 3 }}>{label}</Text></View>)}</View>;
}
