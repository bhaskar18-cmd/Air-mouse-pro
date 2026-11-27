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

  const borderClass =
    notice.tone === 'error'
      ? 'border-rose-300 dark:border-rose-800'
      : notice.tone === 'success'
        ? 'border-emerald-300 dark:border-emerald-800'
        : 'border-[#E5E7EB] dark:border-[#30343D]';

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-xl border bg-white dark:bg-[#1A1D24] text-[#172033] dark:text-[#F4F5F7] shadow-sm px-4 py-3 flex items-center justify-between gap-3 ${borderClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {notice.tone === 'loading' && (
            <Loader2 className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] animate-spin shrink-0" />
          )}
          {notice.tone === 'success' && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          {notice.tone === 'error' && (
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          {notice.tone === 'info' && (
            <CheckCircle2 className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium leading-snug">{notice.message}</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] hover:bg-[#F2F4F7] dark:hover:bg-[#222630] shrink-0 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
