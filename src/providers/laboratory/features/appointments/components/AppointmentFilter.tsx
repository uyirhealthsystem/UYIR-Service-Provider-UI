import { Pressable, Text, View } from "react-native";
export default function AppointmentFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
      {["All", "Lab", "Scan", "Home"].map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onChange(filter)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 16,
            backgroundColor: value === filter ? "#DCE7FF" : "#fff",
            borderWidth: 1,
            borderColor: "#E2E7EF",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: value === filter ? "#173FD1" : "#687386",
            }}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
