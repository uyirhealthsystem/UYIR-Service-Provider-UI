import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function QuickActions({ navigation }: any) {
  const actions = [
    {
      title: "Find Hospitals",
      icon: "search-outline",
      color: "#2563EB",
      screen: "Hospitals",
    },
    {
      title: "My Bucket",
      icon: "briefcase-outline",
      color: "#2563EB",
      screen: "Bucket",
    },
    {
      title: "Onboarded",
      icon: "checkmark-circle-outline",
      color: "#7C3AED",
      screen: "Onboarded",
    },
    {
      title: "Rewards",
      icon: "wallet-outline",
      color: "#F59E0B",
      screen: "Rewards",
    },
  ];

  return (
    <View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: "#111827",
          marginTop: 12,
          marginBottom: 10,
        }}
      >
        Quick Actions
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.title}
            onPress={() => navigation.navigate(action.screen)}
            style={{
              width: "23%",
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#EEF1F5",
            }}
          >
            <Ionicons
              name={action.icon as any}
              size={21}
              color={action.color}
            />

            <Text
              style={{
                marginTop: 7,
                fontSize: 9,
                fontWeight: "600",
                color: "#374151",
                textAlign: "center",
              }}
            >
              {action.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
