import { useEffect, useRef, useState } from 'react';
import { bluetoothService } from '../services/bluetoothService';
import type { HidPacketDiagnostic } from '../types/bluetooth';

interface HidDiagnosticsStripProps {
  diagnostics: HidPacketDiagnostic[];
  isConnected: boolean;
}

export function HidDiagnosticsStrip({ diagnostics, isConnected }: HidDiagnosticsStripProps) {
  const [liveLatest, setLiveLatest] = useState<HidPacketDiagnostic | undefined>(diagnostics[0]);
  const pendingRef = useRef<HidPacketDiagnostic | null>(null);
  const timerRef = useRef<number | null>(null);

  // Subscribe locally and throttle UI updates (~10Hz) so App and Touchpad never re-render on mouse moves
  useEffect(() => {
    const unsub = bluetoothService.subscribeDiagnostics((diag) => {
      pendingRef.current = diag;
      if (timerRef.current !== null) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (pendingRef.current) {
          setLiveLatest(pendingRef.current);
          pendingRef.current = null;
        }
      }, 100);
    });

    return () => {
      unsub();
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const latest = liveLatest ?? diagnostics[0];

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] px-3.5 py-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#667085] dark:text-[#A0A5B1]">
          HID Report Inspector {isConnected ? '· Live' : '· Preview'}
        </span>
        {latest ? (
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span className="text-[#2563EB] dark:text-[#6B9BFF] font-medium">{latest.bytesHex}</span>
            <span className="text-[#667085] dark:text-[#A0A5B1]">{latest.summary}</span>
          </div>
        ) : (
          <span className="font-mono text-[#667085] dark:text-[#A0A5B1]">
            Move touchpad or press a key to inspect report bytes
          </span>
        )}
      </div>
    </div>
  );
}
