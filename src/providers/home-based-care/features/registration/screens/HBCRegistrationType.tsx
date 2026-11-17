import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CareType } from "../../../api/types";
import { C } from "../../../components/ui";

const OPTIONS: { careType: CareType; name: string; desc: string; icon: string }[] = [
  { careType: "NURSE", name: "Nurse", desc: "Nursing and clinical home care", icon: "medkit-outline" },
  { careType: "PHYSIO", name: "Physiotherapist", desc: "Physiotherapy and rehabilitation", icon: "body-outline" },
  { careType: "CARETAKER", name: "Caretaker", desc: "Daily living support and personal care", icon: "heart-outline" },
];

export default function HBCRegistrationType({ navigation, route }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        {navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={C.ink} /></Pressable>
        ) : null}
        <Text style={{ color: C.blue, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 14 }}>UYIR · HOME-BASED CARE</Text>
        <Text style={{ fontSize: 27, fontWeight: "900", color: C.ink, marginTop: 8 }}>Choose your care type</Text>
        <Text style={{ color: C.muted, lineHeight: 20, marginTop: 8 }}>
          Your care type decides which bookings you see. It is fixed once you register.
        </Text>
        <View style={{ marginTop: 22, gap: 12 }}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.careType}
              onPress={() => navigation.navigate("HBCProviderRegistration", { ...route?.params, careType: o.careType })}
              style={({ pressed }) => ({ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", opacity: pressed ? 0.85 : 1 })}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.blueSoft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={o.icon as any} size={24} color={C.blue} />
              </View>
              <View style={{ flex: 1, marginLeft: 13 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: C.ink }}>{o.name}</Text>
                <Text style={{ marginTop: 3, color: C.muted, fontSize: 12 }}>{o.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9AA8BB" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
