import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBucket, releaseHospital, updateHospitalStatus } from "../../../api/bucket";
import { getMyCheckpoints, getMyHospitals, getMyProfile } from "../../../api/profile";

export default function Bucket({ navigation }: any) {
  const [bucket, setBucket] = useState<any[]>([]);
  const [expiredHospitals, setExpiredHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadBucket = async () => {
    try {
      setLoading(true);
      setError("");

      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};
      const proId = profile?.proId || profile?.pro?.proId || profile?.id;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      const [response, historyResponse, checkpointsResponse] = await Promise.all([
        getBucket(proId),
        getMyHospitals(),
        getMyCheckpoints(),
      ]);

      const hospitals =
        Array.isArray(response?.data?.hospitals)
          ? response.data.hospitals
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.hospitals)
              ? response.hospitals
              : [];

      setBucket(hospitals);

      const historyRows = extractRows(historyResponse);
      const checkpointRows = extractRows(checkpointsResponse);
      const expiredRows = [...checkpointRows, ...historyRows].filter((item, index, all) => {
        const expiry = item?.blockExpiresAt ? new Date(item.blockExpiresAt).getTime() : 0;
        const expired = String(item?.status || "").toUpperCase() === "EXPIRED" ||
          ((String(item?.status || "").toUpperCase() === "PICKED" || String(item?.status || "").toUpperCase() === "NO_TIME") && expiry > 0 && expiry <= Date.now());
        const id = item?.proHospitalId || item?.id;
        return expired && id && all.findIndex((candidate) => (candidate?.proHospitalId || candidate?.id) === id) === index;
      });
      setExpiredHospitals(expiredRows);
    } catch (error: any) {
      console.log("Bucket API error:", error);

      setError(error?.message || "Unable to load your bucket");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBucket();

      const timer = setInterval(() => {
        setNow(Date.now());
      }, 1000);

      return () => clearInterval(timer);
    }, []),
  );

  const getTimeLeft = (blockExpiresAt: string) => {
    const expiresAt = new Date(blockExpiresAt).getTime();
    const remaining = Math.max(0, expiresAt - now);

    const hours = Math.floor(remaining / (60 * 60 * 1000));

    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return {
      hours,
      minutes,
      seconds,
      expired: remaining <= 0,
    };
  };

  const handleRelease = async (proHospitalId: string) => {
    try {
      setError("");

      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};
      const proId = profile?.proId || profile?.pro?.proId || profile?.id;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      await releaseHospital(proId, proHospitalId);

      await loadBucket();
    } catch (error: any) {
      console.log("Release hospital error:", error);

      setError(error?.message || "Unable to remove hospital");
    }
  };



  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F7F9FC",
      }}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EEF1F5",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              backgroundColor: "#F3F6FA",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#111827",
              }}
            >
              My Bucket
            </Text>

            <Text
              style={{
                marginTop: 3,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              Hospitals you selected
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#EAF2FF",
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#2563EB",
              }}
            >
              {bucket.length} / 5
            </Text>
          </View>
        </View>
      </View>

      {error ? (
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 30,
            paddingTop: 70,
          }}
        >
          <Ionicons name="alert-circle-outline" size={42} color="#EF4444" />

          <Text
            style={{
              marginTop: 12,
              fontSize: 15,
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Unable to load bucket
          </Text>

          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            {error}
          </Text>

          <Pressable
            onPress={loadBucket}
            style={{
              marginTop: 16,
              backgroundColor: "#173FD1",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 9,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
        >
          {loading && (
            <View
              style={{
                alignItems: "center",
                paddingTop: 60,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                }}
              >
                Loading bucket...
              </Text>
            </View>
          )}

          {!loading && bucket.length === 0 && (
            <View
              style={{
                alignItems: "center",
                paddingTop: 80,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#EAF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="briefcase-outline" size={32} color="#2563EB" />
              </View>

              <Text
                style={{
                  marginTop: 16,
                  fontSize: 17,
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                Your bucket is empty
              </Text>

              <Text
                style={{
                  marginTop: 7,
                  fontSize: 12,
                  lineHeight: 18,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                Add hospitals from the hospital list to start onboarding.
              </Text>

              <Pressable
                onPress={() => navigation.navigate("Hospitals")}
                style={{
                  marginTop: 20,
                  backgroundColor: "#173FD1",
                  borderRadius: 10,
                  paddingHorizontal: 22,
                  paddingVertical: 11,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Find Hospitals
                </Text>
              </Pressable>
            </View>
          )}

          {!loading &&
            bucket.map((hospital) => {
              const time = getTimeLeft(hospital.blockExpiresAt);

              const hospitalName =
                hospital.hospitalPool?.name ||
                hospital.name ||
                hospital.hospital?.name ||
                "Hospital";

              const hospitalAddress =
                hospital.hospitalPool?.address ||
                hospital.address ||
                hospital.hospital?.address ||
                hospital.districtId ||
                "Address unavailable";

              const status = hospital.status;

              return (
                <View
                  key={hospital.proHospitalId}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#EEF1F5",
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
                        width: 64,
                        height: 72,
                        borderRadius: 9,
                        backgroundColor: "#EAF2FF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="business-outline"
                        size={26}
                        color="#2563EB"
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                        marginLeft: 11,
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: "#111827",
                        }}
                      >
                        {hospitalName}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#6B7280"
                        />

                        <Text
                          numberOfLines={1}
                          style={{
                            marginLeft: 4,
                            fontSize: 11,
                            color: "#6B7280",
                            flexShrink: 1,
                          }}
                        >
                          {hospitalAddress}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={13}
                          color="#16A34A"
                        />

                        <Text
                          style={{
                            marginLeft: 4,
                            fontSize: 10,
                            color: "#6B7280",
                          }}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F0F2F5",
                      marginVertical: 12,
                    }}
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          backgroundColor: time.expired ? "#FEE2E2" : "#ECFDF5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={time.expired ? "#DC2626" : "#16A34A"}
                        />
                      </View>

                      <View
                        style={{
                          marginLeft: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#6B7280",
                          }}
                        >
                          Claim time remaining
                        </Text>

                        <Text
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            fontWeight: "800",
                            color: time.expired ? "#DC2626" : "#111827",
                          }}
                        >
                          {time.expired
                            ? "Claim expired"
                            : `${time.hours}h ${time.minutes}m ${time.seconds}s`}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: time.expired ? "#FEE2E2" : "#ECFDF5",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: time.expired ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {time.expired ? "Expired" : status}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 12,
                      flexDirection: "row",
                    }}
                  >
                    {!time.expired && String(status || "").toUpperCase() !== "EXPIRED" ? <Pressable
                      onPress={() =>
                        navigation.getParent()?.navigate("HospitalVisit", {
                          hospitalId:
                            hospital.hospitalId || hospital.hospitalPoolId,
                          proHospitalId: hospital.proHospitalId,
                        })
                      }
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 9,
                        backgroundColor: "#173FD1",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#FFFFFF",
                        }}
                      >
                        Start Visit
                      </Text>
                    </Pressable> : null}

                    <Pressable
                      onPress={() => handleRelease(hospital.proHospitalId)}
                      style={{
                        width: 90,
                        height: 38,
                        borderRadius: 9,
                        marginLeft: 8,
                        backgroundColor: "#FEECEC",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#FECACA",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#DC2626",
                        }}
                      >
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

          {expiredHospitals.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10 }}>
                Expired claims ({expiredHospitals.length})
              </Text>
              {expiredHospitals.map((hospital) => {
                const id = hospital.proHospitalId || hospital.id;
                const name = hospital.hospitalPool?.name || hospital.hospital?.name || hospital.name || "Hospital";
                const location = hospital.hospitalPool?.address || hospital.hospital?.address || hospital.address || hospital.districtId || "Address unavailable";
                return (
                  <View key={id} style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: "#FECACA" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>{name}</Text>
                    <Text style={{ marginTop: 3, fontSize: 11, color: "#6B7280" }}>{location}</Text>
                    <Text style={{ marginTop: 5, fontSize: 10, color: "#DC2626", fontWeight: "700" }}>24-hour claim expired</Text>
                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                      <Pressable disabled={actionId === id} onPress={async () => { setActionId(id); await handleRelease(id); setActionId(null); }} style={{ flex: 1, backgroundColor: "#FEECEC", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}>
                        <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>{actionId === id ? "Please wait..." : "Remove"}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function extractRows(response: any): any[] {
  const candidates = [response?.data?.hospitals, response?.data?.items, response?.data, response?.hospitals, response?.items];
  return candidates.find(Array.isArray) || [];
}
