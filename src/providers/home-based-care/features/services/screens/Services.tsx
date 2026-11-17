import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listServices } from "../../../api/catalog";
import { errorMessage } from "../../../api/client";
import type { CareService } from "../../../api/types";
import { C, EmptyState, ErrorBanner, Header } from "../../../components/ui";
import { careTypeLabel, rupees } from "../../../utils/format";
import { useHbcStore } from "../../provider-state/store";

// Public catalog: the services patients can book for this provider's care type.
export default function Services({ navigation }: any) {
  const { profile } = useHbcStore();
  const careType = profile?.careType;
  const [services, setServices] = useState<CareService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!careType) return;
    setLoading(true);
    setError("");
    try {
      setServices(await listServices(careType));
    } catch (e) {
      setError(errorMessage(e, "Unable to load services."));
    } finally {
      setLoading(false);
    }
  }, [careType]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <Header title="Services & rates" onBack={() => navigation.goBack()} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.blue} />} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {careTypeLabel(careType)} services patients can book. Rates are set by Uyir.
        </Text>
        <ErrorBanner message={error} onRetry={load} />
        {services.map((s) => (
          <View key={s.id} style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={{ flex: 1, color: C.ink, fontWeight: "900", fontSize: 14 }}>{s.name}</Text>
              <Text style={{ color: C.green, fontWeight: "900", fontSize: 14 }}>{rupees(s.price)}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{s.durationMinutes} min</Text>
            {s.description ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 17 }}>{s.description}</Text> : null}
          </View>
        ))}
        {!loading && !error && !services.length ? <EmptyState icon="pricetags-outline" title="No services listed yet" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
