import { Pressable, Text, View } from "react-native";
export default function ProfileCard({ navigation }: any) {
  return (
    <>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 18,
          marginTop: 16,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "900" }}>
          Lakshmi Diagnostic Lab
        </Text>
        <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>
          Lab & Scan Service Provider
        </Text>
        <Text style={{ fontSize: 11, color: "#687386", marginTop: 2 }}>
          Tenkasi, Tamil Nadu
        </Text>
      </View>
      {[
        "Lab Details",
        "Test Catalog",
        "Time Slots",
        "Bank & Payout Details",
        "Settings",
        "Help & Support",
      ].map((item) => (
        <Pressable
          key={item}
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#343D4D" }}>
            {item} ›
          </Text>
        </Pressable>
      ))}
      <Pressable style={{ marginTop: 14, padding: 15, alignItems: "center" }}>
        <Text style={{ color: "#E72B3A", fontWeight: "800" }}>Logout</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("LabEarnings")}
        style={{ marginTop: 4, alignItems: "center" }}
      >
        <Text style={{ color: "#173FD1", fontWeight: "700", fontSize: 11 }}>
          Open Earnings
        </Text>
      </Pressable>
    </>
  );
}
