import { useState } from 'react';
import { ChevronDown, ChevronUp, Hand, Sliders } from 'lucide-react';
import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { TouchpadSurface } from '../components/TouchpadSurface';
import type {
  AppScreen,
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  DeviceProfile,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface MouseScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
  activeProfile: DeviceProfile | null;
  onNavigate: (screen: AppScreen) => void;
  onUpdateProfileTouchpad: (patch: Partial<BlueMouseSettings>) => void;
}

export function MouseScreen({
  settings,
  status,
  diagnostics,
  activeProfile,
  onNavigate,
  onUpdateProfileTouchpad,
}: MouseScreenProps) {
  const isConnected = status.connectionPhase === 'connected';
  const [showQuickTune, setShowQuickTune] = useState(false);

  return (
    <div className="flex flex-col gap-3 -mx-1 sm:mx-0">
      {/* Compact Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 sm:px-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
              Wireless Mouse
            </h1>
            {activeProfile && (
              <button
                type="button"
                onClick={() => onNavigate('profiles')}
                className="text-xs font-medium text-[#2563EB] dark:text-[#6B9BFF] hover:underline truncate max-w-[160px]"
                title="Change device profile"
              >
                · {activeProfile.name}
              </button>
            )}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#A0A5B1] truncate">
            {isConnected && status.connectedDevice
              ? `Connected to ${status.connectedDevice.name}`
              : status.isNativeAndroid
                ? 'Not connected — open Dashboard to connect a host'
                : 'Preview mode — build Android APK for live Bluetooth HID'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onUpdateProfileTouchpad({
                handedness: settings.handedness === 'right' ? 'left' : 'right',
              })
            }
            className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center gap-1.5 whitespace-nowrap"
          >
            <Hand className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <span>{settings.handedness === 'right' ? 'Right' : 'Left'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuickTune((v) => !v)}
            className={`min-h-[36px] px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors duration-150 ${
              showQuickTune
                ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#172033] dark:text-[#F4F5F7]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <span>Tune</span>
            {showQuickTune ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Inline Touchpad Tuning Bar */}
      {showQuickTune && (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#667085] dark:text-[#A0A5B1]">Sensitivity</span>
              <span className="font-mono tabular-nums text-[#2563EB] dark:text-[#6B9BFF]">
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
                onUpdateProfileTouchpad({ mouseSensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
              aria-label="Pointer sensitivity"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#667085] dark:text-[#A0A5B1]">Scroll Speed</span>
              <span className="font-mono tabular-nums text-[#2563EB] dark:text-[#6B9BFF]">
                {settings.scrollSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.05}
              value={settings.scrollSpeed}
              onChange={(e) =>
                onUpdateProfileTouchpad({ scrollSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
              aria-label="Scroll speed"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateProfileTouchpad({ naturalScrolling: !settings.naturalScrolling })
              }
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-medium flex-1 ${
                settings.naturalScrolling
                  ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                  : 'border-[#E5E7EB] dark:border-[#30343D] text-[#667085] dark:text-[#A0A5B1]'
              }`}
            >
              {settings.naturalScrolling ? 'Natural Scroll: On' : 'Natural Scroll: Off'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('profiles')}
              className="min-h-[38px] px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] text-xs font-semibold whitespace-nowrap"
            >
              Edit Controls
            </button>
          </div>
        </div>
      )}

      {/* Expanded Full-Width Responsive Touchpad + Dedicated Mouse Buttons */}
      <TouchpadSurface
        settings={settings}
        expanded
        isConnected={isConnected}
        activeProfile={activeProfile}
      />

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
