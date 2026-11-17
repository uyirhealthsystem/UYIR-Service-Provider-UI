import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getProHospitals } from "../../../api/hospitals";
import OnboardedCard from "../components/OnboardedCard";

export default function Onboarded({ navigation }: any) {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProHospitals();

      console.log("========== ONBOARDED HOSPITALS ==========");
      console.log("API response:", response);

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.hospitals)
          ? response.data.hospitals
          : [];

      console.log("Total hospitals:", data.length);

      const onboarded = data
        .filter((item: any) => item?.status === "ONBOARDED")
        .map((item: any) => normalizeHospital(item));

      console.log("Onboarded hospitals:", onboarded.length);

      setHospitals(onboarded);
    } catch (error: any) {
      console.log("Onboarded hospitals API error:", error);

      setError(error?.message || "Unable to load onboarded hospitals");
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHospitals();
    }, []),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return hospitals;
    }

    return hospitals.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query),
    );
  }, [hospitals, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 25 }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#171A2B",
                }}
              >
                Onboarded Hospitals
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  color: "#73798C",
                  marginTop: 3,
                }}
              >
                Hospitals you have successfully onboarded
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#EAF1FF",
                borderRadius: 9,
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#1747D1",
                }}
              >
                {filtered.length} Records
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginHorizontal: 16,
            height: 44,
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E1E5ED",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#7A849A",
              marginRight: 8,
            }}
          >
            ⌕
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search onboarded hospitals"
            placeholderTextColor="#9AA1B2"
            style={{
              flex: 1,
              fontSize: 12,
              color: "#171A2B",
              paddingVertical: 0,
            }}
          />
        </View>

        {loading ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: 70,
            }}
          >
            <ActivityIndicator color="#1747D1" />

            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#73798C",
              }}
            >
              Loading onboarded hospitals...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 30,
              paddingTop: 60,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#171A2B",
              }}
            >
              Unable to load hospitals
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: "#73798C",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {error}
            </Text>

            <Pressable
              onPress={loadHospitals}
              style={{
                marginTop: 15,
                backgroundColor: "#1747D1",
                borderRadius: 9,
                paddingHorizontal: 20,
                paddingVertical: 10,
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
        ) : filtered.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: 70,
              paddingHorizontal: 30,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#34394A",
              }}
            >
              No onboarded hospitals
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: "#8A91A2",
                marginTop: 5,
                textAlign: "center",
              }}
            >
              Successfully onboarded hospitals will appear here.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {filtered.map((item) => (
              <OnboardedCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate("ProviderDetails", {
                    item,
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeHospital(item: any) {
  const pool = item?.hospitalPool || {};
  const hospital = item?.hospital || {};

  const name =
    item?.hospitalName ||
    hospital?.hospitalName ||
    hospital?.name ||
    pool?.name ||
    item?.name ||
    "Hospital";

  const location = getHospitalLocation(item);

  const dateValue = item?.onboardedAt || item?.updatedAt || item?.createdAt;

  const tags: string[] = [];

  if (hospital?.hospitalType) {
    tags.push(hospital.hospitalType);
  }

  if (hospital?.hospitalInsured === true) {
    tags.push("Insured");
  }

  if (hospital?.facilities?.bedCapacity?.general !== undefined) {
    tags.push(`${hospital.facilities.bedCapacity.general} Beds`);
  }

  if (tags.length === 0) {
    tags.push("Hospital");
  }

  return {
    ...item,

    id: item?.proHospitalId || item?.hospitalId || item?.hospitalPoolId,

    name: String(name).replace(/\r?\n/g, " "),

    location: String(location).replace(/\r?\n/g, " "),

    tags,

    date: dateValue ? formatDate(dateValue) : "",

    status: "approved",
  };
}

function getHospitalLocation(item: any) {
  const pool = item?.hospitalPool || {};
  const hospital = item?.hospital || {};

  const address = item?.address || hospital?.address || pool?.address;

  if (typeof address === "string") {
    return address;
  }

  if (address && typeof address === "object") {
    return [
      address.addressLine,
      address.city,
      address.district,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return (
    hospital?.district ||
    pool?.districtId ||
    item?.districtId ||
    "Location unavailable"
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
