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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings &amp; Android Guide
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Tune pointer behavior, appearance, verification checklist, and APK build workflow
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
        >
          <HelpCircle className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
          <span>View Quick Tutorial</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pointer & Touchpad Preferences */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Mouse &amp; Touchpad
          </h2>

          {/* Mouse Sensitivity */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Mouse Sensitivity
              </span>
              <span className="font-mono tabular-nums text-blue-600 dark:text-cyan-400">
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
              className="w-full accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Pointer Speed Curve */}
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Pointer Speed Curve
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['linear', 'adaptive', 'precision'] as PointerAccelerationCurve[]).map((curve) => (
                <button
                  key={curve}
                  type="button"
                  onClick={() => onUpdateSettings({ pointerSpeed: curve })}
                  className={`min-h-[42px] rounded-xl border text-xs font-semibold capitalize transition-colors ${
                    settings.pointerSpeed === curve
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#081020] text-slate-700 dark:text-slate-300'
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
              <span className="font-medium text-slate-700 dark:text-slate-200">Scroll Speed</span>
              <span className="font-mono tabular-nums text-blue-600 dark:text-cyan-400">
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
              className="w-full accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Handedness */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Primary Mouse Hand
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Swap left and right click button outputs
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#081020] border border-slate-200 dark:border-slate-800">
              {(['right', 'left'] as const).map((hand) => (
                <button
                  key={hand}
                  type="button"
                  onClick={() => onUpdateSettings({ handedness: hand })}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    settings.handedness === hand
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
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
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Natural Scrolling
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Content follows two-finger swipe direction
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.naturalScrolling}
              onChange={(e) => onUpdateSettings({ naturalScrolling: e.target.checked })}
              className="h-5 w-5 accent-blue-600 rounded"
            />
          </label>
        </section>

        {/* System, Theme & Keyboard Preferences */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            System, Keyboard &amp; Theme
          </h2>

          {/* Theme */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Appearance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose deep navy dark or crisp daylight mode
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#081020] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
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
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Keyboard Scancode Map
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                HID sends USB Page 0x07 scancodes interpreted by host OS
              </p>
            </div>
            <select
              value={settings.keyboardLayout}
              onChange={(e) =>
                onUpdateSettings({ keyboardLayout: e.target.value as 'us-qwerty' })
              }
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#081020] px-3 text-xs font-semibold text-slate-800 dark:text-slate-100"
              aria-label="Keyboard Layout"
            >
              <option value="us-qwerty">US QWERTY (Standard HID)</option>
            </select>
          </div>

          {/* Haptic Feedback */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Haptic Feedback
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Tactile vibration on clicks, keys, and drag lock
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.hapticFeedback}
              onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
              className="h-5 w-5 accent-blue-600 rounded"
            />
          </label>

          {/* Auto-Reconnect */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Auto-Reconnect on Resume
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Re-attach to last bonded Bluetooth host when returning to app
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoReconnect}
              onChange={(e) => onUpdateSettings({ autoReconnect: e.target.checked })}
              className="h-5 w-5 accent-blue-600 rounded"
            />
          </label>

          {/* HID Packet Inspector */}
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Show HID Report Byte Inspector
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Display outgoing Report ID 0x01 / 0x02 hex bytes on input screens
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.showHidDiagnostics}
              onChange={(e) => onUpdateSettings({ showHidDiagnostics: e.target.checked })}
              className="h-5 w-5 accent-blue-600 rounded"
            />
          </label>

          {/* About */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>About BlueMouse · Native Android BluetoothHidDevice</span>
            <span className="font-mono tabular-nums">Version 1.0.0</span>
          </div>
        </section>
      </div>

      {/* Physical Device Testing Checklist (12 Requirements) */}
      <section
        id="testing-checklist-section"
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Physical Device Testing Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {completedCount} of {checklist.length} tests verified on hardware
            </p>
          </div>
          <button
            type="button"
            onClick={resetChecklist}
            className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
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
              className={`text-left rounded-2xl border p-4 transition-colors flex items-start gap-3 ${
                item.completed
                  ? 'border-emerald-500/40 bg-emerald-500/8'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#081020]'
              }`}
            >
              {item.completed ? (
                <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.number}. {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.verificationSteps}
                </p>
                <p className="mt-1 text-xs text-blue-600 dark:text-cyan-400 leading-relaxed">
                  Expected: {item.expectedResult}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Setup, Build & APK Generation Instructions */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Android Setup, Build &amp; APK Generation
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenApkGuide}
            className="min-h-[40px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Open Interactive APK Build Guide
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          All React frontend code, Capacitor configuration (<code className="font-mono">capacitor.config.ts</code>),
          and native Android Kotlin Bluetooth HID files (<code className="font-mono">BluetoothHIDPlugin.kt</code>,{' '}
          <code className="font-mono">BluetoothHidManager.kt</code>,{' '}
          <code className="font-mono">HidReportDescriptor.kt</code>,{' '}
          <code className="font-mono">MainActivity.kt</code>,{' '}
          <code className="font-mono">AndroidManifest.xml</code>) are included in this workspace.
          Because Bluetooth HID Device profiles require real Android system Bluetooth hardware,
          complete the final APK compilation in Android Studio or Gradle:
        </p>

        <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto space-y-1.5 relative">
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
            className="absolute top-3 right-3 min-h-[30px] px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-sans text-xs font-medium flex items-center gap-1.5"
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
          <p className="text-cyan-400"># 1. Install dependencies and build production web bundle</p>
          <p>npm install &amp;&amp; npm run build</p>
          <p className="text-cyan-400 pt-2"># 2. Sync web assets into native Android project</p>
          <p>npx cap sync android</p>
          <p className="text-cyan-400 pt-2"># 3. Build debug APK via Gradle (or open in Android Studio)</p>
          <p>npx cap open android</p>
          <p>cd android &amp;&amp; ./gradlew assembleDebug</p>
          <p className="text-slate-400 pt-1">
            # Output APK: android/app/build/outputs/apk/debug/app-debug.apk
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <FileCode2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Ensure your Android Studio SDK includes API 34 (minSdk 28 / Android 9.0 Pie for{' '}
            <code className="font-mono">BluetoothHidDevice</code>) and test on a physical Android
            device (emulators do not support physical Bluetooth HID radio pairing).
          </span>
        </div>
      </section>
    </div>
  );
}
