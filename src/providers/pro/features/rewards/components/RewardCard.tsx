import { Text, View } from "react-native";

export default function RewardCard({ item }: { item: any }) {
  const approved = item.status === "approved";

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 9,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "#E4E7ED",
        padding: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
              item.type === "hospital"
                ? "#EAF1FF"
                : item.type === "ambulance"
                  ? "#FFF0F1"
                  : "#F2EEFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color:
                item.type === "hospital"
                  ? "#1747D1"
                  : item.type === "ambulance"
                    ? "#D94444"
                    : "#7656D6",
            }}
          >
            {item.type === "hospital"
              ? "H"
              : item.type === "ambulance"
                ? "A"
                : "L"}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            marginLeft: 11,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#171A2B",
            }}
          >
            {item.name}
          </Text>

          <Text
            style={{
              fontSize: 10,
              color: "#73798C",
              marginTop: 3,
            }}
          >
            {item.service}
          </Text>
        </View>

        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#171A2B",
            }}
          >
            ₹{item.amount}
          </Text>

          <View
            style={{
              marginTop: 5,
              backgroundColor: approved ? "#EAF8F0" : "#FFF4E3",
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: approved ? "#16804D" : "#B66A00",
              }}
            >
              {approved ? "Approved" : "Pending"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: "#EEF0F4",
          marginVertical: 10,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: "#8A91A2",
          }}
        >
          {item.date}
        </Text>

        <Text
          style={{
            fontSize: 10,
            color: "#8A91A2",
          }}
        >
          {item.status === "approved"
            ? "Reward approved"
            : "Waiting for approval"}
        </Text>
      </View>
    </View>
  );
}
