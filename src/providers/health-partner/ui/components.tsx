import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow, spacing, typography } from "../theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export type Tone = "brand" | "blue" | "green" | "amber" | "red" | "violet" | "neutral";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  brand: { fg: colors.brand, bg: colors.brandSoft },
  blue: { fg: colors.blue, bg: colors.blueSoft },
  green: { fg: colors.green, bg: colors.greenSoft },
  amber: { fg: colors.amber, bg: colors.amberSoft },
  red: { fg: colors.red, bg: colors.redSoft },
  violet: { fg: colors.violet, bg: colors.violetSoft },
  neutral: { fg: colors.textSecondary, bg: colors.surfaceMuted },
};

export const toneColors = (tone: Tone) => TONES[tone];

// ---------------------------------------------------------------- layout

/**
 * Page shell: safe area (top only - tab bar / home indicator handle the
 * bottom), scroll, optional pull-to-refresh, keyboard avoidance for forms.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  footer,
  contentStyle,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Pinned below the scroll area (primary form action). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ padding: spacing.xl, paddingBottom: spacing.xxl * 2 }, contentStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md + insets.bottom,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Title block for pushed (stack) screens: back button + title + subtitle. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 42 }}>
        {onBack ? <HeaderIconButton icon="arrow-back" label="Go back" onPress={onBack} /> : <View />}
        {right}
      </View>
      <Text style={[typography.title, { marginTop: onBack ? spacing.lg : 0 }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[typography.body, { marginTop: spacing.xs }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function LoadingView({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.md }}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- surfaces

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
}) {
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.lg : 0,
    overflow: padded ? undefined : "hidden",
    ...shadow.card,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, style, pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] }]}
    >
      {children}
    </Pressable>
  );
}

export function SectionHeader({
  title,
  caption,
  actionLabel,
  onAction,
}: {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: spacing.md, marginTop: spacing.xl }}>
      <View style={{ flex: 1 }}>
        <Text style={typography.heading}>{title}</Text>
        {caption ? <Text style={[typography.caption, { marginTop: 2 }]}>{caption}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 13 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A tappable row inside a padded=false Card: icon, title, subtitle, chevron. */
export function ListRow({
  icon,
  tone = "brand",
  title,
  subtitle,
  right,
  onPress,
  last,
  destructive,
}: {
  icon: IconName;
  tone?: Tone;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
      })}
    >
      <IconBadge icon={icon} tone={destructive ? "red" : tone} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.label, destructive && { color: colors.red }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

/** Label / value line for detail screens. */
export function DetailRow({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.lg,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
      }}
    >
      <Text style={typography.body}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text style={[typography.label, { flexShrink: 1, textAlign: "right" }]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function StatTile({
  label,
  value,
  icon,
  tone = "brand",
  hint,
  onPress,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: Tone;
  hint?: string;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <IconBadge icon={icon} tone={tone} size={34} />
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
      </View>
      <Text style={{ marginTop: spacing.md, fontSize: 22, fontWeight: "800", color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text style={{ marginTop: 2, fontSize: 11, color: TONES[tone].fg, fontWeight: "600" }} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------- small parts

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "light";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.brand, fg: colors.white, border: colors.brand },
    secondary: { bg: colors.brandSoft, fg: colors.brand, border: colors.brandSoft },
    danger: { bg: colors.redSoft, fg: colors.red, border: colors.redSoft },
    ghost: { bg: "transparent", fg: colors.textSecondary, border: colors.border },
    /** White button for use on the brand-coloured hero cards. */
    light: { bg: colors.white, fg: colors.brandDark, border: colors.white },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        {
          minHeight: compact ? 40 : 52,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
          borderRadius: radius.md,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={palette.fg} /> : null}
          <Text style={{ color: palette.fg, fontSize: compact ? 13 : 15, fontWeight: "700" }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Pill({ label, tone = "neutral", icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { fg, bg } = TONES[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

export function IconBadge({ icon, tone = "brand", size = 44 }: { icon: IconName; tone?: Tone; size?: number }) {
  const { fg, bg } = TONES[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={size * 0.48} color={fg} />
    </View>
  );
}

export function Avatar({ label, size = 56, onDark }: { label: string; size?: number; onDark?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onDark ? "rgba(255,255,255,0.18)" : colors.brandSoft,
      }}
    >
      <Text style={{ color: onDark ? colors.white : colors.brand, fontWeight: "800", fontSize: size * 0.36 }}>{label}</Text>
    </View>
  );
}

/** Horizontal chip row for filters. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? colors.brand : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.brand : colors.border,
            }}
          >
            <Text style={{ color: active ? colors.white : colors.textSecondary, fontSize: 13, fontWeight: "700" }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Two-way segmented switch (e.g. Rewards / Withdrawals). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              height: 38,
              borderRadius: radius.sm + 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? colors.surface : "transparent",
              ...(active ? shadow.card : null),
            }}
          >
            <Text style={{ color: active ? colors.text : colors.muted, fontWeight: "700", fontSize: 13 }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl }}>
      <IconBadge icon={icon} size={64} />
      <Text style={[typography.heading, { marginTop: spacing.lg, textAlign: "center" }]}>{title}</Text>
      <Text style={[typography.body, { marginTop: spacing.xs, textAlign: "center" }]}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} compact style={{ marginTop: spacing.lg }} /> : null}
    </View>
  );
}

export function Banner({
  message,
  tone = "red",
  icon,
  actionLabel,
  onAction,
  style,
}: {
  message: string;
  tone?: Tone;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { fg, bg } = TONES[tone];
  return (
    <View
      accessibilityRole={tone === "red" ? "alert" : undefined}
      style={[{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: bg, borderRadius: radius.md, padding: spacing.md }, style]}
    >
      <Ionicons name={icon || (tone === "red" ? "alert-circle" : "information-circle")} size={18} color={fg} />
      <Text style={{ flex: 1, color: fg, fontSize: 13, lineHeight: 18 }}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={{ color: fg, fontWeight: "800", fontSize: 13 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Banner message={message} tone="red" actionLabel={onRetry ? "Retry" : undefined} onAction={onRetry} style={{ marginBottom: spacing.md }} />;
}

/** Small square button for headers (back, notifications, ...). */
export function HeaderIconButton({
  icon,
  onPress,
  onDark,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  onDark?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onDark ? "rgba(255,255,255,0.16)" : colors.surface,
        borderWidth: onDark ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={onDark ? colors.white : colors.text} />
    </Pressable>
  );
}

/** Numbered "how it works" list. */
export function Steps({ items }: { items: { title: string; detail?: string }[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.title} style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.brandSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.brand, fontWeight: "800", fontSize: 13 }}>{index + 1}</Text>
            </View>
            {index < items.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 14, backgroundColor: colors.brandSoft }} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: index < items.length - 1 ? spacing.lg : 0, paddingTop: 4 }}>
            <Text style={typography.label}>{item.title}</Text>
            {item.detail ? <Text style={[typography.caption, { marginTop: 2, lineHeight: 17 }]}>{item.detail}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- referral code

/** The brand hero card showing the HP's referral code with a share button. */
export function ReferralCodeCard({
  code,
  message,
  caption = "Share this code. You earn a reward for every successful referral.",
  shareLabel = "Share code",
}: {
  code?: string | null;
  /** Text placed in the share sheet. */
  message: string;
  caption?: string;
  shareLabel?: string;
}) {
  const hasCode = !!code && code !== "-";
  const share = async () => {
    if (!hasCode) return;
    try {
      await Share.share({ message });
    } catch (error) {
      console.log("HP share error:", error);
    }
  };

  return (
    <View style={{ backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl, overflow: "hidden", ...shadow.card }}>
      {/* soft decorative circles */}
      <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, right: -60, top: -70, backgroundColor: "rgba(255,255,255,0.08)" }} />
      <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, right: 30, bottom: -70, backgroundColor: "rgba(255,255,255,0.06)" }} />

      <Text style={[typography.overline, { color: colors.brandOnDark }]}>YOUR REFERRAL CODE</Text>
      <Text
        selectable
        accessibilityLabel={hasCode ? `Referral code ${String(code).split("").join(" ")}` : "Referral code not available"}
        style={{ marginTop: spacing.sm, color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: 3 }}
      >
        {hasCode ? code : "------"}
      </Text>
      <Text style={{ marginTop: spacing.sm, color: colors.brandOnDark, fontSize: 13, lineHeight: 19 }}>{caption}</Text>
      <Button label={shareLabel} icon="share-social-outline" variant="light" onPress={share} disabled={!hasCode} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

// ---------------------------------------------------------------- forms

export function Field({
  label,
  required,
  error,
  hint,
  icon,
  style,
  ...input
}: TextInputProps & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: input.multiline ? "flex-start" : "center",
          minHeight: 50,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.border,
          borderRadius: radius.md,
          backgroundColor: input.editable === false ? colors.surfaceMuted : colors.surface,
          paddingHorizontal: 14,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10, marginTop: input.multiline ? 14 : 0 }} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          {...input}
          style={[
            { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
            input.multiline && { minHeight: 110, textAlignVertical: "top" },
            style,
          ]}
        />
      </View>
      {error ? (
        <Text style={{ marginTop: 5, color: colors.red, fontSize: 12 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ marginTop: 5, color: colors.muted, fontSize: 12 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Looks like a Field, opens an OptionSheet. */
export function SelectField({
  label,
  required,
  value,
  placeholder = "Select",
  onPress,
  disabled,
  loading,
  error,
  hint,
  icon,
}: {
  label: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ disabled: !!(disabled || loading) }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 50,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.border,
          borderRadius: radius.md,
          backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
          paddingHorizontal: 14,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10 }} /> : null}
        <Text style={{ flex: 1, fontSize: 15, color: value ? colors.text : colors.muted }} numberOfLines={1}>
          {loading ? "Loading..." : value || placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="chevron-down" size={18} color={colors.muted} />}
      </Pressable>
      {error ? (
        <Text style={{ marginTop: 5, color: colors.red, fontSize: 12 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ marginTop: 5, color: colors.muted, fontSize: 12 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

export type Option = { id: string; name: string };

/** Bottom sheet list picker with search once the list gets long. */
export function OptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  emptyText = "No options available.",
  searchValue,
  onSearch,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  emptyText?: string;
  searchValue?: string;
  onSearch?: (text: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(15,31,43,0.4)" }} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={{
          maxHeight: "75%",
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
        }}
      >
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
          <Text style={[typography.heading, { flex: 1 }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        {onSearch ? (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                height: 44,
              }}
            >
              <Ionicons name="search" size={17} color={colors.muted} />
              <TextInput
                value={searchValue}
                onChangeText={onSearch}
                placeholder="Search"
                placeholderTextColor={colors.muted}
                style={{ flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text }}
              />
            </View>
          </View>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled">
          {options.length === 0 ? (
            <Text style={[typography.body, { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl }]}>{emptyText}</Text>
          ) : (
            options.map((option) => {
              const selected = option.id === selectedId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onSelect(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.xl,
                    paddingVertical: 15,
                    backgroundColor: pressed ? colors.surfaceMuted : selected ? colors.brandSoft : colors.surface,
                  })}
                >
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text, fontWeight: selected ? "700" : "400" }}>{option.name}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export type { KeyboardTypeOptions };
