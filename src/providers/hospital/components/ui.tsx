import React, { type ReactNode } from "react";
import {
  ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export const C = {
  primary: "#0B63CE", primaryDark: "#0A4FA3", primarySoft: "#E8F1FC",
  ink: "#14233B", muted: "#66758B", line: "#E2E8F0", bg: "#F4F7FB", card: "#FFFFFF",
  success: "#0E9F6E", successSoft: "#E3F6EE", warn: "#B96A00", warnSoft: "#FFF3DC",
  danger: "#D1304A", dangerSoft: "#FDE8EC", gray: "#8795A8", graySoft: "#EEF1F5",
};

type Tone = "primary" | "success" | "warn" | "danger" | "gray";
const toneMap: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: C.primary, bg: C.primarySoft },
  success: { fg: C.success, bg: C.successSoft },
  warn: { fg: C.warn, bg: C.warnSoft },
  danger: { fg: C.danger, bg: C.dangerSoft },
  gray: { fg: C.muted, bg: C.graySoft },
};

/* ───────── Screen shell ───────── */
export function Screen({
  title, subtitle, onBack, right, children, onRefresh, refreshing = false, scroll = true, footer,
}: {
  title: string; subtitle?: string; onBack?: () => void; right?: ReactNode; children: ReactNode;
  onRefresh?: () => void; refreshing?: boolean; scroll?: boolean; footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      <View style={s.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={s.backBtn} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: (footer ? 16 : insets.bottom + 24) }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>{children}</View>
      )}
      {footer ? <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/* ───────── Primitives ───────── */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const Comp: any = onPress ? Pressable : View;
  return <Comp onPress={onPress} style={[s.card, style]}>{children}</Comp>;
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Button({
  title, onPress, variant = "primary", loading, disabled, icon, small, style,
}: {
  title: string; onPress: () => void; variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "dangerOutline";
  loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: C.primary, fg: "#fff", border: C.primary },
    success: { bg: C.success, fg: "#fff", border: C.success },
    danger: { bg: C.danger, fg: "#fff", border: C.danger },
    secondary: { bg: C.primarySoft, fg: C.primary, border: C.primarySoft },
    ghost: { bg: "transparent", fg: C.primary, border: C.line },
    dangerOutline: { bg: "#fff", fg: C.danger, border: C.danger },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress} disabled={off}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 }, style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={v.fg} /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={v.fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Pill({ text, tone = "gray" }: { text: string; tone?: Tone }) {
  const t = toneMap[tone];
  return (
    <View style={[s.pill, { backgroundColor: t.bg }]}>
      <Text style={[s.pillText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const statusTone: Record<string, Tone> = {
  CONFIRMED: "primary", RESCHEDULED: "warn", COMPLETED: "success", NO_SHOW: "gray", CANCELLED: "danger",
  REQUESTED: "danger", ACCEPTED: "primary", REJECTED: "gray",
  ISSUED: "primary", OVERDUE: "danger", PAID: "success",
  PENDING_DETAILS: "warn", UNDER_REVIEW: "primary", NEEDS_CLARIFICATION: "warn", ACTIVATED: "success", SUSPENDED: "danger",
};
export const StatusPill = ({ status }: { status: string }) => (
  <Pill text={status.replace(/_/g, " ")} tone={statusTone[status] || "gray"} />
);

export function ProgressBar({ value, max, color }: { value: number; max: number | null; color?: string }) {
  const pct = max && max > 0 ? Math.min(1, value / max) : 0;
  const barColor = color || (pct >= 1 ? C.danger : pct >= 0.8 ? C.warn : C.primary);
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.max(max ? 3 : 0, pct * 100)}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export function Stat({ icon, value, label, tone = "primary" }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string; tone?: Tone }) {
  const t = toneMap[tone];
  return (
    <View style={s.stat}>
      <View style={[s.statIcon, { backgroundColor: t.bg }]}><Ionicons name={icon} size={17} color={t.fg} /></View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function Empty({ icon = "file-tray-outline", title, hint }: { icon?: keyof typeof Ionicons.glyphMap; title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={34} color={C.gray} />
      <Text style={s.emptyTitle}>{title}</Text>
      {hint ? <Text style={s.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function Banner({ tone = "warn", text, action }: { tone?: Tone; text: string; action?: { label: string; onPress: () => void } }) {
  const t = toneMap[tone];
  return (
    <View style={[s.banner, { backgroundColor: t.bg }]}>
      <Text style={{ color: t.fg, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" }}>{text}</Text>
      {action ? <Pressable onPress={action.onPress} hitSlop={8}><Text style={{ color: t.fg, fontWeight: "800", fontSize: 13 }}>{action.label}</Text></Pressable> : null}
    </View>
  );
}

export const ErrorText = ({ text }: { text?: string }) => (text ? <Text style={s.error}>{text}</Text> : null);

export function Field({ label, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput {...rest} placeholderTextColor="#9AA6B7" style={[s.input, rest.multiline && { minHeight: 76, textAlignVertical: "top" }, rest.style]} />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}>
      <Text style={[s.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 1, max = 1000, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <View style={s.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - step))} style={s.stepBtn} hitSlop={6}><Ionicons name="remove" size={20} color={C.primary} /></Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + step))} style={s.stepBtn} hitSlop={6}><Ionicons name="add" size={20} color={C.primary} /></Pressable>
    </View>
  );
}

export function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const initials = name.replace(/^dr\.?\s*/i, "").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "D";
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: C.primary, fontWeight: "800", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue}>{value === undefined || value === null || value === "" ? "—" : String(value)}</Text>
  </View>
);

export const shadow = Platform.select({
  ios: { shadowColor: "#0F2747", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 1.5 },
  default: {},
}) as ViewStyle;

/* ───────── Professional building blocks (profile, billing, reports) ───────── */

/** A titled white panel that groups related rows/fields. */
export function Panel({ title, icon, right, children, style }: {
  title?: string; icon?: keyof typeof Ionicons.glyphMap; right?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.card, { padding: 0 }, style]}>
      {title ? (
        <View style={s.panelHead}>
          {icon ? <View style={s.panelIcon}><Ionicons name={icon} size={16} color={C.primary} /></View> : null}
          <Text style={s.panelTitle}>{title}</Text>
          <View style={{ flex: 1 }} />
          {right}
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>{children}</View>
    </View>
  );
}

/** Settings-style navigation row. */
export function MenuItem({ icon, title, subtitle, onPress, tone = "primary", right, last }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress: () => void;
  tone?: Tone; right?: ReactNode; last?: boolean;
}) {
  const t = toneMap[tone];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.menu, !last && s.menuLine, pressed && { opacity: 0.7 }]}>
      <View style={[s.menuIcon, { backgroundColor: t.bg }]}><Ionicons name={icon} size={18} color={t.fg} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuTitle}>{title}</Text>
        {subtitle ? <Text style={s.menuSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
      <Ionicons name="chevron-forward" size={18} color={C.gray} />
    </Pressable>
  );
}

/** Label + switch row for boolean form fields. */
export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={s.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.switchLabel}>{label}</Text>
        {hint ? <Text style={s.menuSub}>{hint}</Text> : null}
      </View>
      <View style={[s.toggle, value && { backgroundColor: C.primary }]}>
        <View style={[s.knob, value && { transform: [{ translateX: 18 }] }]} />
      </View>
    </Pressable>
  );
}

/** Single- or multi-select chip group for enum fields. */
export function ChipSelect<T extends string>({ label, options, value, onChange, multi }: {
  label?: string; options: readonly (readonly [T, string])[] | { value: T; label: string }[];
  value: T | T[] | null | undefined; onChange: (v: any) => void; multi?: boolean;
}) {
  const opts = (options as any[]).map((o) => (Array.isArray(o) ? { value: o[0], label: o[1] } : o)) as { value: T; label: string }[];
  const selected = (v: T) => (multi ? ((value as T[]) || []).includes(v) : value === v);
  const toggle = (v: T) => {
    if (!multi) return onChange(v);
    const cur = (value as T[]) || [];
    onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {opts.map((o) => <Chip key={o.value} label={o.label} active={selected(o.value)} onPress={() => toggle(o.value)} />)}
      </View>
    </View>
  );
}

/** Two-column label/value grid cell. */
export function KV({ label, value, wide }: { label: string; value?: string | number | null; wide?: boolean }) {
  return (
    <View style={[s.kv, wide && { width: "100%" }]}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value === undefined || value === null || value === "" ? "—" : String(value)}</Text>
    </View>
  );
}

/** Lightweight vertical bar chart (no chart library — keeps the APK small). */
export function BarChart({ data, height = 120, color = C.primary, label }: {
  data: { key: string; value: number; label?: string }[]; height?: number; color?: string; label?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.max(1, Math.ceil(data.length / 6));
  return (
    <View>
      {label ? <Text style={s.kvLabel}>{label}</Text> : null}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: data.length > 20 ? 2 : 4, marginTop: 8 }}>
        {data.map((d) => (
          <View key={d.key} style={{ flex: 1, height: "100%", justifyContent: "flex-end" }}>
            <View style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 1, backgroundColor: d.value ? color : C.line, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {data.map((d, i) => (
          <Text key={d.key} style={{ flex: 1, fontSize: 9.5, color: C.muted, textAlign: "center" }} numberOfLines={1}>
            {i % step === 0 ? d.label ?? "" : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Horizontal breakdown bar list (status counts etc.). */
export function Breakdown({ items }: { items: { label: string; value: number; tone?: Tone }[] }) {
  const total = items.reduce((n, i) => n + i.value, 0) || 1;
  return (
    <View style={{ gap: 10 }}>
      {items.map((i) => (
        <View key={i.label}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
            <Text style={s.menuSub}>{i.label}</Text>
            <Text style={[s.menuSub, { color: C.ink, fontWeight: "800" }]}>{i.value}</Text>
          </View>
          <View style={s.track}><View style={[s.fill, { width: `${(i.value / total) * 100}%`, backgroundColor: toneMap[i.tone || "primary"].fg }]} /></View>
        </View>
      ))}
    </View>
  );
}

/** Full-screen loading placeholder. */
export const Loading = ({ text = "Loading…" }: { text?: string }) => (
  <View style={{ alignItems: "center", paddingVertical: 48 }}>
    <ActivityIndicator color={C.primary} />
    <Text style={[s.menuSub, { marginTop: 10 }]}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  panelHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  panelIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  panelTitle: { fontSize: 14.5, fontWeight: "800", color: C.ink },
  menu: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  menuLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontSize: 14.5, fontWeight: "700", color: C.ink },
  menuSub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  switchLabel: { fontSize: 14, fontWeight: "600", color: C.ink },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: "#CBD5E1", padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  kv: { width: "50%", paddingVertical: 8, paddingRight: 8 },
  kvLabel: { fontSize: 11.5, color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  kvValue: { fontSize: 14, color: C.ink, fontWeight: "700", marginTop: 3 },
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.line, gap: 8 },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  title: { fontSize: 20, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 12, ...shadow },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontSize: 15, fontWeight: "700" },
  pill: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  track: { height: 7, borderRadius: 4, backgroundColor: C.graySoft, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  stat: { flex: 1, minWidth: 0, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 12, ...shadow },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: C.ink, marginTop: 8 },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: "700", color: C.ink, textAlign: "center" },
  emptyHint: { marginTop: 4, fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 18 },
  banner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, marginBottom: 12 },
  error: { color: C.danger, fontSize: 13, marginVertical: 6, lineHeight: 18 },
  fieldLabel: { color: C.muted, fontWeight: "600", fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: "#F8FAFD", borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, color: C.ink, fontSize: 15 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  chipText: { fontSize: 13, fontWeight: "700", color: C.muted },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 48, textAlign: "center", fontSize: 18, fontWeight: "800", color: C.ink },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  rowLabel: { width: 112, color: C.muted, fontSize: 13 },
  rowValue: { flex: 1, color: C.ink, fontSize: 14, fontWeight: "600" },
});
