import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProfileFromTemplate,
  ensureDeviceEntryInStore,
  exportProfileToJson,
  importProfileFromJson,
  loadDeviceProfileStore,
  normalizeDeviceAddress,
  PREVIEW_DEVICE_ADDRESS,
  saveDeviceProfileStore,
} from '../services/profileStorage';
import type {
  BlueMouseSettings,
  CustomKeyBinding,
  DeviceConfigEntry,
  DeviceProfile,
  DeviceProfileStore,
  MouseControlSlotId,
  PairedBluetoothDevice,
  ProfileTemplateId,
  ProfileTouchpadSettings,
} from '../types/bluetooth';

export function useDeviceProfiles(
  globalSettings: BlueMouseSettings,
  connectedDevice: PairedBluetoothDevice | null,
  pairedDevices: PairedBluetoothDevice[]
) {
  const [store, setStore] = useState<DeviceProfileStore>(() => loadDeviceProfileStore());
  const [manualSelectedAddress, setManualSelectedAddress] = useState<string | null>(null);

  const connectedAddress = useMemo(
    () => (connectedDevice ? normalizeDeviceAddress(connectedDevice.address) : null),
    [connectedDevice]
  );

  // Sync newly connected or paired devices automatically without overwriting existing device entries
  useEffect(() => {
    setStore((prev) => {
      let next = prev;
      let changed = false;

      if (connectedDevice) {
        const res = ensureDeviceEntryInStore(
          next,
          connectedDevice.address,
          connectedDevice.name || 'Connected Host',
          globalSettings
        );
        if (res.created || res.store !== next) {
          next = res.store;
          changed = true;
        }
      }

      for (const dev of pairedDevices) {
        const res = ensureDeviceEntryInStore(
          next,
          dev.address,
          dev.name || 'Paired Host',
          globalSettings
        );
        if (res.created || res.store !== next) {
          next = res.store;
          changed = true;
        }
      }

      if (Object.keys(next.devices).length === 0) {
        const previewRes = ensureDeviceEntryInStore(
          next,
          PREVIEW_DEVICE_ADDRESS,
          'Preview Workstation',
          globalSettings
        );
        next = previewRes.store;
        changed = true;
      }

      if (changed) {
        saveDeviceProfileStore(next);
      }
      return next;
    });
  }, [connectedDevice, pairedDevices, globalSettings]);

  // Connected device automatically takes priority; otherwise fallback to paired/selected/first stored device
  const activeDeviceAddress = useMemo(() => {
    if (connectedAddress && store.devices[connectedAddress]) {
      return connectedAddress;
    }
    if (manualSelectedAddress && store.devices[manualSelectedAddress]) {
      return manualSelectedAddress;
    }
    if (pairedDevices.length > 0) {
      const firstPaired = normalizeDeviceAddress(pairedDevices[0].address);
      if (store.devices[firstPaired]) return firstPaired;
    }
    const keys = Object.keys(store.devices);
    return keys[0] ?? PREVIEW_DEVICE_ADDRESS;
  }, [connectedAddress, manualSelectedAddress, pairedDevices, store.devices]);

  // Also restore device's default profile when switching active connected device
  useEffect(() => {
    if (!connectedAddress) return;
    setManualSelectedAddress(connectedAddress);
  }, [connectedAddress]);

  const activeDeviceEntry: DeviceConfigEntry | null = store.devices[activeDeviceAddress] ?? null;

  const activeProfile: DeviceProfile | null = useMemo(() => {
    if (!activeDeviceEntry || activeDeviceEntry.profiles.length === 0) return null;
    return (
      activeDeviceEntry.profiles.find((p) => p.id === activeDeviceEntry.activeProfileId) ??
      activeDeviceEntry.profiles[0]
    );
  }, [activeDeviceEntry]);

  // Merge active device profile's touchpad settings with global app settings
  const effectiveSettings: BlueMouseSettings = useMemo(() => {
    if (!activeProfile) return globalSettings;
    return {
      ...globalSettings,
      mouseSensitivity: activeProfile.touchpad.mouseSensitivity,
      pointerSpeed: activeProfile.touchpad.pointerSpeed,
      scrollSpeed: activeProfile.touchpad.scrollSpeed,
      naturalScrolling: activeProfile.touchpad.naturalScrolling,
      handedness: activeProfile.touchpad.handedness,
    };
  }, [activeProfile, globalSettings]);

  const updateStore = useCallback((updater: (prev: DeviceProfileStore) => DeviceProfileStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveDeviceProfileStore(next);
      return next;
    });
  }, []);

  const selectDeviceForEditing = useCallback(
    (address: string, fallbackName = 'Bluetooth Host') => {
      const normalized = normalizeDeviceAddress(address);
      updateStore((prev) => ensureDeviceEntryInStore(prev, normalized, fallbackName, globalSettings).store);
      setManualSelectedAddress(normalized);
    },
    [globalSettings, updateStore]
  );

  const mutateDeviceEntry = useCallback(
    (deviceAddress: string, fn: (entry: DeviceConfigEntry) => DeviceConfigEntry) => {
      const key = normalizeDeviceAddress(deviceAddress);
      updateStore((prev) => {
        const ensured = ensureDeviceEntryInStore(prev, key, 'Bluetooth Host', globalSettings);
        const updatedEntry = fn(ensured.entry);
        return {
          ...ensured.store,
          devices: {
            ...ensured.store.devices,
            [key]: updatedEntry,
          },
        };
      });
    },
    [globalSettings, updateStore]
  );

  const switchProfile = useCallback(
    (profileId: string, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => {
        if (!entry.profiles.some((p) => p.id === profileId)) return entry;
        return { ...entry, activeProfileId: profileId, lastSeenAt: Date.now() };
      });
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const createProfile = useCallback(
    (templateId: ProfileTemplateId, name?: string, deviceAddress = activeDeviceAddress) => {
      const created = createProfileFromTemplate(templateId, name, activeProfile?.touchpad);
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: [...entry.profiles, created],
        activeProfileId: created.id,
      }));
      return created;
    },
    [activeDeviceAddress, activeProfile?.touchpad, mutateDeviceEntry]
  );

  const renameProfile = useCallback(
    (profileId: string, newName: string, deviceAddress = activeDeviceAddress) => {
      const clean = newName.trim();
      if (!clean) return;
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: entry.profiles.map((p) =>
          p.id === profileId ? { ...p, name: clean, updatedAt: Date.now() } : p
        ),
      }));
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const duplicateProfile = useCallback(
    (profileId: string, deviceAddress = activeDeviceAddress) => {
      let cloned: DeviceProfile | null = null;
      mutateDeviceEntry(deviceAddress, (entry) => {
        const source = entry.profiles.find((p) => p.id === profileId);
        if (!source) return entry;
        const now = Date.now();
        cloned = {
          ...source,
          id: `prof_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: `${source.name} Copy`,
          createdAt: now,
          updatedAt: now,
          keyMappings: { ...source.keyMappings },
          mouseMappings: { ...source.mouseMappings },
          touchpad: { ...source.touchpad },
        };
        return {
          ...entry,
          profiles: [...entry.profiles, cloned],
          activeProfileId: cloned.id,
        };
      });
      return cloned;
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const deleteProfile = useCallback(
    (profileId: string, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => {
        if (entry.profiles.length <= 1) return entry;
        const remaining = entry.profiles.filter((p) => p.id !== profileId);
        const nextActive =
          entry.activeProfileId === profileId ? remaining[0].id : entry.activeProfileId;
        const nextDefault =
          entry.defaultProfileId === profileId ? remaining[0].id : entry.defaultProfileId;
        return {
          ...entry,
          profiles: remaining,
          activeProfileId: nextActive,
          defaultProfileId: nextDefault,
        };
      });
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const setDefaultProfile = useCallback(
    (profileId: string, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => {
        if (!entry.profiles.some((p) => p.id === profileId)) return entry;
        return {
          ...entry,
          defaultProfileId: profileId,
          activeProfileId: profileId,
        };
      });
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const resetProfileToTemplate = useCallback(
    (profileId: string, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => {
        const existing = entry.profiles.find((p) => p.id === profileId);
        if (!existing) return entry;
        const fresh = createProfileFromTemplate(existing.templateId, existing.name);
        return {
          ...entry,
          profiles: entry.profiles.map((p) =>
            p.id === profileId
              ? {
                  ...fresh,
                  id: existing.id,
                  createdAt: existing.createdAt,
                  updatedAt: Date.now(),
                }
              : p
          ),
        };
      });
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const setKeyMapping = useCallback(
    (keyId: string, binding: CustomKeyBinding | null, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: entry.profiles.map((p) => {
          if (p.id !== entry.activeProfileId) return p;
          const nextMap = { ...p.keyMappings };
          if (binding) {
            nextMap[keyId] = binding;
          } else {
            delete nextMap[keyId];
          }
          return { ...p, keyMappings: nextMap, updatedAt: Date.now() };
        }),
      }));
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const setMouseMapping = useCallback(
    (
      slotId: MouseControlSlotId,
      binding: CustomKeyBinding | null,
      deviceAddress = activeDeviceAddress
    ) => {
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: entry.profiles.map((p) => {
          if (p.id !== entry.activeProfileId) return p;
          const nextMap = { ...p.mouseMappings };
          if (binding) {
            nextMap[slotId] = binding;
          } else {
            delete nextMap[slotId];
          }
          return { ...p, mouseMappings: nextMap, updatedAt: Date.now() };
        }),
      }));
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const updateProfileTouchpad = useCallback(
    (patch: Partial<ProfileTouchpadSettings>, deviceAddress = activeDeviceAddress) => {
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: entry.profiles.map((p) =>
          p.id === entry.activeProfileId
            ? { ...p, touchpad: { ...p.touchpad, ...patch }, updatedAt: Date.now() }
            : p
        ),
      }));
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const exportActiveProfile = useCallback((): string => {
    if (!activeProfile) return '';
    return exportProfileToJson(activeProfile);
  }, [activeProfile]);

  const importProfileJson = useCallback(
    (jsonText: string, deviceAddress = activeDeviceAddress): { ok: boolean; error?: string } => {
      const res = importProfileFromJson(jsonText);
      if (!res.profile) {
        return { ok: false, error: res.error ?? 'Import failed.' };
      }
      const imported = res.profile;
      mutateDeviceEntry(deviceAddress, (entry) => ({
        ...entry,
        profiles: [...entry.profiles, imported],
        activeProfileId: imported.id,
      }));
      return { ok: true };
    },
    [activeDeviceAddress, mutateDeviceEntry]
  );

  const allDeviceEntries = useMemo(() => Object.values(store.devices), [store.devices]);

  return {
    allDeviceEntries,
    activeDeviceAddress,
    activeDeviceEntry,
    activeProfile,
    effectiveSettings,
    selectDeviceForEditing,
    switchProfile,
    createProfile,
    renameProfile,
    duplicateProfile,
    deleteProfile,
    setDefaultProfile,
    resetProfileToTemplate,
    setKeyMapping,
    setMouseMapping,
    updateProfileTouchpad,
    exportActiveProfile,
    importProfileJson,
  };
}
