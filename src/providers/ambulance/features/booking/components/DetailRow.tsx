import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function DetailRow({ icon, title, value }: any) {
  return (
    <View style={{ flexDirection: "row", marginTop: 15 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "#EAF3FF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color="#1473E6" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 10, color: "#6B7890" }}>{title}</Text>
        <Text
          style={{
            marginTop: 3,
            fontSize: 12,
            color: "#10233F",
            fontWeight: "700",
            lineHeight: 17,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
