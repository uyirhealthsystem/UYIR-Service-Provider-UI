import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

export default function PrimaryButton({ title, onPress, icon, disabled = false }: any) {
  const BLUE = "#1473E6";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        height: 49,
        borderRadius: 12,
        backgroundColor: disabled ? "#B9C9DD" : BLUE,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
      }}
    >
      {icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}
      <Text
        style={{
          color: "#FFFFFF",
          fontWeight: "900",
          fontSize: 14,
          marginLeft: icon ? 8 : 0,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
