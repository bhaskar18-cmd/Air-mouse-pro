import type { HidPacketDiagnostic } from '../types/bluetooth';

interface HidDiagnosticsStripProps {
  diagnostics: HidPacketDiagnostic[];
  isConnected: boolean;
}

export function HidDiagnosticsStrip({ diagnostics, isConnected }: HidDiagnosticsStripProps) {
  const latest = diagnostics[0];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white/80 dark:bg-[#0B1221]/90 px-3.5 py-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-slate-600 dark:text-slate-400">
          HID Packet Preview {isConnected ? '· Transmitting to Host' : '· Local Report Formatter'}
        </span>
        {latest ? (
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span className="text-blue-600 dark:text-cyan-400">{latest.bytesHex}</span>
            <span className="text-slate-500 dark:text-slate-400">{latest.summary}</span>
          </div>
        ) : (
          <span className="font-mono text-slate-400 dark:text-slate-500">
            Move touchpad or press a key to inspect outgoing HID report bytes
          </span>
        )}
      </div>
    </div>
  );
}
