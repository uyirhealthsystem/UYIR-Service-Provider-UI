// Authentication business logic: what happens once authservice has issued
// tokens (after the login code was verified, or straight from the password
// step when the server runs with LOGIN_OTP_ENABLED=false). Checks whether the
// provider has finished their role-specific registration and either sends
// them to that registration screen or signs them in. Moved unchanged from
// screens/OTP.tsx so both Login and OTP can use it.
import { getProviderMe } from "../providers/ecg-on-wheels/api/getProviderMe";
import { getMyProfile as getAmbulanceProfile } from "../providers/ambulance/api/profile";
import { getProfile } from "../providers/health-partner/api/profile";
import { setLaboratoryAccessToken } from "../providers/laboratory/api/client";
import { getProviderRegistrationStatus } from "../providers/laboratory/api/laboratory";
import { setProUserId } from "../providers/pro/api/client";
import { getMyProfile } from "../providers/pro/api/profile";
import { getMyProfile as getHbcProfile } from "../providers/home-based-care/api/profile";
import { setHbcUserId } from "../providers/home-based-care/api/client";
import { getMyCollectorProfile } from "../providers/lab-sample-collector/api/collector";
import { setAuthSession } from "./session";
import { getUserIdFromAccessToken } from "./token";

function isHealthPartnerProfileMissing(data: any): boolean {
  if (data == null) return true;

  if (typeof data?.registered === "boolean") return !data.registered;
  if (typeof data?.isRegistered === "boolean") return !data.isRegistered;
  if (typeof data?.data?.registered === "boolean") return !data.data.registered;
  if (typeof data?.data?.isRegistered === "boolean") return !data.data.isRegistered;

  const message = String(
    data?.message || data?.error?.message || data?.data?.message || "",
  ).toLowerCase();
  if (/(not found|not registered|no profile|profile does not exist|user does not exist)/.test(message)) {
    return true;
  }

  const profile = data?.data?.profile ?? data?.profile ?? data?.data ?? data;
  if (!profile || typeof profile !== "object") return true;
  if (Object.keys(profile).length === 0) return true;

  // The HP collection's GET /api/v1/profile response includes fullName and districtName.
  return !(
    profile.fullName ||
    profile.name ||
    profile.healthPartnerId ||
    profile.id ||
    profile.userId ||
    profile.districtId ||
    profile.districtName
  );
}

function isRegisteredResponse(data: any) {
  if (typeof data === "boolean") {
    return data;
  }

  if (typeof data?.registered === "boolean") {
    return data.registered;
  }

  if (typeof data?.isRegistered === "boolean") {
    return data.isRegistered;
  }

  if (typeof data?.data?.registered === "boolean") {
    return data.data.registered;
  }

  if (typeof data?.data?.isRegistered === "boolean") {
    return data.data.isRegistered;
  }

  return true;
}


export async function completeProviderLogin(
  params: { role?: string; accessToken?: string; refreshToken?: string },
  { navigation, setUser }: { navigation: any; setUser: (user: any) => void },
): Promise<void> {
  const normalizedRole = String(params.role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  // The Health Partner service contract uses the short role code HP.
  const role = ["HP", "HEALTH_PARTNER", "HEALTHPARTNER"].includes(normalizedRole)
    ? "HP"
    : normalizedRole;
  const isHealthPartnerRole = role === "HP";
  const accessToken = params.accessToken;
  const refreshToken = params.refreshToken;

  if (!accessToken) {
    throw new Error("Access token not received");
  }

  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    throw new Error("User ID (sub) not found in access token");
  }

  console.log("Provider role:", role);
  console.log("User ID from access token sub:", userId);

  if (role === "LS") {
    setLaboratoryAccessToken(accessToken, userId);

    setAuthSession({
      accessToken,
      refreshToken,
      userId,
      role,
    });

    try {
      const registration = await getProviderRegistrationStatus();

      console.log("LS registration check:", registration.registered);

      if (!registration.registered) {
        navigation.replace("LaboratoryRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
    } catch (checkError: any) {
      console.log("LS registration check error:", checkError);
      throw checkError;
    }
  }

  if (isHealthPartnerRole) {
    // Put the authenticated token in the API session so the HP service
    // can check whether this Auth user already has an HP profile.
    setAuthSession({
      accessToken,
      refreshToken,
      userId,
      role,
    });

    try {
      const profileResponse = await getProfile();
      const profileMissing = isHealthPartnerProfileMissing(profileResponse);

      console.log("HP registration profile response:", profileResponse);
      console.log("HP registration check - profile missing:", profileMissing);

      if (profileMissing) {
        navigation.replace("HealthPartnerRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
    } catch (checkError: any) {
      console.log("HP registration check error:", checkError);

      // The HP service answers a missing profile with 400
      // { message: "Health Partner not found" }, not 404.
      if (
        checkError?.status === 404 ||
        (checkError?.status === 400 && isHealthPartnerProfileMissing(checkError?.data))
      ) {
        navigation.replace("HealthPartnerRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }

      throw checkError;
    }
  }

  if (
    role === "ECG" ||
    role === "ECG_ON_WHEELS" ||
    role === "ECG_ON_WHEEL"
  ) {
    setAuthSession({
      accessToken,
      refreshToken,
      userId,
      role,
    });

    try {
      const providerResponse = await getProviderMe();
      const provider =
        providerResponse?.data ??
        providerResponse?.provider ??
        providerResponse;
      console.log(
        "ECG registration check:",
        Boolean(provider?.id || provider?.providerId),
      );

      if (!provider?.id && !provider?.providerId) {
        navigation.replace("ECGRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
    } catch (checkError: any) {
      console.log("ECG registration check error:", checkError);
      if (checkError?.status === 404) {
        navigation.replace("ECGRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
      throw checkError;
    }
  }

  if (role === "HBC") {
    setAuthSession({ accessToken, refreshToken, userId, role });
    setHbcUserId(userId);

    // GET /api/v1/hbc/provider/profile — 404 means no provider profile yet.
    try {
      await getHbcProfile();
    } catch (profileError: any) {
      if (profileError?.status === 404) {
        navigation.replace("HBCRegistrationType", {
          sub: userId, role, accessToken, refreshToken,
        });
        return;
      }
      throw profileError;
    }
  }

  if (role === "AMBULANCE_DRIVER" || role === "AMBULANCE") {
    setAuthSession({ accessToken, refreshToken, userId, role });
    try {
      await getAmbulanceProfile();
    } catch (profileError: any) {
      if (profileError?.status === 404) {
        navigation.replace("AmbulanceRegistration", {
          sub: userId, role, accessToken, refreshToken,
        });
        return;
      }
      throw profileError;
    }
  }

  if (role === "HOSPITAL") {
    setAuthSession({ accessToken, refreshToken, userId, role });
  }

  if (role === "DOCTOR") {
    // The supplied Hospital collection has no doctor "me/profile" endpoint.
    // Keep the individual DoctorRegistration screen available via ProviderType;
    // do not guess a user-specific status endpoint here.
  }

  if (role === "LSC") {
    setAuthSession({ accessToken, refreshToken, userId, role });
    try {
      await getMyCollectorProfile();
    } catch (checkError: any) {
      const message = String(checkError?.message || "").toLowerCase();
      if (
        checkError?.status === 404 ||
        /not found|does not exist|no collector profile|collector not found for this user/.test(message)
      ) {
        navigation.replace("CollectorRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
      throw checkError;
    }
  }

  if (role === "PRO") {
    // Keep the signed-in session available to ProRegistration (and authFetch)
    // even if the screen is reached without route params.
    setAuthSession({ accessToken, refreshToken, userId, role });
    setProUserId(userId);

    try {
      const profileResponse = await getMyProfile(userId);
      const registered = isRegisteredResponse(profileResponse);

      console.log("PRO registration check:", registered);

      if (!registered) {
        navigation.replace("ProRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }
    } catch (checkError: any) {
      console.log("PRO registration check error:", checkError);

      if (checkError?.status === 404) {
        navigation.replace("ProRegistration", {
          sub: userId,
          role,
          accessToken,
          refreshToken,
        });
        return;
      }

      throw checkError;
    }
  }

  setUser({
    id: userId,
    sub: userId,
    providerType: role,
    role,
    accessToken,
    refreshToken,
  });
}
