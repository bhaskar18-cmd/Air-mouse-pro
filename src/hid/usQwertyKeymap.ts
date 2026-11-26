import {
  KEY_MOD_LALT,
  KEY_MOD_LCTRL,
  KEY_MOD_LGUI,
  KEY_MOD_LSHIFT,
} from './hidReports';

export interface HidKeyMapping {
  keycode: number;
  modifiers: number;
}

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  modifiers: number;
  keycodes: number[];
}

// USB HID Keyboard/Keypad Usage Page (0x07)
export const HID_KEY = {
  NONE: 0x00,
  A: 0x04, B: 0x05, C: 0x06, D: 0x07, E: 0x08, F: 0x09, G: 0x0a,
  H: 0x0b, I: 0x0c, J: 0x0d, K: 0x0e, L: 0x0f, M: 0x10, N: 0x11,
  O: 0x12, P: 0x13, Q: 0x14, R: 0x15, S: 0x16, T: 0x17, U: 0x18,
  V: 0x19, W: 0x1a, X: 0x1b, Y: 0x1c, Z: 0x1d,
  NUM_1: 0x1e, NUM_2: 0x1f, NUM_3: 0x20, NUM_4: 0x21, NUM_5: 0x22,
  NUM_6: 0x23, NUM_7: 0x24, NUM_8: 0x25, NUM_9: 0x26, NUM_0: 0x27,
  ENTER: 0x28,
  ESCAPE: 0x29,
  BACKSPACE: 0x2a,
  TAB: 0x2b,
  SPACE: 0x2c,
  MINUS: 0x2d,
  EQUAL: 0x2e,
  LEFT_BRACKET: 0x2f,
  RIGHT_BRACKET: 0x30,
  BACKSLASH: 0x31,
  SEMICOLON: 0x33,
  APOSTROPHE: 0x34,
  GRAVE: 0x35,
  COMMA: 0x36,
  PERIOD: 0x37,
  SLASH: 0x38,
  CAPS_LOCK: 0x39,
  F1: 0x3a, F2: 0x3b, F3: 0x3c, F4: 0x3d, F5: 0x3e, F6: 0x3f,
  F7: 0x40, F8: 0x41, F9: 0x42, F10: 0x43, F11: 0x44, F12: 0x45,
  PRINT_SCREEN: 0x46,
  SCROLL_LOCK: 0x47,
  PAUSE: 0x48,
  INSERT: 0x49,
  HOME: 0x4a,
  PAGE_UP: 0x4b,
  DELETE: 0x4c,
  END: 0x4d,
  PAGE_DOWN: 0x4e,
  RIGHT_ARROW: 0x4f,
  LEFT_ARROW: 0x50,
  DOWN_ARROW: 0x51,
  UP_ARROW: 0x52,
} as const;

export const COMMON_SHORTCUTS: ShortcutDefinition[] = [
  { id: 'copy', label: 'Ctrl+C', description: 'Copy selection', modifiers: KEY_MOD_LCTRL, keycodes: [HID_KEY.C] },
  { id: 'paste', label: 'Ctrl+V', description: 'Paste clipboard', modifiers: KEY_MOD_LCTRL, keycodes: [HID_KEY.V] },
  { id: 'cut', label: 'Ctrl+X', description: 'Cut selection', modifiers: KEY_MOD_LCTRL, keycodes: [HID_KEY.X] },
  { id: 'select-all', label: 'Ctrl+A', description: 'Select all', modifiers: KEY_MOD_LCTRL, keycodes: [HID_KEY.A] },
  { id: 'undo', label: 'Ctrl+Z', description: 'Undo action', modifiers: KEY_MOD_LCTRL, keycodes: [HID_KEY.Z] },
  { id: 'alt-tab', label: 'Alt+Tab', description: 'Switch window', modifiers: KEY_MOD_LALT, keycodes: [HID_KEY.TAB] },
  { id: 'win-d', label: 'Win+D', description: 'Show desktop', modifiers: KEY_MOD_LGUI, keycodes: [HID_KEY.D] },
  { id: 'task-mgr', label: 'Ctrl+Shift+Esc', description: 'Task Manager', modifiers: KEY_MOD_LCTRL | KEY_MOD_LSHIFT, keycodes: [HID_KEY.ESCAPE] },
];

const CHAR_TO_HID: Record<string, HidKeyMapping> = {
  a: { keycode: HID_KEY.A, modifiers: 0 },
  b: { keycode: HID_KEY.B, modifiers: 0 },
  c: { keycode: HID_KEY.C, modifiers: 0 },
  d: { keycode: HID_KEY.D, modifiers: 0 },
  e: { keycode: HID_KEY.E, modifiers: 0 },
  f: { keycode: HID_KEY.F, modifiers: 0 },
  g: { keycode: HID_KEY.G, modifiers: 0 },
  h: { keycode: HID_KEY.H, modifiers: 0 },
  i: { keycode: HID_KEY.I, modifiers: 0 },
  j: { keycode: HID_KEY.J, modifiers: 0 },
  k: { keycode: HID_KEY.K, modifiers: 0 },
  l: { keycode: HID_KEY.L, modifiers: 0 },
  m: { keycode: HID_KEY.M, modifiers: 0 },
  n: { keycode: HID_KEY.N, modifiers: 0 },
  o: { keycode: HID_KEY.O, modifiers: 0 },
  p: { keycode: HID_KEY.P, modifiers: 0 },
  q: { keycode: HID_KEY.Q, modifiers: 0 },
  r: { keycode: HID_KEY.R, modifiers: 0 },
  s: { keycode: HID_KEY.S, modifiers: 0 },
  t: { keycode: HID_KEY.T, modifiers: 0 },
  u: { keycode: HID_KEY.U, modifiers: 0 },
  v: { keycode: HID_KEY.V, modifiers: 0 },
  w: { keycode: HID_KEY.W, modifiers: 0 },
  x: { keycode: HID_KEY.X, modifiers: 0 },
  y: { keycode: HID_KEY.Y, modifiers: 0 },
  z: { keycode: HID_KEY.Z, modifiers: 0 },
  A: { keycode: HID_KEY.A, modifiers: KEY_MOD_LSHIFT },
  B: { keycode: HID_KEY.B, modifiers: KEY_MOD_LSHIFT },
  C: { keycode: HID_KEY.C, modifiers: KEY_MOD_LSHIFT },
  D: { keycode: HID_KEY.D, modifiers: KEY_MOD_LSHIFT },
  E: { keycode: HID_KEY.E, modifiers: KEY_MOD_LSHIFT },
  F: { keycode: HID_KEY.F, modifiers: KEY_MOD_LSHIFT },
  G: { keycode: HID_KEY.G, modifiers: KEY_MOD_LSHIFT },
  H: { keycode: HID_KEY.H, modifiers: KEY_MOD_LSHIFT },
  I: { keycode: HID_KEY.I, modifiers: KEY_MOD_LSHIFT },
  J: { keycode: HID_KEY.J, modifiers: KEY_MOD_LSHIFT },
  K: { keycode: HID_KEY.K, modifiers: KEY_MOD_LSHIFT },
  L: { keycode: HID_KEY.L, modifiers: KEY_MOD_LSHIFT },
  M: { keycode: HID_KEY.M, modifiers: KEY_MOD_LSHIFT },
  N: { keycode: HID_KEY.N, modifiers: KEY_MOD_LSHIFT },
  O: { keycode: HID_KEY.O, modifiers: KEY_MOD_LSHIFT },
  P: { keycode: HID_KEY.P, modifiers: KEY_MOD_LSHIFT },
  Q: { keycode: HID_KEY.Q, modifiers: KEY_MOD_LSHIFT },
  R: { keycode: HID_KEY.R, modifiers: KEY_MOD_LSHIFT },
  S: { keycode: HID_KEY.S, modifiers: KEY_MOD_LSHIFT },
  T: { keycode: HID_KEY.T, modifiers: KEY_MOD_LSHIFT },
  U: { keycode: HID_KEY.U, modifiers: KEY_MOD_LSHIFT },
  V: { keycode: HID_KEY.V, modifiers: KEY_MOD_LSHIFT },
  W: { keycode: HID_KEY.W, modifiers: KEY_MOD_LSHIFT },
  X: { keycode: HID_KEY.X, modifiers: KEY_MOD_LSHIFT },
  Y: { keycode: HID_KEY.Y, modifiers: KEY_MOD_LSHIFT },
  Z: { keycode: HID_KEY.Z, modifiers: KEY_MOD_LSHIFT },
  '1': { keycode: HID_KEY.NUM_1, modifiers: 0 },
  '2': { keycode: HID_KEY.NUM_2, modifiers: 0 },
  '3': { keycode: HID_KEY.NUM_3, modifiers: 0 },
  '4': { keycode: HID_KEY.NUM_4, modifiers: 0 },
  '5': { keycode: HID_KEY.NUM_5, modifiers: 0 },
  '6': { keycode: HID_KEY.NUM_6, modifiers: 0 },
  '7': { keycode: HID_KEY.NUM_7, modifiers: 0 },
  '8': { keycode: HID_KEY.NUM_8, modifiers: 0 },
  '9': { keycode: HID_KEY.NUM_9, modifiers: 0 },
  '0': { keycode: HID_KEY.NUM_0, modifiers: 0 },
  '!': { keycode: HID_KEY.NUM_1, modifiers: KEY_MOD_LSHIFT },
  '@': { keycode: HID_KEY.NUM_2, modifiers: KEY_MOD_LSHIFT },
  '#': { keycode: HID_KEY.NUM_3, modifiers: KEY_MOD_LSHIFT },
  '$': { keycode: HID_KEY.NUM_4, modifiers: KEY_MOD_LSHIFT },
  '%': { keycode: HID_KEY.NUM_5, modifiers: KEY_MOD_LSHIFT },
  '^': { keycode: HID_KEY.NUM_6, modifiers: KEY_MOD_LSHIFT },
  '&': { keycode: HID_KEY.NUM_7, modifiers: KEY_MOD_LSHIFT },
  '*': { keycode: HID_KEY.NUM_8, modifiers: KEY_MOD_LSHIFT },
  '(': { keycode: HID_KEY.NUM_9, modifiers: KEY_MOD_LSHIFT },
  ')': { keycode: HID_KEY.NUM_0, modifiers: KEY_MOD_LSHIFT },
  '\n': { keycode: HID_KEY.ENTER, modifiers: 0 },
  '\t': { keycode: HID_KEY.TAB, modifiers: 0 },
  ' ': { keycode: HID_KEY.SPACE, modifiers: 0 },
  '-': { keycode: HID_KEY.MINUS, modifiers: 0 },
  '_': { keycode: HID_KEY.MINUS, modifiers: KEY_MOD_LSHIFT },
  '=': { keycode: HID_KEY.EQUAL, modifiers: 0 },
  '+': { keycode: HID_KEY.EQUAL, modifiers: KEY_MOD_LSHIFT },
  '[': { keycode: HID_KEY.LEFT_BRACKET, modifiers: 0 },
  '{': { keycode: HID_KEY.LEFT_BRACKET, modifiers: KEY_MOD_LSHIFT },
  ']': { keycode: HID_KEY.RIGHT_BRACKET, modifiers: 0 },
  '}': { keycode: HID_KEY.RIGHT_BRACKET, modifiers: KEY_MOD_LSHIFT },
  '\\': { keycode: HID_KEY.BACKSLASH, modifiers: 0 },
  '|': { keycode: HID_KEY.BACKSLASH, modifiers: KEY_MOD_LSHIFT },
  ';': { keycode: HID_KEY.SEMICOLON, modifiers: 0 },
  ':': { keycode: HID_KEY.SEMICOLON, modifiers: KEY_MOD_LSHIFT },
  "'": { keycode: HID_KEY.APOSTROPHE, modifiers: 0 },
  '"': { keycode: HID_KEY.APOSTROPHE, modifiers: KEY_MOD_LSHIFT },
  '`': { keycode: HID_KEY.GRAVE, modifiers: 0 },
  '~': { keycode: HID_KEY.GRAVE, modifiers: KEY_MOD_LSHIFT },
  ',': { keycode: HID_KEY.COMMA, modifiers: 0 },
  '<': { keycode: HID_KEY.COMMA, modifiers: KEY_MOD_LSHIFT },
  '.': { keycode: HID_KEY.PERIOD, modifiers: 0 },
  '>': { keycode: HID_KEY.PERIOD, modifiers: KEY_MOD_LSHIFT },
  '/': { keycode: HID_KEY.SLASH, modifiers: 0 },
  '?': { keycode: HID_KEY.SLASH, modifiers: KEY_MOD_LSHIFT },
};

export interface TextMappingResult {
  mappings: HidKeyMapping[];
  unsupportedChars: string[];
}

export function mapTextToHidSequence(text: string): TextMappingResult {
  const mappings: HidKeyMapping[] = [];
  const unsupportedSet = new Set<string>();

  for (const ch of text) {
    if (ch === '\r') continue;
    const found = CHAR_TO_HID[ch];
    if (found) {
      mappings.push(found);
    } else {
      unsupportedSet.add(ch);
    }
  }

  return {
    mappings,
    unsupportedChars: Array.from(unsupportedSet),
  };
}
