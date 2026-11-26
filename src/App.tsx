/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell';
import { ConfirmDisconnectModal } from './components/ConfirmDisconnectModal';
import { OnboardingModal } from './components/OnboardingModal';
import { useBluetoothHid } from './hooks/useBluetoothHid';
import { useSettings } from './hooks/useSettings';
import { CombinedScreen } from './screens/CombinedScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { KeyboardScreen } from './screens/KeyboardScreen';
import { MouseScreen } from './screens/MouseScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { isOnboardingCompleted, markOnboardingCompleted } from './services/settingsStorage';
import type { AppScreen } from './types/bluetooth';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingCompleted());
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const { settings, updateSettings } = useSettings();

  const handleSaveLastDevice = useCallback(
    (address: string) => {
      updateSettings({ lastDeviceAddress: address });
    },
    [updateSettings]
  );

  const bt = useBluetoothHid(settings, handleSaveLastDevice);

  const handlePrimaryHeaderAction = () => {
    if (bt.status.connectionPhase === 'connected') {
      setShowDisconnectConfirm(true);
      return;
    }
    if (!bt.status.isNativeAndroid) {
      setActiveScreen('settings');
      return;
    }
    if (bt.status.hidState === 'registered') {
      void bt.makeDiscoverable(120);
    } else {
      void bt.registerHidProfile();
    }
  };

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        status={bt.status}
        onPrimaryAction={handlePrimaryHeaderAction}
      >
        {activeScreen === 'dashboard' && (
          <DashboardScreen
            supportInfo={bt.supportInfo}
            status={bt.status}
            pairedDevices={bt.pairedDevices}
            history={bt.history}
            isBusy={bt.isBusy}
            onRequestPermissions={bt.requestPermissions}
            onEnableBluetooth={bt.enableBluetooth}
            onRegisterHid={bt.registerHidProfile}
            onUnregisterHid={bt.unregisterHidProfile}
            onMakeDiscoverable={() => bt.makeDiscoverable(120)}
            onOpenBtSettings={bt.openSystemBluetoothSettings}
            onConnectDevice={bt.connectToDevice}
            onRequestDisconnect={() => setShowDisconnectConfirm(true)}
            onRefresh={bt.refreshState}
            onClearHistory={bt.clearHistory}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'mouse' && (
          <MouseScreen
            settings={settings}
            status={bt.status}
            diagnostics={bt.diagnostics}
            onNavigate={setActiveScreen}
            onUpdateSettings={updateSettings}
          />
        )}

        {activeScreen === 'keyboard' && (
          <KeyboardScreen
            settings={settings}
            status={bt.status}
            diagnostics={bt.diagnostics}
          />
        )}

        {activeScreen === 'combined' && (
          <CombinedScreen
            settings={settings}
            status={bt.status}
            diagnostics={bt.diagnostics}
          />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenOnboarding={() => setShowOnboarding(true)}
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

      <ConfirmDisconnectModal
        open={showDisconnectConfirm}
        device={bt.status.connectedDevice}
        onCancel={() => setShowDisconnectConfirm(false)}
        onConfirm={() => {
          setShowDisconnectConfirm(false);
          void bt.disconnectCurrentDevice();
        }}
      />
    </>
  );
}
