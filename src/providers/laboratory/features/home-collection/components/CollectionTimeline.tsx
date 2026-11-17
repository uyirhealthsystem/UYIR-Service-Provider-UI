import { Text, View } from "react-native";
export default function CollectionTimeline({ collection }: { collection: any }) {
  const status = collection?.status || "PENDING";
  const done = (key: string) => {
    if (key === "ASSIGNED") return ["ASSIGNED", "COLLECTED", "IN_TRANSIT", "RECEIVED", "COMPLETED"].includes(status);
    if (key === "COLLECTED") return ["COLLECTED", "IN_TRANSIT", "RECEIVED", "COMPLETED"].includes(status);
    if (key === "IN_TRANSIT") return ["IN_TRANSIT", "RECEIVED", "COMPLETED"].includes(status);
    if (key === "RECEIVED") return ["RECEIVED", "COMPLETED"].includes(status);
    return status === "COMPLETED";
  };
  const steps = [["ASSIGNED", "Collector assigned"], ["COLLECTED", "Sample collected"], ["IN_TRANSIT", "Sample in transit"], ["RECEIVED", "Sample received by lab"]];
  return <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}><Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Sample Tracking</Text>{steps.map(([key, label], index) => { const complete = done(key); return <View key={key} style={{ flexDirection: "row", paddingTop: index ? 13 : 16 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: complete ? "#DFF7EA" : "#EEF1F5", alignItems: "center", justifyContent: "center" }}><Text style={{ color: complete ? "#159447" : "#8B94A4", fontSize: 10, fontWeight: "900" }}>{complete ? "✓" : index + 1}</Text></View><View style={{ marginLeft: 10, flex: 1 }}><Text style={{ fontSize: 12, fontWeight: "700", color: "#343D4D" }}>{label}</Text><Text style={{ fontSize: 10, color: complete ? "#159447" : "#8B94A4", marginTop: 2 }}>{complete ? "Completed" : "Pending"}</Text></View></View>; })}</View>;
}
