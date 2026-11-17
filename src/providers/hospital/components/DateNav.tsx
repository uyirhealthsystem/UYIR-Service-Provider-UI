import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addDays, dayLabel, fmtDateKey, todayKey } from "../utils/format";
import { C } from "./ui";

/** ‹  Today · Wed, 4 Nov 2026  ›  */
export default function DateNav({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const isToday = value === todayKey();
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.arrow} hitSlop={8} onPress={() => onChange(addDays(value, -1))}><Ionicons name="chevron-back" size={20} color={C.ink} /></Pressable>
      <Pressable style={{ flex: 1, alignItems: "center" }} onPress={() => onChange(todayKey())}>
        <Text style={styles.label}>{dayLabel(value)}</Text>
        <Text style={styles.sub}>{isToday ? fmtDateKey(value) : "Tap to jump to today"}</Text>
      </Pressable>
      <Pressable style={styles.arrow} hitSlop={8} onPress={() => onChange(addDays(value, 1))}><Ionicons name="chevron-forward" size={20} color={C.ink} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 8, marginBottom: 12 },
  arrow: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
