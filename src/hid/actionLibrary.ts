import {
  CONSUMER_USAGE,
  KEY_MOD_LALT,
  KEY_MOD_LCTRL,
  KEY_MOD_LGUI,
  KEY_MOD_LSHIFT,
  MOUSE_BUTTON_LEFT,
  MOUSE_BUTTON_MIDDLE,
  MOUSE_BUTTON_RIGHT,
} from './hidReports';
import { CUSTOMIZABLE_KEYS, getKeyNameFromHidCode, HID_KEY } from './usQwertyKeymap';
import type {
  ActionCategory,
  CustomKeyBinding,
  HidActionDefinition,
  MouseControlSlotId,
} from '../types/bluetooth';

export interface MouseSlotMeta {
  slotId: MouseControlSlotId;
  label: string;
  shortLabel: string;
  description: string;
  defaultActionId: string;
}

export const MOUSE_CONTROL_SLOTS: MouseSlotMeta[] = [
  {
    slotId: 'left_click',
    label: 'Left Click',
    shortLabel: 'Left',
    description: 'Primary mouse button below touchpad',
    defaultActionId: 'mouse_left_click',
  },
  {
    slotId: 'middle_click',
    label: 'Middle Click',
    shortLabel: 'Middle',
    description: 'Wheel / middle button below touchpad',
    defaultActionId: 'mouse_middle_click',
  },
  {
    slotId: 'right_click',
    label: 'Right Click',
    shortLabel: 'Right',
    description: 'Secondary / context click button below touchpad',
    defaultActionId: 'mouse_right_click',
  },
  {
    slotId: 'double_click',
    label: 'Double Click',
    shortLabel: '2x Click',
    description: 'Rapid left double-click control below touchpad',
    defaultActionId: 'mouse_double_click',
  },
  {
    slotId: 'aux_back',
    label: 'Side Back Button',
    shortLabel: 'Back',
    description: 'Auxiliary Back action button',
    defaultActionId: 'media_browser_back',
  },
  {
    slotId: 'aux_forward',
    label: 'Side Forward Button',
    shortLabel: 'Forward',
    description: 'Auxiliary Forward action button',
    defaultActionId: 'media_browser_forward',
  },
  {
    slotId: 'scroll_up',
    label: 'Scroll Up Step',
    shortLabel: 'Scroll +',
    description: 'Quick upward scroll wheel step',
    defaultActionId: 'mouse_scroll_up',
  },
  {
    slotId: 'scroll_down',
    label: 'Scroll Down Step',
    shortLabel: 'Scroll -',
    description: 'Quick downward scroll wheel step',
    defaultActionId: 'mouse_scroll_down',
  },
];

const BASE_ACTIONS: HidActionDefinition[] = [
  // Mouse actions
  {
    id: 'mouse_left_click',
    label: 'Left Click',
    shortLabel: 'L Click',
    description: 'Standard primary mouse button (HID Button 1)',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_click',
    mouseButtonMask: MOUSE_BUTTON_LEFT,
    badge: 'Mouse',
  },
  {
    id: 'mouse_right_click',
    label: 'Right Click',
    shortLabel: 'R Click',
    description: 'Standard context menu mouse button (HID Button 2)',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_click',
    mouseButtonMask: MOUSE_BUTTON_RIGHT,
    badge: 'Mouse',
  },
  {
    id: 'mouse_middle_click',
    label: 'Middle Click',
    shortLabel: 'M Click',
    description: 'Standard middle / wheel click (HID Button 3)',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_click',
    mouseButtonMask: MOUSE_BUTTON_MIDDLE,
    badge: 'Mouse',
  },
  {
    id: 'mouse_double_click',
    label: 'Double Click',
    shortLabel: '2x Click',
    description: 'Two clean left click HID reports in sequence',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_double_click',
    mouseButtonMask: MOUSE_BUTTON_LEFT,
    badge: 'Mouse',
  },
  {
    id: 'mouse_drag_lock',
    label: 'Toggle Drag Lock',
    shortLabel: 'Drag Lock',
    description: 'Toggle holding primary button while moving cursor',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'drag_lock_toggle',
    badge: 'Mouse',
  },
  {
    id: 'mouse_scroll_up',
    label: 'Scroll Up Step',
    shortLabel: 'Scroll +',
    description: 'Send positive vertical scroll wheel report',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_scroll',
    wheelDelta: 3,
    badge: 'Wheel',
  },
  {
    id: 'mouse_scroll_down',
    label: 'Scroll Down Step',
    shortLabel: 'Scroll -',
    description: 'Send negative vertical scroll wheel report',
    category: 'mouse',
    osScope: 'universal',
    actionType: 'mouse_scroll',
    wheelDelta: -3,
    badge: 'Wheel',
  },

  // Media & Browser Consumer Control actions (HID Report ID 3)
  {
    id: 'media_play_pause',
    label: 'Play / Pause Media',
    shortLabel: 'Play/Pause',
    description: 'HID Consumer Play/Pause toggle (0x00CD)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.PLAY_PAUSE,
    badge: 'Media',
  },
  {
    id: 'media_next_track',
    label: 'Next Track',
    shortLabel: 'Next',
    description: 'HID Consumer Next Track (0x00B5)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.NEXT_TRACK,
    badge: 'Media',
  },
  {
    id: 'media_prev_track',
    label: 'Previous Track',
    shortLabel: 'Prev',
    description: 'HID Consumer Previous Track (0x00B6)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.PREV_TRACK,
    badge: 'Media',
  },
  {
    id: 'media_volume_up',
    label: 'Volume Up',
    shortLabel: 'Vol +',
    description: 'HID Consumer Volume Increment (0x00E9)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.VOLUME_UP,
    badge: 'Media',
  },
  {
    id: 'media_volume_down',
    label: 'Volume Down',
    shortLabel: 'Vol -',
    description: 'HID Consumer Volume Decrement (0x00EA)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.VOLUME_DOWN,
    badge: 'Media',
  },
  {
    id: 'media_mute',
    label: 'Mute Audio',
    shortLabel: 'Mute',
    description: 'HID Consumer Mute toggle (0x00E2)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.MUTE,
    badge: 'Media',
  },
  {
    id: 'media_browser_back',
    label: 'Browser Back',
    shortLabel: 'Back',
    description: 'HID Consumer AC Back navigation (0x0224)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.AC_BACK,
    badge: 'Nav',
  },
  {
    id: 'media_browser_forward',
    label: 'Browser Forward',
    shortLabel: 'Forward',
    description: 'HID Consumer AC Forward navigation (0x0225)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.AC_FORWARD,
    badge: 'Nav',
  },
  {
    id: 'media_browser_refresh',
    label: 'Browser Refresh',
    shortLabel: 'Refresh',
    description: 'HID Consumer AC Refresh (0x0227)',
    category: 'media',
    osScope: 'universal',
    actionType: 'consumer_tap',
    consumerUsage: CONSUMER_USAGE.AC_REFRESH,
    badge: 'Nav',
  },

  // Common Productivity & System Shortcuts
  {
    id: 'shortcut_copy',
    label: 'Copy (Ctrl+C)',
    shortLabel: 'Ctrl+C',
    description: 'Copy current selection to clipboard',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.C],
  },
  {
    id: 'shortcut_paste',
    label: 'Paste (Ctrl+V)',
    shortLabel: 'Ctrl+V',
    description: 'Paste clipboard contents',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.V],
  },
  {
    id: 'shortcut_cut',
    label: 'Cut (Ctrl+X)',
    shortLabel: 'Ctrl+X',
    description: 'Cut current selection to clipboard',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.X],
  },
  {
    id: 'shortcut_select_all',
    label: 'Select All (Ctrl+A)',
    shortLabel: 'Ctrl+A',
    description: 'Select all content in active view',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.A],
  },
  {
    id: 'shortcut_undo',
    label: 'Undo (Ctrl+Z)',
    shortLabel: 'Ctrl+Z',
    description: 'Undo previous action',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.Z],
  },
  {
    id: 'shortcut_redo',
    label: 'Redo (Ctrl+Y)',
    shortLabel: 'Ctrl+Y',
    description: 'Redo previously undone action',
    category: 'shortcut',
    osScope: 'windows',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.Y],
  },
  {
    id: 'shortcut_save',
    label: 'Save (Ctrl+S)',
    shortLabel: 'Ctrl+S',
    description: 'Save active document',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.S],
  },
  {
    id: 'shortcut_find',
    label: 'Find (Ctrl+F)',
    shortLabel: 'Ctrl+F',
    description: 'Open search / find prompt',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.F],
  },
  {
    id: 'shortcut_new_tab',
    label: 'New Browser Tab (Ctrl+T)',
    shortLabel: 'Ctrl+T',
    description: 'Open a new tab in browser',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.T],
  },
  {
    id: 'shortcut_close_tab',
    label: 'Close Tab (Ctrl+W)',
    shortLabel: 'Ctrl+W',
    description: 'Close the active tab or window pane',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.W],
  },
  {
    id: 'shortcut_reopen_tab',
    label: 'Reopen Closed Tab (Ctrl+Shift+T)',
    shortLabel: 'Ctrl+Sh+T',
    description: 'Reopen last closed browser tab',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL | KEY_MOD_LSHIFT,
    keycodes: [HID_KEY.T],
  },
  {
    id: 'shortcut_alt_tab',
    label: 'Switch Window (Alt+Tab)',
    shortLabel: 'Alt+Tab',
    description: 'Cycle between open applications',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LALT,
    keycodes: [HID_KEY.TAB],
  },
  {
    id: 'shortcut_alt_f4',
    label: 'Close Window (Alt+F4)',
    shortLabel: 'Alt+F4',
    description: 'Close focused desktop application',
    category: 'shortcut',
    osScope: 'windows',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LALT,
    keycodes: [HID_KEY.F4],
  },
  {
    id: 'shortcut_win_d',
    label: 'Show Desktop (Win+D)',
    shortLabel: 'Win+D',
    description: 'Minimize/restore all windows on Windows',
    category: 'shortcut',
    osScope: 'windows',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LGUI,
    keycodes: [HID_KEY.D],
  },
  {
    id: 'shortcut_win_l',
    label: 'Lock Screen (Win+L)',
    shortLabel: 'Win+L',
    description: 'Lock Windows session',
    category: 'shortcut',
    osScope: 'windows',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LGUI,
    keycodes: [HID_KEY.L],
  },
  {
    id: 'shortcut_task_manager',
    label: 'Task Manager (Ctrl+Shift+Esc)',
    shortLabel: 'Task Mgr',
    description: 'Open Windows Task Manager directly',
    category: 'shortcut',
    osScope: 'windows',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL | KEY_MOD_LSHIFT,
    keycodes: [HID_KEY.ESCAPE],
  },
  {
    id: 'shortcut_zoom_in',
    label: 'Zoom In (Ctrl+=)',
    shortLabel: 'Zoom +',
    description: 'Increase zoom level in browser or editor',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.EQUAL],
  },
  {
    id: 'shortcut_zoom_out',
    label: 'Zoom Out (Ctrl+-)',
    shortLabel: 'Zoom -',
    description: 'Decrease zoom level in browser or editor',
    category: 'shortcut',
    osScope: 'universal',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LCTRL,
    keycodes: [HID_KEY.MINUS],
  },
  {
    id: 'shortcut_android_back',
    label: 'System Back (Esc)',
    shortLabel: 'Sys Back',
    description: 'Send Escape (acts as Back on Android & dismiss on desktop)',
    category: 'system',
    osScope: 'android',
    actionType: 'key_tap',
    keycode: HID_KEY.ESCAPE,
  },
  {
    id: 'shortcut_android_home',
    label: 'Home / Launcher (Win+Enter)',
    shortLabel: 'Home App',
    description: 'Open Android home launcher or desktop start search',
    category: 'system',
    osScope: 'android',
    actionType: 'key_combo',
    modifiers: KEY_MOD_LGUI,
    keycodes: [HID_KEY.ENTER],
  },
  {
    id: 'system_noop',
    label: 'Disabled (No Action)',
    shortLabel: 'None',
    description: 'Ignore presses on this key or button',
    category: 'system',
    osScope: 'universal',
    actionType: 'noop',
  },
];

// System / Key HID actions derived dynamically from every keycode-backed customizable key
const SYSTEM_KEY_IDS = new Set([
  'key_escape',
  'key_enter',
  'key_tab',
  'key_backspace',
  'key_delete',
  'key_insert',
  'key_print_screen',
  'key_caps_lock',
  'key_up',
  'key_down',
  'key_left',
  'key_right',
  'key_home',
  'key_end',
  'key_page_up',
  'key_page_down',
]);

const SINGLE_KEY_ACTIONS: HidActionDefinition[] = CUSTOMIZABLE_KEYS.filter(
  (k) => typeof k.keycode === 'number'
).map((keyDef) => {
  const isSystem = SYSTEM_KEY_IDS.has(keyDef.keyId);
  return {
    id: `send_${keyDef.keyId}`,
    label: `Send ${keyDef.label}`,
    shortLabel: keyDef.shortLabel,
    description: `Send HID key ${keyDef.label} (0x${(keyDef.keycode ?? 0).toString(16).toUpperCase()})`,
    category: isSystem ? 'system' : 'keyboard',
    osScope: 'universal',
    actionType: 'key_tap',
    keycode: keyDef.keycode,
    badge: keyDef.group === 'function' ? 'Fn' : undefined,
  };
});

export const ACTION_LIBRARY: HidActionDefinition[] = [
  ...BASE_ACTIONS,
  ...SINGLE_KEY_ACTIONS,
];

const ACTION_BY_ID = new Map<string, HidActionDefinition>(
  ACTION_LIBRARY.map((action) => [action.id, action])
);

export function getActionById(actionId: string): HidActionDefinition | undefined {
  return ACTION_BY_ID.get(actionId);
}

export function formatCustomComboLabel(modifiers: number, keycodes: number[]): string {
  const parts: string[] = [];
  if (modifiers & KEY_MOD_LCTRL) parts.push('Ctrl');
  if (modifiers & KEY_MOD_LSHIFT) parts.push('Shift');
  if (modifiers & KEY_MOD_LALT) parts.push('Alt');
  if (modifiers & KEY_MOD_LGUI) parts.push('Win');
  for (const code of keycodes) {
    if (code > 0) {
      parts.push(getKeyNameFromHidCode(code));
    }
  }
  return parts.join('+') || 'None';
}

export function resolveBindingToAction(binding: CustomKeyBinding): HidActionDefinition | null {
  if (binding.kind === 'library') {
    return getActionById(binding.actionId) ?? null;
  }
  const cleanCodes = binding.keycodes.filter((k) => k > 0 && k <= 0x65).slice(0, 6);
  const label = binding.label.trim() || formatCustomComboLabel(binding.modifiers, cleanCodes);
  return {
    id: `custom_${binding.modifiers}_${cleanCodes.join('_')}`,
    label,
    shortLabel: label.length > 10 ? `${label.slice(0, 9)}..` : label,
    description: binding.description || `Custom HID combination: ${label}`,
    category: 'shortcut',
    osScope: 'universal',
    actionType: cleanCodes.length > 0 || binding.modifiers > 0 ? 'key_combo' : 'noop',
    modifiers: binding.modifiers,
    keycodes: cleanCodes,
    badge: 'Custom',
  };
}

export function searchActions(
  query: string,
  category: ActionCategory | 'all' = 'all'
): HidActionDefinition[] {
  const normalized = query.trim().toLowerCase();
  return ACTION_LIBRARY.filter((action) => {
    if (category !== 'all' && action.category !== category) {
      return false;
    }
    if (!normalized) return true;
    return (
      action.label.toLowerCase().includes(normalized) ||
      action.shortLabel.toLowerCase().includes(normalized) ||
      action.description.toLowerCase().includes(normalized) ||
      action.category.toLowerCase().includes(normalized) ||
      action.osScope.toLowerCase().includes(normalized)
    );
  });
}
