import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyBookings } from "../../../api/bookings";
import StatusPill from "../components/StatusPill";

export default function Bookings({ route }: any) {
  const BLUE = "#1473E6";
  const BG = "#F5F8FC";
  const GREEN = "#17B26A";
  const MUTED = "#6B7890";
  const RED = "#E5484D";
  const TEXT = "#10233F";
  const serviceType = route.params?.serviceType || "AMBULANCE";

  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const response = await getMyBookings();
      const items = Array.isArray(response)
        ? response
        : response?.bookings || [];
      setBookings(
        items.map((item: any) => {
          const pickup = item?.pickup || item?.pickupLocation || {};
          const drop = item?.drop || item?.dropLocation || item?.hospital || {};
          const rawStatus = String(item?.status || "NEW").toUpperCase();

          return {
            id: String(item?.id || item?.bookingId || ""),
            patient:
              item?.contactName ||
              item?.patientName ||
              item?.patient?.name ||
              "Patient",
            serviceType,
            date:
              item?.appointmentDate ||
              item?.scheduledAt?.slice?.(0, 10) ||
              "Today",
            time: item?.startTime || item?.scheduledAt?.slice?.(11, 16) || "",
            patientAddress: pickup?.address || "Patient pickup location",
            hospital:
              drop?.name ||
              drop?.hospitalName ||
              item?.hospitalName ||
              "Hospital",
            amount: Number(item?.fare || item?.amount || 0),
            status: rawStatus === "PAYMENT_PENDING" ? "PAYMENT" : rawStatus,
          };
        }),
      );
    } catch (error) {
      console.log("AMBULANCE BOOKINGS ERROR:", error);
    }
  }

  const visibleBookings = bookings.filter(
    (booking) => booking.serviceType === serviceType,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900" }}>
          My Bookings
        </Text>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
          Your patient transport history
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10 }}
      >
        {visibleBookings.map((booking) => (
          <View
            key={booking.id}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "#EAF3FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={
                    booking.serviceType === "AMBULANCE"
                      ? "medkit-outline"
                      : "car-outline"
                  }
                  size={20}
                  color={BLUE}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: TEXT, fontSize: 13, fontWeight: "900" }}>
                  {booking.id} • {booking.patient}
                </Text>
                <Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>
                  {booking.date} • {booking.time}
                </Text>
              </View>
              <StatusPill
                label={booking.status.replace(/_/g, " ")}
                color={
                  booking.status === "COMPLETED"
                    ? GREEN
                    : booking.status === "REJECTED"
                      ? RED
                      : BLUE
                }
              />
            </View>

            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="location-outline" size={15} color={BLUE} />
              <Text
                style={{ flex: 1, marginLeft: 6, color: TEXT, fontSize: 10 }}
              >
                {booking.patientAddress}
              </Text>
            </View>

            <View
              style={{
                marginTop: 7,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="business-outline" size={15} color={GREEN} />
              <Text
                style={{ flex: 1, marginLeft: 6, color: TEXT, fontSize: 10 }}
              >
                {booking.hospital}
              </Text>
              <Text style={{ color: TEXT, fontSize: 12, fontWeight: "900" }}>
                ₹{booking.amount}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
