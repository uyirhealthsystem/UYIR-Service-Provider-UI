import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DISTRICTS } from "../../../domain/districts";
import { AMBULANCE_TYPES } from "../../../domain/trip";
import { colors, spacing, typography } from "../../../theme";
import type { DriverProfileRequest } from "../../../types";
import { ChoiceChips, FormSheet, SelectField, TextField } from "../../../ui/components";

type Props = {
  values: DriverProfileRequest;
  onChange: (values: DriverProfileRequest) => void;
  editable: boolean;
};

export default function DriverFormFields({ values, onChange, editable }: Props) {
  const [pickingDistrict, setPickingDistrict] = useState(false);

  const set = <K extends keyof DriverProfileRequest>(key: K, value: DriverProfileRequest[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <View>
      <TextField
        label="Full name *"
        value={values.fullName}
        onChangeText={(value) => set("fullName", value)}
        editable={editable}
        autoCapitalize="words"
      />
      <TextField
        label="Mobile number *"
        value={values.phone}
        onChangeText={(value) => set("phone", value)}
        editable={editable}
        keyboardType="phone-pad"
      />
      <TextField
        label="Driving licence number *"
        value={values.licenseNumber}
        onChangeText={(value) => set("licenseNumber", value)}
        editable={editable}
        autoCapitalize="characters"
      />
      <TextField
        label="Vehicle registration number *"
        value={values.plateNumber}
        onChangeText={(value) => set("plateNumber", value)}
        editable={editable}
        autoCapitalize="characters"
        maxLength={15}
      />
      <SelectField
        label="District *"
        value={values.districtId}
        placeholder="Select district"
        onPress={() => setPickingDistrict(true)}
      />

      <Text style={styles.label}>Ambulance type *</Text>
      <ChoiceChips
        options={AMBULANCE_TYPES}
        value={values.ambulanceType}
        onChange={(value) => set("ambulanceType", value)}
      />

      {pickingDistrict ? (
        <FormSheet title="Select district" onClose={() => setPickingDistrict(false)}>
          {DISTRICTS.map((district) => (
            <Pressable
              key={district}
              onPress={() => {
                set("districtId", district);
                setPickingDistrict(false);
              }}
              accessibilityRole="button"
              style={styles.district}
            >
              <Text style={typography.label}>{district}</Text>
            </Pressable>
          ))}
        </FormSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: spacing.sm },
  district: {
    minHeight: 48,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
