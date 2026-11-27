import { SlidersHorizontal } from 'lucide-react';
import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { TouchpadSurface } from '../components/TouchpadSurface';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import type {
  AppScreen,
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  DeviceProfile,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface CombinedScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
  activeProfile: DeviceProfile | null;
  onNavigate: (screen: AppScreen) => void;
}

export function CombinedScreen({
  settings,
  status,
  diagnostics,
  activeProfile,
  onNavigate,
}: CombinedScreenProps) {
  const isConnected = status.connectionPhase === 'connected';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
            Combined Mouse &amp; Keyboard
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#A0A5B1] mt-0.5">
            {isConnected && status.connectedDevice
              ? `Composite HID active with ${status.connectedDevice.name}`
              : 'Touchpad paired with keyboard and shortcuts'}
          </p>
        </div>

        {activeProfile && (
          <button
            type="button"
            onClick={() => onNavigate('profiles')}
            className="min-h-[38px] px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:border-[#2563EB]/50 dark:hover:border-[#6B9BFF]/50 text-xs font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <span>{activeProfile.name}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5">
          <TouchpadSurface
            settings={settings}
            compact
            isConnected={isConnected}
            activeProfile={activeProfile}
          />
        </div>
        <div className="lg:col-span-7">
          <VirtualKeyboard
            hapticEnabled={settings.hapticFeedback}
            handedness={settings.handedness}
            compact
            isConnected={isConnected}
            activeProfile={activeProfile}
          />
        </div>
      </div>

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
