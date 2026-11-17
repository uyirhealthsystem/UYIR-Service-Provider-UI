import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRefreshToken, refreshAccessToken } from "../../../../../auth/session";
import { getLaboratoryAccessToken, getLaboratoryProviderUserId } from "../../../api/client";
import { getAppointment } from "../../../api/laboratory";
import { BASE_URL } from "../../../config/env";

const BLUE = "#075DE8";
const NAVY = "#10254B";
const MUTED = "#78869C";
const BORDER = "#E4EBF5";
type Appointment = { [key: string]: any; appointmentId: string; bookingId?: string; patient?: { name?: string; age?: number; gender?: string } | null; tests?: any[]; services?: any[]; appointmentDate?: string; startTime?: string; endTime?: string; };
type SelectedFile = { uri: string; name: string; size?: number; mimeType?: string };

function isAllowedFile(file: { name?: string; mimeType?: string }) {
  const name = String(file.name || "").toLowerCase();
  const mime = String(file.mimeType || "").toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || mime === "application/pdf" || mime === "image/jpeg" || mime === "image/png";
}

export default function UploadReport({ route, navigation }: any) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reportUploaded, setReportUploaded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const uploadLock = useRef(false);
  const appointmentId = route.params?.appointmentId as string | undefined;

  const load = async () => {
    if (!appointmentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await getAppointment(appointmentId);
      const data = response?.data || response?.appointment || null;
      setAppointment(data);
      if (data?.report) setReportUploaded(true);
      if (String(data?.status || "").toUpperCase() === "COMPLETED") setCompleted(true);
    } catch (error) { console.log("Upload report details API error:", error); }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [appointmentId]));

  const selectReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png"], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      if (!isAllowedFile(file)) {
        Alert.alert("Unsupported file", "Upload only PDF or JPG/JPEG reports. PNG, DOC, and other file types are not allowed.");
        return;
      }
      setSelectedFile({ uri: file.uri, name: file.name, size: file.size, mimeType: file.mimeType });
      setReportUploaded(false);
    } catch (error: any) { Alert.alert("Unable to select file", error?.message || "Please try again."); }
  };

  const uploadReport = async () => {
    // Prevent duplicate requests and make one tap trigger one upload.
    if (uploadLock.current || uploading) return;
    if (!appointmentId) {
      Alert.alert("Missing appointment", "Appointment ID was not provided.");
      return;
    }
    if (!selectedFile || !isAllowedFile(selectedFile)) {
      Alert.alert("Report required", "Choose a PDF, JPG/JPEG, or PNG report before continuing.");
      return;
    }

    const appointmentTestId =
      route.params?.appointmentTestId ||
      appointment?.tests?.find((item: any) => item?.appointmentTestId)?.appointmentTestId ||
      appointment?.services?.find((item: any) => item?.appointmentTestId)?.appointmentTestId;

    if (!appointmentTestId) {
      Alert.alert(
        "Test ID missing",
        "This appointment does not include an appointmentTestId. Please refresh the appointment details or ask the backend team to check the appointment response.",
      );
      return;
    }

    uploadLock.current = true;
    setUploading(true);
    const token = getLaboratoryAccessToken();
    const userId = getLaboratoryProviderUserId();
    const lowerName = selectedFile.name.toLowerCase();
    const mimeType = lowerName.endsWith(".pdf")
      ? "application/pdf"
      : lowerName.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    const url = `${BASE_URL}/api/v1/labscan/reports/upload/${appointmentId}`;

    try {
      // Expo's native multipart uploader avoids the React Native FormDataPart error.
      const upload = (accessToken: string | null) =>
        FileSystem.uploadAsync(url, selectedFile.uri, {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType,
          parameters: {
            appointmentTestId: String(appointmentTestId),
            ...(notes.trim() ? { reportNotes: notes.trim() } : {}),
          },
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(userId ? { "x-user-id": userId } : {}),
          },
        });
      let response = await upload(token);
      // Expired token: refresh it and upload once more.
      if (response.status === 401 && token && getRefreshToken()) {
        response = await upload(await refreshAccessToken());
      }
      let result: any = null;
      try { result = JSON.parse(response.body); } catch { /* response may not be JSON */ }
      if (response.status < 200 || response.status >= 300 || result?.status === "error") {
        throw new Error(result?.message || result?.error?.message || `Report upload failed (HTTP ${response.status}).`);
      }
      setReportUploaded(true);
      Alert.alert("Report uploaded", "Your report was uploaded successfully. You can now complete this test.");
    } catch (error: any) {
      console.log("LAB REPORT UPLOAD ERROR:", error);
      Alert.alert("Upload failed", error?.message || "Could not upload the report. Please try again.");
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  };

  const continueToComplete = () => {
    if (!appointmentId || !reportUploaded) return Alert.alert("Report required", "Upload the report successfully before continuing.");
    navigation.navigate("LabCompleteTest", { appointmentId, reportUploaded: true });
  };

  const formatSize = (size?: number) => size == null ? "Size unavailable" : size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  const testName = [ ...(appointment?.tests || []).map((x: any) => x.labTest?.testCatalog?.name || x.labTest?.name), ...(appointment?.services || []).map((x: any) => x.scanService?.serviceCatalog?.name || x.scanService?.name) ].filter(Boolean).join(", ") || "Lab Test";

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC" }} edges={["top"]}>
    <View style={{ height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}><Pressable onPress={() => navigation.goBack()} style={{ padding: 5 }}><Ionicons name="chevron-back" size={24} color={NAVY}/></Pressable><Text style={{ flex: 1, textAlign: "center", marginRight: 30, color: NAVY, fontSize: 17, fontWeight: "900" }}>{completed ? "Test Completed" : "Upload Report"}</Text></View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 15, flexDirection: "row", alignItems: "center" }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={22} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: NAVY, fontSize: 13, fontWeight: "900" }}>{loading ? "Loading patient…" : appointment?.patient?.name || "Patient"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{testName}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{appointment?.bookingId || appointmentId || ""}</Text></View></View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 18 }}><Step active done label="Appointment"/><View style={{ height: 2, backgroundColor: reportUploaded ? BLUE : "#D9E2F0", flex: 1 }}/><Step active={reportUploaded} done={reportUploaded} label="Upload report"/><View style={{ height: 2, backgroundColor: completed ? BLUE : "#D9E2F0", flex: 1 }}/><Step active={completed} done={completed} label="Complete"/></View>
      {completed ? <View style={{ backgroundColor: "#E8F8EF", borderRadius: 16, padding: 24, alignItems: "center", marginTop: 10 }}><Ionicons name="checkmark-circle" size={58} color="#17A35B"/><Text style={{ color: "#126F40", fontSize: 18, fontWeight: "900", marginTop: 12 }}>Test completed successfully</Text><Text style={{ color: "#4E7863", fontSize: 12, textAlign: "center", marginTop: 7 }}>The report was uploaded and the appointment is marked completed.</Text></View> : <>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginTop: 2 }}><Text style={{ color: NAVY, fontSize: 14, fontWeight: "900" }}>Upload Test Report <Text style={{ color: "#E83B48" }}>(Mandatory)</Text></Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 5, marginBottom: 14 }}>Accepted formats: PDF, JPG/JPEG, or PNG.</Text>
          <Pressable onPress={selectReport} disabled={uploading || reportUploaded} style={{ borderWidth: 1, borderStyle: "dashed", borderColor: reportUploaded ? "#73C99A" : "#8BB3FF", backgroundColor: reportUploaded ? "#F0FBF5" : "#F8FBFF", borderRadius: 13, paddingVertical: 24, alignItems: "center" }}><Ionicons name={reportUploaded ? "checkmark-circle" : "cloud-upload-outline"} size={33} color={reportUploaded ? "#159447" : BLUE}/><Text style={{ color: reportUploaded ? "#159447" : BLUE, fontSize: 12, fontWeight: "900", marginTop: 7 }}>{reportUploaded ? "Report uploaded successfully" : "Tap to choose report"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>PDF / JPG / JPEG / PNG · Max size as allowed by server</Text></Pressable>
          {selectedFile ? <View style={{ marginTop: 11, padding: 12, borderRadius: 11, backgroundColor: "#F4F7FC", flexDirection: "row", alignItems: "center" }}><Ionicons name={selectedFile.name.toLowerCase().endsWith(".pdf") ? "document-text" : "image"} size={24} color={BLUE}/><View style={{ flex: 1, marginLeft: 10 }}><Text numberOfLines={1} style={{ color: NAVY, fontSize: 11, fontWeight: "800" }}>{selectedFile.name}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{formatSize(selectedFile.size)}</Text></View><Pressable onPress={() => { setSelectedFile(null); setReportUploaded(false); }} disabled={uploading}><Ionicons name="close-circle" size={21} color="#E83B48"/></Pressable></View> : null}
          <Text style={{ color: NAVY, fontSize: 12, fontWeight: "800", marginTop: 19 }}>Report Notes <Text style={{ color: MUTED, fontWeight: "500" }}>(Optional)</Text></Text><TextInput value={notes} onChangeText={setNotes} placeholder="Add test results, observations or notes…" placeholderTextColor="#9AA6B8" multiline editable={!uploading && !reportUploaded} maxLength={500} style={{ minHeight: 105, textAlignVertical: "top", marginTop: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, color: NAVY, fontSize: 12 }}/><Text style={{ color: MUTED, fontSize: 10, textAlign: "right", marginTop: 4 }}>{notes.length}/500</Text>
          {!reportUploaded ? <Pressable onPress={uploadReport} disabled={uploading || !selectedFile} style={{ backgroundColor: uploading || !selectedFile ? "#AAB8D0" : BLUE, borderRadius: 12, padding: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 14 }}>{uploading ? <ActivityIndicator color="#FFFFFF"/> : <Ionicons name="cloud-upload" size={18} color="#FFFFFF"/>}<Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 12, marginLeft: 8 }}>{uploading ? "Uploading report…" : "Upload Report"}</Text></Pressable> : <View style={{ backgroundColor: "#E8F8EF", borderRadius: 11, padding: 12, flexDirection: "row", alignItems: "center", marginTop: 14 }}><Ionicons name="checkmark-circle" size={19} color="#159447"/><Text style={{ color: "#159447", fontWeight: "800", fontSize: 11, marginLeft: 8 }}>Report upload complete. You can now complete the test.</Text></View>}
        </View>
        {reportUploaded ? <Pressable onPress={continueToComplete} style={{ backgroundColor: BLUE, borderRadius: 13, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 14 }}><Ionicons name="arrow-forward-circle" size={19} color="#FFFFFF"/><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", marginLeft: 8 }}>Next: Complete Test</Text></Pressable> : null}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
function Step({ active, done, label }: { active: boolean; done: boolean; label: string }) { return <View style={{ alignItems: "center", minWidth: 68 }}><View style={{ width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: done ? "#17A35B" : active ? BLUE : "#E6ECF5" }}><Text style={{ color: done || active ? "#FFFFFF" : MUTED, fontSize: 11, fontWeight: "900" }}>{done ? "✓" : active ? "2" : "3"}</Text></View><Text style={{ color: active || done ? BLUE : MUTED, fontSize: 9, fontWeight: "800", marginTop: 5 }}>{label}</Text></View>; }
