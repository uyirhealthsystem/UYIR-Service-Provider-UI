import { Pressable, ScrollView, Text } from "react-native";

export default function ServiceTabs({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const services = [
    { id: "all", label: "All" },
    { id: "hospital", label: "Hospitals" },
    { id: "ambulance", label: "Ambulances" },
    { id: "lab", label: "Labs" },
    { id: "nurse", label: "Nurses" },
    { id: "doctor", label: "Doctors" },
    { id: "pharmacy", label: "Pharmacy" },
    { id: "scan", label: "Scan Centres" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {services.map((item) => {
        const active = selected === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              backgroundColor: active ? "#1747D1" : "#FFFFFF",
              borderWidth: 1,
              borderColor: active ? "#1747D1" : "#E1E5ED",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: active ? "700" : "600",
                color: active ? "#FFFFFF" : "#596174",
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
