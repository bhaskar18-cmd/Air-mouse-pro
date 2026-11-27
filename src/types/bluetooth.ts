export type AppScreen = 'dashboard' | 'mouse' | 'keyboard' | 'combined' | 'profiles' | 'settings';

export type BluetoothHardwareState =
  | 'unknown'
  | 'unavailable'
  | 'permission_required'
  | 'disabled'
  | 'turning_on'
  | 'enabled'
  | 'turning_off';

export type HidRegistrationState =
  | 'unregistered'
  | 'registering'
  | 'registered'
  | 'failed';

export type ConnectionPhase =
  | 'web_unsupported'
  | 'bluetooth_disabled'
  | 'bluetooth_enabled'
  | 'hid_pending'
  | 'waiting_for_pairing'
  | 'pairing_in_progress'
  | 'connected'
  | 'disconnected'
  | 'connection_failed';

export interface PairedBluetoothDevice {
  name: string;
  address: string;
  bondState: 'bonded' | 'bonding' | 'none';
  deviceClass?: number;
  isConnected?: boolean;
}

export interface ConnectionHistoryEntry {
  id: string;
  deviceName: string;
  deviceAddress: string;
  timestamp: number;
  status: 'connected' | 'disconnected' | 'failed';
  note?: string;
}

export interface BluetoothSupportInfo {
  isNativeAndroid: boolean;
  bluetoothSupported: boolean;
  hidProfileSupported: boolean;
  androidSdkInt: number;
  hasRequiredPermissions: boolean;
  missingPermissions: string[];
  reason?: string;
}

export interface BluetoothStatusSnapshot {
  isNativeAndroid: boolean;
  bluetoothState: BluetoothHardwareState;
  hidState: HidRegistrationState;
  connectionPhase: ConnectionPhase;
  connectedDevice: PairedBluetoothDevice | null;
  isDiscoverable: boolean;
  discoverableRemainingSeconds: number;
  lastError: string | null;
}

export interface MouseReportPayload {
  buttons: number; // Bit 0: Left, Bit 1: Right, Bit 2: Middle
  dx: number;      // -127..127
  dy: number;      // -127..127
  wheel: number;   // -127..127 (vertical)
  hWheel: number;  // -127..127 (horizontal AC pan)
}

export interface KeyboardReportPayload {
  modifiers: number;  // Bitmask: LCtrl(1), LShift(2), LAlt(4), LGui(8), RCtrl(16), RShift(32), RAlt(64), RGui(128)
  keycodes: number[]; // Up to 6 HID Usage IDs (6KRO)
}

export interface ConsumerReportPayload {
  usageCode: number; // 16-bit Consumer Page (0x0C) usage ID (0x0000 = release)
}

export interface HidPacketDiagnostic {
  timestamp: number;
  type: 'mouse' | 'keyboard' | 'consumer';
  reportId: number;
  bytesHex: string;
  summary: string;
}

export type PointerAccelerationCurve = 'linear' | 'adaptive' | 'precision';

export type KeyboardLayoutId = 'us-qwerty';

export interface BlueMouseSettings {
  mouseSensitivity: number; // 0.3 to 3.0
  pointerSpeed: PointerAccelerationCurve;
  scrollSpeed: number; // 0.5 to 3.0
  naturalScrolling: boolean;
  handedness: 'right' | 'left';
  hapticFeedback: boolean;
  theme: 'dark' | 'light';
  keyboardLayout: KeyboardLayoutId;
  autoReconnect: boolean;
  lastDeviceAddress: string | null;
  showHidDiagnostics: boolean;
}

export interface TestingChecklistItem {
  id: string;
  number: number;
  title: string;
  verificationSteps: string;
  expectedResult: string;
  completed: boolean;
}

export type ActionCategory = 'keyboard' | 'shortcut' | 'mouse' | 'media' | 'system';

export type ActionOsScope = 'universal' | 'windows' | 'android';

export type CustomActionType =
  | 'key_tap'
  | 'key_combo'
  | 'mouse_click'
  | 'mouse_double_click'
  | 'mouse_scroll'
  | 'consumer_tap'
  | 'drag_lock_toggle'
  | 'noop';

export interface HidActionDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: ActionCategory;
  osScope: ActionOsScope;
  actionType: CustomActionType;
  keycode?: number;
  modifiers?: number;
  keycodes?: number[];
  mouseButtonMask?: number;
  wheelDelta?: number;
  hWheelDelta?: number;
  consumerUsage?: number;
  badge?: string;
}

export type CustomKeyBinding =
  | {
      kind: 'library';
      actionId: string;
    }
  | {
      kind: 'custom_combo';
      label: string;
      modifiers: number;
      keycodes: number[];
      description?: string;
    };

export type MouseControlSlotId =
  | 'left_click'
  | 'right_click'
  | 'middle_click'
  | 'double_click'
  | 'aux_back'
  | 'aux_forward'
  | 'scroll_up'
  | 'scroll_down';

export type ProfileTemplateId = 'default' | 'gaming' | 'office' | 'browsing' | 'custom';

export interface ProfileTouchpadSettings {
  mouseSensitivity: number;
  pointerSpeed: PointerAccelerationCurve;
  scrollSpeed: number;
  naturalScrolling: boolean;
  handedness: 'right' | 'left';
}

export interface DeviceProfile {
  id: string;
  name: string;
  templateId: ProfileTemplateId;
  createdAt: number;
  updatedAt: number;
  keyMappings: Record<string, CustomKeyBinding>;
  mouseMappings: Partial<Record<MouseControlSlotId, CustomKeyBinding>>;
  touchpad: ProfileTouchpadSettings;
}

export interface DeviceConfigEntry {
  deviceAddress: string;
  deviceName: string;
  activeProfileId: string;
  defaultProfileId: string;
  profiles: DeviceProfile[];
  lastSeenAt: number;
}

export interface DeviceProfileStore {
  version: 1;
  devices: Record<string, DeviceConfigEntry>;
}

