$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
cd android
.\gradlew -version

Launcher JVM: 17.0.20.1
Daemon JVM: C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot

cd ..
npx expo run:android

---

npx expo prebuild --clean
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
Test-Path "$env:ANDROID_HOME"
True
$env:ANDROID_HOME
npx expo run:android

---

pro
"email": "sample@gmail.com",
pwd : pass123!

Lab And scan
"email": "Ls@gmail.com",
pwd : pass123!

Labcollectors
"email": "labcollectors@gmail.com",
pwd : Password@123

Health partners
"email": "HealthPartner@gmail.com",
pwd : pass123!

Ecg On wheels
"email": "ECG1@gmail.com",
pwd : password123!

Ambulance
Email : AD@gamail.com
Pass : pass123!
AD1@gmail.com
pass123!

HBC
nurse2@gmail.com
pass123!
Phy@gmail.com
CT@gmail.com
nurse@gmail.com

not reg
pwd:pass123!
"email": "u1ecg@gmail.com",
"role": "ECG",
"email": "u1ls@gmail.com",
"role": "LS",
"email": "u1hps@gmail.com",
"role": "HOSPITAL",
"email": "u1hbc@gmail.com",
"role": "HBC",
u1pro@gmail.com

hospital@gmail.com
pass123!

h@gmail.com
12345678
==============================
Start everything from your own terminal:

1. Start the emulator. Use Android Studio → Device Manager → ▶ on Medium Phone API 37, or run:
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" 
   Wait until the Android home screen appears.
2. Start Metro in a second PowerShell window, from the project folder:
cd C:\Users\param\Downloads\service-provider
npx expo start
3. Press a. The app opens on the emulator, and it reloads automatically whenever you save a file in src/.

If the app shows a red error screen or a doesn't open it, paste the message here.

One limitation right now: the Metro server running in my session is in CI mode, so automatic reload when you save a file is off. For normal development, run Metro in your own terminal instead:

1. Tell me to stop my Metro server. It uses port 8081, so yours can't start while it's running.
2. Then in PowerShell, from the project folder:
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx expo start
   Press a to open the app on the emulator. Now when you save a file in src/, the app updates right away.

Next time you start working: open the emulator, then run npx expo start and press a. That takes seconds, not 22 minutes. Run npx expo run:android again only after adding a native package or changing app.json. It will need JAVA_HOME set to JDK 17.-avd Medium_Phone_API_37.0

========================================================
Terminal 1: start the emulator

Skip this if the emulator is already open.
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_37.0
Leave this window open and wait until the phone's home screen appears.

Terminal 2: build and run the app

cd C:\Users\param\Downloads\service-provider

# Use Java 17 in this window (this fixes the error)
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"

# Stop the old Gradle process that's still on Java 25
cd android; .\gradlew --stop; cd ..

# Build, install on the emulator, and start Expo
npx expo run:android
The first build takes about 5–15 minutes. When it finishes, the app opens on the emulator and Expo keeps running in that window.

Every time after that

You don't need to rebuild unless you add a new native package or change app.json. Just start the emulator (Terminal 1), then:
cd C:\Users\param\Downloads\service-provider
npx expo start --dev-client
Press a to open the app on the emulator. Press r to reload after you change code.

Make the Java fix permanent (optional)

The $env:JAVA_HOME = ... line only lasts until you close that window. To set it for good, run this once:
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot", "User")
Then close and reopen all terminals and VS Code. After that you can skip the $env:JAVA_HOME line.
=========================
## Build 
cd C:\Users\param\Downloads\service-provider\android
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
.\gradlew assembleRelease

## Phone only Build
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

=======================
Freeze Solution
adb emu kill
adb kill-server
adb start-server
Then cold boot the emulator from Android Studio's Device Manager (⋮ → Cold Boot Now), and run npx expo start --dev-client --clear.