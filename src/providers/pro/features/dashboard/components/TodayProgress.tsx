import { Text, View } from "react-native";

export default function TodayProgress({ dashboard }: any) {
  const bucketCount = dashboard?.metrics?.activeBucketCount ?? 0;

  const bucketSize = dashboard?.bucket?.bucketSize ?? 5;

  const onboarded = dashboard?.dailyProgress?.onboarded ?? 0;

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        marginTop: 20,
        padding: 15,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#111827",
          }}
        >
          Today's Progress
        </Text>


      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: 15,
        }}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#16A34A",
            }}
          >
            {bucketCount}/{bucketSize}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 10,
              color: "#6B7280",
            }}
          >
            Bucket
          </Text>
        </View>



        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            {onboarded}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 10,
              color: "#6B7280",
            }}
          >
            Onboarded
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: "#2563EB",
            }}
          >
            {formatAmount(dashboard?.metrics?.earnings ?? dashboard?.metrics?.totalEarnings)}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 10,
              color: "#6B7280",
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
