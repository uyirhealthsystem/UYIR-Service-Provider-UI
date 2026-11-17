import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TodayProgress({ navigation }: any) {
  const activities = [
    {
      title: "Hospital visit completed",
      name: "Grace Hospital",
      time: "10:20 AM",
      icon: "checkmark-circle",
      color: "#16A34A",
    },
    {
      title: "Hospital onboarding completed",
      name: "Sakthi Hospital",
      time: "12:05 PM",
      icon: "checkmark-circle",
      color: "#16A34A",
    },
    {
      title: "Hospital visit completed",
      name: "Lotus Hospital",
      time: "2:15 PM",
      icon: "checkmark-circle",
      color: "#16A34A",
    },
    {
      title: "Reward earned",
      name: "₹1,000 approved",
      time: "2:20 PM",
      icon: "cash-outline",
      color: "#2563EB",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E4E7ED",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#171A2B" />
          </Pressable>

          <View style={{ marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#171A2B",
              }}
            >
              Today's Progress
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: "#73798C",
                marginTop: 2,
              }}
            >
              Your activity for today
            </Text>
          </View>
        </View>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E4E7ED",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#73798C",
            }}
          >
            TODAY'S SUMMARY
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 18,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#16A34A",
                }}
              >
                5
              </Text>
              <Text style={{ fontSize: 10, color: "#73798C", marginTop: 3 }}>
                Bucket
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#F59E0B",
                }}
              >
                3
              </Text>
              <Text style={{ fontSize: 10, color: "#73798C", marginTop: 3 }}>
                Visits
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#171A2B",
                }}
              >
                2
              </Text>
              <Text style={{ fontSize: 10, color: "#73798C", marginTop: 3 }}>
                Onboarded
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#2563EB",
                }}
              >
                ₹2,000
              </Text>
              <Text style={{ fontSize: 10, color: "#73798C", marginTop: 3 }}>
                Earned
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 22,
            marginBottom: 10,
            fontSize: 14,
            fontWeight: "700",
            color: "#171A2B",
          }}
        >
          Today's Activity
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E4E7ED",
            paddingHorizontal: 15,
          }}
        >
          {activities.map((item, index) => (
            <View
              key={item.title + item.time}
              style={{
                flexDirection: "row",
                paddingVertical: 15,
                borderBottomWidth: index === activities.length - 1 ? 0 : 1,
                borderBottomColor: "#EEF0F4",
              }}
            >
              <Ionicons name={item.icon as any} size={22} color={item.color} />

              <View style={{ flex: 1, marginLeft: 11 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#171A2B",
                  }}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    color: "#73798C",
                    marginTop: 3,
                  }}
                >
                  {item.name}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 9,
                  color: "#8A91A2",
                }}
              >
                {item.time}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
