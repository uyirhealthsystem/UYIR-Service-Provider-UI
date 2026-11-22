import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getHospitalById } from "../../../api/onboarding";
import { optionLabel } from "../../../ui/format";

export default function ProviderDetails({ navigation, route }: any) {
  const provider = route.params?.item;
  // Always re-read the hospital the onboarding created: the PRO service row only
  // holds its id, and the hospital may have been edited since the list loaded.
  const [fresh, setFresh] = useState<any>(null);
  const [loadingHospital, setLoadingHospital] = useState(!!provider?.hospitalId);
  useEffect(() => {
    if (!provider?.hospitalId) return;
    let cancelled = false;
    getHospitalById(provider.hospitalId)
      .then((record) => { if (!cancelled) setFresh(record); })
      .catch((e) => console.log("Hospital details lookup failed:", e?.message))
      .finally(() => { if (!cancelled) setLoadingHospital(false); });
    return () => { cancelled = true; };
  }, [provider?.hospitalId]);

  if (!provider) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F5F7FB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#73798C",
            fontSize: 13,
          }}
        >
          Hospital details not found
        </Text>
      </SafeAreaView>
    );
  }

  const hospital = fresh || provider?.hospital || {};

  const address = hospital?.address || provider?.address || {};

  const contactDetails =
    hospital?.contactDetails || provider?.contactDetails || {};

  const facilities = hospital?.facilities || provider?.facilities || {};

  const bedCapacity = facilities?.bedCapacity || {};

  const services = Array.isArray(provider?.tags) ? provider.tags : [];

  const hospitalType = optionLabel(
    hospital?.hospitalType || provider?.hospitalType || "Hospital",
  );

  const hospitalName =
    hospital?.hospitalName || provider?.name || hospital?.name || "Hospital";

  // districtId is a UUID, so it is never shown as a place.
  const district = loadingHospital
    ? "Loading…"
    : typeof address === "object"
      ? address?.district || address?.city || "Address not available"
      : address || "Address not available";

  const coordinates = Array.isArray(address?.location?.coordinates) ? address.location.coordinates : null;
  const claimText = hospital?.claimed
    ? "Claimed by the hospital"
    : hospital?.claimCodeSentTo
      ? `Claim code sent to ${hospital.claimCodeSentTo}`
      : hospital?.hospitalName
        ? "Not claimed yet"
        : "";

  const phone =
    contactDetails?.phone ||
    provider?.phone ||
    hospital?.phone ||
    "Not available";

  const email =
    contactDetails?.email ||
    provider?.email ||
    hospital?.email ||
    "Not available";

  const registrationNumber =
    provider?.registrationNumber ||
    hospital?.registrationNumber ||
    "Not available";

  const generalBeds =
    bedCapacity?.general !== undefined ? `${bedCapacity.general}` : null;

  const icuBeds = bedCapacity?.icu !== undefined ? `${bedCapacity.icu}` : null;

  const nicuBeds =
    bedCapacity?.nicu !== undefined ? `${bedCapacity.nicu}` : null;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F5F7FB",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        {/* Header */}

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E4E7ED",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#171A2B" />
          </Pressable>

          <View
            style={{
              marginLeft: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#171A2B",
              }}
            >
              Hospital Details
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: "#73798C",
                marginTop: 2,
              }}
            >
              Onboarding information
            </Text>
          </View>
        </View>

        {/* Hospital Header */}

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E4E7ED",
            padding: 16,
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
                width: 52,
                height: 52,
                borderRadius: 13,
                backgroundColor: "#EAF1FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="business-outline" size={25} color="#1747D1" />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#171A2B",
                }}
              >
                {hospitalName}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: "#73798C",
                  marginTop: 4,
                }}
              >
                {hospitalType}
              </Text>
            </View>
          </View>

          {/* Status */}

          <View
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: "#EAF8F0",
              borderRadius: 7,
              paddingHorizontal: 9,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: "#16804D",
              }}
            >
              ONBOARDED
            </Text>
          </View>
        </View>

        {/* Basic Information */}

        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 9,
            fontSize: 13,
            fontWeight: "700",
            color: "#171A2B",
          }}
        >
          Basic Information
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E4E7ED",
            padding: 14,
          }}
        >
          {loadingHospital ? <ActivityIndicator color="#1747D1" style={{ marginBottom: 12 }} /> : null}

          <InfoRow title="Location" value={formatAddress(address, district)} />

          {coordinates ? (
            <InfoRow title="Map coordinates" value={`${Number(coordinates[1]).toFixed(5)}, ${Number(coordinates[0]).toFixed(5)}`} />
          ) : null}

          {claimText ? <InfoRow title="Hospital account" value={claimText} /> : null}

          <InfoRow title="Registration Number" value={registrationNumber} />

          <InfoRow title="Phone" value={phone} />

          <InfoRow title="Email" value={email} last />
        </View>

        {/* Bed Capacity */}

        {(generalBeds || icuBeds || nicuBeds) && (
          <>
            <Text
              style={{
                marginHorizontal: 16,
                marginTop: 20,
                marginBottom: 9,
                fontSize: 13,
                fontWeight: "700",
                color: "#171A2B",
              }}
            >
              Bed Capacity
            </Text>

            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E4E7ED",
                padding: 14,
                flexDirection: "row",
                gap: 8,
              }}
            >
              {generalBeds && (
                <CapacityCard title="General" value={generalBeds} />
              )}

              {icuBeds && <CapacityCard title="ICU" value={icuBeds} />}

              {nicuBeds && <CapacityCard title="NICU" value={nicuBeds} />}
            </View>
          </>
        )}

        {/* Services */}

        {services.length > 0 && (
          <>
            <Text
              style={{
                marginHorizontal: 16,
                marginTop: 20,
                marginBottom: 9,
                fontSize: 13,
                fontWeight: "700",
                color: "#171A2B",
              }}
            >
              Services
            </Text>

            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E4E7ED",
                padding: 14,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 7,
              }}
            >
              {services.map((service: string, index: number) => (
                <View
                  key={`${service}-${index}`}
                  style={{
                    backgroundColor: "#F1F4F9",
                    borderRadius: 6,
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "600",
                      color: "#596174",
                    }}
                  >
                    {service}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Contact Details */}

        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 9,
            fontSize: 13,
            fontWeight: "700",
            color: "#171A2B",
          }}
        >
          Contact Details
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E4E7ED",
            padding: 14,
          }}
        >
          <InfoRow title="Phone" value={phone} />

          <InfoRow title="Email" value={email} />

          <InfoRow
            title="Website"
            value={
              contactDetails?.website || provider?.website || "Not available"
            }
            last
          />
        </View>

        {/* Onboarding */}

        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 9,
            fontSize: 13,
            fontWeight: "700",
            color: "#171A2B",
          }}
        >
          Onboarding
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E4E7ED",
            padding: 14,
          }}
        >
          <InfoRow
            title="Onboarded Date"
            value={provider?.date || "Not available"}
          />

          <InfoRow title="Status" value="ONBOARDED" />

          <InfoRow
            title="Hospital ID"
            value={
              provider?.hospitalId ||
              provider?.proHospitalId ||
              provider?.hospitalPoolId ||
              "Not available"
            }
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  title,
  value,
  last = false,
}: {
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        marginBottom: last ? 0 : 14,
        paddingBottom: last ? 0 : 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#EEF0F4",
      }}
    >
      <Text
        style={{
          fontSize: 9,
          color: "#8A91A2",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#34394A",
          marginTop: 4,
        }}
      >
        {value || "Not available"}
      </Text>
    </View>
  );
}

function CapacityCard({ title, value }: { title: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F5F7FB",
        borderRadius: 9,
        padding: 10,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 9,
          color: "#73798C",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: "#1747D1",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatAddress(address: any, fallback: string) {
  if (typeof address === "string") {
    return address;
  }

  if (address && typeof address === "object") {
    const value = [
      address.addressLine,
      address.city,
      address.district,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    if (value) {
      return value;
    }
  }

  return fallback || "Location unavailable";
}
