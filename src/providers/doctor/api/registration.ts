import { authFetch, getAccessToken, getAuthUserId, getAuthRole } from "../../../auth/session";
import { DOCTOR_API_BASE_URL } from "../config/env";
const HOSPITAL_BASE_URL = DOCTOR_API_BASE_URL;
export async function createDoctor(payload: Record<string, any>) {
 const token=getAccessToken();const userId=getAuthUserId();if(!token||!userId)throw new Error("Please login again before registering your doctor profile.");
 const response=await authFetch(`${HOSPITAL_BASE_URL}/api/v1/hospital/doctors`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json",Authorization:`Bearer ${token}`,"X-User-Id":userId,"X-User-Role":getAuthRole()||"DOCTOR"},body:JSON.stringify(payload)});
 const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.error?.message||data?.message||"Unable to register doctor.");return data;
}
export async function getDoctorSpecialtyMaster(): Promise<any[]> {
 const response=await fetch(`${HOSPITAL_BASE_URL}/api/v1/hospital/specialties`,{headers:{Accept:"application/json"}});
 const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.message||"Unable to load specialties.");const result=data?.data??data;return Array.isArray(result)?result:Array.isArray(result?.items)?result.items:[];
}
export async function getDoctorEmergencyMaster(): Promise<any[]> {
 const response=await fetch(`${HOSPITAL_BASE_URL}/api/v1/hospital/emergency-conditions`,{headers:{Accept:"application/json"}});
 const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.message||"Unable to load emergency conditions.");const result=data?.data??data;return Array.isArray(result)?result:Array.isArray(result?.items)?result.items:[];
}
