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
): Promise<{ kind: "otp"; challenge: LoginChallenge } | { kind: "tokens"; tokens: LoginTokens }> {
  const { status, data } = await post("/auth/google/native", { idToken, clientId: CLIENT_ID });
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
