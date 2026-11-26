import { HidDiagnosticsStrip } from '../components/HidDiagnosticsStrip';
import { TouchpadSurface } from '../components/TouchpadSurface';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import type {
  BlueMouseSettings,
  BluetoothStatusSnapshot,
  HidPacketDiagnostic,
} from '../types/bluetooth';

interface CombinedScreenProps {
  settings: BlueMouseSettings;
  status: BluetoothStatusSnapshot;
  diagnostics: HidPacketDiagnostic[];
}

export function CombinedScreen({ settings, status, diagnostics }: CombinedScreenProps) {
  const isConnected = status.connectionPhase === 'connected';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Combined Mouse &amp; Keyboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {isConnected && status.connectedDevice
            ? `Composite HID active with ${status.connectedDevice.name}`
            : 'Compact touchpad paired with accessible keyboard & shortcuts'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5">
          <TouchpadSurface settings={settings} compact isConnected={isConnected} />
        </div>
        <div className="lg:col-span-7">
          <VirtualKeyboard hapticEnabled={settings.hapticFeedback} compact />
        </div>
      </div>

      {settings.showHidDiagnostics && (
        <HidDiagnosticsStrip diagnostics={diagnostics} isConnected={isConnected} />
      )}
    </div>
  );
}
