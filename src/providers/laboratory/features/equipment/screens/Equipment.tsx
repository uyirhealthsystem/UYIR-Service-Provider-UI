import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEquipmentServices, getProviderContext } from "../../../api/laboratory";

export default function Equipment() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const response = await getEquipmentServices(); const all = Array.isArray(response?.data) ? response.data : []; const context = await getProviderContext(); const id = context.scanCenter?.scanCenterId; setItems(id ? all.filter((x: any) => x.equipment?.scanCenterId === id) : []); } catch (e) { console.log("Equipment API error:", e); } finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { load(); }, []));
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}><View style={{ padding: 18 }}><Text style={{ fontSize: 22, fontWeight: "900", color: "#172033" }}>Equipment</Text><Text style={{ marginTop: 4, color: "#758096", fontSize: 11 }}>Equipment mapped to scan services</Text></View><ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>{loading ? <Text style={{ color: "#758096" }}>Loading equipment...</Text> : items.length ? items.map((item) => <View key={item.equipmentServiceId} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 15, marginBottom: 10 }}><Text style={{ fontSize: 14, fontWeight: "800", color: "#172033" }}>{item.equipment?.name || "Equipment"}</Text><Text style={{ marginTop: 5, fontSize: 11, color: "#687386" }}>{item.equipment?.equipmentType || "-"} • {item.equipment?.manufacturer || "-"} • {item.equipment?.modelNumber || "-"}</Text><Text style={{ marginTop: 8, fontSize: 11, color: "#173FD1", fontWeight: "700" }}>{item.scanService?.serviceCatalog?.name || "Service"}</Text></View>) : <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}><Text style={{ color: "#758096" }}>No equipment mapped to this scan center.</Text></View>}</ScrollView></SafeAreaView>;
}
