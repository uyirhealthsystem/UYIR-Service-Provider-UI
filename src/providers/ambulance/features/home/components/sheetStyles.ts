import { StyleSheet } from "react-native";

import { colors, radius, shadow, spacing } from "../../../theme";

export const sheetStyles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadow.floating,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  grow: { flex: 1 },
});
