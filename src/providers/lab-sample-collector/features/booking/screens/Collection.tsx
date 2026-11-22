import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BLUE, GREEN, Header, MUTED, PrimaryButton, TEXT } from "../components/BookingUI";
import { useLabSampleCollector } from "../../provider-state/store";
import * as ImagePicker from "expo-image-picker";

export default function Collection({ route, navigation }: any) {
  const { activeBooking, verifyPatientOtp, createCollectionSamples, uploadCollectionImage, markSampleCollected } = useLabSampleCollector();
  const booking = activeBooking;
  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  if (!booking) return null;

  const [busy, setBusy] = React.useState(false);
  const [photoUri, setPhotoUri] = React.useState("");
  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return Alert.alert("Invalid OTP", "Please enter the 6-digit OTP shared by the patient.");
    try {
      setBusy(true);
      await verifyPatientOtp(booking.homeCollectionId || booking.id, otp);
      await createCollectionSamples(booking.homeCollectionId || booking.id);
      setVerified(true);
    } catch (error: any) {
      Alert.alert("OTP verification failed", error?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to upload collection evidence.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };
  const finish = async () => {
    if (!photoUri) return Alert.alert("Sample image required", "Upload a photo of the collected sample / barcode before marking collection complete.");
    try {
      setBusy(true);
      await uploadCollectionImage(photoUri);
      for (const test of booking.tests) if (test.sampleId) await markSampleCollected(test.sampleId);
      navigation.replace("LabCollectorBookingDetails", { bookingId: booking.id });
    } catch (error: any) {
      Alert.alert("Collection update failed", error?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><Header title="Collect Sample" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      {!verified ? <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 17 }}><View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center", alignSelf: "center" }}><Ionicons name="lock-closed" size={29} color={BLUE} /></View><Text style={{ color: TEXT, fontSize: 17, fontWeight: "900", textAlign: "center", marginTop: 13 }}>Confirm Patient OTP</Text><Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 5 }}>Ask {booking.patient} for the 6-digit OTP.</Text><TextInput value={otp} onChangeText={setOtp} maxLength={6} keyboardType="number-pad" placeholder="Enter 6-digit OTP" style={{ marginTop: 17, height: 55, borderWidth: 1, borderColor: "#D8E1ED", borderRadius: 12, textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 7 }} /><View style={{ marginTop: 13 }}><PrimaryButton title={busy ? "Verifying…" : "Verify OTP"} onPress={verify} /></View></View> : null}
      {verified ? <>
        <View style={{ backgroundColor: "#E6F8EE", borderRadius: 13, padding: 13, flexDirection: "row", alignItems: "center" }}><Ionicons name="checkmark-circle" size={21} color={GREEN} /><View style={{ marginLeft: 8 }}><Text style={{ color: GREEN, fontWeight: "900", fontSize: 12 }}>Patient verified</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>You can now collect the requested samples.</Text></View></View>
        <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Samples to Collect</Text>{booking.tests.map((test, i) => <View key={test.name} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: i === booking.tests.length - 1 ? 0 : 1, borderBottomColor: "#EEF1F5" }}><View style={{ width: 25, height: 25, borderRadius: 7, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={15} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: TEXT, fontSize: 12, fontWeight: "800" }}>{test.name}</Text><Text style={{ color: MUTED, fontSize: 9.5, marginTop: 2 }}>{test.type} sample</Text></View><Ionicons name="checkmark-circle-outline" size={21} color={photoUri ? GREEN : "#A9B2C0"} /></View>)}</View>
        <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Sample Photo</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>Take a clear photo showing the sample tubes / barcode.</Text><Pressable onPress={takePhoto} style={{ marginTop: 13, height: 145, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: BLUE, backgroundColor: "#F7FBFF", alignItems: "center", justifyContent: "center" }}><Ionicons name={photoUri ? "image" : "camera-outline"} size={32} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginTop: 8 }}>{photoUri ? "Collection photo added" : "Take / Upload Sample Image"}</Text><Text style={{ color: MUTED, fontSize: 9.5, marginTop: 3 }}>{photoUri ? "Ready to submit" : "Photo is required"}</Text></Pressable></View>
        <View style={{ marginTop: 14 }}><PrimaryButton title={busy ? "Submitting…" : "Mark Sample as Collected"} icon="checkmark" onPress={finish} disabled={!photoUri || busy} /></View>
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
