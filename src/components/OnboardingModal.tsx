import { useState } from 'react';
import { Bluetooth, CheckCircle2, ChevronRight, Hand, Laptop, MousePointer2, X } from 'lucide-react';
import { BlueMouseLogo } from './BlueMouseLogo';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Pure Bluetooth HID Peripheral',
    subtitle: 'Zero Wi-Fi, zero internet, zero receiver software',
    body: 'BlueMouse uses Android’s native BluetoothHidDevice API so Windows laptops, desktops, and supported Android hosts recognize your smartphone as a standard wireless mouse and keyboard.',
    icon: Bluetooth,
    highlights: [
      'Works completely offline over direct Bluetooth HID',
      'Requires Android 9+ smartphone with HID Device profile support',
      'No companion app needed on your PC or laptop',
    ],
  },
  {
    title: 'Simple 3-Step Pairing Flow',
    subtitle: 'Guided through Android system Bluetooth',
    body: 'Register the HID profile inside BlueMouse, tap Make Discoverable, then select your phone from Windows Bluetooth settings (Add device → Bluetooth). Once paired, tap Connect anytime.',
    icon: Laptop,
    highlights: [
      'Register HID peripheral profile before connecting',
      'System pairing happens in native Android & Windows Bluetooth UI',
      'Auto-releases all keys if app goes to background or disconnects',
    ],
  },
  {
    title: 'Precision Touchpad & Full Keyboard',
    subtitle: 'Multi-finger gestures + US QWERTY HID scancodes',
    body: 'Control your desktop smoothly with one-finger tracking, two-finger scrolling, tap-to-click, long-press drag mode, full F1–F12 keys, and one-tap Windows shortcuts.',
    icon: Hand,
    highlights: [
      '1-finger tap: Left click · 2-finger tap: Right click',
      '2-finger drag: Vertical & horizontal scrolling',
      'Long press (~450ms): Drag-and-drop lock mode',
    ],
  },
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <BlueMouseLogo size={34} />
            <div>
              <span className="text-xs font-medium text-blue-600 dark:text-cyan-400">
                Welcome to BlueMouse · Step {stepIndex + 1} of {STEPS.length}
              </span>
              <h2
                id="onboarding-title"
                className="text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Skip onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/12 dark:bg-blue-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {step.subtitle}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>

          <ul className="mt-5 space-y-2.5">
            {step.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === stepIndex
                      ? 'w-7 bg-blue-600 dark:bg-cyan-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isLast) {
                    onComplete();
                  } else {
                    setStepIndex((i) => i + 1);
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{isLast ? 'Get Started' : 'Next'}</span>
                {isLast ? <MousePointer2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
