import * as SecureStore from "expo-secure-store";

// The logged-in user and their tokens, kept in the Android Keystore / iOS Keychain
// so the app opens already signed in.
const KEY = "uyir.auth.user";

export type StoredUser = {
  id: string;
  sub: string;
  providerType: string;
  role: string;
  accessToken: string;
  refreshToken?: string;
};

export async function loadStoredUser(): Promise<StoredUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.accessToken && (user.sub || user.id) ? user : null;
  } catch (e) {
    console.log("Unable to read saved login:", e);
    return null;
  }
}

export async function saveStoredUser(user: StoredUser) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(user));
  } catch (e) {
    console.log("Unable to save login:", e);
  }
}

export async function clearStoredUser() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (e) {
    console.log("Unable to clear saved login:", e);
  }
}
