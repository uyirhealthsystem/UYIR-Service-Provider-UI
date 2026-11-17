import { teleconsultationApi } from './client';
export const addComplaint=(payload:{appointmentId:string;category:string;subject:string;description:string})=>teleconsultationApi('/teleconsultation/complaint/add',{method:'POST',body:JSON.stringify(payload)});
export const getMyComplaints=()=>teleconsultationApi('/teleconsultation/complaints/me',{method:'GET'});
export const getComplaint=(id:string)=>teleconsultationApi(`/teleconsultation/complaints/${encodeURIComponent(id)}`,{method:'GET'});
export const cancelComplaint=(id:string)=>teleconsultationApi(`/teleconsultation/complaints/${encodeURIComponent(id)}/cancel`,{method:'PATCH'});
