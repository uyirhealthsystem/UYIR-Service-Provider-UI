import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import type { Booking, BookingStatus } from "../api/types";
import { STATUS_LABEL, dateTime, distance, initials, patientName, rupees, serviceName } from "../utils/format";

export const C = {
  blue: "#0878F9",
  blueSoft: "#EAF3FF",
  ink: "#10264D",
  muted: "#71809A",
  bg: "#F4F7FC",
  card: "#FFFFFF",
  border: "#E7EDF7",
  green: "#10A56A",
  greenSoft: "#E5F9F0",
  amber: "#D98300",
  amberSoft: "#FFF4E0",
  red: "#D83248",
  redSoft: "#FFF0F1",
};

const STATUS_TONE: Record<BookingStatus, [string, string]> = {
  PENDING: [C.blue, C.blueSoft],
  ACCEPTED: [C.amber, C.amberSoft],
  CONFIRMED: [C.amber, C.amberSoft],
  PAID: [C.blue, C.blueSoft],
  IN_PROGRESS: [C.green, C.greenSoft],
  COMPLETED: [C.green, C.greenSoft],
  CANCELLED: [C.red, C.redSoft],
};

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={{ height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={{ width: 34 }}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
      ) : <View style={{ width: 34 }} />}
      <Text style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: "900", color: C.ink }}>{title}</Text>
      <View style={{ width: 34, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const [fg, bg] = STATUS_TONE[status] || [C.muted, C.bg];
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: bg }}>
      <Text style={{ fontSize: 10, fontWeight: "900", color: fg }}>{STATUS_LABEL[status] || status}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[{ backgroundColor: C.card, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: C.border }, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 10 }}>
      <Text style={{ color: C.ink, fontSize: 16, fontWeight: "900" }}>{title}</Text>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={{ color: C.blue, fontWeight: "900", fontSize: 12 }}>{action}</Text></Pressable> : null}
    </View>
  );
}

type ButtonProps = { title: string; onPress: () => void; variant?: "primary" | "outline" | "danger" | "success"; busy?: boolean; disabled?: boolean; icon?: string };

export function Button({ title, onPress, variant = "primary", busy, disabled, icon }: ButtonProps) {
  const filled = variant === "primary" || variant === "success";
  const tone = variant === "danger" ? C.red : variant === "success" ? C.green : C.blue;
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        flex: 1, minHeight: 46, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: filled ? tone : C.card, borderWidth: filled ? 0 : 1.2, borderColor: tone,
        opacity: off ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? <ActivityIndicator color={filled ? "#FFF" : tone} /> : (
        <>
          {icon ? <Ionicons name={icon as any} size={17} color={filled ? "#FFF" : tone} style={{ marginRight: 7 }} /> : null}
          <Text style={{ color: filled ? "#FFFFFF" : tone, fontWeight: "900", fontSize: 13 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View style={{ backgroundColor: C.redSoft, padding: 12, borderRadius: 12, marginBottom: 12 }}>
      <Text style={{ color: C.red, fontSize: 12 }}>{message}</Text>
      {onRetry ? <Pressable onPress={onRetry} style={{ marginTop: 6 }}><Text style={{ color: C.blue, fontWeight: "800" }}>Retry</Text></Pressable> : null}
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", padding: 28, backgroundColor: C.card, borderRadius: 17 }}>
      <Ionicons name={icon as any} size={30} color="#9AA8BB" />
      <Text style={{ color: C.ink, fontWeight: "900", marginTop: 9 }}>{title}</Text>
      {subtitle ? <Text style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 4 }}>{subtitle}</Text> : null}
    </View>
  );
}

export function Field({ label, required, ...props }: TextInputProps & { label: string; required?: boolean }) {
  return (
    <View style={{ marginTop: 13 }}>
      <Text style={{ color: "#344054", fontSize: 13, fontWeight: "700", marginBottom: 7 }}>
        {label}{required ? " *" : ""}
      </Text>
      <TextInput
        placeholderTextColor="#98A2B3"
        {...props}
        style={[{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 11, padding: 13, color: C.ink, backgroundColor: props.editable === false ? "#F2F4F7" : "#FFF" }, props.style]}
      />
    </View>
  );
}

export function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 15 }}>
      <Ionicons name={icon as any} size={18} color={C.blue} />
      <View style={{ marginLeft: 11, flex: 1 }}>
        <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
        <Text style={{ color: C.ink, fontSize: 13, fontWeight: "700", marginTop: 3, lineHeight: 18 }}>{value || "—"}</Text>
      </View>
    </View>
  );
}

// Pool bookings carry no patient details, so the card leads with the service.
export function BookingCard({ booking, onPress, action }: { booking: Booking; onPress: () => void; action?: ReactNode }) {
  const inPool = booking.status === "PENDING";
  const title = inPool ? serviceName(booking) : patientName(booking);
  const subtitle = inPool ? booking.city || booking.pincode || "Home visit" : serviceName(booking);
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 17, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border }}>
      <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.blueSoft, alignItems: "center", justifyContent: "center" }}>
          {inPool ? <Ionicons name="home-outline" size={20} color={C.blue} /> : <Text style={{ color: C.blue, fontWeight: "900" }}>{initials(title)}</Text>}
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontWeight: "900", fontSize: 14 }}>{title}</Text>
          <Text numberOfLines={1} style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{subtitle}</Text>
        </View>
        <StatusPill status={booking.status} />
      </Pressable>
      <View style={{ flexDirection: "row", marginTop: 12, gap: 10 }}>
        <Meta icon="calendar-outline" text={dateTime(booking.scheduledAt)} />
        <Meta icon={inPool ? "navigate-outline" : "cash-outline"} text={inPool ? distance(booking.distanceKm) : rupees(booking.amount)} />
      </View>
      {action ? <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      <Ionicons name={icon as any} size={14} color={C.blue} />
      <Text numberOfLines={1} style={{ marginLeft: 5, fontSize: 11, color: C.muted, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}
