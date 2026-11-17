import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button, C } from "../../../components/ui";
import type { PoolBlock } from "../useProviderBookings";

// Pool returns 403 PROVIDER_LOCATION_REQUIRED for older profiles with no pincode/coordinates.
export function LocationRequired({ code, onFix }: { code: PoolBlock; onFix: () => void }) {
  const isLocation = code === "PROVIDER_LOCATION_REQUIRED";
  return (
    <View style={{ backgroundColor: C.amberSoft, borderRadius: 16, padding: 15 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="location-outline" size={20} color={C.amber} />
        <Text style={{ marginLeft: 8, color: C.ink, fontWeight: "900", flex: 1 }}>
          {isLocation ? "Add your service location" : "Complete your profile"}
        </Text>
      </View>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
        Bookings are matched by your pincode and distance from your location. Add them to start seeing requests.
      </Text>
      <View style={{ flexDirection: "row", marginTop: 12 }}>
        <Button title="Update location" icon="create-outline" onPress={onFix} />
      </View>
    </View>
  );
}
