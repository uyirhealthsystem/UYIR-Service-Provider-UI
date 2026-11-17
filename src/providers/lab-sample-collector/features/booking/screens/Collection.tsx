import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BLUE, GREEN, Header, MUTED, PrimaryButton, TEXT } from "../components/BookingUI";
import { useLabSampleCollector } from "../../provider-state/store";

export default function Collection({ route, navigation }: any) {
  const { activeBooking, setStatus, uploadCollectionImage } = useLabSampleCollector();
  const booking = activeBooking;
  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [imageAdded, setImageAdded] = React.useState(false);
  if (!booking) return null;

  const verify = () => {
    if (otp !== booking.otp) return Alert.alert("Invalid OTP", "Please enter the 6-digit OTP shared by the patient.");
    setVerified(true); setStatus("COLLECTING");
  };
  const finish = () => {
    if (!imageAdded) return Alert.alert("Sample image required", "Upload a photo of the collected sample / barcode before marking collection complete.");
    uploadCollectionImage();
    navigation.replace("LabCollectorBookingDetails", { bookingId: booking.id });
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><Header title="Collect Sample" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      {!verified ? <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 17 }}><View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center", alignSelf: "center" }}><Ionicons name="lock-closed" size={29} color={BLUE} /></View><Text style={{ color: TEXT, fontSize: 17, fontWeight: "900", textAlign: "center", marginTop: 13 }}>Confirm Patient OTP</Text><Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 5 }}>Ask {booking.patient} for the 6-digit OTP.</Text><TextInput value={otp} onChangeText={setOtp} maxLength={6} keyboardType="number-pad" placeholder="Enter 6-digit OTP" style={{ marginTop: 17, height: 55, borderWidth: 1, borderColor: "#D8E1ED", borderRadius: 12, textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 7 }} /><View style={{ marginTop: 13 }}><PrimaryButton title="Verify OTP" onPress={verify} /></View></View> : null}
      {verified ? <>
        <View style={{ backgroundColor: "#E6F8EE", borderRadius: 13, padding: 13, flexDirection: "row", alignItems: "center" }}><Ionicons name="checkmark-circle" size={21} color={GREEN} /><View style={{ marginLeft: 8 }}><Text style={{ color: GREEN, fontWeight: "900", fontSize: 12 }}>Patient verified</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>You can now collect the requested samples.</Text></View></View>
        <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Samples to Collect</Text>{booking.tests.map((test, i) => <View key={test.name} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: i === booking.tests.length - 1 ? 0 : 1, borderBottomColor: "#EEF1F5" }}><View style={{ width: 25, height: 25, borderRadius: 7, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask-outline" size={15} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: TEXT, fontSize: 12, fontWeight: "800" }}>{test.name}</Text><Text style={{ color: MUTED, fontSize: 9.5, marginTop: 2 }}>{test.type} sample</Text></View><Ionicons name="checkmark-circle-outline" size={21} color={imageAdded ? GREEN : "#A9B2C0"} /></View>)}</View>
        <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Sample Photo</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>Take a clear photo showing the sample tubes / barcode.</Text><Pressable onPress={() => setImageAdded(true)} style={{ marginTop: 13, height: 145, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: BLUE, backgroundColor: "#F7FBFF", alignItems: "center", justifyContent: "center" }}><Ionicons name={imageAdded ? "image" : "camera-outline"} size={32} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginTop: 8 }}>{imageAdded ? "sample_photo.jpg added" : "Take / Upload Sample Image"}</Text><Text style={{ color: MUTED, fontSize: 9.5, marginTop: 3 }}>{imageAdded ? "Ready to submit" : "Photo is required"}</Text></Pressable></View>
        <View style={{ marginTop: 14 }}><PrimaryButton title="Mark Sample as Collected" icon="checkmark" onPress={finish} disabled={!imageAdded} /></View>
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
