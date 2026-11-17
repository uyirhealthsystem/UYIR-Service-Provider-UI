import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { addDays, fmtDateKey, istKey, istToIso, pad, todayKey } from "../utils/format";
import { Chip, C } from "./ui";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00
const MINUTES = [0, 15, 30, 45];

/** Lightweight date + time picker (IST). Calls onChange with a UTC ISO string for the API. */
export default function DateTimePicker({ initialIso, onChange }: { initialIso?: string; onChange: (iso: string) => void }) {
  const base = initialIso && !Number.isNaN(new Date(initialIso).getTime()) ? new Date(new Date(initialIso).getTime() + 330 * 60000) : null;
  const [dateKey, setDateKey] = useState(base ? istKey(initialIso as string) : addDays(todayKey(), 1));
  const [hour, setHour] = useState(base ? base.getUTCHours() : 10);
  const [minute, setMinute] = useState(base ? Math.round(base.getUTCMinutes() / 15) * 15 % 60 : 0);

  const emit = (d: string, h: number, m: number) => onChange(istToIso(d, `${pad(h)}:${pad(m)}`));
  React.useEffect(() => { emit(dateKey, hour, minute); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const days = Array.from({ length: 30 }, (_, i) => addDays(todayKey(), i));
  const h12 = (h: number) => `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;

  return (
    <View>
      <Text style={{ color: C.muted, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {days.map((k) => <Chip key={k} label={k === todayKey() ? "Today" : fmtDateKey(k).replace(/, \d{4}$/, "")} active={k === dateKey} onPress={() => { setDateKey(k); emit(k, hour, minute); }} />)}
      </ScrollView>
      <Text style={{ color: C.muted, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>Hour</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {HOURS.map((h) => <Chip key={h} label={h12(h)} active={h === hour} onPress={() => { setHour(h); emit(dateKey, h, minute); }} />)}
      </View>
      <Text style={{ color: C.muted, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>Minutes</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
        {MINUTES.map((m) => <Chip key={m} label={`:${pad(m)}`} active={m === minute} onPress={() => { setMinute(m); emit(dateKey, hour, m); }} />)}
      </View>
      <Text style={{ color: C.ink, fontWeight: "800", fontSize: 15, marginTop: 10 }}>
        {fmtDateKey(dateKey)} · {hour % 12 || 12}:{pad(minute)} {hour >= 12 ? "PM" : "AM"}
      </Text>
    </View>
  );
}
