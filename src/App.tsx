/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { ApkBuildGuideModal } from './components/ApkBuildGuideModal';
import { AppShell } from './components/AppShell';
import { ConfirmDisconnectModal } from './components/ConfirmDisconnectModal';
import { FeedbackToast, type ToastNotice } from './components/FeedbackToast';
import { OnboardingModal } from './components/OnboardingModal';
import { useBluetoothHid } from './hooks/useBluetoothHid';
import { useDeviceProfiles } from './hooks/useDeviceProfiles';
import { useSettings } from './hooks/useSettings';
import { CombinedScreen } from './screens/CombinedScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { KeyboardScreen } from './screens/KeyboardScreen';
import { MouseScreen } from './screens/MouseScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { isOnboardingCompleted, markOnboardingCompleted } from './services/settingsStorage';
import type { AppScreen, PairedBluetoothDevice } from './types/bluetooth';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingCompleted());
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const { settings, updateSettings } = useSettings();

  const showToast = useCallback((tone: ToastNotice['tone'], message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    const id = Date.now();
    setToast({ id, tone, message });
    if (tone !== 'loading') {
      toastTimerRef.current = window.setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
      }, 3600);
    }
  }, []);

  const handleSaveLastDevice = useCallback(
    (address: string) => {
      updateSettings({ lastDeviceAddress: address });
    },
    [updateSettings]
  );

  const bt = useBluetoothHid(settings, handleSaveLastDevice);
  const profiles = useDeviceProfiles(settings, bt.status.connectedDevice, bt.pairedDevices);

  const handlePrimaryHeaderAction = async () => {
    if (bt.status.connectionPhase === 'connected') {
      setShowDisconnectConfirm(true);
      return;
    }
    if (!bt.status.isNativeAndroid) {
      setShowApkGuide(true);
      return;
    }
    if (bt.status.hidState === 'registered') {
      showToast('loading', 'Requesting Bluetooth discoverability...');
      await bt.makeDiscoverable(120);
      showToast('info', 'Device discoverable for system pairing.');
    } else {
      showToast('loading', 'Registering Bluetooth HID peripheral...');
      await bt.registerHidProfile();
    }
  };

  const handleRefresh = async () => {
    showToast('loading', 'Checking Bluetooth HID hardware status...');
    try {
      await bt.refreshState();
      if (bt.status.isNativeAndroid) {
        showToast('success', 'Bluetooth HID status refreshed.');
      } else {
        showToast('info', 'Browser runtime detected — install the Android APK for live Bluetooth HID.');
      }
    } catch {
      showToast('error', 'Failed to refresh Bluetooth status.');
    }
  };

  const handleRequestPermissions = async () => {
    showToast('loading', 'Requesting Android Bluetooth permissions...');
    try {
      await bt.requestPermissions();
      showToast('success', 'Bluetooth permission status updated.');
    } catch {
      showToast('error', 'Bluetooth permission request failed.');
    }
  };

  const handleEnableBluetooth = async () => {
    showToast('loading', 'Opening Android Bluetooth enable dialog...');
    try {
      await bt.enableBluetooth();
      showToast('success', 'Bluetooth status updated.');
    } catch {
      showToast('error', 'Could not enable Bluetooth.');
    }
  };

  const handleRegisterHid = async () => {
    showToast('loading', 'Registering Mouse & Keyboard HID profile...');
    try {
      await bt.registerHidProfile();
      showToast('info', 'HID registration request sent to Android.');
    } catch {
      showToast('error', 'Failed to register HID peripheral.');
    }
  };

  const handleUnregisterHid = async () => {
    showToast('loading', 'Unregistering HID peripheral...');
    try {
      await bt.unregisterHidProfile();
      showToast('success', 'HID peripheral unregistered.');
    } catch {
      showToast('error', 'Failed to unregister HID peripheral.');
    }
  };

  const handleMakeDiscoverable = async () => {
    showToast('loading', 'Making smartphone discoverable for 120 seconds...');
    try {
      await bt.makeDiscoverable(120);
      showToast('info', 'Bluetooth discoverability requested.');
    } catch {
      showToast('error', 'Could not start Bluetooth discoverability.');
    }
  };

  const handleConnectDevice = async (device: PairedBluetoothDevice) => {
    showToast('loading', `Connecting to ${device.name || device.address}...`);
    try {
      await bt.connectToDevice(device);
    } catch {
      showToast('error', `Failed to connect to ${device.name || device.address}.`);
    }
  };

  const handleOpenChecklist = () => {
    setActiveScreen('settings');
    window.setTimeout(() => {
      const el = document.getElementById('testing-checklist-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        status={bt.status}
        onPrimaryAction={() => void handlePrimaryHeaderAction()}
      >
        {activeScreen === 'dashboard' && (
          <DashboardScreen
            supportInfo={bt.supportInfo}
            status={bt.status}
            pairedDevices={bt.pairedDevices}
            history={bt.history}
            isBusy={bt.isBusy}
            activeProfile={profiles.activeProfile}
            onRequestPermissions={() => void handleRequestPermissions()}
            onEnableBluetooth={() => void handleEnableBluetooth()}
            onRegisterHid={() => void handleRegisterHid()}
            onUnregisterHid={() => void handleUnregisterHid()}
            onMakeDiscoverable={() => void handleMakeDiscoverable()}
            onOpenBtSettings={() => void bt.openSystemBluetoothSettings()}
            onConnectDevice={(device) => void handleConnectDevice(device)}
            onRequestDisconnect={() => setShowDisconnectConfirm(true)}
            onRefresh={() => void handleRefresh()}
            onClearHistory={() => {
              bt.clearHistory();
              showToast('success', 'Connection history cleared.');
            }}
            onNavigate={setActiveScreen}
            onOpenApkGuide={() => setShowApkGuide(true)}
          />
        )}

        {activeScreen === 'mouse' && (
          <MouseScreen
            settings={profiles.effectiveSettings}
            status={bt.status}
            diagnostics={bt.diagnostics}
            activeProfile={profiles.activeProfile}
            onNavigate={setActiveScreen}
            onUpdateProfileTouchpad={(patch) => {
              profiles.updateProfileTouchpad(patch);
              updateSettings(patch);
              if (patch.handedness) {
                showToast(
                  'success',
                  `Mouse buttons switched to ${patch.handedness}-handed mode.`
                );
              }
            }}
          />
        )}

        {activeScreen === 'keyboard' && (
          <KeyboardScreen
            settings={profiles.effectiveSettings}
            status={bt.status}
            diagnostics={bt.diagnostics}
            activeProfile={profiles.activeProfile}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'combined' && (
          <CombinedScreen
            settings={profiles.effectiveSettings}
            status={bt.status}
            diagnostics={bt.diagnostics}
            activeProfile={profiles.activeProfile}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'profiles' && (
          <ProfilesScreen
            connectedDevice={bt.status.connectedDevice}
            allDevices={profiles.allDeviceEntries}
            activeDeviceAddress={profiles.activeDeviceAddress}
            activeDeviceEntry={profiles.activeDeviceEntry}
            activeProfile={profiles.activeProfile}
            onSelectDevice={(addr) => profiles.selectDeviceForEditing(addr)}
            onSwitchProfile={(id) => profiles.switchProfile(id)}
            onCreateProfile={(tpl, name) => profiles.createProfile(tpl, name)}
            onRenameProfile={(id, name) => profiles.renameProfile(id, name)}
            onDuplicateProfile={(id) => profiles.duplicateProfile(id)}
            onDeleteProfile={(id) => profiles.deleteProfile(id)}
            onSetDefaultProfile={(id) => profiles.setDefaultProfile(id)}
            onResetProfile={(id) => profiles.resetProfileToTemplate(id)}
            onSetKeyMapping={(keyId, binding) => profiles.setKeyMapping(keyId, binding)}
            onSetMouseMapping={(slotId, binding) => profiles.setMouseMapping(slotId, binding)}
            onUpdateTouchpad={(patch) => profiles.updateProfileTouchpad(patch)}
            onExportJson={profiles.exportActiveProfile}
            onImportJson={(json) => profiles.importProfileJson(json)}
            onNotify={(tone, message) => showToast(tone, message)}
          />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenOnboarding={() => setShowOnboarding(true)}
            onOpenApkGuide={() => setShowApkGuide(true)}
            onNotify={(tone, message) => showToast(tone, message)}
          />
        )}
      </AppShell>

      <OnboardingModal
        open={showOnboarding}
        onComplete={() => {
          markOnboardingCompleted(true);
          setShowOnboarding(false);
        }}
      />

      <ApkBuildGuideModal
        open={showApkGuide}
        onClose={() => setShowApkGuide(false)}
        onOpenChecklist={handleOpenChecklist}
      />

      <ConfirmDisconnectModal
        open={showDisconnectConfirm}
        device={bt.status.connectedDevice}
        onCancel={() => setShowDisconnectConfirm(false)}
        onConfirm={() => {
          setShowDisconnectConfirm(false);
          showToast('loading', 'Disconnecting Bluetooth host...');
          void bt.disconnectCurrentDevice().then(() => {
            showToast('success', 'Disconnected safely.');
          });
        }}
      />

      <FeedbackToast notice={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
