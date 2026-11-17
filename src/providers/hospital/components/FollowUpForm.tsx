import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Chip, Field, Stepper, C } from "./ui";
import { addDays, fmtDateKey, todayKey } from "../utils/format";

export type FollowUpValue = { afterDays?: number; date?: string; instructions?: string };

/** Follow-up instruction: "after N days" or "on a date", plus optional notes for the patient. */
export default function FollowUpForm({ onChange }: { onChange: (v: FollowUpValue) => void }) {
  const [mode, setMode] = useState<"days" | "date">("days");
  const [days, setDays] = useState(7);
  const [date, setDate] = useState(addDays(todayKey(), 7));
  const [notes, setNotes] = useState("");

  const emit = (next: Partial<{ mode: "days" | "date"; days: number; date: string; notes: string }>) => {
    const m = next.mode ?? mode, d = next.days ?? days, dt = next.date ?? date, n = next.notes ?? notes;
    onChange({ ...(m === "days" ? { afterDays: d } : { date: dt }), ...(n.trim() ? { instructions: n.trim().slice(0, 1000) } : {}) });
  };
  // report the initial value once
  React.useEffect(() => { emit({}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dateOptions = Array.from({ length: 45 }, (_, i) => addDays(todayKey(), i + 1));

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Chip label="After some days" active={mode === "days"} onPress={() => { setMode("days"); emit({ mode: "days" }); }} />
        <Chip label="On a date" active={mode === "date"} onPress={() => { setMode("date"); emit({ mode: "date" }); }} />
      </View>
      {mode === "days" ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Stepper value={days} onChange={(n) => { setDays(n); emit({ days: n }); }} min={1} max={365} />
          <Text style={{ color: C.muted, fontSize: 13 }}>days after the visit</Text>
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {dateOptions.map((k) => <Chip key={k} label={fmtDateKey(k).replace(/, \d{4}$/, "")} active={k === date} onPress={() => { setDate(k); emit({ date: k }); }} />)}
          </ScrollView>
        </View>
      )}
      <Field label="Instructions for the patient (optional)" value={notes} onChangeText={(t) => { setNotes(t); emit({ notes: t }); }} multiline maxLength={1000} placeholder="e.g. Review with fasting blood sugar report" />
    </View>
  );
}
