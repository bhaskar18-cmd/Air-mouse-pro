import type { ReactNode } from 'react';
import {
  Bluetooth,
  Keyboard,
  LayoutDashboard,
  MousePointer2,
  Settings,
  Sliders,
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
  { id: 'profiles', label: 'Controls', icon: Sliders },
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
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] dark:bg-[#111318] text-[#172033] dark:text-[#F4F5F7] transition-colors duration-150">
      {/* Top Bar: Clean 3-Zone Header */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 border-b border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => onSelectScreen('dashboard')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-[#6B9BFF] rounded-lg"
          >
            <BlueMouseLogo size={28} />
            <span className="font-display text-lg font-bold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
              BlueMouse
            </span>
          </button>

          {/* Zone 2: Desktop Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectScreen(item.id)}
                  className={`py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'text-[#2563EB] dark:text-[#6B9BFF] border-[#2563EB] dark:border-[#6B9BFF]'
                      : 'text-[#667085] dark:text-[#A0A5B1] border-transparent hover:text-[#172033] dark:hover:text-[#F4F5F7]'
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
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 flex items-center gap-1.5 active:opacity-85 ${
                isConnected
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318]'
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

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-6 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors duration-150 ${
                  active
                    ? 'text-[#2563EB] dark:text-[#6B9BFF]'
                    : 'text-[#667085] dark:text-[#A0A5B1]'
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.75} />
                <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
