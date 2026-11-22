import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../theme";

// Doctor working hours, modelled on WhatsApp Business hours: a quick preset,
// or per-day open/closed with one or more time ranges. Stored on the form as a
// Schedule object; scheduleToText() turns it into the hospital service's
// free-text `availability.customTimings`.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];
export type Slot = { from: string; to: string }; // "HH:MM", 24h
export type Schedule = {
  mode: "SELECTED" | "ALWAYS" | "APPOINTMENT";
  days: Record<Day, { open: boolean; slots: Slot[] }>;
};

const MON_SAT: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MORNING: Slot = { from: "09:00", to: "13:00" };
const EVENING: Slot = { from: "17:00", to: "21:00" };

const week = (openDays: Day[], slots: Slot[]): Schedule["days"] =>
  Object.fromEntries(DAYS.map((d) => [d, { open: openDays.includes(d), slots: openDays.includes(d) ? slots.map((s) => ({ ...s })) : [] }])) as Schedule["days"];

const PRESETS: { id: string; label: string; icon: any; build: () => Schedule }[] = [
  { id: "morning-evening", label: "Morning & evening", icon: "partly-sunny-outline", build: () => ({ mode: "SELECTED", days: week(MON_SAT, [MORNING, EVENING]) }) },
  { id: "morning", label: "Morning (9–1)", icon: "sunny-outline", build: () => ({ mode: "SELECTED", days: week(MON_SAT, [MORNING]) }) },
  { id: "evening", label: "Evening (5–9)", icon: "moon-outline", build: () => ({ mode: "SELECTED", days: week(MON_SAT, [EVENING]) }) },
  { id: "day", label: "Day (9–6)", icon: "briefcase-outline", build: () => ({ mode: "SELECTED", days: week(MON_SAT, [{ from: "09:00", to: "18:00" }]) }) },
  { id: "always", label: "Open 24 hours", icon: "time-outline", build: () => ({ mode: "ALWAYS", days: week([...DAYS], []) }) },
  { id: "appointment", label: "By appointment only", icon: "calendar-outline", build: () => ({ mode: "APPOINTMENT", days: week([], []) }) },
];

/** Every 30 minutes, 00:00 to 23:30. */
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

const slotText = (slots: Slot[]) => slots.map((s) => `${formatTime(s.from)}–${formatTime(s.to)}`).join(", ");

export function isSchedule(value: unknown): value is Schedule {
  return !!value && typeof value === "object" && "mode" in (value as any) && "days" in (value as any);
}

/** Problems that block saving, or "" if the schedule is usable. */
export function scheduleError(value: unknown): string {
  if (!isSchedule(value)) return "Choose the doctor's working hours";
  if (value.mode !== "SELECTED") return "";
  const openDays = DAYS.filter((d) => value.days[d]?.open);
  if (!openDays.length) return "Open at least one day, or choose a preset";
  for (const d of openDays) {
    const slots = value.days[d].slots;
    if (!slots.length) return `${d}: add the working hours`;
    for (const s of slots) if (s.from >= s.to) return `${d}: the end time must be after the start time`;
  }
  return "";
}

/** "Mon–Sat 9 AM–1 PM, 5 PM–9 PM; Sun closed" for availability.customTimings. */
export function scheduleToText(value: unknown): string {
  if (!isSchedule(value)) return typeof value === "string" ? value.trim() : "";
  if (value.mode === "ALWAYS") return "Open 24 hours, all days";
  if (value.mode === "APPOINTMENT") return "By appointment only";
  // Group consecutive days that share the same hours.
  const groups: { days: Day[]; text: string }[] = [];
  for (const d of DAYS) {
    const day = value.days[d];
    const text = day?.open && day.slots.length ? slotText(day.slots) : "closed";
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(d);
    else groups.push({ days: [d], text });
  }
  return groups
    .map((g) => `${g.days.length > 2 ? `${g.days[0]}–${g.days[g.days.length - 1]}` : g.days.join(", ")} ${g.text}`)
    .join("; ");
}

export default function ScheduleEditor({ value, onChange, invalid }: { value: unknown; onChange: (next: Schedule) => void; invalid?: boolean }) {
  const schedule: Schedule | null = isSchedule(value) ? value : null;
  const [picker, setPicker] = useState<{ day: Day; index: number; edge: "from" | "to" } | null>(null);
  const [expanded, setExpanded] = useState<Day | null>(null);

  const activePreset = schedule ? PRESETS.find((p) => JSON.stringify(p.build()) === JSON.stringify(schedule))?.id : undefined;
  const update = (fn: (s: Schedule) => void) => {
    const next: Schedule = JSON.parse(JSON.stringify(schedule || { mode: "SELECTED", days: week([], []) }));
    next.mode = "SELECTED";
    fn(next);
    onChange(next);
  };

  return (
    <View>
      <Text style={[typography.caption, { marginBottom: spacing.sm }]}>Quick pick, then adjust any day below.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {PRESETS.map((p) => {
          const on = activePreset === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => onChange(p.build())}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill, borderWidth: on ? 1.5 : 1, borderColor: on ? colors.brand : invalid && !schedule ? colors.red : colors.border, backgroundColor: on ? colors.brandSoft : colors.surface, opacity: pressed ? 0.8 : 1 })}
            >
              <Ionicons name={p.icon} size={15} color={on ? colors.brand : colors.muted} />
              <Text style={{ fontSize: 13, fontWeight: on ? "700" : "600", color: on ? colors.brand : colors.textSecondary }}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {schedule && schedule.mode !== "SELECTED" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.brandSoft }}>
          <Ionicons name={schedule.mode === "ALWAYS" ? "time" : "calendar"} size={18} color={colors.brand} />
          <Text style={{ flex: 1, color: colors.brand, fontWeight: "700" }}>{scheduleToText(schedule)}</Text>
          <Pressable onPress={() => onChange(PRESETS[0].build())} hitSlop={8}>
            <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 12, textDecorationLine: "underline" }}>Set hours</Text>
          </Pressable>
        </View>
      ) : null}

      {schedule && schedule.mode === "SELECTED" ? (
        <View style={{ marginTop: spacing.md, borderWidth: 1, borderColor: invalid ? colors.red : colors.border, borderRadius: radius.lg, overflow: "hidden" }}>
          {DAYS.map((d, di) => {
            const day = schedule.days[d];
            const open = expanded === d;
            return (
              <View key={d} style={{ borderTopWidth: di ? 1 : 0, borderTopColor: colors.divider, backgroundColor: colors.surface }}>
                <Pressable onPress={() => setExpanded(open ? null : d)} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, minHeight: 54, gap: spacing.sm }}>
                  <Text style={{ width: 40, fontWeight: "800", color: colors.text }}>{d}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: day.open ? colors.text : colors.muted }} numberOfLines={1}>
                    {day.open ? (day.slots.length ? slotText(day.slots) : "Add hours") : "Closed"}
                  </Text>
                  <Switch
                    value={day.open}
                    onValueChange={(on) => {
                      update((s) => { s.days[d] = { open: on, slots: on ? (s.days[d].slots.length ? s.days[d].slots : [{ ...MORNING }]) : [] }; });
                      if (on) setExpanded(d);
                    }}
                    trackColor={{ true: colors.brand, false: colors.border }}
                    thumbColor={colors.white}
                  />
                </Pressable>
                {open && day.open ? (
                  <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm }}>
                    {day.slots.map((slot, si) => (
                      <View key={si} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <TimeButton label={formatTime(slot.from)} invalid={slot.from >= slot.to} onPress={() => setPicker({ day: d, index: si, edge: "from" })} />
                        <Text style={{ color: colors.muted }}>to</Text>
                        <TimeButton label={formatTime(slot.to)} invalid={slot.from >= slot.to} onPress={() => setPicker({ day: d, index: si, edge: "to" })} />
                        <Pressable onPress={() => update((s) => { s.days[d].slots.splice(si, 1); if (!s.days[d].slots.length) s.days[d].open = false; })} hitSlop={8} accessibilityLabel="Remove hours">
                          <Ionicons name="trash-outline" size={18} color={colors.red} />
                        </Pressable>
                      </View>
                    ))}
                    <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: 2 }}>
                      <Pressable onPress={() => update((s) => { const last = s.days[d].slots[s.days[d].slots.length - 1]; s.days[d].slots.push(last && last.to < "17:00" ? { ...EVENING } : { from: "18:00", to: "20:00" }); })} hitSlop={6}>
                        <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 13 }}>+ Add hours</Text>
                      </Pressable>
                      <Pressable onPress={() => update((s) => { for (const other of DAYS) if (other !== d && s.days[other].open) s.days[other].slots = s.days[d].slots.map((x) => ({ ...x })); })} hitSlop={6}>
                        <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 13 }}>Copy to other open days</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {schedule ? (
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>Saved as: {scheduleToText(schedule)}</Text>
      ) : null}

      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(15,27,51,0.45)" }} onPress={() => setPicker(null)} />
        <View style={{ maxHeight: "60%", backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: spacing.lg }}>
          <Text style={[typography.title, { marginBottom: spacing.md }]}>{picker ? `${picker.day} · ${picker.edge === "from" ? "Opens at" : "Closes at"}` : ""}</Text>
          <ScrollView>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {TIMES.map((t) => {
                const current = picker ? schedule?.days[picker.day].slots[picker.index]?.[picker.edge] : undefined;
                const on = current === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      if (!picker) return;
                      update((s) => { const slot = s.days[picker.day].slots[picker.index]; if (slot) slot[picker.edge] = t; });
                      setPicker(null);
                    }}
                    style={{ width: "25%", padding: 3 }}
                  >
                    <View style={{ height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.brand : colors.surfaceMuted }}>
                      <Text style={{ fontSize: 13, fontWeight: on ? "800" : "600", color: on ? colors.white : colors.text }}>{formatTime(t)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function TimeButton({ label, onPress, invalid }: { label: string; onPress: () => void; invalid?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: invalid ? colors.red : colors.border, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 })}>
      <Ionicons name="time-outline" size={15} color={colors.muted} />
      <Text style={{ fontWeight: "700", color: colors.text }}>{label}</Text>
    </Pressable>
  );
}
