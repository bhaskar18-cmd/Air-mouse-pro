import type {
  BlueMouseSettings,
  ConnectionHistoryEntry,
  TestingChecklistItem,
} from '../types/bluetooth';

const SETTINGS_KEY = 'bluemouse_settings_v1';
const HISTORY_KEY = 'bluemouse_history_v1';
const ONBOARDING_KEY = 'bluemouse_onboarding_done_v1';
const CHECKLIST_KEY = 'bluemouse_testing_checklist_v1';

export const DEFAULT_SETTINGS: BlueMouseSettings = {
  mouseSensitivity: 1.25,
  pointerSpeed: 'adaptive',
  scrollSpeed: 1.2,
  naturalScrolling: false,
  handedness: 'right',
  hapticFeedback: true,
  theme: 'dark',
  keyboardLayout: 'us-qwerty',
  autoReconnect: true,
  lastDeviceAddress: null,
  showHidDiagnostics: false,
};

export const DEFAULT_TESTING_CHECKLIST: TestingChecklistItem[] = [
  {
    id: 'test-permissions',
    number: 1,
    title: 'Bluetooth permission handling',
    verificationSteps:
      'Launch on Android 12+ (API 31+) with BLUETOOTH_CONNECT & BLUETOOTH_SCAN denied, then grant and deny again.',
    expectedResult:
      'App prompts runtime permission cleanly, displays clear denial recovery guidance, and enables HID controls once granted.',
    completed: false,
  },
  {
    id: 'test-hid-reg',
    number: 2,
    title: 'HID registration',
    verificationSteps:
      'Tap Register HID Peripheral on the Dashboard with Bluetooth enabled.',
    expectedResult:
      'BluetoothHidDevice.registerApp() triggers onAppStatusChanged(registered = true) and dashboard updates to Waiting for pairing.',
    completed: false,
  },
  {
    id: 'test-win-pair',
    number: 3,
    title: 'Windows pairing',
    verificationSteps:
      'Tap Make Discoverable, open Windows Bluetooth settings -> Add device -> Bluetooth, and select the Android phone.',
    expectedResult:
      'Windows identifies the phone as a Keyboard/Mouse composite HID peripheral and pairs without installing any receiver software.',
    completed: false,
  },
  {
    id: 'test-pointer',
    number: 4,
    title: 'Mouse pointer movement',
    verificationSteps:
      'Swipe smoothly with one finger across the Mouse touchpad in slow circles and fast flicks.',
    expectedResult:
      'Host cursor moves smoothly without jitter or lag; sensitivity and adaptive speed curve visibly scale cursor travel.',
    completed: false,
  },
  {
    id: 'test-clicks',
    number: 5,
    title: 'Left, middle, and right click buttons',
    verificationSteps:
      'Tap the touchpad surface (confirm no click occurs), then test the dedicated Left Click, Middle Click, and Right Click buttons below the touchpad.',
    expectedResult:
      'Touchpad taps do nothing; dedicated buttons send accurate HID press and release reports and respect left-handed swap.',
    completed: false,
  },
  {
    id: 'test-double-click',
    number: 6,
    title: 'Double click & Drag & Drop Lock',
    verificationSteps:
      'Press the Double Click button on a desktop icon, then enable Drag & Drop Lock, swipe one finger across the touchpad, and turn the lock off.',
    expectedResult:
      'Double Click opens the item cleanly; Drag Lock holds the left mouse button during cursor movement and releases it immediately when disabled.',
    completed: false,
  },
  {
    id: 'test-scroll',
    number: 7,
    title: 'Two-finger vertical & horizontal scrolling',
    verificationSteps:
      'Place two fingers on the touchpad and drag vertically in a long page, then horizontally in a wide table.',
    expectedResult:
      'Vertical wheel and horizontal AC Pan reports scroll smoothly; Natural Scrolling toggle reverses direction.',
    completed: false,
  },
  {
    id: 'test-typing',
    number: 8,
    title: 'Keyboard typing & symbols layout',
    verificationSteps:
      'Open Notepad on the host and type letters, numbers, punctuation, Shift/Caps Lock, Backspace, Enter, and F1-F12.',
    expectedResult:
      'Every key sends matching press (key-down) and release (key-up) HID reports with zero stuck keys.',
    completed: false,
  },
  {
    id: 'test-shortcuts',
    number: 9,
    title: 'Keyboard shortcuts',
    verificationSteps:
      'Trigger Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+Z, Alt+Tab, Win+D, and Ctrl+Shift+Esc from the shortcut strip or held modifiers.',
    expectedResult:
      'Host executes each multi-key chord cleanly and immediately releases all modifier bits afterwards.',
    completed: false,
  },
  {
    id: 'test-reconnect',
    number: 10,
    title: 'Disconnection and reconnection',
    verificationSteps:
      'Disconnect from BlueMouse (confirming dialog), then reconnect to the paired host from Connection Dashboard.',
    expectedResult:
      'All held keys release before disconnect; reconnecting restores HID control and updates Connection History.',
    completed: false,
  },
  {
    id: 'test-lifecycle',
    number: 11,
    title: 'App backgrounding and foregrounding',
    verificationSteps:
      'Send BlueMouse to background (Home button) for 15 seconds while paired, then reopen BlueMouse.',
    expectedResult:
      'Plugin releases any active keys on pause, respects Android HID lifecycle, and verifies/restores HID app registration on resume.',
    completed: false,
  },
  {
    id: 'test-unsupported',
    number: 12,
    title: 'Unsupported devices & browser guard',
    verificationSteps:
      'Open BlueMouse in a desktop/mobile web browser or on Android < 9 without BluetoothHidDevice.',
    expectedResult:
      'App honestly reports that native Android Bluetooth HID is unavailable and never shows a fake connection or simulated pairing.',
    completed: false,
  },
];

export function loadSettings(): BlueMouseSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: BlueMouseSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadConnectionHistory(): ConnectionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendConnectionHistory(entry: ConnectionHistoryEntry): ConnectionHistoryEntry[] {
  const existing = loadConnectionHistory();
  const next = [entry, ...existing].slice(0, 15);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function clearConnectionHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore
  }
}

export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(completed: boolean): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

export function loadTestingChecklist(): TestingChecklistItem[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return DEFAULT_TESTING_CHECKLIST;
    const saved = JSON.parse(raw) as Array<{ id: string; completed: boolean }>;
    const map = new Map(saved.map((item) => [item.id, item.completed]));
    return DEFAULT_TESTING_CHECKLIST.map((item) => ({
      ...item,
      completed: map.get(item.id) ?? item.completed,
    }));
  } catch {
    return DEFAULT_TESTING_CHECKLIST;
  }
}

export function saveTestingChecklist(items: TestingChecklistItem[]): void {
  try {
    const compact = items.map((i) => ({ id: i.id, completed: i.completed }));
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(compact));
  } catch {
    // Ignore
  }
}
