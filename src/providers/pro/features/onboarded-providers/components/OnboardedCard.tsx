import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function OnboardedCard({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E4E7ED",
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 11,
            backgroundColor: "#EAF1FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="business-outline" size={27} color="#1747D1" />
        </View>

        <View style={{ flex: 1, marginLeft: 11 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: "700",
                color: "#171A2B",
              }}
            >
              {item.name}
            </Text>
            <Text style={{ fontSize: 20, color: "#A1A7B4", marginLeft: 6 }}>›</Text>
          </View>

          <Text
            numberOfLines={1}
            style={{ fontSize: 11, color: "#73798C", marginTop: 4 }}
          >
            {item.location}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {item.tags.slice(0, 3).map((tag: string) => (
              <View
                key={tag}
                style={{
                  backgroundColor: "#F1F4F9",
                  borderRadius: 5,
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "600", color: "#596174" }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
          paddingTop: 9,
          borderTopWidth: 1,
          borderTopColor: "#EEF0F4",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            backgroundColor: "#EAF8F0",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: "#16804D" }}>
            ONBOARDED
          </Text>
        </View>

        <Text style={{ fontSize: 10, color: "#8A91A2" }}>
          {item.date ? `Onboarded ${item.date}` : "Onboarded"}
        </Text>

        <Text style={{ fontSize: 10, fontWeight: "700", color: "#1747D1" }}>
          View Details
        </Text>
      </View>
    </Pressable>
  );
}
