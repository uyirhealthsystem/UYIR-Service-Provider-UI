import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { ReactNode, ComponentProps } from "react";
import type { CollectorStatus } from "../../provider-data/data";

export const BLUE = "#1473E6";
export const BG = "#F5F8FC";
export const TEXT = "#172033";
export const MUTED = "#758096";
export const GREEN = "#159447";
export const RED = "#E72B3A";
export const ORANGE = "#D98200";

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
    <Pressable onPress={onBack} style={{ width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" }}>{onBack ? <Ionicons name="chevron-back" size={24} color={TEXT} /> : null}</Pressable>
    <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT }}>{title}</Text><View style={{ width: 36, alignItems: "flex-end" }}>{right}</View>
  </View>;
}

export function StatusPill({ status }: { status: CollectorStatus }) {
  const map: Record<CollectorStatus, { bg: string; color: string; label: string }> = {
    NEW: { bg: "#EAF3FF", color: BLUE, label: "NEW REQUEST" }, ACCEPTED: { bg: "#EAF3FF", color: BLUE, label: "ACCEPTED" },
    REACHED: { bg: "#FFF2DC", color: ORANGE, label: "REACHED" }, COLLECTING: { bg: "#EAF3FF", color: BLUE, label: "COLLECTING" },
    COLLECTED: { bg: "#E6F8EE", color: GREEN, label: "SAMPLE COLLECTED" }, DELIVERING: { bg: "#EAF3FF", color: BLUE, label: "DELIVERING" },
    DELIVERED: { bg: "#E6F8EE", color: GREEN, label: "DELIVERED" }, COMPLETED: { bg: "#E6F8EE", color: GREEN, label: "COMPLETED" },
  };
  const item = map[status];
  return <View style={{ backgroundColor: item.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }}><Text style={{ color: item.color, fontSize: 9, fontWeight: "900" }}>{item.label}</Text></View>;
}

export function PrimaryButton({ title, onPress, icon, disabled = false }: { title: string; onPress: () => void; icon?: ComponentProps<typeof Ionicons>["name"]; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => ({ height: 50, borderRadius: 13, backgroundColor: disabled ? "#B8C3D2" : BLUE, alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: pressed ? 0.88 : 1 })}>
    {icon ? <Ionicons name={icon} size={19} color="#fff" style={{ marginRight: 8 }} /> : null}<Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>{title}</Text>
  </Pressable>;
}

export function DetailRow({ icon, title, value }: { icon: ComponentProps<typeof Ionicons>["name"]; title: string; value: string }) {
  return <View style={{ flexDirection: "row", paddingVertical: 10, alignItems: "flex-start" }}><Ionicons name={icon} size={18} color={BLUE} /><View style={{ marginLeft: 10, flex: 1 }}><Text style={{ color: MUTED, fontSize: 10 }}>{title}</Text><Text style={{ color: TEXT, fontSize: 12, fontWeight: "700", marginTop: 3, lineHeight: 17 }}>{value}</Text></View></View>;
}
