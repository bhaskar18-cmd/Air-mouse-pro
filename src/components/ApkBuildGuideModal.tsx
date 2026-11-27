import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  FolderArchive,
  Laptop,
  PackageCheck,
  Smartphone,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { BlueMouseLogo } from './BlueMouseLogo';

interface ApkBuildGuideModalProps {
  open: boolean;
  onClose: () => void;
  onOpenChecklist: () => void;
}

type GuideStepId = 'export' | 'capacitor' | 'studio' | 'kotlin' | 'apk';

interface GuideStep {
  id: GuideStepId;
  number: number;
  shortTitle: string;
  title: string;
  subtitle: string;
  icon: typeof FolderArchive;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'export',
    number: 1,
    shortTitle: 'Export Project',
    title: '1. Export the Complete BlueMouse Project',
    subtitle: 'Download all React, Capacitor, and native Android Kotlin source files',
    icon: FolderArchive,
  },
  {
    id: 'capacitor',
    number: 2,
    shortTitle: 'Capacitor',
    title: '2. Capacitor Installation & Configuration',
    subtitle: 'Install packages, build the web bundle, and sync the Android platform',
    icon: Terminal,
  },
  {
    id: 'studio',
    number: 3,
    shortTitle: 'Android Studio',
    title: '3. Android Studio & SDK Setup',
    subtitle: 'Configure JDK 21, Android SDK 36, and Gradle sync',
    icon: Wrench,
  },
  {
    id: 'kotlin',
    number: 4,
    shortTitle: 'Kotlin HID',
    title: '4. Kotlin Bluetooth HID Plugin Integration',
    subtitle: 'Verify native BluetoothHidDevice classes, SDP descriptor, and permissions',
    icon: FileCode2,
  },
  {
    id: 'apk',
    number: 5,
    shortTitle: 'Build APK',
    title: '5. APK Generation & Device Installation',
    subtitle: 'Compile debug/release APKs and deploy to a physical Android 9+ smartphone',
    icon: PackageCheck,
  },
];

function CopyCodeBlock({
  label,
  code,
  copiedId,
  id,
  onCopy,
}: {
  label: string;
  code: string;
  id: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const isCopied = copiedId === id;

  return (
    <div className="rounded-xl border border-[#30343D] bg-[#16181E] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30343D] bg-[#1A1D24]">
        <span className="text-xs font-medium text-[#A0A5B1]">{label}</span>
        <button
          type="button"
          onClick={() => onCopy(id, code)}
          className="min-h-[30px] px-2.5 rounded-lg text-xs font-medium text-[#6B9BFF] hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
        >
          {isCopied ? (
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
      </div>
      <pre className="p-4 text-xs font-mono text-[#F4F5F7] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ApkBuildGuideModal({
  open,
  onClose,
  onOpenChecklist,
}: ApkBuildGuideModalProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  if (!open) return null;

  const activeStep = GUIDE_STEPS[activeStepIndex];

  const handleCopy = async (id: string, text: string) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      setCopyError(
        'Clipboard access was blocked by your browser. Please select and copy the command manually.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-guide-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#30343D] shadow-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#30343D] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <BlueMouseLogo size={36} className="shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#2563EB] dark:text-[#6B9BFF]">
                Native Android Build &amp; Deployment Guide
              </span>
              <h2
                id="apk-guide-title"
                className="text-lg sm:text-xl font-semibold text-[#172033] dark:text-[#F4F5F7] truncate"
              >
                {activeStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] transition-colors duration-150 shrink-0"
            aria-label="Close Android Build Guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            {GUIDE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const active = idx === activeStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-150 whitespace-nowrap ${
                    active
                      ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                      : 'bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#30343D] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>
                    {step.number}. {step.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <p className="text-sm text-[#667085] dark:text-[#A0A5B1]">{activeStep.subtitle}</p>

          {copyError && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
              {copyError}
            </div>
          )}

          {activeStep.id === 'export' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
                  <span>Step-by-Step Project Export</span>
                </h3>
                <ol className="space-y-2.5 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1] list-decimal list-inside leading-relaxed">
                  <li>
                    Download or export the complete project archive from AI Studio (or clone your
                    connected repository) to a local folder such as{' '}
                    <code className="font-mono text-[#172033] dark:text-[#F4F5F7]">bluemouse/</code>.
                  </li>
                  <li>
                    Verify that all root configuration, React frontend, and native Android files are
                    present before installing dependencies.
                  </li>
                  <li>
                    Ensure <strong className="text-[#172033] dark:text-[#F4F5F7]">Node.js 20+</strong> and{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">npm 10+</strong> are installed on
                    your workstation.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] p-4 space-y-2">
                <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]">
                  Required Project Tree Checklist
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#667085] dark:text-[#A0A5B1]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>package.json &amp; capacitor.config.ts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>src/ (React UI, HID utils, Bridge)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>android/app/src/main/AndroidManifest.xml</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>android/app/src/main/java/com/bluemouse/app/*.kt</span>
                  </li>
                </ul>
              </div>

              <CopyCodeBlock
                id="cmd-export-install"
                label="Install project dependencies in the exported folder"
                code={`cd bluemouse\nnode -v && npm -v\nnpm install`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </div>
          )}

          {activeStep.id === 'capacitor' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-2.5 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1] leading-relaxed">
                <p>
                  BlueMouse already includes <code className="font-mono">@capacitor/core</code>,{' '}
                  <code className="font-mono">@capacitor/cli</code>,{' '}
                  <code className="font-mono">@capacitor/android</code>,{' '}
                  <code className="font-mono">@capacitor/app</code>, and{' '}
                  <code className="font-mono">@capacitor/haptics</code> in{' '}
                  <code className="font-mono">package.json</code>, along with{' '}
                  <code className="font-mono">capacitor.config.ts</code>.
                </p>
                <p>
                  If you are migrating into a fresh Capacitor workspace, install those packages
                  first, then compile the Vite bundle (<code className="font-mono">dist/</code>) and
                  sync assets into <code className="font-mono">android/</code>.
                </p>
              </div>

              <CopyCodeBlock
                id="cmd-cap-install"
                label="Capacitor packages & platform sync commands"
                code={`# Only needed if initializing Capacitor in a fresh project:\nnpm install @capacitor/core @capacitor/android @capacitor/app @capacitor/haptics\nnpm install -D @capacitor/cli\n\n# Build production web assets and sync into Android:\nnpm run build\nnpx cap sync android`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />

              <CopyCodeBlock
                id="cfg-cap-ts"
                label="capacitor.config.ts (already configured)"
                code={`import type { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = {\n  appId: 'com.bluemouse.app',\n  appName: 'BlueMouse',\n  webDir: 'dist',\n  android: {\n    allowMixedContent: false,\n    backgroundColor: '#111318',\n  },\n};\n\nexport default config;`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </div>
          )}

          {activeStep.id === 'studio' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
                  <span>Android Studio &amp; SDK Requirements</span>
                </h3>
                <ol className="space-y-2.5 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1] list-decimal list-inside leading-relaxed">
                  <li>
                    Install <strong className="text-[#172033] dark:text-[#F4F5F7]">Android Studio</strong> (Ladybug or newer) with{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">JDK 21</strong> selected under{' '}
                    <em>Settings → Build, Execution, Deployment → Build Tools → Gradle</em>.
                  </li>
                  <li>
                    Open <strong className="text-[#172033] dark:text-[#F4F5F7]">SDK Manager</strong> and install{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">Android SDK Platform 36</strong>,{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">Android SDK Build-Tools</strong>,
                    and <strong className="text-[#172033] dark:text-[#F4F5F7]">Platform-Tools (adb)</strong>.
                  </li>
                  <li>
                    Note <code className="font-mono">minSdkVersion = 28</code> (Android 9.0 Pie),
                    because Android introduced <code className="font-mono">BluetoothHidDevice</code>{' '}
                    in API 28.
                  </li>
                  <li>
                    On your physical Android phone, enable{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">Developer Options</strong> and{' '}
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">USB Debugging</strong>. (Android Emulators cannot emulate physical
                    Bluetooth HID hardware.)
                  </li>
                </ol>
              </div>

              <CopyCodeBlock
                id="cmd-cap-open"
                label="Open the Android project directly in Android Studio"
                code={`npx cap open android`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </div>
          )}

          {activeStep.id === 'kotlin' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
                  Native Kotlin HID Files Included in <code className="font-mono">android/</code>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1] leading-relaxed">
                  <li>
                    <code className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                      HidReportDescriptor.kt
                    </code>{' '}
                    — Composite HID SDP descriptor defining Report ID{' '}
                    <code className="font-mono">1</code> (3-button mouse, X, Y, vertical wheel,
                    horizontal AC pan), Report ID <code className="font-mono">2</code> (6-key
                    rollover US keyboard + modifiers), and Report ID{' '}
                    <code className="font-mono">3</code> (Consumer Media Control).
                  </li>
                  <li>
                    <code className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                      BluetoothHidManager.kt
                    </code>{' '}
                    — Obtains <code className="font-mono">BluetoothProfile.HID_DEVICE</code> proxy,
                    calls <code className="font-mono">registerApp()</code>,{' '}
                    <code className="font-mono">connect()</code>,{' '}
                    <code className="font-mono">sendReport()</code>,{' '}
                    <code className="font-mono">disconnect()</code>, and{' '}
                    <code className="font-mono">unregisterApp()</code>, and listens to{' '}
                    <code className="font-mono">BluetoothHidDevice.Callback</code>.
                  </li>
                  <li>
                    <code className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                      BluetoothHIDPlugin.kt
                    </code>{' '}
                    — Capacitor plugin (
                    <code className="font-mono">@CapacitorPlugin(name = &quot;BluetoothHID&quot;)</code>)
                    handling Android 12+ (<code className="font-mono">BLUETOOTH_CONNECT</code>,{' '}
                    <code className="font-mono">BLUETOOTH_SCAN</code>,{' '}
                    <code className="font-mono">BLUETOOTH_ADVERTISE</code>) and legacy runtime
                    permissions plus pause/resume key release.
                  </li>
                  <li>
                    <code className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                      MainActivity.kt
                    </code>{' '}
                    — Registers{' '}
                    <code className="font-mono">BluetoothHIDPlugin::class.java</code> before{' '}
                    <code className="font-mono">super.onCreate(savedInstanceState)</code>.
                  </li>
                </ul>
              </div>

              <CopyCodeBlock
                id="kotlin-mainactivity"
                label="MainActivity.kt plugin registration"
                code={`package com.bluemouse.app\n\nimport android.os.Bundle\nimport com.getcapacitor.BridgeActivity\n\nclass MainActivity : BridgeActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        registerPlugin(BluetoothHIDPlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }\n}`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </div>
          )}

          {activeStep.id === 'apk' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
                  <span>Generate &amp; Install APK</span>
                </h3>
                <ol className="space-y-2.5 text-xs sm:text-sm text-[#667085] dark:text-[#A0A5B1] list-decimal list-inside leading-relaxed">
                  <li>
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">Android Studio UI</strong>: Click{' '}
                    <em>Build → Build App(s) / APK(s) → Build APK(s)</em> for a debug build, or{' '}
                    <em>Build → Generate Signed App Bundle / APK</em> for a signed release APK.
                  </li>
                  <li>
                    <strong className="text-[#172033] dark:text-[#F4F5F7]">Gradle CLI</strong>: Run the commands below inside the{' '}
                    <code className="font-mono">android/</code> directory.
                  </li>
                  <li>
                    Install onto your connected Android 9+ phone via{' '}
                    <code className="font-mono">adb install</code>, grant Bluetooth permissions,
                    register the HID profile, and pair with your Windows PC or Android host.
                  </li>
                </ol>
              </div>

              <CopyCodeBlock
                id="cmd-apk-build"
                label="Build debug APK & install via ADB"
                code={`cd android\n./gradlew assembleDebug\n\n# Install APK onto connected Android 9+ device:\nadb install -r app/build/outputs/apk/debug/app-debug.apk`}
                copiedId={copiedId}
                onCopy={handleCopy}
              />

              <div className="rounded-xl border border-[#2563EB]/30 dark:border-[#6B9BFF]/35 bg-[#EFF4FF] dark:bg-[#232A38] p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-[#172033] dark:text-[#F4F5F7]">
                  Ready to verify on your smartphone? Open the 12-item Physical Device Testing
                  Checklist in Settings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChecklist();
                  }}
                  className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold whitespace-nowrap transition-colors duration-150"
                >
                  Open Testing Checklist
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] shrink-0">
          <span className="text-xs text-[#667085] dark:text-[#A0A5B1] tabular-nums">
            Step {activeStepIndex + 1} of {GUIDE_STEPS.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              className="min-h-[40px] px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] disabled:opacity-40 text-xs font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-1 transition-colors duration-150"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {activeStepIndex < GUIDE_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveStepIndex((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))
                }
                className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold flex items-center gap-1 transition-colors duration-150"
              >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors duration-150"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
