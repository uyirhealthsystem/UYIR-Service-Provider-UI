import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { saveBankAccount } from "../../../api/payments";
import { getProfile } from "../../../api/profile";

export default function BankDetails({ navigation }: any) {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    getProfile().catch(() => null);
  }, []));

  const save = async () => {
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      Alert.alert("Missing details", "Please fill all bank details.");
      return;
    }
    try {
      setSaving(true);
      await saveBankAccount({ accountHolderName, accountNumber, ifscCode: ifscCode.toUpperCase(), bankName });
      Alert.alert("Saved", "Bank account saved successfully.");
    } catch (error: any) {
      Alert.alert("Unable to save", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const input = (value: string, setter: (value: string) => void, placeholder: string, keyboardType: any = "default") => <TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor="#98A2B3" keyboardType={keyboardType} style={{ marginTop: 8, minHeight: 50, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 13, paddingHorizontal: 14, color: "#101828", fontSize: 13 }} />;

  return <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="arrow-back" size={21} color="#101828" /></Pressable>
    <Text style={{ marginTop: 22, color: "#101828", fontSize: 26, fontWeight: "900" }}>Bank Details</Text>
    <Text style={{ marginTop: 5, color: "#667085", fontSize: 13 }}>Add the account used for withdrawals.</Text>
    <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 19, padding: 18 }}>
      <Text style={{ color: "#344054", fontSize: 12, fontWeight: "700" }}>Account Holder Name</Text>{input(accountHolderName, setAccountHolderName, "Name as per bank account")}
      <Text style={{ marginTop: 17, color: "#344054", fontSize: 12, fontWeight: "700" }}>Account Number</Text>{input(accountNumber, setAccountNumber, "Enter account number", "number-pad")}
      <Text style={{ marginTop: 17, color: "#344054", fontSize: 12, fontWeight: "700" }}>IFSC Code</Text>{input(ifscCode, setIfscCode, "Example: SBIN0001234")}
      <Text style={{ marginTop: 17, color: "#344054", fontSize: 12, fontWeight: "700" }}>Bank Name</Text>{input(bankName, setBankName, "Bank name")}
      <Pressable onPress={save} disabled={saving} style={{ marginTop: 22, minHeight: 52, borderRadius: 13, backgroundColor: "#1755E8", alignItems: "center", justifyContent: "center" }}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Save Bank Account</Text>}</Pressable>
    </View>
  </ScrollView>;
}
