import type {
  ConsumerReportPayload,
  HidPacketDiagnostic,
  KeyboardReportPayload,
  MouseReportPayload,
} from '../types/bluetooth';

export const HID_REPORT_ID_MOUSE = 1;
export const HID_REPORT_ID_KEYBOARD = 2;
export const HID_REPORT_ID_CONSUMER = 3;

export const MOUSE_BUTTON_LEFT = 0x01;
export const MOUSE_BUTTON_RIGHT = 0x02;
export const MOUSE_BUTTON_MIDDLE = 0x04;

export const KEY_MOD_LCTRL = 0x01;
export const KEY_MOD_LSHIFT = 0x02;
export const KEY_MOD_LALT = 0x04;
export const KEY_MOD_LGUI = 0x08;
export const KEY_MOD_RCTRL = 0x10;
export const KEY_MOD_RSHIFT = 0x20;
export const KEY_MOD_RALT = 0x40;
export const KEY_MOD_RGUI = 0x80;

// USB HID Consumer Page (0x0C) Usage IDs supported by Report ID 3 (0x0000..0x03FF)
export const CONSUMER_USAGE = {
  RELEASE: 0x0000,
  PLAY_PAUSE: 0x00cd,
  NEXT_TRACK: 0x00b5,
  PREV_TRACK: 0x00b6,
  STOP: 0x00b7,
  MUTE: 0x00e2,
  VOLUME_UP: 0x00e9,
  VOLUME_DOWN: 0x00ea,
  AC_SEARCH: 0x0221,
  AC_HOME: 0x0223,
  AC_BACK: 0x0224,
  AC_FORWARD: 0x0225,
  AC_REFRESH: 0x0227,
} as const;

export function clampInt8(value: number): number {
  const rounded = Math.round(value);
  if (rounded > 127) return 127;
  if (rounded < -127) return -127;
  return rounded;
}

export function int8ToUint8(value: number): number {
  const clamped = clampInt8(value);
  return clamped < 0 ? 256 + clamped : clamped;
}

export function buildMouseReportBytes(payload: MouseReportPayload): Uint8Array {
  return new Uint8Array([
    payload.buttons & 0x07,
    int8ToUint8(payload.dx),
    int8ToUint8(payload.dy),
    int8ToUint8(payload.wheel),
    int8ToUint8(payload.hWheel),
  ]);
}

export function buildKeyboardReportBytes(payload: KeyboardReportPayload): Uint8Array {
  const keys = new Uint8Array(6);
  for (let i = 0; i < 6; i++) {
    keys[i] = (payload.keycodes[i] ?? 0) & 0xff;
  }
  return new Uint8Array([
    payload.modifiers & 0xff,
    0x00, // Reserved OEM byte
    keys[0],
    keys[1],
    keys[2],
    keys[3],
    keys[4],
    keys[5],
  ]);
}

export function buildConsumerReportBytes(payload: ConsumerReportPayload): Uint8Array {
  const code = Math.max(0, Math.min(0x03ff, Math.round(payload.usageCode)));
  return new Uint8Array([code & 0xff, (code >> 8) & 0xff]);
}

export function formatHexPacket(reportId: number, bytes: Uint8Array): string {
  const all = [reportId, ...Array.from(bytes)];
  return all.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function createMouseDiagnostic(payload: MouseReportPayload): HidPacketDiagnostic {
  const bytes = buildMouseReportBytes(payload);
  const btnNames: string[] = [];
  if (payload.buttons & MOUSE_BUTTON_LEFT) btnNames.push('L');
  if (payload.buttons & MOUSE_BUTTON_RIGHT) btnNames.push('R');
  if (payload.buttons & MOUSE_BUTTON_MIDDLE) btnNames.push('M');
  return {
    timestamp: Date.now(),
    type: 'mouse',
    reportId: HID_REPORT_ID_MOUSE,
    bytesHex: formatHexPacket(HID_REPORT_ID_MOUSE, bytes),
    summary: `Btn:[${btnNames.join('+') || 'none'}] dX:${clampInt8(payload.dx)} dY:${clampInt8(payload.dy)} W:${clampInt8(payload.wheel)} H:${clampInt8(payload.hWheel)}`,
  };
}

export function createKeyboardDiagnostic(payload: KeyboardReportPayload): HidPacketDiagnostic {
  const bytes = buildKeyboardReportBytes(payload);
  const activeKeys = payload.keycodes.filter((k) => k > 0).map((k) => `0x${k.toString(16).padStart(2, '0').toUpperCase()}`);
  return {
    timestamp: Date.now(),
    type: 'keyboard',
    reportId: HID_REPORT_ID_KEYBOARD,
    bytesHex: formatHexPacket(HID_REPORT_ID_KEYBOARD, bytes),
    summary: `Mod:0x${(payload.modifiers & 0xff).toString(16).padStart(2, '0').toUpperCase()} Keys:[${activeKeys.join(',') || 'release'}]`,
  };
}

export function createConsumerDiagnostic(payload: ConsumerReportPayload): HidPacketDiagnostic {
  const bytes = buildConsumerReportBytes(payload);
  return {
    timestamp: Date.now(),
    type: 'consumer',
    reportId: HID_REPORT_ID_CONSUMER,
    bytesHex: formatHexPacket(HID_REPORT_ID_CONSUMER, bytes),
    summary:
      payload.usageCode === 0
        ? 'Consumer:[release]'
        : `Consumer:0x${payload.usageCode.toString(16).padStart(4, '0').toUpperCase()}`,
  };
}

export function mapLogicalButtonsToPhysical(
  logicalButtons: number,
  handedness: 'right' | 'left'
): number {
  if (handedness === 'right') {
    return logicalButtons & 0x07;
  }
  let mapped = logicalButtons & MOUSE_BUTTON_MIDDLE;
  if (logicalButtons & MOUSE_BUTTON_LEFT) mapped |= MOUSE_BUTTON_RIGHT;
  if (logicalButtons & MOUSE_BUTTON_RIGHT) mapped |= MOUSE_BUTTON_LEFT;
  return mapped;
}

