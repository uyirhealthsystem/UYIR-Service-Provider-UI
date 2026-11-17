import { Text, View } from "react-native";

export default function EarningsSummary() {
  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: "#1747D1",
        borderRadius: 16,
        padding: 17,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: "#D9E3FF",
          fontWeight: "600",
        }}
      >
        TOTAL EARNINGS
      </Text>

      <Text
        style={{
          fontSize: 30,
          fontWeight: "800",
          color: "#FFFFFF",
          marginTop: 5,
        }}
      >
        ₹12,500
      </Text>

      <Text
        style={{
          fontSize: 10,
          color: "#D9E3FF",
          marginTop: 3,
        }}
      >
        From approved provider onboardings
      </Text>

      <View
        style={{
          height: 1,
          backgroundColor: "#FFFFFF30",
          marginVertical: 15,
        }}
      />

      <View
        style={{
          flexDirection: "row",
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#D9E3FF",
            }}
          >
            This Month
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#FFFFFF",
              marginTop: 3,
            }}
          >
            ₹4,000
          </Text>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: "#FFFFFF30",
            marginHorizontal: 15,
          }}
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#D9E3FF",
            }}
          >
            Pending
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#FFFFFF",
              marginTop: 3,
            }}
          >
            ₹1,000
          </Text>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: "#FFFFFF30",
            marginHorizontal: 15,
          }}
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#D9E3FF",
            }}
          >
            Approved
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#FFFFFF",
              marginTop: 3,
            }}
          >
            12
          </Text>
        </View>
      </View>
    </View>
  );
}
