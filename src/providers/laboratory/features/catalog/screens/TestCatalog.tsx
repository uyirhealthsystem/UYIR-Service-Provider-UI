import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLabTestCatalogs } from "../../../api/laboratory";

export default function TestCatalog() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await getLabTestCatalogs();
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.log("Test catalog API error:", error);
    } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}>
    <View style={{ padding: 18 }}><Text style={{ fontSize: 22, fontWeight: "900", color: "#172033" }}>Test Catalog</Text><Text style={{ marginTop: 4, color: "#758096", fontSize: 11 }}>Available laboratory test definitions</Text></View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
      {loading ? <Text style={{ color: "#758096" }}>Loading catalog...</Text> : items.length ? items.map((item) => <View key={item.testCatalogId} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 15, marginBottom: 10 }}><Text style={{ fontSize: 14, fontWeight: "800", color: "#172033" }}>{item.name || "Unnamed test"}</Text><Text style={{ marginTop: 4, fontSize: 10, color: "#173FD1" }}>{item.code || "-"} • {item.category || "General"}</Text><Text style={{ marginTop: 7, fontSize: 11, color: "#687386" }}>{item.description || "No description available"}</Text></View>) : <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}><Text style={{ color: "#758096" }}>No test catalog items.</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}
