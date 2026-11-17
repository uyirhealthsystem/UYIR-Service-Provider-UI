import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getBucket } from "../../../api/bucket";
import { getMyProfile } from "../../../api/profile";

export default function CurrentBucket({ navigation }: any) {
  const [bucket, setBucket] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBucket = async () => {
    try {
      setLoading(true);

      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};
      const proId = profile?.proId || profile?.pro?.proId || profile?.id;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      const response = await getBucket(proId);

      const hospitals =
        Array.isArray(response?.data?.hospitals)
          ? response.data.hospitals
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.hospitals)
              ? response.hospitals
              : [];

      setBucket(hospitals);
    } catch (error) {
      console.log("Current bucket API error:", error);

      setBucket([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBucket();
    }, []),
  );

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
          Current Bucket
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginRight: 9 }}>
            {Math.min(bucket.length, 5)}/5 selected
          </Text>
          {bucket.length < 5 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add hospital to bucket"
              onPress={() => navigation.navigate("Hospitals")}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: "#EAF2FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={21} color="#2563EB" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#EEF1F5",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            Loading bucket...
          </Text>
        </View>
      ) : bucket.length === 0 ? (
        <Pressable
          onPress={() => navigation.navigate("Hospitals")}
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#EEF1F5",
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: "#EAF2FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="briefcase-outline" size={20} color="#2563EB" />
          </View>

          <View
            style={{
              flex: 1,
              marginLeft: 11,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Your bucket is empty
            </Text>

            <Text
              style={{
                marginTop: 3,
                fontSize: 11,
                color: "#6B7280",
              }}
            >
              Find hospitals and add them to your bucket
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: "#2563EB",
              fontWeight: "600",
            }}
          >
            Find
          </Text>
        </Pressable>
      ) : (
        bucket.slice(0, 5).map((hospital: any) => {
          const name =
            hospital?.hospitalPool?.name ||
            hospital?.name ||
            hospital?.hospital?.name ||
            "Hospital";

          const location =
            hospital?.hospitalPool?.address ||
            hospital?.address ||
            hospital?.hospital?.address ||
            hospital?.districtId ||
            "Location unavailable";

          const status = hospital?.status || "PICKED";

          const statusColor =
            status === "Visiting"
              ? "#2563EB"
              : status === "Interested"
                ? "#16A34A"
                : status === "Not Interested"
                  ? "#F59E0B"
                  : "#2563EB";

          const statusBackground =
            status === "Visiting"
              ? "#EAF2FF"
              : status === "Interested"
                ? "#EAF8EF"
                : status === "Not Interested"
                  ? "#FFF4E5"
                  : "#EAF2FF";

          return (
            <Pressable
              key={hospital?.proHospitalId || hospital?.hospitalPoolId}
              onPress={() => navigation.navigate("Bucket")}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#EEF1F5",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#EAF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="business-outline" size={20} color="#2563EB" />
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
                    color: "#111827",
                  }}
                >
                  {name.replace(/\r?\n/g, " ")}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 3,
                    fontSize: 11,
                    color: "#6B7280",
                  }}
                >
                  {location}
                </Text>
              </View>

              <View
                style={{
                  alignItems: "flex-end",
                }}
              >
                <View
                  style={{
                    backgroundColor: statusBackground,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: statusColor,
                    }}
                  >
                    {status}
                  </Text>
                </View>

                <Text
                  style={{
                    marginTop: 5,
                    fontSize: 10,
                    color: "#6B7280",
                  }}
                >
                  {hospital?.blockExpiresAt
                    ? getTimeLeft(hospital.blockExpiresAt)
                    : "Claim active"}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function getTimeLeft(blockExpiresAt: string) {
  const remaining = Math.max(
    0,
    new Date(blockExpiresAt).getTime() - Date.now(),
  );

  if (remaining <= 0) {
    return "Expired";
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));

  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  return `${hours}h ${minutes}m left`;
}
