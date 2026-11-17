import { proApi } from "./client";

export function getDashboard(proId: string) {
  return proApi(`/pro/${proId}/dashboard`);
}

export function getDailyProgress(proId: string) {
  return proApi(`/pro/${proId}/daily-progress`);
}

export function getWeeklyProgress(proId: string) {
  return proApi(`/pro/${proId}/weekly-progress`);
}
