import { useState } from "react";
import { Alert } from "react-native";

import { saveBankAccount } from "../../../api/payments";
import { spacing } from "../../../theme";
import { Banner, Button, Card, ErrorBanner, Field, Screen, ScreenHeader } from "../../../ui/components";

// POST /payments/bank upserts the single bank account used for withdrawals.
// The HP service has no "read bank account" endpoint, so the form always
// starts empty and saving replaces whatever was stored before.

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type Errors = Partial<Record<"name" | "account" | "confirm" | "ifsc" | "bank", string>>;

export default function BankDetails({ navigation }: any) {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!accountHolderName.trim()) next.name = "Enter the name exactly as on your bank account.";
    if (!/^\d{9,18}$/.test(accountNumber)) next.account = "Account numbers are 9 to 18 digits.";
    if (confirmNumber !== accountNumber) next.confirm = "Account numbers don't match.";
    if (!IFSC.test(ifscCode)) next.ifsc = "IFSC is 11 characters, like SBIN0001234.";
    if (!bankName.trim()) next.bank = "Enter your bank's name.";
    return next;
  };

  const save = async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setSaving(true);
      setServerError("");
      await saveBankAccount({
        accountHolderName: accountHolderName.trim(),
        accountNumber,
        ifscCode,
        bankName: bankName.trim(),
      });
      Alert.alert("Bank account saved", "Your withdrawals will be sent to this account.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setServerError(error?.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clear = (key: keyof Errors) => errors[key] && setErrors((prev) => ({ ...prev, [key]: undefined }));

  return (
    <Screen footer={<Button label="Save bank account" icon="shield-checkmark-outline" onPress={save} loading={saving} />}>
      <ScreenHeader title="Bank account" subtitle="Withdrawals from your wallet are sent here." onBack={() => navigation.goBack()} />

      <Banner
        tone="blue"
        icon="lock-closed-outline"
        message="For your security, saved details are not shown again. Saving replaces your previous account."
        style={{ marginBottom: spacing.lg }}
      />
      {serverError ? <ErrorBanner message={serverError} /> : null}

      <Card>
        <Field
          label="Account holder name"
          required
          icon="person-outline"
          value={accountHolderName}
          onChangeText={(t) => {
            setAccountHolderName(t);
            clear("name");
          }}
          placeholder="Name as per bank records"
          autoCapitalize="words"
          error={errors.name}
        />
        <Field
          label="Account number"
          required
          icon="card-outline"
          value={accountNumber}
          onChangeText={(t) => {
            setAccountNumber(t.replace(/\D/g, ""));
            clear("account");
          }}
          placeholder="Enter account number"
          keyboardType="number-pad"
          maxLength={18}
          secureTextEntry
          error={errors.account}
        />
        <Field
          label="Confirm account number"
          required
          icon="card-outline"
          value={confirmNumber}
          onChangeText={(t) => {
            setConfirmNumber(t.replace(/\D/g, ""));
            clear("confirm");
          }}
          placeholder="Re-enter account number"
          keyboardType="number-pad"
          maxLength={18}
          error={errors.confirm}
        />
        <Field
          label="IFSC code"
          required
          icon="business-outline"
          value={ifscCode}
          onChangeText={(t) => {
            setIfscCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            clear("ifsc");
          }}
          placeholder="SBIN0001234"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          error={errors.ifsc}
          hint="Printed on your passbook or cheque book."
        />
        <Field
          label="Bank name"
          required
          icon="library-outline"
          value={bankName}
          onChangeText={(t) => {
            setBankName(t);
            clear("bank");
          }}
          placeholder="e.g. State Bank of India"
          autoCapitalize="words"
          error={errors.bank}
        />
      </Card>
    </Screen>
  );
}
