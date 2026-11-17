import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function PaymentIssue({ navigation }: any) {
  const [issueType, setIssueType] = useState("Payment not received");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(false);

  const submit = () => {
    if (!description.trim()) {
      Alert.alert("Add details", "Please describe the payment issue.");
      return;
    }
    Alert.alert("Issue captured", "The payment issue form is ready. A payment-issue API is not present in the current Postman collection, so no fake submission was sent.");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="arrow-back" size={21} color="#101828" /></Pressable>
      <Text style={{ marginTop: 22, color: "#101828", fontSize: 26, fontWeight: "900" }}>Report Payment Issue</Text>
      <Text style={{ marginTop: 5, color: "#667085", fontSize: 13, lineHeight: 20 }}>Tell us what went wrong with a reward or payment.</Text>

      <View style={{ marginTop: 22, backgroundColor: "#FFFFFF", borderRadius: 19, padding: 18 }}>
        <Text style={{ color: "#344054", fontSize: 12, fontWeight: "700" }}>Issue type</Text>
        <Pressable onPress={() => setSelected(!selected)} style={{ marginTop: 8, minHeight: 50, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 13, paddingHorizontal: 14, justifyContent: "center", flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, color: "#101828", fontSize: 13 }}>{issueType}</Text><Ionicons name={selected ? "chevron-up" : "chevron-down"} size={18} color="#667085" /></Pressable>
        {selected ? <View style={{ marginTop: 7, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 12, overflow: "hidden" }}>{["Payment not received", "Wrong amount", "Withdrawal issue", "Other"].map((type) => <Pressable key={type} onPress={() => { setIssueType(type); setSelected(false); }} style={{ padding: 13, borderBottomWidth: 1, borderBottomColor: "#F2F4F7" }}><Text style={{ color: "#344054", fontSize: 13 }}>{type}</Text></Pressable>)}</View> : null}

        <Text style={{ marginTop: 18, color: "#344054", fontSize: 12, fontWeight: "700" }}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Please describe the issue..." placeholderTextColor="#98A2B3" multiline textAlignVertical="top" maxLength={300} style={{ marginTop: 8, minHeight: 130, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 13, padding: 14, color: "#101828", fontSize: 13 }} />
        <Text style={{ marginTop: 5, color: "#98A2B3", textAlign: "right", fontSize: 10 }}>{description.length}/300</Text>

        <Pressable onPress={submit} style={{ marginTop: 18, minHeight: 52, borderRadius: 13, backgroundColor: "#1755E8", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Submit Issue</Text></Pressable>
      </View>
    </ScrollView>
  );
}
