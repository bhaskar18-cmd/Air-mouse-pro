import { Info } from 'lucide-react';
import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import type {
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface KeyboardScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
}

export function KeyboardScreen({ settings, status, diagnostics }: KeyboardScreenProps) {
  const isConnected = status.connectionPhase === 'connected';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Wireless Keyboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {isConnected && status.connectedDevice
              ? `Sending US QWERTY HID keyboard reports to ${status.connectedDevice.name}`
              : 'US QWERTY 6-key rollover HID keyboard · Report ID 0x02'}
          </p>
        </div>
      </div>

      <VirtualKeyboard hapticEnabled={settings.hapticFeedback} isConnected={isConnected} />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-4 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Bluetooth HID keyboards transmit USB Usage ID scancodes rather than raw Unicode strings.
          BlueMouse uses standard US QWERTY key mapping; characters depend on the receiving
          computer&apos;s active keyboard layout. Non-US Unicode symbols cannot be mapped to US
          scancodes directly.
        </p>
      </div>

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
