import {
  AlertCircle,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  ChevronRight,
  ExternalLink,
  History,
  Keyboard,
  Laptop,
  Loader2,
  MousePointer2,
  Radio,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { BlueMouseLogo } from '../components/BlueMouseLogo';
import type {
  AppScreen,
  BluetoothStatusSnapshot,
  BluetoothSupportInfo,
  ConnectionHistoryEntry,
  ConnectionPhase,
  DeviceProfile,
  PairedBluetoothDevice,
} from '../types/bluetooth';

interface DashboardScreenProps {
  supportInfo: BluetoothSupportInfo | null;
  status: BluetoothStatusSnapshot;
  pairedDevices: PairedBluetoothDevice[];
  history: ConnectionHistoryEntry[];
  isBusy: boolean;
  onRequestPermissions: () => void;
  onEnableBluetooth: () => void;
  onRegisterHid: () => void;
  onUnregisterHid: () => void;
  onMakeDiscoverable: () => void;
  onOpenBtSettings: () => void;
  onConnectDevice: (device: PairedBluetoothDevice) => void;
  onRequestDisconnect: () => void;
  onRefresh: () => void;
  onClearHistory: () => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenApkGuide: () => void;
  activeProfile?: DeviceProfile | null;
}

interface PhaseMeta {
  label: string;
  description: string;
  textClass: string;
  icon: typeof Bluetooth;
  spinning?: boolean;
}

function getPhaseMeta(phase: ConnectionPhase, status: BluetoothStatusSnapshot): PhaseMeta {
  switch (phase) {
    case 'web_unsupported':
      return {
        label: 'Android APK Required',
        description:
          'Viewing in a web browser. Build and install the Android APK on an Android 9+ smartphone to pair over Bluetooth HID.',
        textClass: 'text-amber-700 dark:text-amber-400',
        icon: Smartphone,
      };
    case 'bluetooth_disabled':
      return {
        label: 'Bluetooth Disabled',
        description: 'Turn on Android Bluetooth to register the HID keyboard and mouse service.',
        textClass: 'text-rose-600 dark:text-rose-400',
        icon: BluetoothOff,
      };
    case 'bluetooth_enabled':
      return {
        label: 'Bluetooth Ready',
        description:
          'Bluetooth radio is enabled. Register the BlueMouse HID profile to connect with a computer.',
        textClass: 'text-[#2563EB] dark:text-[#6B9BFF]',
        icon: Bluetooth,
      };
    case 'hid_pending':
      return {
        label: 'Registering HID Profile',
        description: 'Registering composite Mouse + Keyboard + Media HID descriptor with Android...',
        textClass: 'text-[#2563EB] dark:text-[#6B9BFF]',
        icon: Loader2,
        spinning: true,
      };
    case 'waiting_for_pairing':
      return {
        label: 'Waiting for Pairing',
        description:
          'HID service active. Make your smartphone discoverable or select a paired device below.',
        textClass: 'text-[#2563EB] dark:text-[#6B9BFF]',
        icon: Radio,
      };
    case 'pairing_in_progress':
      return {
        label: 'Connecting',
        description: 'Establishing Bluetooth HID control and interrupt channels...',
        textClass: 'text-[#2563EB] dark:text-[#6B9BFF]',
        icon: Loader2,
        spinning: true,
      };
    case 'connected':
      return {
        label: 'Connected',
        description: status.connectedDevice
          ? `Connected to ${status.connectedDevice.name} (${status.connectedDevice.address}).`
          : 'Bluetooth HID session is active.',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        icon: BluetoothConnected,
      };
    case 'connection_failed':
      return {
        label: 'Connection Failed',
        description:
          status.lastError ||
          'Could not establish HID connection. Ensure the host accepts Bluetooth HID peripherals.',
        textClass: 'text-rose-600 dark:text-rose-400',
        icon: AlertCircle,
      };
    case 'disconnected':
    default:
      return {
        label: 'Disconnected',
        description: 'No host is currently connected. Select a paired host or pair a new computer.',
        textClass: 'text-[#667085] dark:text-[#A0A5B1]',
        icon: BluetoothOff,
      };
  }
}

export function DashboardScreen({
  supportInfo,
  status,
  pairedDevices,
  history,
  isBusy,
  onRequestPermissions,
  onEnableBluetooth,
  onRegisterHid,
  onUnregisterHid,
  onMakeDiscoverable,
  onOpenBtSettings,
  onConnectDevice,
  onRequestDisconnect,
  onRefresh,
  onClearHistory,
  onNavigate,
  onOpenApkGuide,
  activeProfile,
}: DashboardScreenProps) {
  const phaseMeta = getPhaseMeta(status.connectionPhase, status);
  const PhaseIcon = phaseMeta.icon;
  const isConnected = status.connectionPhase === 'connected';
  const needsPermissions =
    status.isNativeAndroid && supportInfo && !supportInfo.hasRequiredPermissions;

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Connection Summary */}
      <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <BlueMouseLogo size={48} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
                  BlueMouse
                </h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${phaseMeta.textClass}`}>
                  <PhaseIcon className={`h-3.5 w-3.5 ${phaseMeta.spinning ? 'animate-spin' : ''}`} />
                  <span>{phaseMeta.label}</span>
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[#667085] dark:text-[#A0A5B1] max-w-2xl leading-relaxed">
                {phaseMeta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {needsPermissions && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onRequestPermissions}
                className="min-h-[44px] px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Grant Bluetooth Permissions
              </button>
            )}

            {status.isNativeAndroid && status.bluetoothState === 'disabled' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onEnableBluetooth}
                className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Enable Bluetooth
              </button>
            )}

            {status.isNativeAndroid &&
              status.bluetoothState === 'enabled' &&
              status.hidState !== 'registered' && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onRegisterHid}
                  className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Register HID Peripheral
                </button>
              )}

            {status.isNativeAndroid && status.hidState === 'registered' && !isConnected && (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onMakeDiscoverable}
                  className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Make Discoverable (120s)
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onUnregisterHid}
                  className="min-h-[44px] px-4 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Unregister HID
                </button>
              </>
            )}

            {isConnected && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('mouse')}
                  className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Open Mouse Pad
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onRequestDisconnect}
                  className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Disconnect
                </button>
              </>
            )}

            {!status.isNativeAndroid && (
              <button
                type="button"
                onClick={onOpenApkGuide}
                className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Android Build &amp; APK Guide
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isBusy}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] hover:bg-[#EEF0F4] dark:hover:bg-[#222630] text-[#667085] dark:text-[#A0A5B1] flex items-center justify-center transition-colors"
              aria-label="Refresh Bluetooth status"
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Clean 3-Metric Status Row separated by hairline dividers */}
        <div className="mt-5 pt-4 border-t border-[#E5E7EB] dark:border-[#30343D] grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-[#667085] dark:text-[#A0A5B1]">Connected Device</span>
            <p className="mt-0.5 font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
              {status.connectedDevice ? status.connectedDevice.name : 'None'}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#667085] dark:text-[#A0A5B1]">Bluetooth HID Service</span>
            <p className="mt-0.5 font-semibold text-[#172033] dark:text-[#F4F5F7] capitalize">
              {status.isNativeAndroid ? `${status.bluetoothState.replace('_', ' ')} · ${status.hidState}` : 'Browser Runtime'}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#667085] dark:text-[#A0A5B1]">Active Device Profile</span>
            <p className="mt-0.5 font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
              {activeProfile ? activeProfile.name : 'Default Profile'}
            </p>
          </div>
        </div>

        {/* Unsupported Hardware Warning */}
        {status.isNativeAndroid && supportInfo && !supportInfo.hidProfileSupported && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#30343D] flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Bluetooth HID Device Profile Unsupported:</strong>{' '}
              {supportInfo.reason ||
                'This device does not expose BluetoothHidDevice (requires Android 9+ with HID Device profile support).'}
            </p>
          </div>
        )}

        {/* Explicit Error Notice */}
        {status.lastError && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#30343D] flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Bluetooth HID Error:</strong> {status.lastError}
            </p>
          </div>
        )}

        {/* Browser Environment Notice */}
        {!status.isNativeAndroid && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#30343D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1]">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Web browsers cannot act as Bluetooth HID peripherals. Use the preview to test the
                touchpad, keyboard, and device profiles, or build the Android APK for live Bluetooth
                control.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenApkGuide}
              className="min-h-[38px] px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-xs font-semibold text-[#172033] dark:text-[#F4F5F7] whitespace-nowrap shrink-0"
            >
              Open Build Guide
            </button>
          </div>
        )}
      </section>

      {/* Quick Access Mode Launcher */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            id: 'mouse' as AppScreen,
            title: 'Mouse Pad',
            subtitle: 'Expanded cursor surface',
            icon: MousePointer2,
          },
          {
            id: 'keyboard' as AppScreen,
            title: 'Keyboard',
            subtitle: 'Full US QWERTY HID',
            icon: Keyboard,
          },
          {
            id: 'combined' as AppScreen,
            title: 'Combined',
            subtitle: 'Trackpad + keys',
            icon: SlidersHorizontal,
          },
          {
            id: 'profiles' as AppScreen,
            title: 'Device Profiles',
            subtitle: activeProfile ? activeProfile.name : 'Custom controls',
            icon: Sliders,
          },
          {
            id: 'settings' as AppScreen,
            title: 'Settings',
            subtitle: 'Tuning & APK guide',
            icon: Settings,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="text-left rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:border-[#2563EB]/50 dark:hover:border-[#6B9BFF]/50 p-4 transition-colors duration-150 flex items-center justify-between gap-3 active:opacity-85"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#172033] dark:text-[#F4F5F7]">
                  <Icon className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
                  <span className="text-sm font-semibold truncate">{item.title}</span>
                </div>
                <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-1 truncate">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#667085] dark:text-[#A0A5B1] shrink-0" />
            </button>
          );
        })}
      </section>

      {/* Paired Devices + Pairing Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7]">
                Paired Bluetooth Hosts
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
                Devices bonded through Android system Bluetooth settings
              </p>
            </div>
            {status.isNativeAndroid && (
              <button
                type="button"
                onClick={onOpenBtSettings}
                className="min-h-[38px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>System Bluetooth</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {pairedDevices.length === 0 ? (
            <div className="py-8 text-center">
              <Laptop className="h-7 w-7 mx-auto text-[#667085] dark:text-[#A0A5B1] mb-2" />
              <p className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
                {status.isNativeAndroid
                  ? 'No bonded Bluetooth devices found'
                  : 'No native Bluetooth adapter in web browser'}
              </p>
              <p className="mt-1 text-xs text-[#667085] dark:text-[#A0A5B1] max-w-md mx-auto leading-relaxed">
                {status.isNativeAndroid
                  ? 'Register the HID peripheral above, tap Make Discoverable, then pair from Windows Bluetooth settings.'
                  : 'Install the compiled Android APK to list real paired Windows and Android Bluetooth hosts here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E7EB] dark:divide-[#30343D]">
              {pairedDevices.map((device) => {
                const active = status.connectedDevice?.address === device.address;
                return (
                  <li
                    key={device.address}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Laptop className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
                          {device.name || 'Unnamed Host'}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-[#667085] dark:text-[#A0A5B1]">
                          {device.address}
                        </p>
                      </div>
                    </div>

                    {active ? (
                      <button
                        type="button"
                        onClick={onRequestDisconnect}
                        className="min-h-[38px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy || status.hidState !== 'registered'}
                        onClick={() => onConnectDevice(device)}
                        className="min-h-[38px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] disabled:opacity-45 text-xs font-semibold whitespace-nowrap"
                      >
                        Connect
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7] mb-1">
            Quick Pairing Guide
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mb-4">
            Windows 10/11 PCs and Android hosts supporting HID Host mode
          </p>

          <ol className="space-y-3 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1]">
            <li>
              <strong className="text-[#172033] dark:text-[#F4F5F7]">1. Register HID Peripheral</strong>
              <p className="text-xs mt-0.5">
                Registers Mouse, Keyboard, and Media Consumer Control via{' '}
                <code className="font-mono">BluetoothHidDevice.registerApp()</code>.
              </p>
            </li>
            <li>
              <strong className="text-[#172033] dark:text-[#F4F5F7]">2. Enable Discoverability</strong>
              <p className="text-xs mt-0.5">
                Tap Make Discoverable so your computer can detect the phone as an HID peripheral.
              </p>
            </li>
            <li>
              <strong className="text-[#172033] dark:text-[#F4F5F7]">3. Pair from Target Device</strong>
              <p className="text-xs mt-0.5">
                Open Bluetooth settings on your PC, add your phone, and confirm the pairing code.
              </p>
            </li>
            <li>
              <strong className="text-[#172033] dark:text-[#F4F5F7]">4. Reconnect Anytime</strong>
              <p className="text-xs mt-0.5">
                Each host keeps its own saved touchpad, mouse, and keyboard profile automatically.
              </p>
            </li>
          </ol>
        </section>
      </div>

      {/* Connection History */}
      <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
            <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7]">
              Connection History
            </h2>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="min-h-[36px] px-3 rounded-lg text-xs font-medium text-[#667085] dark:text-[#A0A5B1] hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#667085] dark:text-[#A0A5B1] py-2">
            No Bluetooth HID connection events recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB] dark:divide-[#30343D]">
            {history.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
                    {item.deviceName}
                  </p>
                  <p className="font-mono text-[#667085] dark:text-[#A0A5B1] tabular-nums">
                    {item.deviceAddress} · {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`font-semibold capitalize shrink-0 ${
                    item.status === 'connected'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : item.status === 'failed'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-[#667085] dark:text-[#A0A5B1]'
                  }`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
