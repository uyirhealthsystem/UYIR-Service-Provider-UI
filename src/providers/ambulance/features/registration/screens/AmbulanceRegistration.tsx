import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerAmbulanceDriver } from "../../../api/registerDriver";
import { addTechnician } from "../../../api/technicians";

const DISTRICTS=["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanniyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"] as const;
const styles = {
  page: { flex: 1, backgroundColor: "#F7F9FC" }, content: { padding: 22, paddingBottom: 40 },
  back: { color: "#173FD1", fontSize: 16, fontWeight: "700" }, eyebrow: { color: "#173FD1", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  title: { marginTop: 8, fontSize: 28, fontWeight: "800", color: "#152238" }, subtitle: { marginTop: 8, color: "#657187", lineHeight: 21 },
  card: { marginTop: 22, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 17, borderWidth: 1, borderColor: "#E6EAF1" },
  label: { color: "#344054", fontSize: 13, fontWeight: "700", marginTop: 13, marginBottom: 7 }, input: { borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 11, padding: 13, color: "#152238" },
  chipRow: { flexDirection: "row" as const, gap: 8, marginTop: 8 }, chip: { borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 }, chipActive: { backgroundColor: "#EAF0FF", borderColor: "#173FD1" },
  button: { marginTop: 22, backgroundColor: "#173FD1", padding: 16, borderRadius: 12, alignItems: "center" as const }, buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, error: { color: "#B42318", marginTop: 12 }
} as const;
export default function AmbulanceRegistration({ navigation }: any) {
  const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState(""); const [plateNumber, setPlateNumber] = useState("");
  const [technicianName, setTechnicianName] = useState(""); const [technicianPhone, setTechnicianPhone] = useState("");
  const [technicianQualification, setTechnicianQualification] = useState(""); const [technicianCertification, setTechnicianCertification] = useState("");
  const [districtId, setDistrictId] = useState(""); const [ambulanceType, setAmbulanceType] = useState<"NORMAL"|"BLS"|"VENTILATOR">("BLS");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [districtPicker,setDistrictPicker]=useState(false);
  const submit = async () => {
    if (!fullName.trim() || !phone.trim() || !licenseNumber.trim() || !plateNumber.trim() || !districtId.trim()) { setError("Complete all required fields."); return; }
    const hasTechnicianDetails = Boolean(technicianName.trim() || technicianPhone.trim() || technicianQualification.trim() || technicianCertification.trim());
    if (hasTechnicianDetails && (!technicianName.trim() || !technicianPhone.trim())) {
      setError("Technician details are optional, but if you enter them, both name and mobile number are required.");
      return;
    }
    try {
      setLoading(true); setError("");
      await registerAmbulanceDriver({fullName:fullName.trim(),phone:phone.trim(),licenseNumber:licenseNumber.trim(),plateNumber:plateNumber.trim(),ambulanceType,districtId:districtId.trim()});
      if (technicianName.trim() || technicianPhone.trim() || technicianQualification.trim() || technicianCertification.trim()) {
        try {
          await addTechnician({fullName:technicianName.trim(),phone:technicianPhone.trim(),qualification:technicianQualification.trim() || undefined,certificationNumber:technicianCertification.trim() || undefined});
        } catch (technicianError: any) {
          setError(`Driver profile was registered, but technician details could not be saved. Add them later in Profile. ${technicianError?.message || ""}`);
          return;
        }
      }
      Alert.alert("Registration submitted","Your ambulance driver profile has been submitted.",[{text:"Continue",onPress:()=>navigation.replace("PendingApproval")}]);
    } catch(e:any) { setError(e?.message || "Unable to register ambulance driver."); } finally { setLoading(false); }
  };
  const field=(label:string,value:string,set:(v:string)=>void,kb?:any)=> <View><Text style={styles.label}>{label}{label.startsWith("Technician") || label === "Qualification" || label === "Certification number" ? " (optional)" : " *"}</Text><TextInput value={value} onChangeText={set} keyboardType={kb} editable={!loading} style={styles.input} placeholder={label}/></View>;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>navigation.goBack()}><Text style={styles.back}>‹  Back</Text></Pressable><Text style={styles.eyebrow}>UYIR · PROVIDER ONBOARDING</Text><Text style={styles.title}>Ambulance Registration</Text><Text style={styles.subtitle}>Register your driver profile and ambulance details.</Text>
    <View style={styles.card}>{field("Driver full name",fullName,setFullName)}{field("Mobile number",phone,setPhone,"phone-pad")}{field("Driving licence number",licenseNumber,setLicenseNumber)}{field("Vehicle registration number",plateNumber,setPlateNumber)}<View><Text style={styles.label}>District *</Text><Pressable onPress={()=>setDistrictPicker(true)} style={[styles.input,{flexDirection:"row",justifyContent:"space-between"}]}><Text style={{color:districtId?"#152238":"#98A2B3"}}>{districtId||"Select district"}</Text><Text style={{color:"#173FD1"}}>⌄</Text></Pressable></View>
    <Text style={styles.label}>Ambulance type *</Text><View style={styles.chipRow}>{(["NORMAL","BLS","VENTILATOR"] as const).map(v=><Pressable key={v} onPress={()=>setAmbulanceType(v)} style={[styles.chip,ambulanceType===v&&styles.chipActive]}><Text style={{color:ambulanceType===v?"#173FD1":"#344054",fontWeight:"700"}}>{v}</Text></Pressable>)}</View>
    <Text style={{color:"#667085",fontSize:12,marginTop:10,lineHeight:17}}>The current driver-profile API accepts these fields. It does not expose a document-photo upload field.</Text>
    <Text style={{color:"#152238",fontSize:17,fontWeight:"800",marginTop:22}}>Technician details <Text style={{color:"#667085",fontSize:12,fontWeight:"500"}}>(optional)</Text></Text>
    <Text style={{color:"#667085",fontSize:12,marginTop:5,lineHeight:17}}>You can add a technician now or skip this section and add one later from Profile.</Text>
    {field("Technician full name",technicianName,setTechnicianName)}
    {field("Technician mobile number",technicianPhone,setTechnicianPhone,"phone-pad")}
    {field("Qualification",technicianQualification,setTechnicianQualification)}
    {field("Certification number",technicianCertification,setTechnicianCertification)}
    {error?<Text style={styles.error}>{error}</Text>:null}
    <Pressable onPress={submit} disabled={loading} style={[styles.button,loading&&{opacity:.6}]}>{loading?<ActivityIndicator color="#fff"/>:<Text style={styles.buttonText}>Submit registration</Text>}</Pressable></View>
  </ScrollView><Modal visible={districtPicker} transparent animationType="slide" onRequestClose={()=>setDistrictPicker(false)}><View style={{flex:1,backgroundColor:"#0006",justifyContent:"flex-end"}}><View style={{maxHeight:"70%",backgroundColor:"white",borderTopLeftRadius:20,borderTopRightRadius:20,padding:18}}><Text style={{fontSize:18,fontWeight:"900",color:"#152238",marginBottom:12}}>Select district</Text><ScrollView>{DISTRICTS.map(d=><Pressable key={d} onPress={()=>{setDistrictId(d);setDistrictPicker(false);}} style={{paddingVertical:13,borderBottomWidth:1,borderBottomColor:"#EEF1F6"}}><Text style={{color:"#152238"}}>{d}</Text></Pressable>)}</ScrollView><Pressable onPress={()=>setDistrictPicker(false)} style={{padding:12,alignItems:"center"}}><Text style={{color:"#173FD1",fontWeight:"800"}}>Cancel</Text></Pressable></View></View></Modal></SafeAreaView>;
}
