import { BluetoothOff, X } from 'lucide-react';
import type { PairedBluetoothDevice } from '../types/bluetooth';

interface ConfirmDisconnectModalProps {
  open: boolean;
  device: PairedBluetoothDevice | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDisconnectModal({
  open,
  device,
  onConfirm,
  onCancel,
}: ConfirmDisconnectModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disconnect-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#30343D] shadow-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BluetoothOff className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="disconnect-dialog-title"
                className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]"
              >
                Disconnect Bluetooth Host?
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5 tabular-nums">
                {device ? `${device.name} · ${device.address}` : 'Active HID session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] transition-colors duration-150"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#667085] dark:text-[#A0A5B1]">
          Any held mouse buttons or keyboard modifier keys will be released safely before ending the
          Bluetooth HID connection. You can reconnect anytime from the dashboard.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#172033] dark:text-[#F4F5F7] bg-[#ECEEF2] dark:bg-[#222630] hover:bg-[#E5E7EB] dark:hover:bg-[#30343D] transition-colors duration-150 whitespace-nowrap"
          >
            Keep Connected
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors duration-150 whitespace-nowrap"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
