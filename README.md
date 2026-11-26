# BlueMouse — Bluetooth Wireless Mouse & Keyboard

BlueMouse turns an Android 9+ smartphone into a real Bluetooth HID peripheral (composite mouse and keyboard) using Android's native `android.bluetooth.BluetoothHidDevice` API and Capacitor.

## Architecture Overview

- **Frontend (`src/`)**: React + TypeScript + Tailwind CSS UI with Connection Dashboard, Wireless Mouse Touchpad, Virtual US QWERTY Keyboard, Combined Mode, and Settings + Testing Checklist.
- **HID Utilities (`src/hid/`)**:
  - `hidReports.ts`: Binary report builders for Report ID `1` (Mouse: buttons, dx, dy, vertical wheel, horizontal AC pan) and Report ID `2` (Keyboard: modifier bitmask, reserved byte, 6-key rollover array).
  - `usQwertyKeymap.ts`: USB HID Usage Page `0x07` scancodes, Windows/desktop shortcuts, and unsupported Unicode character detection.
- **Capacitor Bridge (`src/bridge/bluetoothHidBridge.ts`)**: Exposes typed calls to the native Android `BluetoothHID` plugin and strictly refuses to fake devices or connections when running in a standard web browser.
- **Native Android Kotlin (`android/app/src/main/java/com/bluemouse/app/`)**:
  - `HidReportDescriptor.kt`: Composite Mouse + Keyboard SDP HID report descriptor.
  - `BluetoothHidManager.kt`: Manages `BluetoothProfile.HID_DEVICE`, `BluetoothHidDevice.registerApp()`, `connect()`, `disconnect()`, `sendReport()`, `unregisterApp()`, and `BluetoothHidDevice.Callback`.
  - `BluetoothHIDPlugin.kt`: Capacitor plugin handling Android 12+ (`BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`) and legacy runtime permissions, Bluetooth enable/discoverability intents, and pause/resume lifecycle cleanup.
  - `MainActivity.kt`: Registers `BluetoothHIDPlugin`.

## Setup, Build & APK Generation

1. Install dependencies and build the production web bundle:
   ```bash
   npm install
   npm run build
   ```
2. Sync web assets and Capacitor plugins into Android:
   ```bash
   npx cap sync android
   ```
3. Generate the Android APK (requires Android Studio / Android SDK 34 + JDK 17):
   - Open in Android Studio: `npx cap open android` -> **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Or via Gradle CLI:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
   - Resulting APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Note on Physical Device Testing

Android emulators and desktop web browsers do not expose physical `BluetoothHidDevice` radio hardware. Install the generated APK onto a physical Android 9+ device to verify pairing with Windows 10/11 or another Android HID Host device.
