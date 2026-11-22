import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { isValidPhone } from "../../../domain/trip";
import { spacing } from "../../../theme";
import type { Technician, TechnicianRequest } from "../../../types";
import { Button, ErrorBanner, FormSheet, TextField } from "../../../ui/components";

type Props = {
  technician: Technician | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: TechnicianRequest) => void;
};

export default function TechnicianFormModal({ technician, saving, onClose, onSave }: Props) {
  const [fullName, setFullName] = useState(technician?.fullName ?? "");
  const [phone, setPhone] = useState(technician?.phone ?? "");
  const [qualification, setQualification] = useState(technician?.qualification ?? "");
  const [certificationNumber, setCertificationNumber] = useState(
    technician?.certificationNumber ?? "",
  );
  const [error, setError] = useState("");

  function submit() {
    if (!fullName.trim() || !phone.trim()) {
      setError("Enter the technician's name and mobile number.");
      return;
    }
    if (!isValidPhone(phone.trim())) {
      setError("Enter a mobile number with 10 to 13 digits.");
      return;
    }
    setError("");
    onSave({
      fullName: fullName.trim(),
      phone: phone.trim(),
      qualification: qualification.trim() || undefined,
      certificationNumber: certificationNumber.trim() || undefined,
    });
  }

  return (
    <FormSheet
      title={technician ? "Edit technician" : "Add technician"}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {error ? <ErrorBanner message={error} /> : null}
          <Button title="Save technician" loading={saving} onPress={submit} />
        </View>
      }
    >
      <TextField
        label="Full name *"
        value={fullName}
        onChangeText={setFullName}
        editable={!saving}
        autoCapitalize="words"
      />
      <TextField
        label="Mobile number *"
        value={phone}
        onChangeText={setPhone}
        editable={!saving}
        keyboardType="phone-pad"
      />
      <TextField
        label="Qualification"
        value={qualification}
        onChangeText={setQualification}
        editable={!saving}
        maxLength={100}
      />
      <TextField
        label="Certification number"
        value={certificationNumber}
        onChangeText={setCertificationNumber}
        editable={!saving}
        maxLength={50}
      />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.md },
});
