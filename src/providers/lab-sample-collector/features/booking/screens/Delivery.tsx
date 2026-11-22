import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BLUE, GREEN, Header, MUTED, PrimaryButton, TEXT } from "../components/BookingUI";
import { useLabSampleCollector } from "../../provider-state/store";
import * as ImagePicker from "expo-image-picker";

export default function Delivery({ navigation }: any) {
  const { activeBooking, markSampleInTransit, uploadDeliveryProof, verifyHandoverOtp } = useLabSampleCollector();
  const [imageAdded, setImageAdded] = React.useState(false);
  const [photoUri, setPhotoUri] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  if (!activeBooking) return null;
  const booking = activeBooking;
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to upload delivery evidence.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setPhotoUri(result.assets[0].uri); setImageAdded(true); }
  };
  const markDelivered = async () => {
    if (!photoUri) return Alert.alert("Delivery proof", "Add a delivery photo / acknowledgement before confirming delivery.");
    try {
      setBusy(true);
      await uploadDeliveryProof(photoUri);
      for (const test of booking.tests) if (test.sampleId) await markSampleInTransit(test.sampleId);
      Alert.alert("Samples marked in transit", "Ask the laboratory staff to generate a handover OTP.");
    } catch (error: any) {
      Alert.alert("Delivery update failed", error?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const verifyHandover = async () => {
    if (!/^\d{6}$/.test(otp)) return Alert.alert("Invalid OTP", "Enter the 6-digit handover OTP.");
    try {
      setBusy(true);
      for (const test of booking.tests) if (test.sampleId) await verifyHandoverOtp(test.sampleId, otp);
      Alert.alert("Handover complete", "The laboratory has received the assigned samples.", [{ text: "Go to Dashboard", onPress: () => navigation.navigate("LabCollectorLayout") }]);
    } catch (error: any) {
      Alert.alert("Handover failed", error?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><Header title="Deliver to Lab" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16 }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="business-outline" size={24} color={BLUE} /></View><View style={{ marginLeft: 11, flex: 1 }}><Text style={{ color: TEXT, fontSize: 14, fontWeight: "900" }}>{booking.labName}</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 3 }}>{booking.labAddress}</Text></View></View><View style={{ marginTop: 15, backgroundColor: "#F7F9FD", borderRadius: 12, padding: 13 }}><Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>Samples for</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>{booking.patient} • {booking.tests.map(t => t.name).join(", ")}</Text></View></View>
      <><View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Delivery Proof</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>Capture a photo of the handover / acknowledgement at the lab.</Text><Pressable onPress={takePhoto} style={{ marginTop: 13, height: 135, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: BLUE, backgroundColor: "#F7FBFF", alignItems: "center", justifyContent: "center" }}><Ionicons name={imageAdded ? "image" : "camera-outline"} size={31} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginTop: 8 }}>{imageAdded ? "Delivery photo added" : "Add Delivery Photo"}</Text></Pressable></View><View style={{ marginTop: 14 }}><PrimaryButton title={busy ? "Updating…" : "Mark Samples In Transit"} onPress={markDelivered} disabled={!imageAdded || busy} /></View><View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Lab Handover OTP</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>The assigned laboratory generates this OTP after you arrive.</Text><TextInput value={otp} onChangeText={setOtp} maxLength={6} keyboardType="number-pad" placeholder="6-digit OTP" style={{ marginTop: 12, height: 55, borderWidth: 1, borderColor: "#D8E1ED", borderRadius: 12, textAlign: "center", fontSize: 20, fontWeight: "900", letterSpacing: 7 }} /><View style={{ marginTop: 12 }}><PrimaryButton title="Verify Handover OTP" onPress={verifyHandover} disabled={busy} /></View></View></>
    </ScrollView>
  </SafeAreaView>;
}
