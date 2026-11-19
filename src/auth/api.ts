// Authentication API - email/password login with the emailed sign-in code.
//
//   loginWithEmail()   -> password step. Either { kind: "otp", challenge } (code
//                         emailed - show the OTP screen) or { kind: "tokens" }
//                         (server has LOGIN_OTP_ENABLED=false - already logged in).
//   verifyLoginCode()  -> challengeId + 6-digit code -> tokens.
//   resendLoginCode()  -> emails a fresh code for the same challenge.
import { AUTH_BASE_URL } from "../config/env";

export const CLIENT_ID = "service-provider-app";

export interface LoginChallenge {
  otpRequired: true;
  challengeId: string;
  email: string; // masked, e.g. "me***@gmail.com"
  codeLength: number;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface LoginTokens {
  accessToken: string;
  refreshToken?: string;
  role: string;
}

/** Error from authservice, carrying its `error.code` (e.g. INVALID_LOGIN_CODE). */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function post(path: string, body: unknown): Promise<{ status: number; data: any }> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("Unable to connect to server", 0, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AuthApiError(
      data?.error?.message || data?.message || "Something went wrong. Please try again.",
      response.status,
      data?.error?.code,
    );
  }
  return { status: response.status, data };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ kind: "otp"; challenge: LoginChallenge } | { kind: "tokens"; tokens: LoginTokens }> {
  const { status, data } = await post("/auth/email/login", { email, password, clientId: CLIENT_ID });
  if (status === 202 && data?.otpRequired) {
    return { kind: "otp", challenge: data as LoginChallenge };
  }
  return { kind: "tokens", tokens: data as LoginTokens };
}

/**
 * Google sign-in: send the Google ID token to authservice (POST /auth/google/native).
 * authservice never asks for the emailed code on Google login (Google already
 * proved the email) and returns tokens directly. No role is sent: an existing
 * account keeps its stored role; a brand-new account gets 400 ROLE_REQUIRED.
 * The 202/OTP branch is kept so the app copes if the server ever adds it.
 */
export async function loginWithGoogle(
  idToken: string,
  role?: string,
): Promise<{ kind: "otp"; challenge: LoginChallenge } | { kind: "tokens"; tokens: LoginTokens }> {
  // `role` is only sent when signing UP: authservice needs it to create a new
  // account on this multi-role portal, and ignores it for an existing account.
  const { status, data } = await post("/auth/google/native", {
    idToken,
    clientId: CLIENT_ID,
    ...(role ? { role } : {}),
  });
  if (status === 202 && data?.otpRequired) {
    return { kind: "otp", challenge: data as LoginChallenge };
  }
  return { kind: "tokens", tokens: data as LoginTokens };
}

export async function verifyLoginCode(challengeId: string, otp: string): Promise<LoginTokens> {
  const { data } = await post("/auth/email/login/verify", { challengeId, otp, clientId: CLIENT_ID });
  return data as LoginTokens;
}

export async function resendLoginCode(challengeId: string): Promise<LoginChallenge> {
  const { data } = await post("/auth/email/login/resend", { challengeId, clientId: CLIENT_ID });
  return data as LoginChallenge;
}

/** Provider kinds the service-provider-app portal accepts at registration (authservice SERVICE_PROVIDER_ROLES). */
export const PROVIDER_ROLES = [
  { role: "PRO", label: "PRO", description: "Public Relations Officer", icon: "👨‍💼" },
  { role: "AMBULANCE_DRIVER", label: "Ambulance", description: "Emergency and patient transport", icon: "🚑" },
  { role: "LS", label: "Laboratory / Scan Centre", description: "Diagnostic, pathology and imaging", icon: "🧪" },
  { role: "DOCTOR", label: "Doctor", description: "Doctor profile and qualifications", icon: "🩺" },
  { role: "HOSPITAL", label: "Hospital", description: "Hospital administration", icon: "🏥" },
  { role: "HBC", label: "Home-Based Care", description: "Nurse, caretaker or physiotherapist", icon: "🏠" },
  { role: "ECG", label: "ECG on Wheels", description: "Mobile ECG at the patient's doorstep", icon: "💙" },
  { role: "HP", label: "Health Partner", description: "Community health partner", icon: "🤝" },
  { role: "LSC", label: "Lab Sample Collector", description: "Home sample collection", icon: "🧫" },
  { role: "TCS", label: "Teleconsultation", description: "Online consultations", icon: "💻" },
] as const;

export interface RegisterResult {
  id: string;
  email: string;
  role: string;
  status: string;
  /** true = an admin must approve the account before it can log in. */
  pendingApproval: boolean;
}

/** POST /auth/email/register - create an account for the chosen provider role. */
export async function registerWithEmail(email: string, password: string, role: string): Promise<RegisterResult> {
  const { data } = await post("/auth/email/register", { email, password, clientId: CLIENT_ID, role });
  return data as RegisterResult;
}

/**
 * POST /auth/password/forgot - emails a 6-digit reset code. Always succeeds
 * (202) whether or not the email has an account, so it can't be used to probe
 * for accounts. Also how a Google-only user sets a first password.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await post("/auth/password/forgot", { email, clientId: CLIENT_ID });
}

/** POST /auth/password/reset - redeem the emailed code and set a new password (signs out every device). */
export async function resetPassword(email: string, otp: string, password: string): Promise<void> {
  await post("/auth/password/reset", { email, otp, password });
}
