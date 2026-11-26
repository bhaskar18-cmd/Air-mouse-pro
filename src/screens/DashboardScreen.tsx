import {
  AlertCircle,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  CheckCircle2,
  ExternalLink,
  History,
  Laptop,
  Loader2,
  Radio,
  RefreshCw,
  ShieldAlert,
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
}

interface PhaseMeta {
  label: string;
  description: string;
  toneClass: string;
  icon: typeof Bluetooth;
  spinning?: boolean;
}

function getPhaseMeta(phase: ConnectionPhase, status: BluetoothStatusSnapshot): PhaseMeta {
  switch (phase) {
    case 'web_unsupported':
      return {
        label: 'Android APK Required',
        description:
          'You are viewing BlueMouse in a web browser. Native Bluetooth HID Device profiles cannot run in browser tabs; build and install the Android APK to pair over Bluetooth.',
        toneClass: 'text-amber-600 dark:text-amber-300 bg-amber-500/12 border-amber-500/30',
        icon: Smartphone,
      };
    case 'bluetooth_disabled':
      return {
        label: 'Bluetooth Disabled',
        description: 'Turn on Android Bluetooth to register the HID keyboard and mouse service.',
        toneClass: 'text-rose-600 dark:text-rose-300 bg-rose-500/12 border-rose-500/30',
        icon: BluetoothOff,
      };
    case 'bluetooth_enabled':
      return {
        label: 'Bluetooth Enabled',
        description:
          'Bluetooth hardware is ready. Register the BlueMouse HID peripheral profile to begin.',
        toneClass: 'text-blue-600 dark:text-cyan-300 bg-blue-500/12 border-blue-500/30',
        icon: Bluetooth,
      };
    case 'hid_pending':
      return {
        label: 'HID Registration Pending',
        description: 'Registering composite Mouse + Keyboard SDP descriptor with Android Bluetooth...',
        toneClass: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/12 border-cyan-500/30',
        icon: Loader2,
        spinning: true,
      };
    case 'waiting_for_pairing':
      return {
        label: 'Waiting for Pairing',
        description:
          'HID profile is active. Make your phone discoverable or select a previously paired host below.',
        toneClass: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/12 border-cyan-500/30',
        icon: Radio,
      };
    case 'pairing_in_progress':
      return {
        label: 'Pairing in Progress',
        description: 'Establishing Bluetooth HID interrupt and control channels with the host...',
        toneClass: 'text-blue-600 dark:text-blue-300 bg-blue-500/12 border-blue-500/30',
        icon: Loader2,
        spinning: true,
      };
    case 'connected':
      return {
        label: 'Connected',
        description: status.connectedDevice
          ? `Active Bluetooth HID session with ${status.connectedDevice.name}.`
          : 'Bluetooth HID session is active.',
        toneClass: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/12 border-emerald-500/30',
        icon: BluetoothConnected,
      };
    case 'connection_failed':
      return {
        label: 'Connection Failed',
        description:
          status.lastError ||
          'Could not establish HID connection. Ensure the host accepts incoming HID peripherals or re-pair in system Bluetooth settings.',
        toneClass: 'text-rose-600 dark:text-rose-300 bg-rose-500/12 border-rose-500/30',
        icon: AlertCircle,
      };
    case 'disconnected':
    default:
      return {
        label: 'Disconnected',
        description: 'No host is currently connected. Choose a paired device or pair a new host.',
        toneClass: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-400/30',
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
}: DashboardScreenProps) {
  const phaseMeta = getPhaseMeta(status.connectionPhase, status);
  const PhaseIcon = phaseMeta.icon;
  const isConnected = status.connectionPhase === 'connected';
  const needsPermissions =
    status.isNativeAndroid && supportInfo && !supportInfo.hasRequiredPermissions;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Hero Connection Card */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BlueMouseLogo size={54} className="shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  BlueMouse
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${phaseMeta.toneClass}`}
                >
                  <PhaseIcon
                    className={`h-3.5 w-3.5 ${phaseMeta.spinning ? 'animate-spin' : ''}`}
                  />
                  <span>{phaseMeta.label}</span>
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {phaseMeta.description}
              </p>
            </div>
          </div>

          {/* Primary Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {needsPermissions && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onRequestPermissions}
                className="min-h-[44px] px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Grant Bluetooth Permissions
              </button>
            )}

            {status.isNativeAndroid && status.bluetoothState === 'disabled' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onEnableBluetooth}
                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
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
                  className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
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
                  className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Make Discoverable (120s)
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onUnregisterHid}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap"
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
                  className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Open Mouse Pad
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onRequestDisconnect}
                  className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Disconnect
                </button>
              </>
            )}

            {!status.isNativeAndroid && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Android Build &amp; APK Guide
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isBusy}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#081020] hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Refresh Bluetooth status"
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Browser Environment Notice (Strict Honesty Rule) */}
        {!status.isNativeAndroid && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 space-y-1">
              <p className="font-semibold">
                Native Android HID functionality requires the installed Android application
              </p>
              <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                Web browsers cannot act as Bluetooth HID mouse/keyboard peripherals. You can
                explore the full touchpad, keyboard, settings, and HID report formatter here, then
                compile the included Kotlin plugin (`BluetoothHIDPlugin.kt`) via Capacitor and
                Android Studio to control Windows or Android hosts over real Bluetooth.
              </p>
            </div>
          </div>
        )}

        {/* 3-Column Live Hardware Readout */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#081020] px-4 py-3.5 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-xs text-slate-500 dark:text-slate-400">Bluetooth Radio</span>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white capitalize">
              {status.isNativeAndroid ? status.bluetoothState.replace('_', ' ') : 'Browser Runtime'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#081020] px-4 py-3.5 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              HID Service Registration
            </span>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white capitalize">
              {status.hidState}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#081020] px-4 py-3.5 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-xs text-slate-500 dark:text-slate-400">Connected Host</span>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
              {status.connectedDevice ? status.connectedDevice.name : 'None'}
            </p>
          </div>
        </div>
      </section>

      {/* Middle Split: Paired Devices + Guided Pairing Tutorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paired Devices Panel */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Paired Bluetooth Hosts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Devices bonded through Android system Bluetooth settings
              </p>
            </div>
            {status.isNativeAndroid && (
              <button
                type="button"
                onClick={onOpenBtSettings}
                className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>System Bluetooth</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {pairedDevices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 p-7 text-center">
              <Laptop className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 mb-2.5" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {status.isNativeAndroid
                  ? 'No bonded Bluetooth devices found'
                  : 'No native Bluetooth adapter in web browser'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {status.isNativeAndroid
                  ? 'Register the HID peripheral above, tap Make Discoverable, then pair your phone from Windows Bluetooth settings. Bonded hosts will appear here.'
                  : 'BlueMouse never fabricates mock Bluetooth devices. Once compiled and installed on Android, real paired Windows PCs and Android hosts will list here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {pairedDevices.map((device) => {
                const active = status.connectedDevice?.address === device.address;
                return (
                  <li
                    key={device.address}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {device.name || 'Unnamed Host'}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {device.address}
                        </p>
                      </div>
                    </div>

                    {active ? (
                      <button
                        type="button"
                        onClick={onRequestDisconnect}
                        className="min-h-[40px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy || status.hidState !== 'registered'}
                        onClick={() => onConnectDevice(device)}
                        className="min-h-[40px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-45 text-white text-xs font-semibold whitespace-nowrap"
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

        {/* System Pairing Tutorial */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Bluetooth Pairing Guide
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Windows 10/11 &amp; Android HID Host pairing steps
          </p>

          <ol className="space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600/15 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Register HID Peripheral
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calls <code className="font-mono">BluetoothHidDevice.registerApp()</code> with the
                  combined mouse &amp; keyboard SDP descriptor.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600/15 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Enable Discoverability
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap Make Discoverable so your computer can see the phone as an input peripheral.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600/15 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Pair from Target Device
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  On Windows, open Bluetooth &amp; devices → Add device → Bluetooth, then confirm
                  the pairing PIN on both screens.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600/15 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Control Immediately
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Switch to Mouse, Keyboard, or Combined mode. If your PC sleeps, tap Connect on its
                  entry above.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      {/* Bottom Split: Connection History + Troubleshooting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Connection History
              </h2>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="min-h-[36px] px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-500 flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              No Bluetooth HID connection events recorded yet. Real connection attempts on Android
              will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {history.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.deviceName}
                    </p>
                    <p className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.deviceAddress} · {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`font-semibold capitalize shrink-0 ${
                      item.status === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.status === 'failed'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Troubleshooting Tips
          </h2>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>Already paired earlier?</strong> Remove the phone from Windows Bluetooth
                devices first, register HID inside BlueMouse, then re-pair so Windows fetches the
                new Mouse+Keyboard SDP descriptor.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>HID Registration failed?</strong> Some older Android 8 devices or custom
                OEM ROMs disable the <code className="font-mono">BluetoothHidDevice</code> service.
                Android 9+ stock or Pixel/Samsung/OnePlus firmware works best.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>App backgrounded?</strong> Android may pause background HID transmission.
                Return to BlueMouse to automatically verify and restore HID registration.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
