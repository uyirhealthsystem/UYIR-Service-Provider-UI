import { teleconsultationApi } from './client';
export const addDoctorFeedback=(appointmentId:string,payload:{overallRating:number;communicationRating:number;experienceRating:number;cooperationRating:number;comments:string})=>teleconsultationApi(`/teleconsultation/appointments/${encodeURIComponent(appointmentId)}/feedback/add`,{method:'POST',body:JSON.stringify(payload)});
export const getMyDoctorFeedback=()=>teleconsultationApi('/teleconsultation/feedback/me',{method:'GET'});
