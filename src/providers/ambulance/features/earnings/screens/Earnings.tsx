import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyBookings } from "../../../api/bookings";
import Row from "../components/Row";

export default function Earnings({ route }: any) {
  const BLUE = "#1473E6";
  const BG = "#F5F8FC";
  const MUTED = "#6B7890";
  const TEXT = "#10233F";
  const serviceType = route.params?.serviceType || "AMBULANCE";

  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const response = await getMyBookings();
      const items = Array.isArray(response) ? response : response?.bookings || [];
      setBookings(
        items.map((item: any) => {
          const rawStatus = String(item?.status || "NEW").toUpperCase();

          return {
            serviceType,
            amount: Number(item?.fare || item?.amount || 0),
            status: rawStatus === "PAYMENT_PENDING" ? "PAYMENT" : rawStatus,
          };
        }),
      );
    } catch (error) {
      console.log("AMBULANCE EARNINGS ERROR:", error);
    }
  }

  const completed = bookings.filter(
    (booking) =>
      booking.serviceType === serviceType && booking.status === "COMPLETED",
  );
  const total = completed.reduce(
    (sum, booking) => sum + Number(booking.amount || 0),
    0,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900" }}>
          Earnings
        </Text>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
          Your transport service earnings
        </Text>

        <View
          style={{
            marginTop: 18,
            backgroundColor: BLUE,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ color: "#DDEBFF", fontSize: 11 }}>
            Completed Bookings
          </Text>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 31,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            ₹{total.toLocaleString("en-IN")}
          </Text>
          <Text style={{ color: "#DDEBFF", fontSize: 10, marginTop: 5 }}>
            Calculated from completed bookings returned by the API
          </Text>
        </View>

        <View
          style={{
            marginTop: 14,
            backgroundColor: "#FFFFFF",
            borderRadius: 17,
            padding: 16,
          }}
        >
          <Row
            icon="checkmark-circle-outline"
            label="Completed bookings"
            value={String(completed.length)}
          />
          <Row
            icon="calendar-outline"
            label="Total bookings"
            value={String(bookings.length)}
          />
          <Row
            icon="wallet-outline"
            label="Completed earnings"
            value={`₹${total.toLocaleString("en-IN")}`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
