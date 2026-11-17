import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function QuickStats({ dashboard }: any) {
  const metrics = dashboard?.metrics;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "800",
            color: "#111827",
          }}
        >
          Quick Stats
        </Text>

        <Text
          style={{
            fontSize: 10,
            color: "#6B7280",
          }}
        >
          This Month
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 16,
          flexDirection: "row",
          borderWidth: 1,
          borderColor: "#EEF1F5",
        }}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name="business-outline" size={20} color="#16A34A" />

          <Text
            style={{
              marginTop: 7,
              fontSize: 20,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            {metrics?.totalHospitals ?? 0}
          </Text>

          <Text
            style={{
              marginTop: 2,
              fontSize: 9,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Hospitals Visited
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#2563EB" />

          <Text
            style={{
              marginTop: 7,
              fontSize: 20,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            {metrics?.onboardedHospitals ?? 0}
          </Text>

          <Text
            style={{
              marginTop: 2,
              fontSize: 9,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Onboarded
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name="people-outline" size={20} color="#7C3AED" />

          <Text
            style={{
              marginTop: 7,
              fontSize: 20,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            {metrics?.pickedHospitals ?? 0}
          </Text>

          <Text
            style={{
              marginTop: 2,
              fontSize: 9,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            In Progress
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name="wallet-outline" size={20} color="#16A34A" />

          <Text
            style={{
              marginTop: 7,
              fontSize: 18,
              fontWeight: "800",
              color: "#16A34A",
            }}
          >
            {formatAmount(metrics?.earnings ?? metrics?.totalEarnings ?? metrics?.totalRewards)}
          </Text>

          <Text
            style={{
              marginTop: 2,
              fontSize: 9,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Earned
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "₹0";
}
