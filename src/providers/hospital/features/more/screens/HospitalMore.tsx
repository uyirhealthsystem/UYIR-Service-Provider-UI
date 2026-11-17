import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../../auth/store";
import { C, MenuItem, Panel, Screen } from "../../../components/ui";
import { useHospitalStore } from "../../provider-state/store";
import { HOSPITAL_TYPES, labelOf } from "../../profile/constants";

/** Account hub: profile, reports, money, configuration. */
export default function HospitalMore({ navigation }: any) {
  const { logout } = useAuth();
  const { hospital } = useHospitalStore();
  const go = (s: string) => navigation.navigate(s);
  const a = hospital?.address || {};

  return (
    <Screen title="More" subtitle="Hospital account & settings">
      <View style={styles.card}>
        <View style={styles.logo}><Ionicons name="business" size={24} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={2}>{hospital?.hospitalName || "Your hospital"}</Text>
          <Text style={styles.sub} numberOfLines={1}>{[labelOf(HOSPITAL_TYPES, hospital?.hospitalType), a.city].filter(Boolean).join(" · ")}</Text>
          <Text style={styles.reg} numberOfLines={1}>Reg. {hospital?.registrationNumber || "—"}</Text>
        </View>
      </View>

      <Panel title="Hospital">
        <MenuItem icon="business-outline" title="Hospital profile" subtitle="Details, facilities, emergency, staff" onPress={() => go("HospitalProfile")} />
        <MenuItem icon="stats-chart-outline" title="Reports" subtitle="Appointments, emergencies, trends" onPress={() => go("HospitalReports")} last />
      </Panel>

      <Panel title="Finance">
        <MenuItem icon="receipt-outline" title="Billing & invoices" subtitle="Monthly platform commission" onPress={() => go("HospitalInvoices")} />
        <MenuItem icon="wallet-outline" title="Payout account" subtitle="Bank account for patient payments" tone="success" onPress={() => go("HospitalPayoutAccount")} last />
      </Panel>

      <Panel title="Doctors & bookings">
        <MenuItem icon="grid-outline" title="Seats" subtitle="Assign doctors, buy seats" onPress={() => go("HospitalAssign")} />
        <MenuItem icon="options-outline" title="Token limits" subtitle="Daily appointment caps per doctor" onPress={() => go("HospitalSlots")} last />
      </Panel>

      <Panel>
        <MenuItem
          icon="log-out-outline" title="Log out" tone="danger" last
          onPress={() => Alert.alert("Log out?", "You will stop receiving live emergency alerts on this device.", [
            { text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: logout },
          ])}
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.primary, borderRadius: 18, padding: 16, marginBottom: 14 },
  logo: { width: 52, height: 52, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  name: { color: "#fff", fontSize: 17, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: 2 },
  reg: { color: "rgba(255,255,255,0.65)", fontSize: 11.5, marginTop: 4 },
});
