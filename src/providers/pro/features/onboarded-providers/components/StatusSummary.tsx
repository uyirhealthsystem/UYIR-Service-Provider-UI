import { Pressable, Text, View } from "react-native";

export default function StatusSummary({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const items = [
    {
      id: "approved",
      number: 18,
      title: "Approved",
      icon: "✓",
      background: "#EAF8F0",
      iconBackground: "#1DA866",
      text: "#167A4A",
    },
    {
      id: "pending",
      number: 10,
      title: "Pending",
      icon: "◷",
      background: "#FFF6E8",
      iconBackground: "#F59E0B",
      text: "#B66A00",
    },
    {
      id: "rejected",
      number: 3,
      title: "Rejected",
      icon: "×",
      background: "#FFF0F1",
      iconBackground: "#EF4444",
      text: "#C62828",
    },
    {
      id: "all",
      number: 31,
      title: "Total",
      icon: "☷",
      background: "#F0F3F8",
      iconBackground: "#71809D",
      text: "#27304A",
    },
  ];

  return (
    <View
      style={{
        paddingHorizontal: 16,
        marginTop: 12,
        flexDirection: "row",
        gap: 8,
      }}
    >
      {items.map((item) => {
        const active = selected === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={{
              flex: 1,
              minHeight: 82,
              borderRadius: 12,
              backgroundColor: item.background,
              borderWidth: active ? 1 : 0,
              borderColor: active ? item.iconBackground : "transparent",
              padding: 9,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: item.iconBackground,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 5,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {item.icon}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: item.text,
              }}
            >
              {item.number}
            </Text>

            <Text
              style={{
                fontSize: 9,
                color: item.text,
                marginTop: 1,
              }}
            >
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
