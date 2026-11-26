import { Hand, Sliders } from 'lucide-react';
import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { TouchpadSurface } from '../components/TouchpadSurface';
import type {
  AppScreen,
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface MouseScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
  onNavigate: (screen: AppScreen) => void;
  onUpdateSettings: (patch: Partial<BlueMouseSettings>) => void;
}

export function MouseScreen({
  settings,
  status,
  diagnostics,
  onNavigate,
  onUpdateSettings,
}: MouseScreenProps) {
  const isConnected = status.connectionPhase === 'connected';

  return (
    <div className="flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Wireless Mouse
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {isConnected && status.connectedDevice
              ? `Sending relative HID pointer reports to ${status.connectedDevice.name}`
              : status.isNativeAndroid
                ? 'Not connected to a Bluetooth host — connect from Dashboard to control a cursor'
                : 'Browser preview — install Android APK to transmit real Bluetooth HID reports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                handedness: settings.handedness === 'right' ? 'left' : 'right',
              })
            }
            className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
          >
            <Hand className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{settings.handedness === 'right' ? 'Right-Handed' : 'Left-Handed'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Tune Sensitivity</span>
          </button>
        </div>
      </div>

      {/* Main Touchpad + Side Gesture Guide on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <TouchpadSurface settings={settings} isConnected={isConnected} />
        </div>

        <aside className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Touchpad Gestures &amp; Tuning
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-600 dark:text-slate-400">1-Finger Move</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Move pointer</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-600 dark:text-slate-400">1-Finger Tap</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Left click</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-600 dark:text-slate-400">Double Tap</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Double click</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-600 dark:text-slate-400">2-Finger Tap</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Right click</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-600 dark:text-slate-400">2-Finger Drag</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Scroll V &amp; H</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600 dark:text-slate-400">Long Press (450ms)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">Drag &amp; Drop</span>
            </div>
          </div>

          {/* Quick Inline Sensitivity Slider */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-slate-600 dark:text-slate-300">Pointer Sensitivity</span>
              <span className="font-mono tabular-nums text-blue-600 dark:text-cyan-400">
                {settings.mouseSensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={3.0}
              step={0.05}
              value={settings.mouseSensitivity}
              onChange={(e) =>
                onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-blue-600 dark:accent-cyan-400"
              aria-label="Pointer sensitivity"
            />
          </div>
        </aside>
      </div>

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
