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
    body: 'Move the cursor smoothly with one finger without accidental tap clicks, scroll vertically and horizontally with two fingers, and click or drag with the dedicated buttons below the touchpad.',
    icon: Hand,
    highlights: [
      '1-finger movement moves cursor only (tapping does nothing)',
      '2-finger drag: Vertical & horizontal scrolling',
      'Dedicated Left, Middle, Right, Double Click, and Drag Lock buttons',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#30343D] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E5E7EB] dark:border-[#30343D]">
          <div className="flex items-center gap-3">
            <BlueMouseLogo size={34} />
            <div>
              <span className="text-xs font-medium text-[#2563EB] dark:text-[#6B9BFF]">
                Welcome to BlueMouse · Step {stepIndex + 1} of {STEPS.length}
              </span>
              <h2
                id="onboarding-title"
                className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7] leading-tight"
              >
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] transition-colors duration-150"
            aria-label="Skip onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF] flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
              {step.subtitle}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#667085] dark:text-[#A0A5B1]">{step.body}</p>

          <ul className="mt-5 space-y-2.5">
            {step.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-[#172033] dark:text-[#F4F5F7]"
              >
                <CheckCircle2 className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0 mt-0.5" />
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
                  className={`h-2 rounded-full transition-all duration-150 ${
                    idx === stepIndex
                      ? 'w-7 bg-[#2563EB] dark:bg-[#6B9BFF]'
                      : 'w-2 bg-[#E5E7EB] dark:bg-[#30343D]'
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
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#667085] dark:text-[#A0A5B1] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] transition-colors duration-150"
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
                className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white dark:text-[#111318] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap"
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
