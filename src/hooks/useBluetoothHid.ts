import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { bluetoothHidBridge } from '../bridge/bluetoothHidBridge';
import { bluetoothService } from '../services/bluetoothService';
import {
  appendConnectionHistory,
  clearConnectionHistory,
  loadConnectionHistory,
} from '../services/settingsStorage';
import type {
  BlueMouseSettings,
  BluetoothHardwareState,
  BluetoothStatusSnapshot,
  BluetoothSupportInfo,
  ConnectionHistoryEntry,
  ConnectionPhase,
  HidPacketDiagnostic,
  HidRegistrationState,
  PairedBluetoothDevice,
} from '../types/bluetooth';

function derivePhase(
  isNativeAndroid: boolean,
  btState: BluetoothHardwareState,
  hidState: HidRegistrationState,
  rawConnection: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'failed',
  hasError: boolean
): ConnectionPhase {
  if (!isNativeAndroid) return 'web_unsupported';
  if (btState === 'disabled' || btState === 'turning_off') return 'bluetooth_disabled';
  if (rawConnection === 'connected') return 'connected';
  if (rawConnection === 'connecting') return 'pairing_in_progress';
  if (rawConnection === 'failed' || hasError) return 'connection_failed';
  if (hidState === 'registering') return 'hid_pending';
  if (hidState === 'registered') return 'waiting_for_pairing';
  if (btState === 'enabled') return 'bluetooth_enabled';
  return 'disconnected';
}

export function useBluetoothHid(
  settings: BlueMouseSettings,
  onSaveLastDevice: (address: string) => void
) {
  const [supportInfo, setSupportInfo] = useState<BluetoothSupportInfo | null>(null);
  const [status, setStatus] = useState<BluetoothStatusSnapshot>(() => ({
    isNativeAndroid: bluetoothHidBridge.isNativeAndroid(),
    bluetoothState: bluetoothHidBridge.isNativeAndroid() ? 'unknown' : 'unavailable',
    hidState: 'unregistered',
    connectionPhase: bluetoothHidBridge.isNativeAndroid() ? 'disconnected' : 'web_unsupported',
    connectedDevice: null,
    isDiscoverable: false,
    discoverableRemainingSeconds: 0,
    lastError: null,
  }));
  const [pairedDevices, setPairedDevices] = useState<PairedBluetoothDevice[]>([]);
  const [history, setHistory] = useState<ConnectionHistoryEntry[]>(() => loadConnectionHistory());
  const [diagnostics, setDiagnostics] = useState<HidPacketDiagnostic[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refreshState = useCallback(async () => {
    const [support, snapshot] = await Promise.all([
      bluetoothHidBridge.checkBluetoothSupport(),
      bluetoothHidBridge.getConnectionStatus(),
    ]);
    setSupportInfo(support);
    setStatus(snapshot);
    if (support.isNativeAndroid && support.hasRequiredPermissions) {
      const { devices } = await bluetoothHidBridge.getPairedDevices();
      setPairedDevices(devices);
    } else {
      setPairedDevices([]);
    }
  }, []);

  useEffect(() => {
    void refreshState();

    const unsubDiag = bluetoothService.subscribeDiagnostics((diag) => {
      setDiagnostics((prev) => [diag, ...prev].slice(0, 20));
    });

    let pluginListeners: PluginListenerHandle[] = [];
    let appListeners: PluginListenerHandle[] = [];

    void bluetoothHidBridge
      .addListeners({
        onBluetoothStateChanged: (btState) => {
          setStatus((prev) => ({
            ...prev,
            bluetoothState: btState,
            connectionPhase: derivePhase(
              prev.isNativeAndroid,
              btState,
              prev.hidState,
              prev.connectedDevice ? 'connected' : 'disconnected',
              Boolean(prev.lastError)
            ),
          }));
          if (btState === 'enabled') {
            void refreshState();
          }
        },
        onHidRegistrationChanged: (hidState, error) => {
          setStatus((prev) => ({
            ...prev,
            hidState,
            lastError: error ?? (hidState === 'failed' ? 'HID profile registration failed.' : null),
            connectionPhase: derivePhase(
              prev.isNativeAndroid,
              prev.bluetoothState,
              hidState,
              prev.connectedDevice ? 'connected' : 'disconnected',
              Boolean(error)
            ),
          }));
        },
        onConnectionStateChanged: ({ state, device, reason }) => {
          if (state === 'disconnected' || state === 'failed') {
            void bluetoothService.releaseAllKeys();
            void bluetoothService.releaseAllMouseButtons(settingsRef.current.handedness);
          }

          setStatus((prev) => {
            const nextDevice = state === 'connected' ? device ?? prev.connectedDevice : null;
            const nextError = state === 'failed' ? reason ?? 'Connection failed.' : null;
            return {
              ...prev,
              connectedDevice: nextDevice,
              lastError: nextError,
              connectionPhase: derivePhase(
                prev.isNativeAndroid,
                prev.bluetoothState,
                prev.hidState,
                state,
                state === 'failed'
              ),
            };
          });

          if (state === 'connected' && device) {
            onSaveLastDevice(device.address);
            setHistory(
              appendConnectionHistory({
                id: `${Date.now()}-${device.address}`,
                deviceName: device.name || 'Bluetooth Host',
                deviceAddress: device.address,
                timestamp: Date.now(),
                status: 'connected',
              })
            );
          } else if (state === 'disconnected' && device) {
            setHistory(
              appendConnectionHistory({
                id: `${Date.now()}-${device.address}`,
                deviceName: device.name || 'Bluetooth Host',
                deviceAddress: device.address,
                timestamp: Date.now(),
                status: 'disconnected',
                note: reason,
              })
            );
          } else if (state === 'failed') {
            setHistory(
              appendConnectionHistory({
                id: `${Date.now()}-fail`,
                deviceName: device?.name || 'Bluetooth Host',
                deviceAddress: device?.address || 'Unknown',
                timestamp: Date.now(),
                status: 'failed',
                note: reason ?? 'Connection attempt failed',
              })
            );
          }
        },
      })
      .then((handles) => {
        pluginListeners = handles;
      });

    // Respect Android foreground/background lifecycle
    if (bluetoothHidBridge.isNativeAndroid()) {
      void Promise.all([
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            // Release all keys & buttons before backgrounding to avoid stuck inputs
            void bluetoothService.releaseAllKeys();
            void bluetoothService.releaseAllMouseButtons(settingsRef.current.handedness);
          } else {
            // Re-verify Bluetooth & HID registration on foreground resume
            void refreshState().then(async () => {
              const snap = await bluetoothHidBridge.getConnectionStatus();
              if (
                snap.isNativeAndroid &&
                snap.bluetoothState === 'enabled' &&
                snap.hidState === 'unregistered'
              ) {
                await bluetoothHidBridge.registerHIDDevice();
              }
              if (
                settingsRef.current.autoReconnect &&
                settingsRef.current.lastDeviceAddress &&
                snap.hidState === 'registered' &&
                !snap.connectedDevice
              ) {
                await bluetoothHidBridge.connectDevice(settingsRef.current.lastDeviceAddress);
              }
            });
          }
        }),
      ]).then((handles) => {
        appListeners = handles;
      });
    }

    return () => {
      unsubDiag();
      pluginListeners.forEach((h) => void h.remove());
      appListeners.forEach((h) => void h.remove());
    };
  }, [onSaveLastDevice, refreshState]);

  const requestPermissions = useCallback(async () => {
    setIsBusy(true);
    try {
      await bluetoothHidBridge.requestPermissions();
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const enableBluetooth = useCallback(async () => {
    setIsBusy(true);
    try {
      await bluetoothHidBridge.requestBluetoothEnable();
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const registerHidProfile = useCallback(async () => {
    setIsBusy(true);
    try {
      setStatus((prev) => ({
        ...prev,
        hidState: 'registering',
        connectionPhase: 'hid_pending',
        lastError: null,
      }));
      const res = await bluetoothHidBridge.registerHIDDevice();
      if (!res.initiated && res.message) {
        setStatus((prev) => ({
          ...prev,
          hidState: 'failed',
          connectionPhase: prev.isNativeAndroid ? 'connection_failed' : 'web_unsupported',
          lastError: res.message ?? null,
        }));
      }
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const unregisterHidProfile = useCallback(async () => {
    setIsBusy(true);
    try {
      await bluetoothService.releaseAllKeys();
      await bluetoothService.releaseAllMouseButtons(settingsRef.current.handedness);
      await bluetoothHidBridge.unregisterHIDDevice();
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const makeDiscoverable = useCallback(async (durationSeconds = 120) => {
    setIsBusy(true);
    try {
      await bluetoothHidBridge.requestDiscoverability(durationSeconds);
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const openSystemBluetoothSettings = useCallback(async () => {
    await bluetoothHidBridge.openBluetoothSettings();
  }, []);

  const connectToDevice = useCallback(
    async (device: PairedBluetoothDevice) => {
      setIsBusy(true);
      try {
        setStatus((prev) => ({
          ...prev,
          connectionPhase: 'pairing_in_progress',
          lastError: null,
        }));
        const res = await bluetoothHidBridge.connectDevice(device.address);
        if (!res.initiated) {
          setStatus((prev) => ({
            ...prev,
            connectionPhase: prev.isNativeAndroid ? 'connection_failed' : 'web_unsupported',
            lastError: res.message ?? 'Could not initiate HID host connection.',
          }));
        }
      } finally {
        setIsBusy(false);
      }
    },
    []
  );

  const disconnectCurrentDevice = useCallback(async () => {
    setIsBusy(true);
    try {
      await bluetoothService.releaseAllKeys();
      await bluetoothService.releaseAllMouseButtons(settingsRef.current.handedness);
      await bluetoothHidBridge.disconnectDevice();
      await refreshState();
    } finally {
      setIsBusy(false);
    }
  }, [refreshState]);

  const clearHistory = useCallback(() => {
    clearConnectionHistory();
    setHistory([]);
  }, []);

  return {
    supportInfo,
    status,
    pairedDevices,
    history,
    diagnostics,
    isBusy,
    refreshState,
    requestPermissions,
    enableBluetooth,
    registerHidProfile,
    unregisterHidProfile,
    makeDiscoverable,
    openSystemBluetoothSettings,
    connectToDevice,
    disconnectCurrentDevice,
    clearHistory,
  };
}
