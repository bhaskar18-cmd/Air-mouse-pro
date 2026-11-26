import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type {
  BluetoothHardwareState,
  BluetoothStatusSnapshot,
  BluetoothSupportInfo,
  HidRegistrationState,
  KeyboardReportPayload,
  MouseReportPayload,
  PairedBluetoothDevice,
} from '../types/bluetooth';

export interface BluetoothHIDPluginInterface {
  checkBluetoothSupport(): Promise<BluetoothSupportInfo>;
  getBluetoothState(): Promise<{
    state: BluetoothHardwareState;
    hasRequiredPermissions: boolean;
    missingPermissions: string[];
  }>;
  requestBluetoothEnable(): Promise<{ requested: boolean; enabled: boolean }>;
  requestPermissions(): Promise<{ granted: boolean; missingPermissions: string[] }>;
  registerHIDDevice(): Promise<{ initiated: boolean; registered: boolean; message?: string }>;
  unregisterHIDDevice(): Promise<{ unregistered: boolean }>;
  getPairedDevices(): Promise<{ devices: PairedBluetoothDevice[] }>;
  requestDiscoverability(options?: { durationSeconds?: number }): Promise<{
    requested: boolean;
    durationSeconds: number;
  }>;
  openBluetoothSettings(): Promise<{ opened: boolean }>;
  connectDevice(options: { address: string }): Promise<{ initiated: boolean; message?: string }>;
  disconnectDevice(): Promise<{ initiated: boolean }>;
  sendMouseReport(options: MouseReportPayload): Promise<{ sent: boolean }>;
  sendKeyboardReport(options: KeyboardReportPayload): Promise<{ sent: boolean }>;
  getConnectionStatus(): Promise<BluetoothStatusSnapshot>;
  addListener(
    eventName: 'bluetoothStateChanged',
    listenerFunc: (data: { state: BluetoothHardwareState }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'hidRegistrationChanged',
    listenerFunc: (data: { state: HidRegistrationState; error?: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'connectionStateChanged',
    listenerFunc: (data: {
      state: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'failed';
      device?: PairedBluetoothDevice | null;
      reason?: string;
    }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'discoverabilityChanged',
    listenerFunc: (data: { isDiscoverable: boolean }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'bondStateChanged',
    listenerFunc: (data: {
      bondState: 'bonded' | 'bonding' | 'cancelled' | 'none';
      device?: PairedBluetoothDevice;
    }) => void
  ): Promise<PluginListenerHandle>;
}

const NativeBluetoothHID = registerPlugin<BluetoothHIDPluginInterface>('BluetoothHID');

export function isNativeAndroidRuntime(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export const bluetoothHidBridge = {
  isNativeAndroid(): boolean {
    return isNativeAndroidRuntime();
  },

  async checkBluetoothSupport(): Promise<BluetoothSupportInfo> {
    if (!isNativeAndroidRuntime()) {
      return {
        isNativeAndroid: false,
        bluetoothSupported: false,
        hidProfileSupported: false,
        androidSdkInt: 0,
        hasRequiredPermissions: false,
        missingPermissions: [],
        reason:
          'Running inside a web browser. Android BluetoothHidDevice requires the compiled BlueMouse Android APK installed on an Android 9+ smartphone.',
      };
    }
    return NativeBluetoothHID.checkBluetoothSupport();
  },

  async getBluetoothState() {
    if (!isNativeAndroidRuntime()) {
      return {
        state: 'unavailable' as BluetoothHardwareState,
        hasRequiredPermissions: false,
        missingPermissions: [],
      };
    }
    return NativeBluetoothHID.getBluetoothState();
  },

  async requestPermissions() {
    if (!isNativeAndroidRuntime()) {
      return { granted: false, missingPermissions: ['BLUETOOTH_CONNECT'] };
    }
    return NativeBluetoothHID.requestPermissions();
  },

  async requestBluetoothEnable() {
    if (!isNativeAndroidRuntime()) {
      return { requested: false, enabled: false };
    }
    return NativeBluetoothHID.requestBluetoothEnable();
  },

  async registerHIDDevice() {
    if (!isNativeAndroidRuntime()) {
      return {
        initiated: false,
        registered: false,
        message: 'Native Android runtime required to register Bluetooth HID SDP profile.',
      };
    }
    return NativeBluetoothHID.registerHIDDevice();
  },

  async unregisterHIDDevice() {
    if (!isNativeAndroidRuntime()) {
      return { unregistered: false };
    }
    return NativeBluetoothHID.unregisterHIDDevice();
  },

  async getPairedDevices(): Promise<{ devices: PairedBluetoothDevice[] }> {
    if (!isNativeAndroidRuntime()) {
      return { devices: [] };
    }
    return NativeBluetoothHID.getPairedDevices();
  },

  async requestDiscoverability(durationSeconds = 120) {
    if (!isNativeAndroidRuntime()) {
      return { requested: false, durationSeconds: 0 };
    }
    return NativeBluetoothHID.requestDiscoverability({ durationSeconds });
  },

  async openBluetoothSettings() {
    if (!isNativeAndroidRuntime()) {
      return { opened: false };
    }
    return NativeBluetoothHID.openBluetoothSettings();
  },

  async connectDevice(address: string) {
    if (!isNativeAndroidRuntime()) {
      return {
        initiated: false,
        message: 'Cannot connect in browser preview. Install the Android APK.',
      };
    }
    return NativeBluetoothHID.connectDevice({ address });
  },

  async disconnectDevice() {
    if (!isNativeAndroidRuntime()) {
      return { initiated: false };
    }
    return NativeBluetoothHID.disconnectDevice();
  },

  async sendMouseReport(payload: MouseReportPayload) {
    if (!isNativeAndroidRuntime()) {
      return { sent: false };
    }
    return NativeBluetoothHID.sendMouseReport(payload);
  },

  async sendKeyboardReport(payload: KeyboardReportPayload) {
    if (!isNativeAndroidRuntime()) {
      return { sent: false };
    }
    return NativeBluetoothHID.sendKeyboardReport(payload);
  },

  async getConnectionStatus(): Promise<BluetoothStatusSnapshot> {
    if (!isNativeAndroidRuntime()) {
      return {
        isNativeAndroid: false,
        bluetoothState: 'unavailable',
        hidState: 'unregistered',
        connectionPhase: 'web_unsupported',
        connectedDevice: null,
        isDiscoverable: false,
        discoverableRemainingSeconds: 0,
        lastError: null,
      };
    }
    return NativeBluetoothHID.getConnectionStatus();
  },

  addListeners(handlers: {
    onBluetoothStateChanged: (state: BluetoothHardwareState) => void;
    onHidRegistrationChanged: (state: HidRegistrationState, error?: string) => void;
    onConnectionStateChanged: (payload: {
      state: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'failed';
      device?: PairedBluetoothDevice | null;
      reason?: string;
    }) => void;
    onDiscoverabilityChanged?: (isDiscoverable: boolean) => void;
    onBondStateChanged?: (payload: {
      bondState: 'bonded' | 'bonding' | 'cancelled' | 'none';
      device?: PairedBluetoothDevice;
    }) => void;
  }): Promise<PluginListenerHandle[]> {
    if (!isNativeAndroidRuntime()) {
      return Promise.resolve([]);
    }
    return Promise.all([
      NativeBluetoothHID.addListener('bluetoothStateChanged', (d) =>
        handlers.onBluetoothStateChanged(d.state)
      ),
      NativeBluetoothHID.addListener('hidRegistrationChanged', (d) =>
        handlers.onHidRegistrationChanged(d.state, d.error)
      ),
      NativeBluetoothHID.addListener('connectionStateChanged', (d) =>
        handlers.onConnectionStateChanged(d)
      ),
      NativeBluetoothHID.addListener('discoverabilityChanged', (d) =>
        handlers.onDiscoverabilityChanged?.(d.isDiscoverable)
      ),
      NativeBluetoothHID.addListener('bondStateChanged', (d) =>
        handlers.onBondStateChanged?.(d)
      ),
    ]);
  },
};
