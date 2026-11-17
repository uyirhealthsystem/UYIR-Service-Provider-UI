import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { completeAppointment } from "../../../api/hospital";
import FollowUpForm, { type FollowUpValue } from "../../../components/FollowUpForm";
import { Banner, Button, C, Card, ErrorText, Row, Screen } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { fmtDateTime } from "../../../utils/format";

/** Close a visit as COMPLETED, optionally asking the patient to come back (one API call). */
export default function HospitalMarkComplete({ navigation, route }: any) {
  const id = route.params?.appointmentId ?? route.params?.appointment?.id;
  const { appointments, reload } = useHospitalData();
  const a = appointments.find((x) => x.id === id);

  const [wantFollowUp, setWantFollowUp] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUpValue>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!id) { setError("Appointment ID is missing."); return; }
    setSaving(true); setError("");
    try {
      await completeAppointment(id, wantFollowUp ? followUp : undefined);
      await reload();
      Alert.alert("Appointment completed", wantFollowUp ? "Marked complete and the follow-up request was sent to the patient." : "The visit has been marked complete.");
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message || "Unable to complete this appointment.");
    } finally { setSaving(false); }
  };

  return (
    <Screen
      title="Mark as completed" onBack={() => navigation.goBack()}
      footer={<Button variant="success" icon="checkmark-circle" title="Complete appointment" loading={saving} onPress={submit} />}
    >
      {a ? (
        <Card>
          <Text style={styles.name}>{a.patientName}</Text>
          <View style={{ marginTop: 6 }}>
            <Row label="Doctor" value={a.doctorName} />
            <Row label="When" value={fmtDateTime(a.dateTime)} />
            <Row label="Token" value={a.token} />
          </View>
        </Card>
      ) : <Banner tone="gray" text="Loading appointment…" />}

      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sTitle}>Ask for a follow-up visit</Text>
            <Text style={styles.sSub}>The patient can then book a return visit in the follow-up window.</Text>
          </View>
          <Switch value={wantFollowUp} onValueChange={setWantFollowUp} trackColor={{ true: C.primary, false: "#CBD5E1" }} thumbColor="#fff" />
        </View>
        {wantFollowUp ? <View style={{ marginTop: 14 }}><FollowUpForm onChange={setFollowUp} /></View> : null}
      </Card>
      <ErrorText text={error} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 17, fontWeight: "800", color: C.ink },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  sSub: { fontSize: 12.5, color: C.muted, marginTop: 3, lineHeight: 17 },
});
