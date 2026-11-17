import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: any) {
  const BLUE = "#1473E6";
  const TEXT = "#10233F";
  const MUTED = "#6B7890";

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "#EAF3FF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={BLUE} />
      </View>

      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={{ color: TEXT, fontSize: 13, fontWeight: "900" }}>
          {title}
        </Text>
        <Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>
          {subtitle}
        </Text>
      </View>

      <Pressable
        onPress={() => onValueChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 16,
          backgroundColor: value ? BLUE : "#CBD5E1",
          padding: 3,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFFFFF",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </Pressable>
    </View>
  );
}
