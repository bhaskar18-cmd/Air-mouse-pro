import type { ReactNode } from 'react';
import {
  Bluetooth,
  Keyboard,
  LayoutDashboard,
  MousePointer2,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import type { AppScreen, BluetoothStatusSnapshot } from '../types/bluetooth';
import { BlueMouseLogo } from './BlueMouseLogo';

interface AppShellProps {
  activeScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  status: BluetoothStatusSnapshot;
  onPrimaryAction: () => void;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: AppScreen; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mouse', label: 'Mouse', icon: MousePointer2 },
  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
  { id: 'combined', label: 'Combined', icon: SlidersHorizontal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  activeScreen,
  onSelectScreen,
  status,
  onPrimaryAction,
  children,
}: AppShellProps) {
  const isConnected = status.connectionPhase === 'connected';
  const primaryLabel = isConnected
    ? 'Disconnect'
    : status.isNativeAndroid
      ? status.hidState === 'registered'
        ? 'Pair Host'
        : 'Register HID'
      : 'APK Guide';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#050914] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar: Desktop 3-Zone Contract / Compact Mobile Header (52px) */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#050914]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectScreen('dashboard')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <BlueMouseLogo size={30} />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              BlueMouse
            </span>
          </button>

          {/* Zone 2: Desktop Single-Line Text Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectScreen(item.id)}
                  className={`py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'text-blue-600 dark:text-cyan-400 border-blue-600 dark:border-cyan-400'
                      : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Contextual Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onPrimaryAction}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Bluetooth className="h-3.5 w-3.5" />
              <span>{primaryLabel}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
        {children}
      </main>

      {/* Mobile Fixed Bottom Thumb-Zone Navigation (56px + safe area) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080F1E]/95 backdrop-blur-md pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
