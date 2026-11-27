import { DEFAULT_SETTINGS } from './settingsStorage';
import type {
  CustomKeyBinding,
  DeviceConfigEntry,
  DeviceProfile,
  DeviceProfileStore,
  MouseControlSlotId,
  ProfileTemplateId,
  ProfileTouchpadSettings,
} from '../types/bluetooth';

export const DEVICE_PROFILES_STORAGE_KEY = 'bluemouse_device_profiles_v1';
export const PREVIEW_DEVICE_ADDRESS = 'LOCAL-PREVIEW';

export interface ProfileTemplateMeta {
  templateId: ProfileTemplateId;
  name: string;
  description: string;
}

export const PROFILE_TEMPLATES: ProfileTemplateMeta[] = [
  {
    templateId: 'default',
    name: 'Standard Default',
    description: 'Clean standard mouse & keyboard HID layout without overrides',
  },
  {
    templateId: 'gaming',
    name: 'Gaming Mode',
    description: 'Linear 1.45x pointer, instant F1-F4 media/capture, Esc/Tab side buttons',
  },
  {
    templateId: 'office',
    name: 'Office Mode',
    description: 'F1-F7 mapped to Copy, Paste, Cut, Undo, Select All, Save & Find',
  },
  {
    templateId: 'browsing',
    name: 'Browsing Mode',
    description: '1.50x smooth scrolling, browser tabs on F5-F8, Back/Forward side buttons',
  },
  {
    templateId: 'custom',
    name: 'Create Your Own',
    description: 'Start from an empty custom profile and tailor every key & mouse button',
  },
];

function safeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeDeviceAddress(address: string | null | undefined): string {
  const trimmed = (address ?? '').trim().toUpperCase();
  return trimmed || PREVIEW_DEVICE_ADDRESS;
}

function defaultTouchpad(base?: Partial<ProfileTouchpadSettings>): ProfileTouchpadSettings {
  return {
    mouseSensitivity: base?.mouseSensitivity ?? DEFAULT_SETTINGS.mouseSensitivity,
    pointerSpeed: base?.pointerSpeed ?? DEFAULT_SETTINGS.pointerSpeed,
    scrollSpeed: base?.scrollSpeed ?? DEFAULT_SETTINGS.scrollSpeed,
    naturalScrolling: base?.naturalScrolling ?? DEFAULT_SETTINGS.naturalScrolling,
    handedness: base?.handedness ?? DEFAULT_SETTINGS.handedness,
  };
}

export function createProfileFromTemplate(
  templateId: ProfileTemplateId,
  customName?: string,
  baseTouchpad?: Partial<ProfileTouchpadSettings>
): DeviceProfile {
  const now = Date.now();
  const baseTp = defaultTouchpad(baseTouchpad);

  if (templateId === 'gaming') {
    return {
      id: safeId('prof'),
      name: customName?.trim() || 'Gaming Mode',
      templateId: 'gaming',
      createdAt: now,
      updatedAt: now,
      keyMappings: {
        key_f1: { kind: 'library', actionId: 'media_volume_down' },
        key_f2: { kind: 'library', actionId: 'media_volume_up' },
        key_f3: { kind: 'library', actionId: 'media_mute' },
        key_f4: { kind: 'library', actionId: 'media_play_pause' },
      },
      mouseMappings: {
        aux_back: { kind: 'library', actionId: 'send_key_escape' },
        aux_forward: { kind: 'library', actionId: 'send_key_tab' },
      },
      touchpad: {
        ...baseTp,
        mouseSensitivity: 1.45,
        pointerSpeed: 'linear',
        scrollSpeed: 1.25,
      },
    };
  }

  if (templateId === 'office') {
    return {
      id: safeId('prof'),
      name: customName?.trim() || 'Office Mode',
      templateId: 'office',
      createdAt: now,
      updatedAt: now,
      keyMappings: {
        key_f1: { kind: 'library', actionId: 'shortcut_copy' },
        key_f2: { kind: 'library', actionId: 'shortcut_paste' },
        key_f3: { kind: 'library', actionId: 'shortcut_cut' },
        key_f4: { kind: 'library', actionId: 'shortcut_undo' },
        key_f5: { kind: 'library', actionId: 'shortcut_select_all' },
        key_f6: { kind: 'library', actionId: 'shortcut_save' },
        key_f7: { kind: 'library', actionId: 'shortcut_find' },
      },
      mouseMappings: {
        aux_back: { kind: 'library', actionId: 'shortcut_undo' },
        aux_forward: { kind: 'library', actionId: 'shortcut_paste' },
      },
      touchpad: {
        ...baseTp,
        mouseSensitivity: 1.2,
        pointerSpeed: 'adaptive',
        scrollSpeed: 1.15,
      },
    };
  }

  if (templateId === 'browsing') {
    return {
      id: safeId('prof'),
      name: customName?.trim() || 'Browsing Mode',
      templateId: 'browsing',
      createdAt: now,
      updatedAt: now,
      keyMappings: {
        key_f5: { kind: 'library', actionId: 'media_browser_refresh' },
        key_f6: { kind: 'library', actionId: 'shortcut_new_tab' },
        key_f7: { kind: 'library', actionId: 'shortcut_close_tab' },
        key_f8: { kind: 'library', actionId: 'shortcut_reopen_tab' },
        key_f9: { kind: 'library', actionId: 'media_play_pause' },
      },
      mouseMappings: {
        aux_back: { kind: 'library', actionId: 'media_browser_back' },
        aux_forward: { kind: 'library', actionId: 'media_browser_forward' },
      },
      touchpad: {
        ...baseTp,
        mouseSensitivity: 1.3,
        pointerSpeed: 'adaptive',
        scrollSpeed: 1.5,
      },
    };
  }

  const defaultName =
    templateId === 'custom' ? customName?.trim() || 'Custom Profile' : customName?.trim() || 'Default Profile';

  return {
    id: safeId('prof'),
    name: defaultName,
    templateId,
    createdAt: now,
    updatedAt: now,
    keyMappings: {},
    mouseMappings: {},
    touchpad: baseTp,
  };
}

function isValidBinding(val: unknown): val is CustomKeyBinding {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  if (obj.kind === 'library') {
    return typeof obj.actionId === 'string' && obj.actionId.length > 0;
  }
  if (obj.kind === 'custom_combo') {
    return (
      typeof obj.label === 'string' &&
      typeof obj.modifiers === 'number' &&
      Array.isArray(obj.keycodes)
    );
  }
  return false;
}

const VALID_MOUSE_SLOTS = new Set<MouseControlSlotId>([
  'left_click',
  'right_click',
  'middle_click',
  'double_click',
  'aux_back',
  'aux_forward',
  'scroll_up',
  'scroll_down',
]);

function sanitizeProfile(raw: unknown): DeviceProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null;

  const templateId: ProfileTemplateId =
    item.templateId === 'gaming' ||
    item.templateId === 'office' ||
    item.templateId === 'browsing' ||
    item.templateId === 'custom'
      ? item.templateId
      : 'default';

  const keyMappings: Record<string, CustomKeyBinding> = {};
  if (item.keyMappings && typeof item.keyMappings === 'object') {
    for (const [k, v] of Object.entries(item.keyMappings as Record<string, unknown>)) {
      if (isValidBinding(v)) {
        keyMappings[k] = v;
      }
    }
  }

  const mouseMappings: Partial<Record<MouseControlSlotId, CustomKeyBinding>> = {};
  if (item.mouseMappings && typeof item.mouseMappings === 'object') {
    for (const [k, v] of Object.entries(item.mouseMappings as Record<string, unknown>)) {
      if (VALID_MOUSE_SLOTS.has(k as MouseControlSlotId) && isValidBinding(v)) {
        mouseMappings[k as MouseControlSlotId] = v;
      }
    }
  }

  const tpRaw =
    item.touchpad && typeof item.touchpad === 'object'
      ? (item.touchpad as Partial<ProfileTouchpadSettings>)
      : {};

  return {
    id: item.id,
    name: item.name.trim() || 'Unnamed Profile',
    templateId,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
    keyMappings,
    mouseMappings,
    touchpad: defaultTouchpad({
      mouseSensitivity:
        typeof tpRaw.mouseSensitivity === 'number'
          ? Math.min(3, Math.max(0.3, tpRaw.mouseSensitivity))
          : DEFAULT_SETTINGS.mouseSensitivity,
      pointerSpeed:
        tpRaw.pointerSpeed === 'linear' ||
        tpRaw.pointerSpeed === 'precision' ||
        tpRaw.pointerSpeed === 'adaptive'
          ? tpRaw.pointerSpeed
          : DEFAULT_SETTINGS.pointerSpeed,
      scrollSpeed:
        typeof tpRaw.scrollSpeed === 'number'
          ? Math.min(3, Math.max(0.5, tpRaw.scrollSpeed))
          : DEFAULT_SETTINGS.scrollSpeed,
      naturalScrolling:
        typeof tpRaw.naturalScrolling === 'boolean'
          ? tpRaw.naturalScrolling
          : DEFAULT_SETTINGS.naturalScrolling,
      handedness: tpRaw.handedness === 'left' ? 'left' : 'right',
    }),
  };
}

export function loadDeviceProfileStore(): DeviceProfileStore {
  try {
    if (typeof localStorage === 'undefined') {
      return { version: 1, devices: {} };
    }
    const raw = localStorage.getItem(DEVICE_PROFILES_STORAGE_KEY);
    if (!raw) return { version: 1, devices: {} };

    const parsed = JSON.parse(raw) as Partial<DeviceProfileStore>;
    if (!parsed || typeof parsed !== 'object' || !parsed.devices || typeof parsed.devices !== 'object') {
      return { version: 1, devices: {} };
    }

    const devices: Record<string, DeviceConfigEntry> = {};
    for (const [rawKey, entryRaw] of Object.entries(parsed.devices)) {
      if (!entryRaw || typeof entryRaw !== 'object') continue;
      const entry = entryRaw as Partial<DeviceConfigEntry>;
      const normalizedAddr = normalizeDeviceAddress(entry.deviceAddress || rawKey);
      const validProfiles = Array.isArray(entry.profiles)
        ? entry.profiles.map(sanitizeProfile).filter((p): p is DeviceProfile => p !== null)
        : [];
      if (validProfiles.length === 0) {
        const starter = createProfileFromTemplate('default', 'Default Profile');
        validProfiles.push(starter);
      }

      const activeId = validProfiles.some((p) => p.id === entry.activeProfileId)
        ? (entry.activeProfileId as string)
        : validProfiles[0].id;
      const defaultId = validProfiles.some((p) => p.id === entry.defaultProfileId)
        ? (entry.defaultProfileId as string)
        : validProfiles[0].id;

      devices[normalizedAddr] = {
        deviceAddress: normalizedAddr,
        deviceName:
          typeof entry.deviceName === 'string' && entry.deviceName.trim()
            ? entry.deviceName.trim()
            : normalizedAddr === PREVIEW_DEVICE_ADDRESS
              ? 'Preview Workstation'
              : 'Bluetooth Host',
        activeProfileId: activeId,
        defaultProfileId: defaultId,
        profiles: validProfiles,
        lastSeenAt: typeof entry.lastSeenAt === 'number' ? entry.lastSeenAt : Date.now(),
      };
    }

    return { version: 1, devices };
  } catch {
    return { version: 1, devices: {} };
  }
}

export function saveDeviceProfileStore(store: DeviceProfileStore): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DEVICE_PROFILES_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function ensureDeviceEntryInStore(
  store: DeviceProfileStore,
  deviceAddress: string,
  deviceName: string,
  baseTouchpad?: Partial<ProfileTouchpadSettings>
): { store: DeviceProfileStore; entry: DeviceConfigEntry; created: boolean } {
  const key = normalizeDeviceAddress(deviceAddress);
  const existing = store.devices[key];
  const cleanName = deviceName.trim();

  if (existing) {
    // Only refresh display metadata without altering another device or overwriting profiles
    if (cleanName && cleanName !== existing.deviceName) {
      const updatedEntry: DeviceConfigEntry = {
        ...existing,
        deviceName: cleanName,
        lastSeenAt: Date.now(),
      };
      return {
        store: {
          ...store,
          devices: {
            ...store.devices,
            [key]: updatedEntry,
          },
        },
        entry: updatedEntry,
        created: false,
      };
    }
    return { store, entry: existing, created: false };
  }

  const starter = createProfileFromTemplate('default', 'Default Profile', baseTouchpad);
  const newEntry: DeviceConfigEntry = {
    deviceAddress: key,
    deviceName: cleanName || (key === PREVIEW_DEVICE_ADDRESS ? 'Preview Workstation' : 'Bluetooth Host'),
    activeProfileId: starter.id,
    defaultProfileId: starter.id,
    profiles: [starter],
    lastSeenAt: Date.now(),
  };

  return {
    store: {
      ...store,
      devices: {
        ...store.devices,
        [key]: newEntry,
      },
    },
    entry: newEntry,
    created: true,
  };
}

export function exportProfileToJson(profile: DeviceProfile): string {
  return JSON.stringify(
    {
      schema: 'bluemouse-profile-v1',
      exportedAt: new Date().toISOString(),
      profile,
    },
    null,
    2
  );
}

export function importProfileFromJson(jsonText: string): { profile?: DeviceProfile; error?: string } {
  try {
    const parsed = JSON.parse(jsonText) as { schema?: string; profile?: unknown } | unknown;
    const candidate =
      parsed && typeof parsed === 'object' && 'profile' in (parsed as Record<string, unknown>)
        ? (parsed as Record<string, unknown>).profile
        : parsed;

    const sanitized = sanitizeProfile(candidate);
    if (!sanitized) {
      return { error: 'Invalid BlueMouse profile JSON format.' };
    }

    return {
      profile: {
        ...sanitized,
        id: safeId('prof'),
        name: `${sanitized.name} (Imported)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  } catch {
    return { error: 'Could not parse JSON text. Check formatting and try again.' };
  }
}
