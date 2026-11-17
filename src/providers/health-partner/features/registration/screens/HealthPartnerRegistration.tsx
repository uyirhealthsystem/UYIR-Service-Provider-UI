import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../../auth/store";
import {
  createHealthPartner,
  getBlocks,
  getDistricts,
  getVillages,
} from "../../../api/healthPartner";

type Option = {
  id: string;
  name: string;
};

function getList(data: any): Option[] {
  const value = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return value.map((item: any) => ({
    id: String(item.id),
    name: String(item.name || item.title || item.label || item.id),
  }));
}

export default function HealthPartnerRegistration({ route }: any) {
  const { setUser } = useAuth();

  const accessToken = route.params?.accessToken;
  const refreshToken = route.params?.refreshToken;
  const userId = route.params?.sub;
  const role = String(route.params?.role || "HP").toUpperCase();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [villages, setVillages] = useState<Option[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [villageId, setVillageId] = useState("");

  const [picker, setPicker] = useState<"gender" | "district" | "block" | "village" | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDistricts();
  }, []);

  useEffect(() => {
    if (!districtId) {
      setBlocks([]);
      setBlockId("");
      setVillages([]);
      setVillageId("");
      return;
    }

    loadBlocks(districtId);
  }, [districtId]);

  useEffect(() => {
    if (!districtId || !blockId) {
      setVillages([]);
      setVillageId("");
      return;
    }

    loadVillages(districtId, blockId);
  }, [districtId, blockId]);

  const loadDistricts = async () => {
    try {
      setLoadingLocations(true);
      const response = await getDistricts();
      setDistricts(getList(response));
    } catch (loadError: any) {
      console.log("HP districts error:", loadError);
      setError(loadError?.message || "Unable to load districts");
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadBlocks = async (selectedDistrictId: string) => {
    try {
      setLoadingBlocks(true);
      setBlocks([]);
      setBlockId("");
      setVillages([]);
      setVillageId("");
      const response = await getBlocks(selectedDistrictId);
      setBlocks(getList(response));
    } catch (loadError: any) {
      console.log("HP blocks error:", loadError);
      setError(loadError?.message || "Unable to load blocks");
    } finally {
      setLoadingBlocks(false);
    }
  };

  const loadVillages = async (selectedDistrictId: string, selectedBlockId: string) => {
    try {
      setLoadingVillages(true);
      setVillages([]);
      setVillageId("");
      const response = await getVillages(selectedDistrictId, selectedBlockId);
      setVillages(getList(response));
    } catch (loadError: any) {
      console.log("HP villages error:", loadError);
      setError(loadError?.message || "Unable to load villages");
    } finally {
      setLoadingVillages(false);
    }
  };

  const selectedName = (items: Option[], id: string) =>
    items.find((item) => item.id === id)?.name || "Select";

  const choose = (value: string) => {
    if (picker === "gender") {
      setGender(value as "MALE" | "FEMALE" | "OTHER");
    }

    if (picker === "district") {
      setDistrictId(value);
    }

    if (picker === "block") {
      setBlockId(value);
    }

    if (picker === "village") {
      setVillageId(value);
    }

    setPicker(null);
  };

  const pickerItems: Option[] =
    picker === "gender"
      ? [
          { id: "MALE", name: "Male" },
          { id: "FEMALE", name: "Female" },
          { id: "OTHER", name: "Other" },
        ]
      : picker === "district"
        ? districts
        : picker === "block"
          ? blocks
          : villages;

  const pickerTitle =
    picker === "gender"
      ? "Select Gender"
      : picker === "district"
        ? "Select District"
        : picker === "block"
          ? "Select Block"
          : "Select Village";

  const submit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your mobile number");
      return;
    }

    if (!districtId) {
      setError("Please select a district");
      return;
    }

    if (blockId && !districtId) {
      setError("Please select a district first");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createHealthPartner({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(dateOfBirth.trim() ? { dateOfBirth: dateOfBirth.trim() } : {}),
        ...(gender ? { gender } : {}),
        ...(addressLine1.trim() ? { addressLine1: addressLine1.trim() } : {}),
        ...(addressLine2.trim() ? { addressLine2: addressLine2.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(state.trim() ? { state: state.trim() } : {}),
        ...(pincode.trim() ? { pincode: pincode.trim() } : {}),
        districtId,
        ...(blockId ? { blockId } : {}),
        ...(villageId ? { villageId } : {}),
        ...(profilePhotoUrl.trim() ? { profilePhotoUrl: profilePhotoUrl.trim() } : {}),
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
      });

      console.log("HP registration successful");

      setUser({
        id: userId,
        sub: userId,
        providerType: role,
        role,
        accessToken,
        refreshToken,
      });
    } catch (submitError: any) {
      console.log("HP registration error:", submitError);
      setError(submitError?.message || "Unable to create Health Partner profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#171A2B" }}>
          Create Health Partner Profile
        </Text>

        <Text style={{ marginTop: 7, color: "#73798C", lineHeight: 20 }}>
          Complete your profile to start using the Health Partner app.
        </Text>

        {error ? (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#FEECEC",
            }}
          >
            <Text style={{ color: "#DC2626" }}>{error}</Text>
          </View>
        ) : null}

        <Text style={labelStyle}>Full Name *</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter full name" style={inputStyle} />

        <Text style={labelStyle}>Mobile Number *</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Enter mobile number" keyboardType="phone-pad" maxLength={15} style={inputStyle} />

        <Text style={labelStyle}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" style={inputStyle} />

        <Text style={labelStyle}>Date of Birth</Text>
        <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" style={inputStyle} />

        <Text style={labelStyle}>Gender</Text>
        <SelectButton title={gender ? gender : "Select gender"} onPress={() => setPicker("gender")} />

        <Text style={labelStyle}>Address Line 1</Text>
        <TextInput value={addressLine1} onChangeText={setAddressLine1} placeholder="Enter address" style={inputStyle} />

        <Text style={labelStyle}>Address Line 2</Text>
        <TextInput value={addressLine2} onChangeText={setAddressLine2} placeholder="Enter address line 2" style={inputStyle} />

        <Text style={labelStyle}>City</Text>
        <TextInput value={city} onChangeText={setCity} placeholder="Enter city" style={inputStyle} />

        <Text style={labelStyle}>State</Text>
        <TextInput value={state} onChangeText={setState} placeholder="Enter state" style={inputStyle} />

        <Text style={labelStyle}>Pincode</Text>
        <TextInput value={pincode} onChangeText={setPincode} placeholder="Enter pincode" keyboardType="number-pad" maxLength={6} style={inputStyle} />

        <Text style={labelStyle}>District *</Text>
        <SelectButton
          title={loadingLocations ? "Loading districts..." : selectedName(districts, districtId)}
          disabled={loadingLocations}
          onPress={() => setPicker("district")}
        />

        <Text style={labelStyle}>Block</Text>
        <SelectButton
          title={loadingBlocks ? "Loading blocks..." : selectedName(blocks, blockId)}
          disabled={!districtId || loadingBlocks}
          onPress={() => setPicker("block")}
        />

        <Text style={labelStyle}>Village</Text>
        <SelectButton
          title={loadingVillages ? "Loading villages..." : selectedName(villages, villageId)}
          disabled={!blockId || loadingVillages}
          onPress={() => setPicker("village")}
        />

        <Text style={labelStyle}>Profile Photo URL (Optional)</Text>
        <TextInput
          value={profilePhotoUrl}
          onChangeText={setProfilePhotoUrl}
          placeholder="Enter profile photo URL"
          autoCapitalize="none"
          style={inputStyle}
        />

        <Text style={labelStyle}>Referral Code (Optional)</Text>
        <TextInput
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="Enter referral code"
          autoCapitalize="characters"
          style={inputStyle}
        />

        <Pressable
          onPress={submit}
          disabled={submitting}
          style={{
            marginTop: 24,
            backgroundColor: "#173FD1",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
              Create Profile
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
          <View style={{ maxHeight: "70%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 19, fontWeight: "800", color: "#171A2B" }}>{pickerTitle}</Text>
              <Pressable onPress={() => setPicker(null)}>
                <Text style={{ fontSize: 24, color: "#6B7280" }}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }}>
              {pickerItems.length === 0 ? (
                <Text style={{ paddingVertical: 20, color: "#6B7280" }}>No options available.</Text>
              ) : (
                pickerItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => choose(item.id)}
                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#EEF0F4" }}
                  >
                    <Text style={{ fontSize: 16, color: "#171A2B" }}>{item.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const labelStyle = {
  marginTop: 16,
  marginBottom: 7,
  fontSize: 13,
  fontWeight: "700" as const,
  color: "#374151",
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#E1E5EC",
  borderRadius: 12,
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
};

function SelectButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 1,
        borderColor: "#E1E5EC",
        borderRadius: 12,
        backgroundColor: disabled ? "#F1F3F7" : "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 14,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <Text style={{ color: title === "Select" || title.startsWith("Select ") ? "#9CA3AF" : "#171A2B" }}>
        {title}
      </Text>
    </Pressable>
  );
}
