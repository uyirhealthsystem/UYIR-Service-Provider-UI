import { Linking, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Booking } from "../../../api/types";
import { Button, C, Header } from "../../../components/ui";
import { patientName } from "../../../utils/format";

export default function Map({ route, navigation }: any) {
  const booking: Booking = route.params?.booking;
  const lat = Number(booking?.latitude);
  const lng = Number(booking?.longitude);
  const address = [booking?.address, booking?.city, booking?.pincode].filter(Boolean).join(", ");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <Header title="Patient location" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, padding: 14 }}>
        <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: C.border }}>
          <MapView
            style={{ flex: 1 }}
            mapType="none"
            initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
            showsUserLocation
            showsMyLocationButton
          >
            <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
            <Marker coordinate={{ latitude: lat, longitude: lng }} title={patientName(booking)} description={address} pinColor={C.red} />
          </MapView>
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 17, padding: 14, marginTop: 12 }}>
          <Text style={{ color: C.ink, fontWeight: "900", fontSize: 14 }}>{patientName(booking)}</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{address || "—"}</Text>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <Button title="Open in Google Maps" icon="navigate" onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
