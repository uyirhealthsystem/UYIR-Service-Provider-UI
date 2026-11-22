import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { validateDriverProfile } from "../../../domain/trip";
import { spacing } from "../../../theme";
import type { DriverProfile, DriverProfileRequest } from "../../../types";
import { Button, ErrorBanner, FormSheet } from "../../../ui/components";
import DriverFormFields from "./DriverFormFields";

type Props = {
  profile: DriverProfile;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (data: DriverProfileRequest) => void;
};

export default function ProfileFormModal({ profile, saving, error, onClose, onSave }: Props) {
  const [values, setValues] = useState<DriverProfileRequest>({
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    licenseNumber: profile.licenseNumber,
    plateNumber: profile.plateNumber,
    ambulanceType: profile.ambulanceType,
    districtId: profile.districtId,
  });
  const [validationError, setValidationError] = useState("");
  const message = validationError || error;

  function submit() {
    const problem = validateDriverProfile(values);
    setValidationError(problem ?? "");
    if (problem) return;
    onSave({
      ...values,
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      licenseNumber: values.licenseNumber.trim(),
      plateNumber: values.plateNumber.trim(),
    });
  }

  return (
    <FormSheet
      title="Edit details"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {message ? <ErrorBanner message={message} /> : null}
          <Button title="Save changes" loading={saving} onPress={submit} />
        </View>
      }
    >
      <DriverFormFields values={values} onChange={setValues} editable={!saving} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.md },
});
