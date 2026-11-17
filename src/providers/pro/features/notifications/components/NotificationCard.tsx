import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function NotificationCard({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) {
  const icon =
    item.type === "reward"
      ? "cash-outline"
      : item.type === "hospital"
        ? "business-outline"
        : item.type === "approval"
          ? "checkmark-circle-outline"
          : item.type === "rejected"
            ? "close-circle-outline"
            : "notifications-outline";

  const iconColor =
    item.type === "reward"
      ? "#2563EB"
      : item.type === "rejected"
        ? "#C62828"
        : item.type === "approval"
          ? "#16804D"
          : "#1747D1";

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 9,
        padding: 13,
        backgroundColor: item.read ? "#FFFFFF" : "#F4F7FF",
        borderRadius: 13,
        borderWidth: 1,
        borderColor: item.read ? "#E4E7ED" : "#D9E3FF",
      }}
    >
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor: "#EAF1FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>

        <View style={{ flex: 1, marginLeft: 11 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: "700",
                color: "#171A2B",
              }}
            >
              {item.title}
            </Text>

            {!item.read && (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#1747D1",
                  marginLeft: 7,
                }}
              />
            )}
          </View>

          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              color: "#73798C",
              marginTop: 4,
              lineHeight: 15,
            }}
          >
            {item.message}
          </Text>

          <Text
            style={{
              fontSize: 9,
              color: "#9AA0AE",
              marginTop: 6,
            }}
          >
            {item.time}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 20,
            color: "#A1A7B4",
            marginLeft: 5,
            marginTop: 8,
          }}
        >
          ›
        </Text>
      </View>
    </Pressable>
  );
}
