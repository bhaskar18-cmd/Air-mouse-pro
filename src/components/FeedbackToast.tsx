import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

export interface ToastNotice {
  id: number;
  tone: 'loading' | 'success' | 'error' | 'info';
  message: string;
}

interface FeedbackToastProps {
  notice: ToastNotice | null;
  onDismiss: () => void;
}

export function FeedbackToast({ notice, onDismiss }: FeedbackToastProps) {
  if (!notice) return null;

  const toneClasses =
    notice.tone === 'error'
      ? 'border-rose-500/40 bg-rose-950/90 text-rose-100'
      : notice.tone === 'success'
        ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
        : notice.tone === 'loading'
          ? 'border-cyan-500/40 bg-[#0B1221]/95 text-cyan-100'
          : 'border-blue-500/40 bg-[#0B1221]/95 text-slate-100';

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-2xl border backdrop-blur-md shadow-xl px-4 py-3 flex items-center justify-between gap-3 ${toneClasses}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {notice.tone === 'loading' && (
            <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
          )}
          {notice.tone === 'success' && (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          {notice.tone === 'error' && (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          {notice.tone === 'info' && (
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium leading-snug">{notice.message}</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
