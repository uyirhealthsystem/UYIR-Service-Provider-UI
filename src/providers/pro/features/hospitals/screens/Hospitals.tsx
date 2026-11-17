import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { getBucket, pickHospital } from "../../../api/bucket";
import { getAvailableHospitals } from "../../../api/hospitals";
import { getMyProfile } from "../../../api/profile";

const MAX_SELECTION = 5;

export default function Hospitals({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const hasLoadedHospitals = useRef(false);
  const proIdRef = useRef("");

  const [search, setSearch] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<any[]>([]);
  const [bucketCount, setBucketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("");

  const getBucketCount = useCallback(async (proId: string) => {
    try {
      const bucketResponse = await getBucket(proId);

      console.log(
        "PRO bucket response:",
        JSON.stringify(bucketResponse, null, 2),
      );

      const bucketData = bucketResponse?.data;
      const bucketHospitals =
        Array.isArray(bucketData?.hospitals)
          ? bucketData.hospitals
          : Array.isArray(bucketData)
            ? bucketData
            : Array.isArray(bucketResponse?.hospitals)
              ? bucketResponse.hospitals
              : Array.isArray(bucketResponse)
                ? bucketResponse
                : [];

      setBucketCount(bucketHospitals.length);
    } catch (bucketError: any) {
      console.log("PRO bucket API error:", bucketError);
      setBucketCount(0);
    }
  }, []);

  const loadHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};

      const proId = profile?.proId || profile?.pro?.proId || profile?.id;
      const profileDistrict =
        profile?.districtId || profile?.district?.name || profile?.district;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      proIdRef.current = proId;
      setDistrict(profileDistrict || "");

      const hospitalResponse = await getAvailableHospitals(proId);

      console.log(
        "Available hospitals response:",
        JSON.stringify(hospitalResponse, null, 2),
      );

      const availableHospitals =
        Array.isArray(hospitalResponse?.data?.hospitals)
          ? hospitalResponse.data.hospitals
          : Array.isArray(hospitalResponse?.data)
            ? hospitalResponse.data
            : Array.isArray(hospitalResponse?.hospitals)
              ? hospitalResponse.hospitals
              : Array.isArray(hospitalResponse)
                ? hospitalResponse
                : [];

      console.log("Available hospitals count:", availableHospitals.length);

      // Keep only fields needed by the list. This reduces memory usage for large
      // responses such as the current 6,000+ hospital records.
      const listHospitals = availableHospitals.map((hospital: any) => ({
        hospitalPoolId: hospital?.hospitalPoolId,
        serialNo: hospital?.serialNo,
        name: hospital?.name || "Unnamed hospital",
        address: hospital?.address,
        districtId: hospital?.districtId,
        tnceraNo: hospital?.tnceraNo,
      }));

      setHospitals(listHospitals);

      if (!profileDistrict && listHospitals.length > 0) {
        setDistrict(listHospitals[0]?.districtId || "");
      }

      hasLoadedHospitals.current = true;
      setLoading(false);

      // Bucket loading is independent. The hospital list must never wait for it.
      await getBucketCount(proId);
    } catch (loadError: any) {
      console.log("Hospitals screen API error:", loadError);
      setError(loadError?.message || "Unable to load hospitals");
      setLoading(false);
    }
  }, [getBucketCount]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedHospitals.current) {
        loadHospitals();
        return;
      }

      if (proIdRef.current) {
        getBucketCount(proIdRef.current);
      }
    }, [getBucketCount, loadHospitals]),
  );

  const availableSlots = Math.max(0, MAX_SELECTION - bucketCount);

  const filteredHospitals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return hospitals;
    }

    return hospitals.filter((hospital) =>
      `${hospital.name || ""} ${hospital.address || ""} ${
        hospital.districtId || ""
      } ${hospital.tnceraNo || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [hospitals, search]);

  const isSelected = (hospital: any) => {
    return selectedHospitals.some(
      (item) => item.hospitalPoolId === hospital.hospitalPoolId,
    );
  };

  const handleSelect = (hospital: any) => {
    const selected = isSelected(hospital);

    if (selected) {
      setSelectedHospitals((current) =>
        current.filter(
          (item) => item.hospitalPoolId !== hospital.hospitalPoolId,
        ),
      );

      return;
    }

    if (availableSlots === 0) {
      return;
    }

    if (selectedHospitals.length >= availableSlots) {
      return;
    }

    setSelectedHospitals((current) => [...current, hospital]);
  };

  const handleDone = async () => {
    if (selectedHospitals.length === 0 || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const proId = proIdRef.current;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      await pickHospital({
        proId,
        hospitals: selectedHospitals.map((hospital) => ({
          hospitalPoolId: hospital.hospitalPoolId,
        })),
      });

      setSelectedHospitals([]);
      hasLoadedHospitals.current = false;

      navigation.navigate("Bucket");
    } catch (selectError: any) {
      console.log("Pick hospital error:", selectError);
      setError(selectError?.message || "Unable to add hospitals to bucket");
    } finally {
      setSaving(false);
    }
  };

  const renderHospital = ({ item: hospital }: { item: any }) => {
    const selected = isSelected(hospital);
    const disabled =
      !selected && selectedHospitals.length >= availableSlots;

    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 11,
          marginBottom: 12,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? "#2563EB" : "#EEF1F5",
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
              size={29}
              color="#2563EB"
            />
          </View>

          <View
            style={{
              flex: 1,
              marginLeft: 11,
              minWidth: 0,
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {String(hospital.name || "Unnamed hospital").replace(
                /\r?\n/g,
                " ",
              )}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 5,
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
                  flex: 1,
                  marginLeft: 3,
                  fontSize: 11,
                  color: "#6B7280",
                }}
              >
                {hospital.address ||
                  hospital.districtId ||
                  "Address unavailable"}
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
                name="document-text-outline"
                size={13}
                color="#7C3AED"
              />

              <Text
                numberOfLines={1}
                style={{
                  marginLeft: 4,
                  fontSize: 10,
                  color: "#6B7280",
                }}
              >
                TNCERA: {hospital.tnceraNo || "Not available"}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => handleSelect(hospital)}
          disabled={disabled}
          style={{
            marginTop: 10,
            height: 38,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected
              ? "#EAF2FF"
              : disabled
                ? "#E5E7EB"
                : "#173FD1",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {selected && (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color="#2563EB"
                style={{ marginRight: 5 }}
              />
            )}

            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: selected
                  ? "#2563EB"
                  : disabled
                    ? "#9CA3AF"
                    : "#fff",
              }}
            >
              {selected
                ? "Selected"
                : disabled
                  ? "Selection Full"
                  : "Select Hospital"}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  const listHeader = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 15,
        paddingBottom: 10,
      }}
    >
      <Ionicons name="location-outline" size={16} color="#2563EB" />

      <Text
        style={{
          marginLeft: 5,
          fontSize: 12,
          fontWeight: "600",
          color: "#374151",
        }}
      >
        Hospitals near {district || "your district"}
      </Text>

      <View style={{ flex: 1 }} />

      <Text
        style={{
          fontSize: 11,
          color: "#6B7280",
        }}
      >
        {filteredHospitals.length} found
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F7F9FC",
      }}
      edges={["top"]}
    >
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#EEF1F5",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 21,
                fontWeight: "800",
                color: "#111827",
              }}
            >
              Un-onboarded Hospitals
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Ionicons name="location-outline" size={13} color="#2563EB" />

              <Text
                style={{
                  marginLeft: 3,
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {district || "Location unavailable"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate("Bucket")}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "#EAF2FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="briefcase-outline" size={21} color="#2563EB" />

            {bucketCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  right: -2,
                  top: -2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: "800",
                  }}
                >
                  {bucketCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 15,
            height: 46,
            backgroundColor: "#F7F9FC",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 13,
            borderWidth: 1,
            borderColor: "#E8EBF0",
          }}
        >
          <Ionicons name="search-outline" size={19} color="#6B7280" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search hospitals..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            style={{
              flex: 1,
              marginLeft: 9,
              fontSize: 13,
              color: "#111827",
            }}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            paddingHorizontal: 30,
            paddingVertical: 50,
          }}
        >
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />

          <Text
            style={{
              marginTop: 12,
              fontSize: 15,
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Unable to load hospitals
          </Text>

          <Text
            style={{
              marginTop: 5,
              fontSize: 12,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            {error}
          </Text>

          <Pressable
            onPress={() => {
              hasLoadedHospitals.current = false;
              loadHospitals();
            }}
            style={{
              marginTop: 15,
              backgroundColor: "#173FD1",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 9,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="small" color="#173FD1" />
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            Loading hospitals...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item, index) =>
            String(item.hospitalPoolId || item.serialNo || index)
          }
          renderItem={renderHospital}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                paddingVertical: 60,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#EAF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="search-outline" size={28} color="#2563EB" />
              </View>

              <Text
                style={{
                  marginTop: 14,
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                No hospitals found
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                Try searching with a different hospital name.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom:
              25 + insets.bottom + (selectedHospitals.length > 0 ? 75 : 0),
          }}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews
        />
      )}

      {selectedHospitals.length > 0 && (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 12 + insets.bottom,
          }}
        >
          <Pressable
            onPress={handleDone}
            disabled={saving}
            style={{
              height: 50,
              borderRadius: 11,
              backgroundColor: saving ? "#9CA3AF" : "#173FD1",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {saving
                ? "Adding hospitals..."
                : `${selectedHospitals.length} / ${availableSlots} selected`}
            </Text>

            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {saving ? "Please wait" : "Done"}
            </Text>

            {!saving && (
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
