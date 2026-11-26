import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerDownLeft,
  Delete,
  Loader2,
  Send,
} from 'lucide-react';
import {
  KEY_MOD_LALT,
  KEY_MOD_LCTRL,
  KEY_MOD_LGUI,
  KEY_MOD_LSHIFT,
} from '../hid/hidReports';
import { COMMON_SHORTCUTS, HID_KEY, mapTextToHidSequence } from '../hid/usQwertyKeymap';
import { bluetoothService } from '../services/bluetoothService';

interface VirtualKeyboardProps {
  hapticEnabled: boolean;
  compact?: boolean;
  isConnected?: boolean;
}

interface KeyDef {
  label: string;
  shiftLabel?: string;
  keycode: number;
  width?: string;
  modBit?: number;
  isShift?: boolean;
  isCaps?: boolean;
}

const FUNCTION_ROW: KeyDef[] = [
  { label: 'Esc', keycode: HID_KEY.ESCAPE },
  { label: 'F1', keycode: HID_KEY.F1 },
  { label: 'F2', keycode: HID_KEY.F2 },
  { label: 'F3', keycode: HID_KEY.F3 },
  { label: 'F4', keycode: HID_KEY.F4 },
  { label: 'F5', keycode: HID_KEY.F5 },
  { label: 'F6', keycode: HID_KEY.F6 },
  { label: 'F7', keycode: HID_KEY.F7 },
  { label: 'F8', keycode: HID_KEY.F8 },
  { label: 'F9', keycode: HID_KEY.F9 },
  { label: 'F10', keycode: HID_KEY.F10 },
  { label: 'F11', keycode: HID_KEY.F11 },
  { label: 'F12', keycode: HID_KEY.F12 },
  { label: 'Del', keycode: HID_KEY.DELETE },
];

const NUMBER_ROW: KeyDef[] = [
  { label: '`', shiftLabel: '~', keycode: HID_KEY.GRAVE },
  { label: '1', shiftLabel: '!', keycode: HID_KEY.NUM_1 },
  { label: '2', shiftLabel: '@', keycode: HID_KEY.NUM_2 },
  { label: '3', shiftLabel: '#', keycode: HID_KEY.NUM_3 },
  { label: '4', shiftLabel: '$', keycode: HID_KEY.NUM_4 },
  { label: '5', shiftLabel: '%', keycode: HID_KEY.NUM_5 },
  { label: '6', shiftLabel: '^', keycode: HID_KEY.NUM_6 },
  { label: '7', shiftLabel: '&', keycode: HID_KEY.NUM_7 },
  { label: '8', shiftLabel: '*', keycode: HID_KEY.NUM_8 },
  { label: '9', shiftLabel: '(', keycode: HID_KEY.NUM_9 },
  { label: '0', shiftLabel: ')', keycode: HID_KEY.NUM_0 },
  { label: '-', shiftLabel: '_', keycode: HID_KEY.MINUS },
  { label: '=', shiftLabel: '+', keycode: HID_KEY.EQUAL },
];

const QWERTY_ROW_1: KeyDef[] = [
  { label: 'q', keycode: HID_KEY.Q },
  { label: 'w', keycode: HID_KEY.W },
  { label: 'e', keycode: HID_KEY.E },
  { label: 'r', keycode: HID_KEY.R },
  { label: 't', keycode: HID_KEY.T },
  { label: 'y', keycode: HID_KEY.Y },
  { label: 'u', keycode: HID_KEY.U },
  { label: 'i', keycode: HID_KEY.I },
  { label: 'o', keycode: HID_KEY.O },
  { label: 'p', keycode: HID_KEY.P },
];

const QWERTY_ROW_2: KeyDef[] = [
  { label: 'a', keycode: HID_KEY.A },
  { label: 's', keycode: HID_KEY.S },
  { label: 'd', keycode: HID_KEY.D },
  { label: 'f', keycode: HID_KEY.F },
  { label: 'g', keycode: HID_KEY.G },
  { label: 'h', keycode: HID_KEY.H },
  { label: 'j', keycode: HID_KEY.J },
  { label: 'k', keycode: HID_KEY.K },
  { label: 'l', keycode: HID_KEY.L },
];

const QWERTY_ROW_3: KeyDef[] = [
  { label: 'z', keycode: HID_KEY.Z },
  { label: 'x', keycode: HID_KEY.X },
  { label: 'c', keycode: HID_KEY.C },
  { label: 'v', keycode: HID_KEY.V },
  { label: 'b', keycode: HID_KEY.B },
  { label: 'n', keycode: HID_KEY.N },
  { label: 'm', keycode: HID_KEY.M },
];

const SYMBOLS_ROW_1: KeyDef[] = [
  { label: '[', shiftLabel: '{', keycode: HID_KEY.LEFT_BRACKET },
  { label: ']', shiftLabel: '}', keycode: HID_KEY.RIGHT_BRACKET },
  { label: '\\', shiftLabel: '|', keycode: HID_KEY.BACKSLASH },
  { label: ';', shiftLabel: ':', keycode: HID_KEY.SEMICOLON },
  { label: "'", shiftLabel: '"', keycode: HID_KEY.APOSTROPHE },
  { label: ',', shiftLabel: '<', keycode: HID_KEY.COMMA },
  { label: '.', shiftLabel: '>', keycode: HID_KEY.PERIOD },
  { label: '/', shiftLabel: '?', keycode: HID_KEY.SLASH },
];

const NAV_KEYS: KeyDef[] = [
  { label: 'Home', keycode: HID_KEY.HOME },
  { label: 'End', keycode: HID_KEY.END },
  { label: 'PgUp', keycode: HID_KEY.PAGE_UP },
  { label: 'PgDn', keycode: HID_KEY.PAGE_DOWN },
  { label: 'Ins', keycode: HID_KEY.INSERT },
  { label: 'PrtSc', keycode: HID_KEY.PRINT_SCREEN },
];

export function VirtualKeyboard({
  hapticEnabled,
  compact = false,
  isConnected = false,
}: VirtualKeyboardProps) {
  const [layoutMode, setLayoutMode] = useState<'qwerty' | 'symbols'>('qwerty');
  const [showFnRow, setShowFnRow] = useState(!compact);
  const [shiftLatched, setShiftLatched] = useState(false);
  const [capsActive, setCapsActive] = useState(false);
  const [heldModifiers, setHeldModifiers] = useState(0);
  const [pressedKeycodes, setPressedKeycodes] = useState<number[]>([]);
  const [textInput, setTextInput] = useState('');
  const [unicodeWarning, setUnicodeWarning] = useState<string | null>(null);
  const [sendingText, setSendingText] = useState(false);
  const [lastActionHint, setLastActionHint] = useState<string | null>(null);

  const effectiveShift = (heldModifiers & KEY_MOD_LSHIFT) !== 0 || shiftLatched;
  const uppercase = effectiveShift !== capsActive;

  const releaseAllSafe = useCallback(() => {
    setPressedKeycodes([]);
    setHeldModifiers(0);
    setShiftLatched(false);
    setLastActionHint('All keys & modifiers released');
    void bluetoothService.releaseAllKeys();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setPressedKeycodes([]);
      setHeldModifiers(0);
      setShiftLatched(false);
    }
  }, [isConnected]);

  useEffect(() => {
    const onBlur = () => releaseAllSafe();
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      releaseAllSafe();
    };
  }, [releaseAllSafe]);

  const syncKeyboardReport = useCallback(
    (mods: number, keys: number[]) => {
      const finalMods = shiftLatched ? mods | KEY_MOD_LSHIFT : mods;
      void bluetoothService.setKeyboardState(finalMods, keys);
    },
    [shiftLatched]
  );

  const handleKeyDown = async (key: KeyDef) => {
    await bluetoothService.triggerHaptic(hapticEnabled, 'light');

    if (key.isCaps) {
      setCapsActive((c) => !c);
      await bluetoothService.sendKeyTap(HID_KEY.CAPS_LOCK, heldModifiers);
      return;
    }

    if (key.isShift) {
      setShiftLatched((s) => !s);
      return;
    }

    if (key.modBit) {
      const nextMods =
        (heldModifiers & key.modBit) !== 0
          ? heldModifiers & ~key.modBit
          : heldModifiers | key.modBit;
      setHeldModifiers(nextMods);
      syncKeyboardReport(nextMods, pressedKeycodes);
      return;
    }

    const nextKeys = pressedKeycodes.includes(key.keycode)
      ? pressedKeycodes
      : [...pressedKeycodes, key.keycode].slice(0, 6);
    setPressedKeycodes(nextKeys);
    syncKeyboardReport(heldModifiers, nextKeys);
  };

  const handleKeyUp = (key: KeyDef) => {
    if (key.isCaps || key.isShift || key.modBit) return;
    if (!pressedKeycodes.includes(key.keycode)) return;

    const nextKeys = pressedKeycodes.filter((k) => k !== key.keycode);
    setPressedKeycodes(nextKeys);

    const modsToSend = shiftLatched ? heldModifiers | KEY_MOD_LSHIFT : heldModifiers;
    void bluetoothService.setKeyboardState(modsToSend, nextKeys);

    // Clear one-shot shift latch and sticky modifiers after sending a non-modifier key
    if (shiftLatched || heldModifiers !== 0) {
      setShiftLatched(false);
      setHeldModifiers(0);
      void bluetoothService.setKeyboardState(0, nextKeys);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const { unsupportedChars } = mapTextToHidSequence(textInput);
    if (unsupportedChars.length > 0) {
      setUnicodeWarning(
        `Skipped unsupported non-US characters (${unsupportedChars.join(' ')}). Standard Bluetooth HID keycodes map to US QWERTY scancodes rather than raw Unicode text.`
      );
    } else {
      setUnicodeWarning(null);
    }
    setSendingText(true);
    try {
      await bluetoothService.triggerHaptic(hapticEnabled, 'medium');
      const { sentCount } = await bluetoothService.sendTextString(textInput);
      setLastActionHint(`Formatted ${sentCount} HID key event${sentCount === 1 ? '' : 's'}`);
      setTextInput('');
    } finally {
      setSendingText(false);
    }
  };

  const renderKeyButton = (key: KeyDef, customClass = '') => {
    const isPressed = pressedKeycodes.includes(key.keycode);
    const isModOn =
      (key.isShift && shiftLatched) ||
      (key.isCaps && capsActive) ||
      (key.modBit !== undefined && (heldModifiers & key.modBit) !== 0);

    let display = key.label;
    if (key.shiftLabel && effectiveShift) {
      display = key.shiftLabel;
    } else if (/^[a-z]$/.test(key.label)) {
      display = uppercase ? key.label.toUpperCase() : key.label;
    }

    return (
      <button
        key={`${key.label}-${key.keycode}`}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          void handleKeyDown(key);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          handleKeyUp(key);
        }}
        onPointerCancel={() => handleKeyUp(key)}
        onPointerLeave={() => handleKeyUp(key)}
        className={`touch-surface select-none min-h-[42px] rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-center ${
          isPressed || isModOn
            ? 'border-cyan-400 bg-blue-600 text-white shadow-sm translate-y-[1px]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#16233E]'
        } ${customClass}`}
      >
        {display}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Toolbar: Layout Toggle + Function Keys Toggle + Release All */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLayoutMode('qwerty')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              layoutMode === 'qwerty'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            QWERTY
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('symbols')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              layoutMode === 'symbols'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Symbols &amp; Nav
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFnRow((v) => !v)}
            className={`min-h-[38px] px-3 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
              showFnRow
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-cyan-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-slate-600 dark:text-slate-300'
            }`}
          >
            {showFnRow ? 'Hide F1–F12' : 'Show F1–F12'}
          </button>
          <button
            type="button"
            onClick={releaseAllSafe}
            className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Release Keys
          </button>
        </div>
      </div>

      {/* Shortcut Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {COMMON_SHORTCUTS.map((sc) => (
          <button
            key={sc.id}
            type="button"
            title={sc.description}
            onClick={async () => {
              await bluetoothService.triggerHaptic(hapticEnabled, 'medium');
              await bluetoothService.sendShortcut(sc.modifiers, sc.keycodes);
              setLastActionHint(`Triggered ${sc.label} (${sc.description})`);
            }}
            className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] hover:border-blue-500/50 text-xs font-mono font-medium text-slate-700 dark:text-cyan-300 shrink-0 whitespace-nowrap transition-colors active:scale-95"
          >
            {sc.label}
          </button>
        ))}
      </div>

      {lastActionHint && (
        <p className="text-xs font-mono text-blue-600 dark:text-cyan-400 px-1">
          {lastActionHint}
        </p>
      )}

      {/* Type & Send Text Bar (US QWERTY verification) */}
      {!compact && (
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => {
              const val = e.target.value;
              setTextInput(val);
              const { unsupportedChars } = mapTextToHidSequence(val);
              if (unsupportedChars.length > 0) {
                setUnicodeWarning(
                  `Unsupported Unicode character(s): ${unsupportedChars.join(' ')}. Bluetooth HID uses US QWERTY scancodes; only standard US ASCII keys will be sent.`
                );
              } else {
                setUnicodeWarning(null);
              }
            }}
            placeholder="Type text to send via US QWERTY HID reports..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={sendingText || !textInput.trim()}
            className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            {sendingText ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{sendingText ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      )}

      {unicodeWarning && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span>{unicodeWarning}</span>
        </div>
      )}

      {/* Keyboard Surface */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-[#081020] p-2.5 sm:p-3.5 flex flex-col gap-1.5">
        {/* Function Keys Row */}
        {showFnRow && (
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
            {FUNCTION_ROW.map((k) => renderKeyButton(k, 'text-[11px] min-h-[36px]'))}
          </div>
        )}

        {layoutMode === 'qwerty' ? (
          <>
            {/* Number Row */}
            <div className="grid grid-cols-13 gap-1">
              {NUMBER_ROW.map((k) => renderKeyButton(k, 'text-xs'))}
            </div>

            {/* QWERTY Row 1 */}
            <div className="grid grid-cols-10 gap-1">
              {QWERTY_ROW_1.map((k) => renderKeyButton(k))}
            </div>

            {/* QWERTY Row 2 */}
            <div className="grid grid-cols-10 gap-1">
              {renderKeyButton({ label: 'Caps', keycode: HID_KEY.CAPS_LOCK, isCaps: true }, 'text-xs')}
              {QWERTY_ROW_2.map((k) => renderKeyButton(k))}
            </div>

            {/* QWERTY Row 3 */}
            <div className="grid grid-cols-10 gap-1">
              {renderKeyButton(
                { label: 'Shift', keycode: 0, isShift: true },
                'col-span-2 text-xs'
              )}
              {QWERTY_ROW_3.map((k) => renderKeyButton(k))}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  void handleKeyDown({ label: 'Bksp', keycode: HID_KEY.BACKSPACE });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleKeyUp({ label: 'Bksp', keycode: HID_KEY.BACKSPACE });
                }}
                onPointerCancel={() => handleKeyUp({ label: 'Bksp', keycode: HID_KEY.BACKSPACE })}
                className="touch-surface min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] text-slate-800 dark:text-slate-100 flex items-center justify-center active:bg-blue-600 active:text-white"
                aria-label="Backspace"
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Symbols & Punctuation */}
            <div className="grid grid-cols-8 gap-1">
              {SYMBOLS_ROW_1.map((k) => renderKeyButton(k))}
            </div>

            {/* Navigation Keys */}
            <div className="grid grid-cols-6 gap-1">
              {NAV_KEYS.map((k) => renderKeyButton(k, 'text-xs'))}
            </div>

            {/* Arrow Cluster */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onPointerDown={() => void handleKeyDown({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
                onPointerUp={() => handleKeyUp({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
                onPointerCancel={() => handleKeyUp({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
                className="touch-surface min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
                aria-label="Left Arrow"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onPointerDown={() => void handleKeyDown({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
                onPointerUp={() => handleKeyUp({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
                onPointerCancel={() => handleKeyUp({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
                className="touch-surface min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
                aria-label="Up Arrow"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onPointerDown={() => void handleKeyDown({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
                onPointerUp={() => handleKeyUp({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
                onPointerCancel={() => handleKeyUp({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
                className="touch-surface min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
                aria-label="Down Arrow"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onPointerDown={() => void handleKeyDown({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
                onPointerUp={() => handleKeyUp({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
                onPointerCancel={() => handleKeyUp({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
                className="touch-surface min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
                aria-label="Right Arrow"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* Bottom Modifier + Spacebar + Enter Row */}
        <div className="grid grid-cols-12 gap-1 pt-0.5">
          {renderKeyButton({ label: 'Ctrl', keycode: 0, modBit: KEY_MOD_LCTRL }, 'col-span-2 text-xs')}
          {renderKeyButton({ label: 'Win', keycode: 0, modBit: KEY_MOD_LGUI }, 'col-span-1 text-xs')}
          {renderKeyButton({ label: 'Alt', keycode: 0, modBit: KEY_MOD_LALT }, 'col-span-2 text-xs')}
          {renderKeyButton({ label: 'Space', keycode: HID_KEY.SPACE }, 'col-span-4 text-xs')}
          {renderKeyButton({ label: 'Tab', keycode: HID_KEY.TAB }, 'col-span-1 text-xs')}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              void handleKeyDown({ label: 'Enter', keycode: HID_KEY.ENTER });
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleKeyUp({ label: 'Enter', keycode: HID_KEY.ENTER });
            }}
            onPointerCancel={() => handleKeyUp({ label: 'Enter', keycode: HID_KEY.ENTER })}
            className="touch-surface col-span-2 min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1 text-xs font-semibold active:scale-95 transition-transform"
            aria-label="Enter"
          >
            <CornerDownLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Enter</span>
          </button>
        </div>

        {/* Always-accessible Arrow row on QWERTY mode */}
        {layoutMode === 'qwerty' && !compact && (
          <div className="grid grid-cols-6 gap-1 pt-0.5">
            {renderKeyButton({ label: 'Home', keycode: HID_KEY.HOME }, 'text-xs')}
            <button
              type="button"
              onPointerDown={() => void handleKeyDown({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
              onPointerUp={() => handleKeyUp({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
              onPointerCancel={() => handleKeyUp({ label: 'Left', keycode: HID_KEY.LEFT_ARROW })}
              className="touch-surface min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
              aria-label="Left Arrow"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => void handleKeyDown({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
              onPointerUp={() => handleKeyUp({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
              onPointerCancel={() => handleKeyUp({ label: 'Up', keycode: HID_KEY.UP_ARROW })}
              className="touch-surface min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
              aria-label="Up Arrow"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => void handleKeyDown({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
              onPointerUp={() => handleKeyUp({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
              onPointerCancel={() => handleKeyUp({ label: 'Down', keycode: HID_KEY.DOWN_ARROW })}
              className="touch-surface min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
              aria-label="Down Arrow"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => void handleKeyDown({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
              onPointerUp={() => handleKeyUp({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
              onPointerCancel={() => handleKeyUp({ label: 'Right', keycode: HID_KEY.RIGHT_ARROW })}
              className="touch-surface min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F192D] flex items-center justify-center text-slate-800 dark:text-slate-100 active:bg-blue-600 active:text-white"
              aria-label="Right Arrow"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            {renderKeyButton({ label: 'End', keycode: HID_KEY.END }, 'text-xs')}
          </div>
        )}
      </div>
    </div>
  );
}
