import React from "react";
import { Pressable, Text, View } from "react-native";
import { useHospitalStore } from "../features/provider-state/store";
import { C } from "./ui";

const label: Record<string, { text: string; color: string }> = {
  open: { text: "Live", color: C.success },
  connecting: { text: "Connecting", color: C.warn },
  reconnecting: { text: "Reconnecting", color: C.warn },
  idle: { text: "Offline", color: C.gray },
  blocked: { text: "Blocked", color: C.danger },
  failed: { text: "Tap to retry", color: C.danger },
};

/** Small live-connection indicator; tap to retry when the socket gave up. */
export default function ConnectionDot() {
  const { socketStatus, reconnectSocket } = useHospitalStore();
  const l = label[socketStatus] || label.idle;
  const retryable = socketStatus === "failed" || socketStatus === "blocked" || socketStatus === "idle";
  return (
    <Pressable onPress={retryable ? reconnectSocket : undefined} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: C.bg }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: l.color }}>{l.text}</Text>
    </Pressable>
  );
}
