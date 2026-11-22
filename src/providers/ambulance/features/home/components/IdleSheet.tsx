import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../theme";
import { Button } from "../../../ui/components";
import { sheetStyles } from "./sheetStyles";

type Props = {
  online: boolean;
  loading: boolean;
  onGoOnline: () => void;
};

export default function IdleSheet({ online, loading, onGoOnline }: Props) {
  return (
    <View style={sheetStyles.sheet}>
      <View style={styles.row}>
        <View style={[styles.icon, online ? styles.iconOnline : null]}>
          <MaterialCommunityIcons
            name={online ? "radar" : "power-sleep"}
            size={24}
            color={online ? colors.green : colors.muted}
          />
        </View>
        <View style={sheetStyles.grow}>
          <Text style={typography.heading}>
            {online ? "Waiting for bookings" : "You are offline"}
          </Text>
          <Text style={typography.body}>
            {online
              ? "New requests will appear here automatically."
              : "Go online to receive booking requests."}
          </Text>
        </View>
      </View>

      {online ? null : (
        <Button
          title="Go online"
          icon="power"
          loading={loading}
          onPress={onGoOnline}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOnline: { backgroundColor: colors.greenSoft },
  action: { marginTop: spacing.lg },
});
