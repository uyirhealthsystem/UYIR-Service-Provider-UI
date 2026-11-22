import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import type { StatusTone } from "../domain/trip";
import { colors, radius, shadow, spacing, typography } from "../theme";

export type IconName = keyof typeof Ionicons.glyphMap;

const TONES: Record<StatusTone, { background: string; foreground: string }> = {
  neutral: { background: colors.surfaceMuted, foreground: colors.textSecondary },
  info: { background: colors.blueSoft, foreground: colors.blue },
  success: { background: colors.greenSoft, foreground: colors.green },
  warning: { background: colors.amberSoft, foreground: colors.amber },
  danger: { background: colors.redSoft, foreground: colors.red },
};

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  const { background, foreground } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.badgeText, { color: foreground }]}>{label}</Text>
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={typography.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={typography.heading} accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "dangerSoft";

const BUTTON_STYLES: Record<
  ButtonVariant,
  { background: string; foreground: string; border: string }
> = {
  primary: { background: colors.blue, foreground: colors.white, border: colors.blue },
  secondary: { background: colors.surface, foreground: colors.text, border: colors.border },
  danger: { background: colors.red, foreground: colors.white, border: colors.red },
  dangerSoft: { background: colors.redSoft, foreground: colors.red, border: colors.redSoft },
};

export function Button({
  title,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  compact = false,
  onPress,
  style,
}: {
  title: string;
  icon?: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { background, foreground, border } = BUTTON_STYLES[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.buttonCompact : null,
        { backgroundColor: background, borderColor: border },
        pressed ? styles.pressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 19} color={foreground} /> : null}
          <Text numberOfLines={1} style={[styles.buttonText, { color: foreground }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null, style]}
    >
      <Ionicons name={icon} size={21} color={color} />
    </Pressable>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last ? null : styles.infoRowDivider]}>
      <Ionicons name={icon} size={19} color={colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.muted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={colors.red} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = "default",
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, editable ? null : styles.inputDisabled]}
      />
    </View>
  );
}

export function SelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        style={[styles.input, styles.select]}
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.chip, selected ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FormSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={typography.heading} accessibilityRole="header">
              {title}
            </Text>
            <IconButton icon="close" label="Close" onPress={onClose} color={colors.muted} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    ...shadow.card,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenSubtitle: { ...typography.body, marginTop: 2 },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 44, paddingHorizontal: spacing.md },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  pressed: { opacity: 0.8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLabel: { ...typography.body, flexShrink: 0 },
  infoValue: { ...typography.label, flex: 1, textAlign: "right" },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.heading, textAlign: "center" },
  emptyMessage: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { ...typography.body, color: colors.red, flex: 1 },
  field: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.label, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: colors.surfaceMuted, color: colors.muted },
  select: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectValue: { color: colors.text, fontSize: 15 },
  selectPlaceholder: { color: colors.muted, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextSelected: { color: colors.blue },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16,28,45,0.45)",
  },
  sheet: {
    maxHeight: "90%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sheetFooter: { paddingTop: spacing.sm },
});
