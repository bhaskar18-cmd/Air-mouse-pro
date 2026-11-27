import { useState } from 'react';
import {
  Check,
  CheckSquare,
  Copy,
  FileCode2,
  HelpCircle,
  Moon,
  RotateCcw,
  Square,
  Sun,
  Terminal,
} from 'lucide-react';
import {
  DEFAULT_TESTING_CHECKLIST,
  loadTestingChecklist,
  saveTestingChecklist,
} from '../services/settingsStorage';
import type {
  BlueMouseSettings,
  PointerAccelerationCurve,
  TestingChecklistItem,
} from '../types/bluetooth';

interface SettingsScreenProps {
  settings: BlueMouseSettings;
  onUpdateSettings: (patch: Partial<BlueMouseSettings>) => void;
  onOpenOnboarding: () => void;
  onOpenApkGuide: () => void;
  onNotify: (tone: 'success' | 'info' | 'error', message: string) => void;
}

export function SettingsScreen({
  settings,
  onUpdateSettings,
  onOpenOnboarding,
  onOpenApkGuide,
  onNotify,
}: SettingsScreenProps) {
  const [checklist, setChecklist] = useState<TestingChecklistItem[]>(() => loadTestingChecklist());
  const [copiedCmds, setCopiedCmds] = useState(false);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      saveTestingChecklist(next);
      return next;
    });
  };

  const resetChecklist = () => {
    setChecklist(DEFAULT_TESTING_CHECKLIST);
    saveTestingChecklist(DEFAULT_TESTING_CHECKLIST);
    onNotify('success', 'Testing checklist reset.');
  };

  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
            Settings &amp; Android Guide
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#A0A5B1] mt-0.5">
            Tune pointer behavior, appearance, verification checklist, and APK build workflow
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="min-h-[42px] px-4 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-xs font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2 whitespace-nowrap transition-colors duration-150"
        >
          <HelpCircle className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
          <span>View Quick Tutorial</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pointer & Touchpad Preferences */}
        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]">
            Mouse &amp; Touchpad
          </h2>

          {/* Mouse Sensitivity */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-[#172033] dark:text-[#F4F5F7]">
                Mouse Sensitivity
              </span>
              <span className="font-mono tabular-nums text-[#2563EB] dark:text-[#6B9BFF]">
                {settings.mouseSensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={3.0}
              step={0.05}
              value={settings.mouseSensitivity}
              onChange={(e) =>
                onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
            />
          </div>

          {/* Pointer Speed Curve */}
          <div>
            <span className="block text-sm font-medium text-[#172033] dark:text-[#F4F5F7] mb-2">
              Pointer Speed Curve
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['linear', 'adaptive', 'precision'] as PointerAccelerationCurve[]).map((curve) => (
                <button
                  key={curve}
                  type="button"
                  onClick={() => onUpdateSettings({ pointerSpeed: curve })}
                  className={`min-h-[42px] rounded-xl border text-xs font-semibold capitalize transition-colors duration-150 ${
                    settings.pointerSpeed === curve
                      ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                      : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] text-[#172033] dark:text-[#F4F5F7]'
                  }`}
                >
                  {curve}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Speed */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-[#172033] dark:text-[#F4F5F7]">Scroll Speed</span>
              <span className="font-mono tabular-nums text-[#2563EB] dark:text-[#6B9BFF]">
                {settings.scrollSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={settings.scrollSpeed}
              onChange={(e) => onUpdateSettings({ scrollSpeed: parseFloat(e.target.value) })}
              className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
            />
          </div>

          {/* Handedness */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Primary Mouse Hand
              </p>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1]">
                Swap left and right click button outputs
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#ECEEF2] dark:bg-[#16181E] border border-[#E5E7EB] dark:border-[#30343D]">
              {(['right', 'left'] as const).map((hand) => (
                <button
                  key={hand}
                  type="button"
                  onClick={() => onUpdateSettings({ handedness: hand })}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold capitalize transition-colors duration-150 ${
                    settings.handedness === hand
                      ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                      : 'text-[#667085] dark:text-[#A0A5B1]'
                  }`}
                >
                  {hand}
                </button>
              ))}
            </div>
          </div>

          {/* Natural Scrolling */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Natural Scrolling
              </span>
              <span className="block text-xs text-[#667085] dark:text-[#A0A5B1]">
                Content follows two-finger swipe direction
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.naturalScrolling}
              onChange={(e) => onUpdateSettings({ naturalScrolling: e.target.checked })}
              className="h-5 w-5 accent-[#2563EB] dark:accent-[#6B9BFF] rounded"
            />
          </label>
        </section>

        {/* System, Theme & Keyboard Preferences */}
        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]">
            System, Keyboard &amp; Theme
          </h2>

          {/* Theme */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">Appearance</p>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1]">
                Switch between clean light and minimalist dark surfaces
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#ECEEF2] dark:bg-[#16181E] border border-[#E5E7EB] dark:border-[#30343D]">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 ${
                  settings.theme === 'dark'
                    ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                    : 'text-[#667085] dark:text-[#A0A5B1]'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 ${
                  settings.theme === 'light'
                    ? 'bg-white text-[#172033] shadow-sm'
                    : 'text-[#667085] dark:text-[#A0A5B1]'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Keyboard Layout */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Keyboard Scancode Map
              </p>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1]">
                HID sends USB Page 0x07 scancodes interpreted by host OS
              </p>
            </div>
            <select
              value={settings.keyboardLayout}
              onChange={(e) =>
                onUpdateSettings({ keyboardLayout: e.target.value as 'us-qwerty' })
              }
              className="min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] px-3 text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]"
              aria-label="Keyboard Layout"
            >
              <option value="us-qwerty">US QWERTY (Standard HID)</option>
            </select>
          </div>

          {/* Haptic Feedback */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Haptic Feedback
              </span>
              <span className="block text-xs text-[#667085] dark:text-[#A0A5B1]">
                Tactile vibration on clicks, keys, and drag lock
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.hapticFeedback}
              onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
              className="h-5 w-5 accent-[#2563EB] dark:accent-[#6B9BFF] rounded"
            />
          </label>

          {/* Auto-Reconnect */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Auto-Reconnect on Resume
              </span>
              <span className="block text-xs text-[#667085] dark:text-[#A0A5B1]">
                Re-attach to last bonded Bluetooth host when returning to app
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoReconnect}
              onChange={(e) => onUpdateSettings({ autoReconnect: e.target.checked })}
              className="h-5 w-5 accent-[#2563EB] dark:accent-[#6B9BFF] rounded"
            />
          </label>

          {/* HID Packet Inspector */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-[#172033] dark:text-[#F4F5F7]">
                Show HID Report Byte Inspector
              </span>
              <span className="block text-xs text-[#667085] dark:text-[#A0A5B1]">
                Display outgoing Report ID 0x01 / 0x02 hex bytes on input screens
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.showHidDiagnostics}
              onChange={(e) => onUpdateSettings({ showHidDiagnostics: e.target.checked })}
              className="h-5 w-5 accent-[#2563EB] dark:accent-[#6B9BFF] rounded"
            />
          </label>

          {/* About */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#30343D] flex items-center justify-between text-xs text-[#667085] dark:text-[#A0A5B1]">
            <span>About BlueMouse · Native Android BluetoothHidDevice</span>
            <span className="font-mono tabular-nums">Version 1.0.0</span>
          </div>
        </section>
      </div>

      {/* Physical Device Testing Checklist */}
      <section
        id="testing-checklist-section"
        className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]">
              Physical Device Testing Checklist
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5 tabular-nums">
              {completedCount} of {checklist.length} tests verified on hardware
            </p>
          </div>
          <button
            type="button"
            onClick={resetChecklist}
            className="min-h-[38px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] flex items-center gap-1.5 transition-colors duration-150"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklistItem(item.id)}
              className={`text-left rounded-xl border p-4 transition-colors duration-150 flex items-start gap-3 ${
                item.completed
                  ? 'border-emerald-500/40 bg-emerald-500/8'
                  : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318]'
              }`}
            >
              {item.completed ? (
                <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Square className="h-5 w-5 text-[#667085] dark:text-[#A0A5B1] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
                  {item.number}. {item.title}
                </p>
                <p className="mt-1 text-xs text-[#667085] dark:text-[#A0A5B1] leading-relaxed">
                  {item.verificationSteps}
                </p>
                <p className="mt-1 text-xs text-[#2563EB] dark:text-[#6B9BFF] leading-relaxed">
                  Expected: {item.expectedResult}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Setup, Build & APK Generation Instructions */}
      <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <h2 className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]">
              Android Setup, Build &amp; APK Generation
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenApkGuide}
            className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold whitespace-nowrap transition-colors duration-150"
          >
            Open Interactive APK Build Guide
          </button>
        </div>

        <p className="text-sm text-[#667085] dark:text-[#A0A5B1] leading-relaxed">
          All React frontend code, Capacitor configuration (<code className="font-mono">capacitor.config.ts</code>),
          and native Android Kotlin Bluetooth HID files (<code className="font-mono">BluetoothHIDPlugin.kt</code>,{' '}
          <code className="font-mono">BluetoothHidManager.kt</code>,{' '}
          <code className="font-mono">HidReportDescriptor.kt</code>,{' '}
          <code className="font-mono">MainActivity.kt</code>,{' '}
          <code className="font-mono">AndroidManifest.xml</code>) are included in this workspace.
          Because Bluetooth HID Device profiles require real Android system Bluetooth hardware,
          complete the final APK compilation in Android Studio, Gradle, or GitHub Actions:
        </p>

        <div className="rounded-xl border border-[#30343D] bg-[#16181E] text-[#F4F5F7] p-4 font-mono text-xs overflow-x-auto space-y-1.5 relative">
          <button
            type="button"
            onClick={async () => {
              const snippet =
                'npm install && npm run build\nnpx cap sync android\nnpx cap open android\ncd android && ./gradlew assembleDebug';
              try {
                await navigator.clipboard.writeText(snippet);
                setCopiedCmds(true);
                onNotify('success', 'Build commands copied to clipboard.');
                window.setTimeout(() => setCopiedCmds(false), 2000);
              } catch {
                onNotify('error', 'Clipboard access blocked. Copy commands manually.');
              }
            }}
            className="absolute top-3 right-3 min-h-[30px] px-2.5 rounded-lg bg-[#222630] hover:bg-[#2A2F3B] text-[#6B9BFF] font-sans text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
          >
            {copiedCmds ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <p className="text-[#6B9BFF]"># 1. Install dependencies and build production web bundle</p>
          <p>npm install &amp;&amp; npm run build</p>
          <p className="text-[#6B9BFF] pt-2"># 2. Sync web assets into native Android project</p>
          <p>npx cap sync android</p>
          <p className="text-[#6B9BFF] pt-2"># 3. Build debug APK via Gradle (or open in Android Studio)</p>
          <p>npx cap open android</p>
          <p>cd android &amp;&amp; ./gradlew assembleDebug</p>
          <p className="text-[#A0A5B1] pt-1">
            # Output APK: android/app/build/outputs/apk/debug/app-debug.apk
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-[#667085] dark:text-[#A0A5B1]">
          <FileCode2 className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0 mt-0.5" />
          <span>
            Ensure your Android Studio SDK includes API 36 (minSdk 28 / Android 9.0 Pie for{' '}
            <code className="font-mono">BluetoothHidDevice</code>) and test on a physical Android
            device (emulators do not support physical Bluetooth HID radio pairing).
          </span>
        </div>
      </section>
    </div>
  );
}
