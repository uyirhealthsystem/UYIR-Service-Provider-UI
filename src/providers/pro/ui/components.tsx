import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius, shadow, spacing, typography } from "../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
export type Tone = "brand" | "green" | "amber" | "red" | "violet" | "neutral";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  brand: { fg: colors.brand, bg: colors.brandSoft },
  green: { fg: colors.green, bg: colors.greenSoft },
  amber: { fg: colors.amber, bg: colors.amberSoft },
  red: { fg: colors.red, bg: colors.redSoft },
  violet: { fg: colors.violet, bg: colors.violetSoft },
  neutral: { fg: colors.textSecondary, bg: colors.surfaceMuted },
};

export const toneColors = (tone: Tone) => TONES[tone];

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
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
  variant?: "primary" | "secondary" | "danger" | "ghost";
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
          minHeight: compact ? 40 : 50,
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

export function ProgressBar({
  value,
  tone = "brand",
  height = 8,
  track = colors.surfaceMuted,
}: {
  /** 0 - 1 */
  value: number;
  tone?: Tone;
  height?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: TONES[tone].fg }} />
    </View>
  );
}

/** One box per bucket slot: filled = in use. */
export function SlotMeter({
  used,
  total,
  onDark,
}: {
  used: number;
  total: number;
  onDark?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel={`${used} of ${total} bucket slots used`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor:
              i < used
                ? onDark ? colors.white : colors.brand
                : onDark ? "rgba(255,255,255,0.25)" : colors.brandSoft,
          }}
        />
      ))}
    </View>
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
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} compact style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.redSoft,
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.md,
      }}
    >
      <Ionicons name="alert-circle" size={18} color={colors.red} />
      <Text style={{ flex: 1, color: colors.red, fontSize: 13, lineHeight: 18 }}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={{ color: colors.red, fontWeight: "800", fontSize: 13 }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Small square button for headers (back, notifications, ...). */
export function HeaderIconButton({
  icon,
  onPress,
  onDark,
  label,
  badge,
}: {
  icon: IconName;
  onPress: () => void;
  onDark?: boolean;
  label: string;
  badge?: number;
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
      {badge ? (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 3,
            backgroundColor: colors.red,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontSize: 9, fontWeight: "800" }}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
