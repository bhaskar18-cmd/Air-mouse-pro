import { Info, SlidersHorizontal } from 'lucide-react';
import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import type {
  AppScreen,
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  DeviceProfile,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface KeyboardScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
  activeProfile: DeviceProfile | null;
  onNavigate: (screen: AppScreen) => void;
}

export function KeyboardScreen({
  settings,
  status,
  diagnostics,
  activeProfile,
  onNavigate,
}: KeyboardScreenProps) {
  const isConnected = status.connectionPhase === 'connected';
  const mappedKeyCount = activeProfile ? Object.keys(activeProfile.keyMappings).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
            Wireless Keyboard
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#A0A5B1] mt-0.5">
            {isConnected && status.connectedDevice
              ? `Sending US QWERTY HID keyboard reports to ${status.connectedDevice.name}`
              : 'US QWERTY 6-key rollover HID keyboard · Report ID 0x02'}
          </p>
        </div>

        {activeProfile && (
          <button
            type="button"
            onClick={() => onNavigate('profiles')}
            className="min-h-[38px] px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:border-[#2563EB]/50 dark:hover:border-[#6B9BFF]/50 text-xs font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <span>
              {activeProfile.name}
              {mappedKeyCount > 0 ? ` · ${mappedKeyCount} mapped` : ''}
            </span>
          </button>
        )}
      </div>

      <VirtualKeyboard
        hapticEnabled={settings.hapticFeedback}
        handedness={settings.handedness}
        isConnected={isConnected}
        activeProfile={activeProfile}
      />

      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-4 flex items-start gap-3 text-xs text-[#667085] dark:text-[#A0A5B1]">
        <Info className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Bluetooth HID keyboards transmit USB scancodes using standard US QWERTY layout. Custom
          mapped keys from the active device profile are highlighted in subtle blue.
        </p>
      </div>

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
