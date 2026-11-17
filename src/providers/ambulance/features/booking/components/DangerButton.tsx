import { Pressable, Text } from "react-native";

export default function DangerButton({ title, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 49,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5484D",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#E5484D", fontWeight: "900", fontSize: 14 }}>
        {title}
      </Text>
    </Pressable>
  );
}
