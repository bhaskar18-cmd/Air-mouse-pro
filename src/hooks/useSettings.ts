import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { bluetoothService } from '../services/bluetoothService';
import type { BlueMouseSettings } from '../types/bluetooth';

export function useSettings() {
  const [settings, setSettings] = useState<BlueMouseSettings>(() => loadSettings());

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', settings.theme === 'dark' ? '#111318' : '#F7F8FA');
    }
    bluetoothService.setHandedness(settings.handedness);
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<BlueMouseSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  return {
    settings,
    updateSettings,
    toggleTheme,
  };
}
