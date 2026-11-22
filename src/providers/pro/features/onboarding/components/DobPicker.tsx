import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../theme";
import { Button } from "../../../ui/components";

// Date of birth picker: year -> month -> day, so a 1975 birthday is three taps
// instead of paging back month by month. Tapping the year or month in the
// header jumps back to that step.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MIN_AGE = 21; // youngest practising doctor (MBBS + internship)
const MAX_AGE = 90;

const isoDate = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

type Step = "year" | "month" | "day";

export default function DobPicker({ visible, value, onChange, onClose }: { visible: boolean; value?: string; onChange: (iso: string) => void; onClose: () => void }) {
  const today = new Date();
  const maxYear = today.getFullYear() - MIN_AGE;
  const minYear = today.getFullYear() - MAX_AGE;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  const [step, setStep] = useState<Step>("year");
  const [year, setYear] = useState(1985);
  const [month, setMonth] = useState(0);
  const yearScroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (match) {
      setYear(Number(match[1]));
      setMonth(Number(match[2]) - 1);
      setStep("day");
    } else {
      setYear(1985);
      setMonth(0);
      setStep("year");
    }
  }, [visible, value]);

  // Bring the selected year into view (4 per row, 48px rows).
  useEffect(() => {
    if (visible && step === "year") {
      const row = Math.floor(years.indexOf(year) / 4);
      setTimeout(() => yearScroll.current?.scrollTo({ y: Math.max(0, row * 52 - 104), animated: false }), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const selected = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const cell = (label: string, on: boolean, onPress: () => void, width: string, disabled = false) => (
    <Pressable
      key={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ width: width as any, height: 48, padding: 3, opacity: disabled ? 0.3 : pressed ? 0.7 : 1 })}
    >
      <View style={{ flex: 1, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.brand : colors.surfaceMuted }}>
        <Text style={{ fontSize: 15, fontWeight: on ? "800" : "600", color: on ? colors.white : colors.text }}>{label}</Text>
      </View>
    </Pressable>
  );

  const crumb = (label: string, active: boolean, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: active ? colors.brand : colors.brandSoft }}>
      <Text style={{ fontWeight: "800", fontSize: 14, color: active ? colors.white : colors.brand }}>{label}</Text>
      <Ionicons name="chevron-down" size={13} color={active ? colors.white : colors.brand} />
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(15,27,51,0.45)", justifyContent: "center", padding: spacing.lg }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg }}>
          <Text style={typography.title}>Date of birth</Text>
          <Text style={[typography.caption, { marginTop: 2 }]}>
            {step === "year" ? "Pick the year" : step === "month" ? "Pick the month" : "Pick the day"}
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginVertical: spacing.md }}>
            {crumb(String(year), step === "year", () => setStep("year"))}
            {step !== "year" ? crumb(MONTHS[month], step === "month", () => setStep("month")) : null}
          </View>

          {step === "year" ? (
            <ScrollView ref={yearScroll} style={{ maxHeight: 312 }} showsVerticalScrollIndicator>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {years.map((y) => cell(String(y), y === year, () => { setYear(y); setStep("month"); }, "25%"))}
              </View>
            </ScrollView>
          ) : null}

          {step === "month" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {MONTHS.map((m, i) => cell(m, i === month, () => { setMonth(i); setStep("day"); }, "33.33%"))}
            </View>
          ) : null}

          {step === "day" ? (
            <View>
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <Text key={`${d}-${i}`} style={{ width: "14.28%", textAlign: "center", color: colors.muted, fontSize: 11, fontWeight: "800" }}>{d}</Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {cells.map((d, i) =>
                  d === null ? (
                    <View key={`blank-${i}`} style={{ width: "14.28%", height: 44 }} />
                  ) : (
                    <Pressable
                      key={`d-${d}`}
                      onPress={() => { onChange(isoDate(year, month, d)); onClose(); }}
                      style={{ width: "14.28%", height: 44, alignItems: "center", justifyContent: "center" }}
                    >
                      {(() => {
                        const on = !!selected && Number(selected[1]) === year && Number(selected[2]) - 1 === month && Number(selected[3]) === d;
                        return (
                          <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.brand : "transparent" }}>
                            <Text style={{ color: on ? colors.white : colors.text, fontSize: 14, fontWeight: on ? "800" : "500" }}>{d}</Text>
                          </View>
                        );
                      })()}
                    </Pressable>
                  ),
                )}
              </View>
            </View>
          ) : null}

          <Button label="Cancel" variant="ghost" onPress={onClose} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </Modal>
  );
}
