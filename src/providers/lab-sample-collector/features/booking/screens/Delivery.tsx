import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BLUE, GREEN, Header, MUTED, PrimaryButton, TEXT } from "../components/BookingUI";
import { useLabSampleCollector } from "../../provider-state/store";

export default function Delivery({ navigation }: any) {
  const { activeBooking, setStatus, confirmDelivery } = useLabSampleCollector();
  const [imageAdded, setImageAdded] = React.useState(false);
  const [delivered, setDelivered] = React.useState(false);
  if (!activeBooking) return null;
  const booking = activeBooking;
  const markDelivered = () => { if (!imageAdded) return Alert.alert("Delivery proof", "Add a delivery photo / acknowledgement before confirming delivery."); setStatus("DELIVERED"); setDelivered(true); };
  const confirm = () => { confirmDelivery(); Alert.alert("Collection Completed", "The lab confirmed receipt. Your collection job is complete and payment has been recorded.", [{ text: "Go to Dashboard", onPress: () => navigation.navigate("LabCollectorLayout") }]); };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><Header title="Deliver to Lab" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16 }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="business-outline" size={24} color={BLUE} /></View><View style={{ marginLeft: 11, flex: 1 }}><Text style={{ color: TEXT, fontSize: 14, fontWeight: "900" }}>{booking.labName}</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 3 }}>{booking.labAddress}</Text></View></View><View style={{ marginTop: 15, backgroundColor: "#F7F9FD", borderRadius: 12, padding: 13 }}><Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>Samples for</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>{booking.patient} • {booking.tests.map(t => t.name).join(", ")}</Text></View></View>
      {!delivered ? <><View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16, marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Delivery Proof</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>Capture a photo of the handover / acknowledgement at the lab.</Text><Pressable onPress={() => setImageAdded(true)} style={{ marginTop: 13, height: 135, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: BLUE, backgroundColor: "#F7FBFF", alignItems: "center", justifyContent: "center" }}><Ionicons name={imageAdded ? "image" : "camera-outline"} size={31} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginTop: 8 }}>{imageAdded ? "delivery_proof.jpg added" : "Add Delivery Photo"}</Text></Pressable></View><View style={{ marginTop: 14 }}><PrimaryButton title="I've Delivered the Samples" onPress={markDelivered} disabled={!imageAdded} /></View></> : <><View style={{ backgroundColor: "#E6F8EE", borderRadius: 16, padding: 17, marginTop: 12, alignItems: "center" }}><View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}><Ionicons name="checkmark" size={35} color={GREEN} /></View><Text style={{ color: GREEN, fontSize: 17, fontWeight: "900", marginTop: 11 }}>Samples Delivered</Text><Text style={{ color: MUTED, fontSize: 10.5, textAlign: "center", marginTop: 4 }}>Waiting for the lab to confirm that the samples were received.</Text></View><View style={{ marginTop: 14 }}><PrimaryButton title="Lab Confirmed Receipt" onPress={confirm} icon="checkmark-circle" /></View></>}
    </ScrollView>
  </SafeAreaView>;
}
