import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
export default function EarningsHeader({ onBack }: { onBack: () => void }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingBottom: 13 }}
    >
      <Pressable
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E1E5ED",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-back" size={22} color="#171A2B" />
      </Pressable>
      <Text
        style={{
          flex: 1,
          marginLeft: 11,
          fontSize: 20,
          fontWeight: "800",
          color: "#171A2B",
        }}
      >
        Earnings
      </Text>
    </View>
  );
}
