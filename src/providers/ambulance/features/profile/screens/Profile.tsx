import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../../auth/store";
import { errorMessage } from "../../../api/errors";
import { getMyProfile, updateMyProfile } from "../../../api/profile";
import {
  addTechnician,
  getMyTechnicians,
  removeTechnician,
  updateTechnician,
} from "../../../api/technicians";
import { ambulanceTypeLabel, MAX_TECHNICIANS, type StatusTone } from "../../../domain/trip";
import { colors, radius, spacing, typography } from "../../../theme";
import type {
  DriverProfile,
  DriverProfileRequest,
  DriverStatus,
  Technician,
  TechnicianRequest,
} from "../../../types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  IconButton,
  InfoRow,
  ScreenHeader,
  SectionTitle,
} from "../../../ui/components";
import ProfileFormModal from "../components/ProfileFormModal";
import TechnicianFormModal from "../components/TechnicianFormModal";

const DRIVER_STATUS: Record<DriverStatus, { label: string; tone: StatusTone }> = {
  AVAILABLE: { label: "Online", tone: "success" },
  BUSY: { label: "On a trip", tone: "info" },
  OFFLINE: { label: "Offline", tone: "neutral" },
};

function initials(name: string | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "D";
}

export default function Profile() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [technicianForm, setTechnicianForm] = useState<{ technician: Technician | null } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [profileResult, techniciansResult] = await Promise.allSettled([
      getMyProfile(),
      getMyTechnicians(),
    ]);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    if (techniciansResult.status === "fulfilled") setTechnicians(techniciansResult.value);

    const failure = [profileResult, techniciansResult].find(
      (result) => result.status === "rejected",
    );
    setLoadError(
      failure?.status === "rejected"
        ? errorMessage(failure.reason, "Unable to load your profile.")
        : "",
    );
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function openProfileForm() {
    setProfileError("");
    setEditingProfile(true);
  }

  async function saveProfile(data: DriverProfileRequest) {
    try {
      setSaving(true);
      setProfileError("");
      setProfile(await updateMyProfile(data));
      setEditingProfile(false);
    } catch (error) {
      setProfileError(errorMessage(error, "Unable to save your details."));
    } finally {
      setSaving(false);
    }
  }

  async function saveTechnician(data: TechnicianRequest) {
    try {
      setSaving(true);
      if (technicianForm?.technician) await updateTechnician(technicianForm.technician.id, data);
      else await addTechnician(data);
      setTechnicianForm(null);
      setTechnicians(await getMyTechnicians());
    } catch (error) {
      Alert.alert("Unable to save technician", errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(technician: Technician) {
    Alert.alert("Remove technician?", `Remove ${technician.fullName} from this ambulance?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTechnician(technician.id);
            setTechnicians(await getMyTechnicians());
          } catch (error) {
            Alert.alert("Unable to remove technician", errorMessage(error));
          }
        },
      },
    ]);
  }

  const onTrip = profile?.status === "BUSY";
  const status = profile ? DRIVER_STATUS[profile.status] : null;
  const technicianLimitReached = technicians.length >= MAX_TECHNICIANS;

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <ScreenHeader title="Profile" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loadError ? <ErrorBanner message={loadError} /> : null}

        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile?.fullName)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={typography.heading} numberOfLines={1}>
              {profile?.fullName || "Driver"}
            </Text>
            <Text style={typography.body} numberOfLines={1}>
              {profile?.phone || "No mobile number"}
            </Text>
          </View>
          {status ? <Badge label={status.label} tone={status.tone} /> : null}
        </Card>

        <SectionTitle
          title="Ambulance"
          action={
            <Button
              title="Edit"
              icon="create-outline"
              variant="secondary"
              compact
              disabled={!profile || onTrip}
              onPress={openProfileForm}
            />
          }
        />
        <Card style={styles.rows}>
          <InfoRow
            icon="car-outline"
            label="Registration"
            value={profile?.plateNumber || "Not available"}
          />
          <InfoRow
            icon="medkit-outline"
            label="Type"
            value={profile ? ambulanceTypeLabel(profile.ambulanceType) : "Not available"}
          />
          <InfoRow
            icon="card-outline"
            label="Licence"
            value={profile?.licenseNumber || "Not available"}
          />
          <InfoRow
            icon="map-outline"
            label="District"
            value={profile?.districtId || "Not available"}
            last
          />
        </Card>
        {onTrip ? (
          <Text style={styles.note}>You can edit these details after your current trip.</Text>
        ) : null}

        <SectionTitle
          title={`Technicians (${technicians.length}/${MAX_TECHNICIANS})`}
          action={
            <Button
              title="Add"
              icon="add"
              variant="secondary"
              compact
              disabled={technicianLimitReached}
              onPress={() => setTechnicianForm({ technician: null })}
            />
          }
        />
        <Card style={styles.rows}>
          {technicians.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No technicians added"
              message="Add the technicians who work on this ambulance."
            />
          ) : (
            technicians.map((technician, index) => (
              <View
                key={technician.id}
                style={[
                  styles.technician,
                  index < technicians.length - 1 ? styles.technicianDivider : null,
                ]}
              >
                <View style={styles.technicianText}>
                  <Text style={typography.label} numberOfLines={1}>
                    {technician.fullName}
                  </Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {[technician.phone, technician.qualification].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <IconButton
                  icon="create-outline"
                  label={`Edit ${technician.fullName}`}
                  color={colors.blue}
                  onPress={() => setTechnicianForm({ technician })}
                />
                <IconButton
                  icon="trash-outline"
                  label={`Remove ${technician.fullName}`}
                  color={colors.red}
                  onPress={() => confirmRemove(technician)}
                />
              </View>
            ))
          )}
        </Card>

        <Button
          title="Log out"
          icon="log-out-outline"
          variant="dangerSoft"
          onPress={logout}
          style={styles.logout}
        />
      </ScrollView>

      {editingProfile && profile ? (
        <ProfileFormModal
          profile={profile}
          saving={saving}
          error={profileError}
          onClose={() => setEditingProfile(false)}
          onSave={saveProfile}
        />
      ) : null}

      {technicianForm ? (
        <TechnicianFormModal
          technician={technicianForm.technician}
          saving={saving}
          onClose={() => setTechnicianForm(null)}
          onSave={saveTechnician}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: 0 },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, lineHeight: 24, fontWeight: "700", color: colors.white },
  identityText: { flex: 1 },
  rows: { paddingVertical: spacing.xs },
  note: { ...typography.caption, marginTop: spacing.sm },
  technician: { minHeight: 60, flexDirection: "row", alignItems: "center" },
  technicianDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  technicianText: { flex: 1 },
  logout: { marginTop: spacing.xl },
});
