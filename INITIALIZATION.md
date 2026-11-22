# Service Provider Uyir: Initialization Guide

How to set up and run the app on Windows with the Android emulator. Run every command in **PowerShell**.

> **Expo Go does not work for this app.** The app uses native modules (100ms video, Google Sign-In, Maps), so it must be built and installed on the emulator once. After that, starting it takes seconds.

## Quick start

Already set up? This is all you need each day.

**Terminal 1: start the emulator** (skip if it is already open)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_37.0
```

**Terminal 2: start the app**

```powershell
cd C:\Users\param\Downloads\service-provider
npx expo start --dev-client
```

When the Expo menu appears, press `a` to open the app on the emulator.

---

## 1. Install the required tools

You only need to do this once per computer.

| Tool | Version | How to get it |
| --- | --- | --- |
| Node.js | 22.13 or newer | [nodejs.org](https://nodejs.org) (LTS) |
| JDK | **17** (not newer) | `winget install Microsoft.OpenJDK.17` |
| Android Studio | Latest | [developer.android.com/studio](https://developer.android.com/studio) |
| Android SDK Platform | 36 | Android Studio > Settings > Languages & Frameworks > Android SDK |
| Android SDK Build-Tools and Emulator | Latest | Same screen, **SDK Tools** tab |

### Create an emulator

1. Open Android Studio.
2. Go to **More Actions > Virtual Device Manager**.
3. Click **Create virtual device**, pick a phone, and finish the wizard.

This project's commands use a device named `Medium_Phone_API_37.0`. To see the names on your computer, run:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -list-avds
```

## 2. Set the environment variables

Run these once, then **close and reopen every terminal and VS Code**.

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot", "User")
```

If your JDK version is different, find the correct folder name with:

```powershell
Get-ChildItem "C:\Program Files\Microsoft" -Directory -Filter "jdk-*"
```

> **Why JDK 17?** Android Studio's built-in Java 25 makes the native build fail at `configureCMakeDebug`.

Add the Android tools to your `PATH`:

```powershell
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
```

Open a new terminal and check that everything is found:

```powershell
node -v
java -version
adb --version
$env:ANDROID_HOME
```

`java -version` must show **17**.

## 3. Install the project packages

```powershell
cd C:\Users\param\Downloads\service-provider
npm install
```

## 4. Add the local settings file

Create a file named `.env.local` in the project folder. Git ignores this file, so a fresh copy of the project will not have it.

```dotenv
EXPO_PUBLIC_HBC_API_URL=
EXPO_PUBLIC_GATEWAY_SHARED_SECRET=
```

Ask the backend team for these values, and never commit them.

The app still starts without this file because each API has a default address. Without the secret, Home Based Care requests are sent without the gateway header.

<details>
<summary>All optional settings</summary>

Set any of these in `.env.local` to override the default.

| Variable | Used for | Default |
| --- | --- | --- |
| `EXPO_PUBLIC_AUTH_API_URL` | Login and accounts | `http://15.252.58.211` |
| `EXPO_PUBLIC_API_URL` | Fallback for login and accounts | None |
| `EXPO_PUBLIC_HOSPITAL_API_URL` | Hospital and Doctor | `http://13.201.204.85:8078` |
| `EXPO_PUBLIC_HOSPITAL_WS_URL` | Hospital live updates | Built from the Hospital URL |
| `EXPO_PUBLIC_LAB_API_URL` | Lab Sample Collector | `http://13.233.101.200:8082` |
| `EXPO_PUBLIC_LAB_SCAN_API_URL` | Laboratory | `http://13.233.101.200:8082` |
| `EXPO_PUBLIC_LAB_REGISTRATION_API_URL` | Laboratory registration | `http://13.233.101.200:8082` |
| `EXPO_PUBLIC_ECG_API_URL` | ECG on Wheels | `http://15.206.187.171:8083` |
| `EXPO_PUBLIC_AMBULANCE_API_URL` | Ambulance | `http://3.108.55.248` |
| `EXPO_PUBLIC_TELECONSULTATION_API_URL` | Teleconsultation | `http://13.203.67.193:8082/api/v1` |
| `EXPO_PUBLIC_HBC_API_URL` | Home Based Care | `http://15.252.164.86:4000` |
| `EXPO_PUBLIC_GATEWAY_SHARED_SECRET` | Home Based Care gateway | Empty |
| `EXPO_PUBLIC_PRO_API_URL` | PRO | `http://3.6.236.124` |
| `EXPO_PUBLIC_HEALTH_PARTNER_API_URL` | Health Partner | `http://13.235.76.15:3000` |

After changing this file, restart with `npx expo start --dev-client --clear`.

</details>

## 5. Build and run the app for the first time

Start the emulator and wait for the phone's home screen:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_37.0
```

In a **second terminal**, build and install the app:

```powershell
cd C:\Users\param\Downloads\service-provider
npx expo run:android
```

The first build can take **5 to 25 minutes**. When it finishes, the app opens on the emulator. Keep this terminal open while you work.

From now on, use the [Quick start](#quick-start).

---

## When do I need to rebuild?

| What changed | What to do |
| --- | --- |
| Code in `src/` | Nothing. The app updates when you save. |
| `.env.local` | `npx expo start --dev-client --clear` |
| `app.json` or a new native package | `npx expo run:android` |
| Native build is badly broken | `npx expo prebuild --clean`, then `npx expo run:android` |

> `npx expo prebuild --clean` deletes and recreates the `android` folder, so any manual edits inside it are lost.

## Expo menu keys

| Key | Action |
| --- | --- |
| `a` | Open the app on the emulator |
| `r` | Reload the app |
| `m` | Open the developer menu |
| `Ctrl + C` | Stop the server |

## Build an APK for a real phone

```powershell
cd C:\Users\param\Downloads\service-provider\android
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The APK is created at `android\app\build\outputs\apk\release\app-release.apk`.

> This APK is signed with the debug key. Use it for testing only. It cannot be published to the Play Store.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Build fails at `configureCMakeDebug`, or mentions a "restricted method" | Java is not version 17. Repeat step 2, then run the Gradle reset below. |
| `SDK location not found` | `ANDROID_HOME` is not set. Repeat step 2 and open a new terminal. |
| `adb` or `emulator` is not recognized | The `PATH` is not set. Repeat step 2 and open a new terminal. |
| `No Android connected device found` | Start the emulator and wait for the home screen. |
| Port 8081 is already in use | Close the other Expo terminal, or stop the process shown by the command below. |
| Pressing `a` opens Expo Go or asks to install it | Start with `npx expo start --dev-client`. |
| App cannot connect to the development server | Run `adb reverse tcp:8081 tcp:8081`, then press `r`. |
| Old code or old settings still appear | `npx expo start --dev-client --clear` |
| Google Sign-In shows `DEVELOPER_ERROR` | The Android OAuth client must be in the same Google Cloud project as the web client, with package `com.uyir.serviceprovider` and your SHA-1. |
| Emulator is frozen | Follow the emulator reset below. |

**Gradle reset** (after changing Java version)

```powershell
cd C:\Users\param\Downloads\service-provider\android
.\gradlew --stop
cd ..
npx expo run:android
```

**Find what is using port 8081**

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081 -State Listen).OwningProcess
```

**Find your SHA-1 for Google Sign-In**

```powershell
cd C:\Users\param\Downloads\service-provider\android
.\gradlew :app:signingReport
```

**Emulator reset**

```powershell
adb emu kill
adb kill-server
adb start-server
```

Then in Android Studio, open **Device Manager**, click **⋮** next to your device, and choose **Cold Boot Now**. When it has started, run:

```powershell
npx expo start --dev-client --clear
```
