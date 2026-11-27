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
import { resolveBindingToAction } from '../hid/actionLibrary';
import {
  KEY_MOD_LALT,
  KEY_MOD_LCTRL,
  KEY_MOD_LGUI,
  KEY_MOD_LSHIFT,
} from '../hid/hidReports';
import { COMMON_SHORTCUTS, HID_KEY, mapTextToHidSequence } from '../hid/usQwertyKeymap';
import { bluetoothService } from '../services/bluetoothService';
import type { DeviceProfile, HidActionDefinition } from '../types/bluetooth';

interface VirtualKeyboardProps {
  hapticEnabled: boolean;
  handedness?: 'right' | 'left';
  compact?: boolean;
  isConnected?: boolean;
  activeProfile?: DeviceProfile | null;
}

interface KeyDef {
  keyId: string;
  label: string;
  shiftLabel?: string;
  keycode: number;
  width?: string;
  modBit?: number;
  isShift?: boolean;
  isCaps?: boolean;
}

const FUNCTION_ROW: KeyDef[] = [
  { keyId: 'key_escape', label: 'Esc', keycode: HID_KEY.ESCAPE },
  { keyId: 'key_f1', label: 'F1', keycode: HID_KEY.F1 },
  { keyId: 'key_f2', label: 'F2', keycode: HID_KEY.F2 },
  { keyId: 'key_f3', label: 'F3', keycode: HID_KEY.F3 },
  { keyId: 'key_f4', label: 'F4', keycode: HID_KEY.F4 },
  { keyId: 'key_f5', label: 'F5', keycode: HID_KEY.F5 },
  { keyId: 'key_f6', label: 'F6', keycode: HID_KEY.F6 },
  { keyId: 'key_f7', label: 'F7', keycode: HID_KEY.F7 },
  { keyId: 'key_f8', label: 'F8', keycode: HID_KEY.F8 },
  { keyId: 'key_f9', label: 'F9', keycode: HID_KEY.F9 },
  { keyId: 'key_f10', label: 'F10', keycode: HID_KEY.F10 },
  { keyId: 'key_f11', label: 'F11', keycode: HID_KEY.F11 },
  { keyId: 'key_f12', label: 'F12', keycode: HID_KEY.F12 },
  { keyId: 'key_delete', label: 'Del', keycode: HID_KEY.DELETE },
];

const NUMBER_ROW: KeyDef[] = [
  { keyId: 'key_grave', label: '`', shiftLabel: '~', keycode: HID_KEY.GRAVE },
  { keyId: 'key_1', label: '1', shiftLabel: '!', keycode: HID_KEY.NUM_1 },
  { keyId: 'key_2', label: '2', shiftLabel: '@', keycode: HID_KEY.NUM_2 },
  { keyId: 'key_3', label: '3', shiftLabel: '#', keycode: HID_KEY.NUM_3 },
  { keyId: 'key_4', label: '4', shiftLabel: '$', keycode: HID_KEY.NUM_4 },
  { keyId: 'key_5', label: '5', shiftLabel: '%', keycode: HID_KEY.NUM_5 },
  { keyId: 'key_6', label: '6', shiftLabel: '^', keycode: HID_KEY.NUM_6 },
  { keyId: 'key_7', label: '7', shiftLabel: '&', keycode: HID_KEY.NUM_7 },
  { keyId: 'key_8', label: '8', shiftLabel: '*', keycode: HID_KEY.NUM_8 },
  { keyId: 'key_9', label: '9', shiftLabel: '(', keycode: HID_KEY.NUM_9 },
  { keyId: 'key_0', label: '0', shiftLabel: ')', keycode: HID_KEY.NUM_0 },
  { keyId: 'key_minus', label: '-', shiftLabel: '_', keycode: HID_KEY.MINUS },
  { keyId: 'key_equal', label: '=', shiftLabel: '+', keycode: HID_KEY.EQUAL },
];

const QWERTY_ROW_1: KeyDef[] = [
  { keyId: 'key_q', label: 'q', keycode: HID_KEY.Q },
  { keyId: 'key_w', label: 'w', keycode: HID_KEY.W },
  { keyId: 'key_e', label: 'e', keycode: HID_KEY.E },
  { keyId: 'key_r', label: 'r', keycode: HID_KEY.R },
  { keyId: 'key_t', label: 't', keycode: HID_KEY.T },
  { keyId: 'key_y', label: 'y', keycode: HID_KEY.Y },
  { keyId: 'key_u', label: 'u', keycode: HID_KEY.U },
  { keyId: 'key_i', label: 'i', keycode: HID_KEY.I },
  { keyId: 'key_o', label: 'o', keycode: HID_KEY.O },
  { keyId: 'key_p', label: 'p', keycode: HID_KEY.P },
];

const QWERTY_ROW_2: KeyDef[] = [
  { keyId: 'key_a', label: 'a', keycode: HID_KEY.A },
  { keyId: 'key_s', label: 's', keycode: HID_KEY.S },
  { keyId: 'key_d', label: 'd', keycode: HID_KEY.D },
  { keyId: 'key_f', label: 'f', keycode: HID_KEY.F },
  { keyId: 'key_g', label: 'g', keycode: HID_KEY.G },
  { keyId: 'key_h', label: 'h', keycode: HID_KEY.H },
  { keyId: 'key_j', label: 'j', keycode: HID_KEY.J },
  { keyId: 'key_k', label: 'k', keycode: HID_KEY.K },
  { keyId: 'key_l', label: 'l', keycode: HID_KEY.L },
];

const QWERTY_ROW_3: KeyDef[] = [
  { keyId: 'key_z', label: 'z', keycode: HID_KEY.Z },
  { keyId: 'key_x', label: 'x', keycode: HID_KEY.X },
  { keyId: 'key_c', label: 'c', keycode: HID_KEY.C },
  { keyId: 'key_v', label: 'v', keycode: HID_KEY.V },
  { keyId: 'key_b', label: 'b', keycode: HID_KEY.B },
  { keyId: 'key_n', label: 'n', keycode: HID_KEY.N },
  { keyId: 'key_m', label: 'm', keycode: HID_KEY.M },
];

const SYMBOLS_ROW_1: KeyDef[] = [
  { keyId: 'key_lbracket', label: '[', shiftLabel: '{', keycode: HID_KEY.LEFT_BRACKET },
  { keyId: 'key_rbracket', label: ']', shiftLabel: '}', keycode: HID_KEY.RIGHT_BRACKET },
  { keyId: 'key_backslash', label: '\\', shiftLabel: '|', keycode: HID_KEY.BACKSLASH },
  { keyId: 'key_semicolon', label: ';', shiftLabel: ':', keycode: HID_KEY.SEMICOLON },
  { keyId: 'key_apostrophe', label: "'", shiftLabel: '"', keycode: HID_KEY.APOSTROPHE },
  { keyId: 'key_comma', label: ',', shiftLabel: '<', keycode: HID_KEY.COMMA },
  { keyId: 'key_period', label: '.', shiftLabel: '>', keycode: HID_KEY.PERIOD },
  { keyId: 'key_slash', label: '/', shiftLabel: '?', keycode: HID_KEY.SLASH },
];

const NAV_KEYS: KeyDef[] = [
  { keyId: 'key_home', label: 'Home', keycode: HID_KEY.HOME },
  { keyId: 'key_end', label: 'End', keycode: HID_KEY.END },
  { keyId: 'key_page_up', label: 'PgUp', keycode: HID_KEY.PAGE_UP },
  { keyId: 'key_page_down', label: 'PgDn', keycode: HID_KEY.PAGE_DOWN },
  { keyId: 'key_insert', label: 'Ins', keycode: HID_KEY.INSERT },
  { keyId: 'key_print_screen', label: 'PrtSc', keycode: HID_KEY.PRINT_SCREEN },
];

export function VirtualKeyboard({
  hapticEnabled,
  handedness = 'right',
  compact = false,
  isConnected = false,
  activeProfile = null,
}: VirtualKeyboardProps) {
  const [layoutMode, setLayoutMode] = useState<'qwerty' | 'symbols'>('qwerty');
  const [showFnRow, setShowFnRow] = useState(!compact);
  const [shiftLatched, setShiftLatched] = useState(false);
  const [capsActive, setCapsActive] = useState(false);
  const [heldModifiers, setHeldModifiers] = useState(0);
  const [pressedKeyIds, setPressedKeyIds] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [unicodeWarning, setUnicodeWarning] = useState<string | null>(null);
  const [sendingText, setSendingText] = useState(false);
  const [lastActionHint, setLastActionHint] = useState<string | null>(null);

  const effectiveShift = (heldModifiers & KEY_MOD_LSHIFT) !== 0 || shiftLatched;
  const uppercase = effectiveShift !== capsActive;

  const getCustomAction = useCallback(
    (keyId: string): HidActionDefinition | null => {
      const binding = activeProfile?.keyMappings?.[keyId];
      return binding ? resolveBindingToAction(binding) : null;
    },
    [activeProfile]
  );

  const releaseAllSafe = useCallback(() => {
    setPressedKeyIds([]);
    setHeldModifiers(0);
    setShiftLatched(false);
    setLastActionHint('All keys & modifiers released');
    void bluetoothService.releaseAllKeys();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setPressedKeyIds([]);
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
    (mods: number, keyIds: string[]) => {
      const finalMods = shiftLatched ? mods | KEY_MOD_LSHIFT : mods;
      const codes = keyIds
        .map((id) => {
          const custom = getCustomAction(id);
          if (custom?.actionType === 'key_tap' && typeof custom.keycode === 'number') {
            return custom.keycode;
          }
          // Lookup standard keycode across known rows
          const allDefs = [
            ...FUNCTION_ROW,
            ...NUMBER_ROW,
            ...QWERTY_ROW_1,
            ...QWERTY_ROW_2,
            ...QWERTY_ROW_3,
            ...SYMBOLS_ROW_1,
            ...NAV_KEYS,
            { keyId: 'key_backspace', label: 'Bksp', keycode: HID_KEY.BACKSPACE },
            { keyId: 'key_enter', label: 'Enter', keycode: HID_KEY.ENTER },
            { keyId: 'key_space', label: 'Space', keycode: HID_KEY.SPACE },
            { keyId: 'key_tab', label: 'Tab', keycode: HID_KEY.TAB },
            { keyId: 'key_left', label: 'Left', keycode: HID_KEY.LEFT_ARROW },
            { keyId: 'key_up', label: 'Up', keycode: HID_KEY.UP_ARROW },
            { keyId: 'key_down', label: 'Down', keycode: HID_KEY.DOWN_ARROW },
            { keyId: 'key_right', label: 'Right', keycode: HID_KEY.RIGHT_ARROW },
          ];
          return allDefs.find((d) => d.keyId === id)?.keycode ?? 0;
        })
        .filter((k) => k > 0)
        .slice(0, 6);

      void bluetoothService.setKeyboardState(finalMods, codes);
    },
    [getCustomAction, shiftLatched]
  );

  const handleKeyDown = async (key: KeyDef) => {
    await bluetoothService.triggerHaptic(hapticEnabled, 'light');

    const customAction = getCustomAction(key.keyId);
    if (customAction) {
      setPressedKeyIds((prev) => (prev.includes(key.keyId) ? prev : [...prev, key.keyId]));
      setLastActionHint(`${key.label.toUpperCase()} -> ${customAction.label}`);
      await bluetoothService.executeActionPress(
        customAction,
        handedness,
        shiftLatched ? heldModifiers | KEY_MOD_LSHIFT : heldModifiers
      );
      return;
    }

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
      syncKeyboardReport(nextMods, pressedKeyIds);
      return;
    }

    const nextKeys = pressedKeyIds.includes(key.keyId)
      ? pressedKeyIds
      : [...pressedKeyIds, key.keyId].slice(0, 6);
    setPressedKeyIds(nextKeys);
    syncKeyboardReport(heldModifiers, nextKeys);
  };

  const handleKeyUp = (key: KeyDef) => {
    const customAction = getCustomAction(key.keyId);
    if (customAction) {
      if (!pressedKeyIds.includes(key.keyId)) return;
      setPressedKeyIds((prev) => prev.filter((id) => id !== key.keyId));
      void bluetoothService.executeActionRelease(customAction, handedness);
      if (shiftLatched || heldModifiers !== 0) {
        setShiftLatched(false);
        setHeldModifiers(0);
      }
      return;
    }

    if (key.isCaps || key.isShift || key.modBit) return;
    if (!pressedKeyIds.includes(key.keyId)) return;

    const nextKeys = pressedKeyIds.filter((k) => k !== key.keyId);
    setPressedKeyIds(nextKeys);

    syncKeyboardReport(heldModifiers, nextKeys);

    // Clear one-shot shift latch and sticky modifiers after sending a non-modifier key
    if (shiftLatched || heldModifiers !== 0) {
      setShiftLatched(false);
      setHeldModifiers(0);
      void bluetoothService.setKeyboardState(0, []);
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

  const renderKeyButton = (key: KeyDef, customClass = '', icon?: React.ReactNode) => {
    const isPressed = pressedKeyIds.includes(key.keyId);
    const customAction = getCustomAction(key.keyId);
    const isModOn =
      !customAction &&
      ((key.isShift && shiftLatched) ||
        (key.isCaps && capsActive) ||
        (key.modBit !== undefined && (heldModifiers & key.modBit) !== 0));

    let display = customAction ? customAction.shortLabel : key.label;
    if (!customAction) {
      if (key.shiftLabel && effectiveShift) {
        display = key.shiftLabel;
      } else if (/^[a-z]$/.test(key.label)) {
        display = uppercase ? key.label.toUpperCase() : key.label;
      }
    }

    return (
      <button
        key={key.keyId}
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
        className={`touch-surface relative select-none min-h-[42px] rounded-lg border text-xs sm:text-sm font-medium transition-colors duration-100 flex items-center justify-center px-1 ${
          isPressed || isModOn
            ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#2563EB] dark:bg-[#6B9BFF] text-white dark:text-[#111318]'
            : customAction
              ? 'border-[#2563EB]/45 dark:border-[#6B9BFF]/45 bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
              : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#222630] text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#2A2F3B]'
        } ${customClass}`}
        title={customAction ? `Custom mapped: ${customAction.label}` : key.label}
      >
        {customAction ? (
          <span className="truncate text-[10px] font-semibold leading-tight">{display}</span>
        ) : (
          icon ?? display
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Toolbar: Layout Toggle + Function Keys Toggle + Release All */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#ECEEF2] dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#30343D]">
          <button
            type="button"
            onClick={() => setLayoutMode('qwerty')}
            className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
              layoutMode === 'qwerty'
                ? 'bg-white dark:bg-[#6B9BFF] text-[#172033] dark:text-[#111318]'
                : 'text-[#667085] dark:text-[#A0A5B1]'
            }`}
          >
            QWERTY
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('symbols')}
            className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
              layoutMode === 'symbols'
                ? 'bg-white dark:bg-[#6B9BFF] text-[#172033] dark:text-[#111318]'
                : 'text-[#667085] dark:text-[#A0A5B1]'
            }`}
          >
            Symbols &amp; Nav
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFnRow((v) => !v)}
            className={`min-h-[36px] px-3 rounded-xl border text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
              showFnRow
                ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1]'
            }`}
          >
            {showFnRow ? 'Hide F1–F12' : 'Show F1–F12'}
          </button>
          <button
            type="button"
            onClick={releaseAllSafe}
            className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-xs font-medium text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] whitespace-nowrap"
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
            className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:border-[#2563EB]/50 dark:hover:border-[#6B9BFF]/50 text-xs font-mono font-medium text-[#172033] dark:text-[#F4F5F7] shrink-0 whitespace-nowrap transition-colors duration-150 active:opacity-75"
          >
            {sc.label}
          </button>
        ))}
      </div>

      {lastActionHint && (
        <p className="text-xs font-mono text-[#2563EB] dark:text-[#6B9BFF] px-1">
          {lastActionHint}
        </p>
      )}

      {/* Type & Send Text Bar */}
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
            className="flex-1 min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] px-3.5 text-sm text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 dark:focus:ring-[#6B9BFF]/30"
          />
          <button
            type="submit"
            disabled={sendingText || !textInput.trim()}
            className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] dark:text-[#111318] disabled:opacity-45 text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors"
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
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>{unicodeWarning}</span>
        </div>
      )}

      {/* Clean Keyboard Surface */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#ECEEF2] dark:bg-[#16181E] p-2.5 sm:p-3.5 flex flex-col gap-1.5">
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
              {renderKeyButton(
                { keyId: 'key_caps_lock', label: 'Caps', keycode: HID_KEY.CAPS_LOCK, isCaps: true },
                'text-xs'
              )}
              {QWERTY_ROW_2.map((k) => renderKeyButton(k))}
            </div>

            {/* QWERTY Row 3 */}
            <div className="grid grid-cols-10 gap-1">
              {renderKeyButton(
                { keyId: 'mod_shift', label: 'Shift', keycode: 0, isShift: true },
                'col-span-2 text-xs'
              )}
              {QWERTY_ROW_3.map((k) => renderKeyButton(k))}
              {renderKeyButton(
                { keyId: 'key_backspace', label: 'Bksp', keycode: HID_KEY.BACKSPACE },
                '',
                <Delete className="h-4 w-4" />
              )}
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
              {renderKeyButton(
                { keyId: 'key_left', label: 'Left', keycode: HID_KEY.LEFT_ARROW },
                'min-h-[44px]',
                <ArrowLeft className="h-4 w-4" />
              )}
              {renderKeyButton(
                { keyId: 'key_up', label: 'Up', keycode: HID_KEY.UP_ARROW },
                'min-h-[44px]',
                <ArrowUp className="h-4 w-4" />
              )}
              {renderKeyButton(
                { keyId: 'key_down', label: 'Down', keycode: HID_KEY.DOWN_ARROW },
                'min-h-[44px]',
                <ArrowDown className="h-4 w-4" />
              )}
              {renderKeyButton(
                { keyId: 'key_right', label: 'Right', keycode: HID_KEY.RIGHT_ARROW },
                'min-h-[44px]',
                <ArrowRight className="h-4 w-4" />
              )}
            </div>
          </>
        )}

        {/* Bottom Modifier + Spacebar + Enter Row */}
        <div className="grid grid-cols-12 gap-1 pt-0.5">
          {renderKeyButton(
            { keyId: 'mod_ctrl', label: 'Ctrl', keycode: 0, modBit: KEY_MOD_LCTRL },
            'col-span-2 text-xs'
          )}
          {renderKeyButton(
            { keyId: 'mod_win', label: 'Win', keycode: 0, modBit: KEY_MOD_LGUI },
            'col-span-1 text-xs'
          )}
          {renderKeyButton(
            { keyId: 'mod_alt', label: 'Alt', keycode: 0, modBit: KEY_MOD_LALT },
            'col-span-2 text-xs'
          )}
          {renderKeyButton(
            { keyId: 'key_space', label: 'Space', keycode: HID_KEY.SPACE },
            'col-span-4 text-xs'
          )}
          {renderKeyButton(
            { keyId: 'key_tab', label: 'Tab', keycode: HID_KEY.TAB },
            'col-span-1 text-xs'
          )}
          {renderKeyButton(
            { keyId: 'key_enter', label: 'Enter', keycode: HID_KEY.ENTER },
            'col-span-2 font-semibold',
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Enter</span>
            </span>
          )}
        </div>

        {/* Always-accessible Arrow row on QWERTY mode */}
        {layoutMode === 'qwerty' && !compact && (
          <div className="grid grid-cols-6 gap-1 pt-0.5">
            {renderKeyButton({ keyId: 'key_home', label: 'Home', keycode: HID_KEY.HOME }, 'text-xs')}
            {renderKeyButton(
              { keyId: 'key_left', label: 'Left', keycode: HID_KEY.LEFT_ARROW },
              'min-h-[40px]',
              <ArrowLeft className="h-4 w-4" />
            )}
            {renderKeyButton(
              { keyId: 'key_up', label: 'Up', keycode: HID_KEY.UP_ARROW },
              'min-h-[40px]',
              <ArrowUp className="h-4 w-4" />
            )}
            {renderKeyButton(
              { keyId: 'key_down', label: 'Down', keycode: HID_KEY.DOWN_ARROW },
              'min-h-[40px]',
              <ArrowDown className="h-4 w-4" />
            )}
            {renderKeyButton(
              { keyId: 'key_right', label: 'Right', keycode: HID_KEY.RIGHT_ARROW },
              'min-h-[40px]',
              <ArrowRight className="h-4 w-4" />
            )}
            {renderKeyButton({ keyId: 'key_end', label: 'End', keycode: HID_KEY.END }, 'text-xs')}
          </div>
        )}
      </div>
    </div>
  );
}
