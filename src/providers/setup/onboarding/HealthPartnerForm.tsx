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

import { useAuth } from "../../../auth/store";
import { createHealthPartner } from "../../health-partner/api/healthPartner";
import { healthPartnerApi } from "../../health-partner/api/client";

type Option = {
  id: string;
  name: string;
};

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Option[];
  disabled?: boolean;
  onChange: (option: Option) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find((item) => item.id === value);

  return (
    <>
      <Text style={{ marginTop: 16, marginBottom: 7, color: "#374151" }}>
        {label}
      </Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderColor: "#E1E5EC",
          borderRadius: 12,
          paddingHorizontal: 15,
          justifyContent: "center",
          backgroundColor: disabled ? "#F3F4F6" : "#FFFFFF",
        }}
      >
        <Text style={{ color: selected ? "#111827" : "#9CA3AF" }}>
          {selected?.name || placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide">
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              maxHeight: "65%",
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 14 }}>
              Select {label}
            </Text>

            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F1F5F9",
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#111827" }}>
                    {option.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function getArray(data: any): Option[] {
  const value = Array.isArray(data) ? data : data?.data;
  if (!Array.isArray(value)) return [];

  return value.map((item: any) => ({
    id: String(item.id),
    name: String(item.name),
  }));
}

export default function HealthPartnerForm({ route }: any) {
  const { setUser } = useAuth();

  const accessToken = route.params?.accessToken;
  const refreshToken = route.params?.refreshToken;
  const role = String(route.params?.role || "HP").toUpperCase();
  const sub = route.params?.sub;

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

  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [villages, setVillages] = useState<Option[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [villageId, setVillageId] = useState("");

  const [loadingLocations, setLoadingLocations] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!blockId || !districtId) {
      setVillages([]);
      setVillageId("");
      return;
    }

    loadVillages(districtId, blockId);
  }, [districtId, blockId]);

  const loadDistricts = async () => {
    try {
      setLoadingLocations(true);
      const data = await healthPartnerApi("/districts");
      setDistricts(getArray(data));
    } catch (locationError: any) {
      console.log("District API error:", locationError);
      setError(locationError?.message || "Unable to load districts");
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadBlocks = async (selectedDistrictId: string) => {
    try {
      setBlocks([]);
      setVillages([]);
      setBlockId("");
      setVillageId("");

      const data = await healthPartnerApi(
        `/districts/${selectedDistrictId}/blocks`,
      );
      setBlocks(getArray(data));
    } catch (locationError: any) {
      console.log("Block API error:", locationError);
      setError(locationError?.message || "Unable to load blocks");
    }
  };

  const loadVillages = async (
    selectedDistrictId: string,
    selectedBlockId: string,
  ) => {
    try {
      setVillages([]);
      setVillageId("");

      const data = await healthPartnerApi(
        `/districts/${selectedDistrictId}/blocks/${selectedBlockId}/villages`,
      );
      setVillages(getArray(data));
    } catch (locationError: any) {
      console.log("Village API error:", locationError);
      setError(locationError?.message || "Unable to load villages");
    }
  };

  const submit = async () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!phone.trim()) {
      setError("Mobile number is required");
      return;
    }

    if (!districtId) {
      setError("Please select a district");
      return;
    }

    try {
      setSaving(true);
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
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
      });

      setUser({
        id: sub,
        sub,
        providerType: role,
        role,
        accessToken,
        refreshToken,
      });
    } catch (saveError: any) {
      console.log("HP registration error:", saveError);
      setError(saveError?.message || "Unable to create Health Partner profile");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E1E5EC",
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 52,
    fontSize: 15,
    color: "#111827",
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}>
          Create Health Partner Profile
        </Text>

        <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 21 }}>
          Complete your profile to start using the Health Partner app.
        </Text>

        <Text style={{ marginTop: 24, fontWeight: "700", color: "#374151" }}>
          Full Name *
        </Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter full name"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Mobile Number *
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Date of Birth
        </Text>
        <TextInput
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          style={inputStyle}
        />

        <SelectField
          label="Gender"
          value={gender}
          placeholder="Select gender"
          options={[
            { id: "MALE", name: "Male" },
            { id: "FEMALE", name: "Female" },
            { id: "OTHER", name: "Other" },
          ]}
          onChange={(option) =>
            setGender(option.id as "MALE" | "FEMALE" | "OTHER")
          }
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Address Line 1
        </Text>
        <TextInput
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholder="House / street"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Address Line 2
        </Text>
        <TextInput
          value={addressLine2}
          onChangeText={setAddressLine2}
          placeholder="Area / landmark"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          City
        </Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          State
        </Text>
        <TextInput
          value={state}
          onChangeText={setState}
          placeholder="State"
          style={inputStyle}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Pincode
        </Text>
        <TextInput
          value={pincode}
          onChangeText={setPincode}
          placeholder="Pincode"
          keyboardType="number-pad"
          maxLength={6}
          style={inputStyle}
        />

        <SelectField
          label="District *"
          value={districtId}
          placeholder={loadingLocations ? "Loading districts..." : "Select district"}
          options={districts}
          disabled={loadingLocations}
          onChange={(option) => setDistrictId(option.id)}
        />

        <SelectField
          label="Block"
          value={blockId}
          placeholder={districtId ? "Select block" : "Select district first"}
          options={blocks}
          disabled={!districtId}
          onChange={(option) => setBlockId(option.id)}
        />

        <SelectField
          label="Village"
          value={villageId}
          placeholder={blockId ? "Select village" : "Select block first"}
          options={villages}
          disabled={!blockId}
          onChange={(option) => setVillageId(option.id)}
        />

        <Text style={{ marginTop: 16, fontWeight: "700", color: "#374151" }}>
          Referral Code
        </Text>
        <TextInput
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="Enter referral code (optional)"
          autoCapitalize="characters"
          style={inputStyle}
        />

        {error ? (
          <Text style={{ marginTop: 14, color: "#DC2626", lineHeight: 20 }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={saving}
          style={{
            marginTop: 24,
            minHeight: 54,
            borderRadius: 12,
            backgroundColor: "#173FD1",
            alignItems: "center",
            justifyContent: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
              Create Profile
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
