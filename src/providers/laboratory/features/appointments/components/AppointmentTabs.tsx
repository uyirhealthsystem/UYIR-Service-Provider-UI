import { Pressable, Text, View } from "react-native";

export default function AppointmentTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginTop: 14,
        backgroundColor: "#E9EDF5",
        borderRadius: 10,
        padding: 3,
      }}
    >
      {["Today", "Upcoming", "Cancelled", "Rescheduled"].map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 8,
            backgroundColor: value === tab ? "#173FD1" : "transparent",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: value === tab ? "#fff" : "#687386",
            }}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
