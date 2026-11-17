import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EarningsSummary from "../components/EarningsSummary";
import RewardCard from "../components/RewardCard";

const rewards: any[] = [
  {
    id: "1",
    name: "City Care Hospital",
    type: "hospital",
    service: "Hospital Onboarding",
    amount: "1,000",
    status: "approved",
    date: "12 Mar 2026",
  },
  {
    id: "2",
    name: "Sree Balaji Hospital",
    type: "hospital",
    service: "Hospital Onboarding",
    amount: "1,000",
    status: "pending",
    date: "20 Mar 2026",
  },
  {
    id: "3",
    name: "Sri Lakshmi Ambulance",
    type: "ambulance",
    service: "Ambulance Onboarding",
    amount: "1,000",
    status: "approved",
    date: "08 Mar 2026",
  },
  {
    id: "4",
    name: "Uyir Diagnostics",
    type: "lab",
    service: "Lab Onboarding",
    amount: "1,000",
    status: "approved",
    date: "06 Mar 2026",
  },
  {
    id: "5",
    name: "Anbu Hospital",
    type: "hospital",
    service: "Hospital Onboarding",
    amount: "1,000",
    status: "approved",
    date: "02 Mar 2026",
  },
];

export default function Rewards({ navigation }: any) {
  const [filter, setFilter] = useState("all");

  const filteredRewards = useMemo(() => {
    if (filter === "all") {
      return rewards;
    }

    return rewards.filter((item) => item.status === filter);
  }, [filter]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F5F7FB",
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 7,
          paddingBottom: 13,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E1E5ED",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              color: "#171A2B",
              marginTop: -2,
            }}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={{
            flex: 1,
            marginLeft: 11,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#171A2B",
            }}
          >
            Rewards
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: "#73798C",
              marginTop: 2,
            }}
          >
            Track your onboarding earnings
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        <EarningsSummary />

        {/* History Header */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#171A2B",
            }}
          >
            Reward History
          </Text>

          <Text
            style={{
              fontSize: 10,
              color: "#8A91A2",
              marginTop: 3,
            }}
          >
            Earnings from your provider onboardings
          </Text>
        </View>

        {/* Filters */}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 16,
            marginBottom: 12,
            gap: 7,
          }}
        >
          <Pressable
            onPress={() => setFilter("all")}
            style={{
              height: 34,
              paddingHorizontal: 15,
              borderRadius: 17,
              backgroundColor: filter === "all" ? "#1747D1" : "#FFFFFF",
              borderWidth: 1,
              borderColor: filter === "all" ? "#1747D1" : "#E1E5ED",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: filter === "all" ? "#FFFFFF" : "#596174",
              }}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("approved")}
            style={{
              height: 34,
              paddingHorizontal: 15,
              borderRadius: 17,
              backgroundColor: filter === "approved" ? "#EAF8F0" : "#FFFFFF",
              borderWidth: 1,
              borderColor: filter === "approved" ? "#1DA866" : "#E1E5ED",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: filter === "approved" ? "#16804D" : "#596174",
              }}
            >
              Approved
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("pending")}
            style={{
              height: 34,
              paddingHorizontal: 15,
              borderRadius: 17,
              backgroundColor: filter === "pending" ? "#FFF4E3" : "#FFFFFF",
              borderWidth: 1,
              borderColor: filter === "pending" ? "#F59E0B" : "#E1E5ED",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: filter === "pending" ? "#B66A00" : "#596174",
              }}
            >
              Pending
            </Text>
          </Pressable>
        </View>

        {/* Reward List */}
        {filteredRewards.map((item) => (
          <RewardCard key={item.id} item={item} />
        ))}

        {filteredRewards.length === 0 && (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              borderWidth: 1,
              borderColor: "#E4E7ED",
              paddingVertical: 35,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#34394A",
              }}
            >
              No rewards found
            </Text>

            <Text
              style={{
                fontSize: 10,
                color: "#8A91A2",
                marginTop: 4,
              }}
            >
              Rewards will appear here after onboarding
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
