import { useMemo, useState } from 'react';
import { Check, Keyboard, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import {
  formatCustomComboLabel,
  resolveBindingToAction,
  searchActions,
} from '../hid/actionLibrary';
import {
  KEY_MOD_LALT,
  KEY_MOD_LCTRL,
  KEY_MOD_LGUI,
  KEY_MOD_LSHIFT,
} from '../hid/hidReports';
import { CUSTOMIZABLE_KEYS } from '../hid/usQwertyKeymap';
import type { ActionCategory, CustomKeyBinding } from '../types/bluetooth';

interface ActionLibraryPickerProps {
  open: boolean;
  targetTitle: string;
  currentBinding?: CustomKeyBinding;
  onSelectBinding: (binding: CustomKeyBinding) => void;
  onResetDefault: () => void;
  onClose: () => void;
}

const CATEGORIES: Array<{ id: ActionCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'shortcut', label: 'Shortcuts' },
  { id: 'media', label: 'Media' },
  { id: 'mouse', label: 'Mouse' },
  { id: 'system', label: 'System' },
  { id: 'keyboard', label: 'Keys' },
];

export function ActionLibraryPicker({
  open,
  targetTitle,
  currentBinding,
  onSelectBinding,
  onResetDefault,
  onClose,
}: ActionLibraryPickerProps) {
  const [mode, setMode] = useState<'library' | 'custom_combo'>('library');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ActionCategory | 'all'>('all');

  // Custom Multi-Key Shortcut Builder state
  const [comboMods, setComboMods] = useState<number>(
    currentBinding?.kind === 'custom_combo' ? currentBinding.modifiers : KEY_MOD_LCTRL
  );
  const [primaryKeycode, setPrimaryKeycode] = useState<number>(
    currentBinding?.kind === 'custom_combo' && currentBinding.keycodes[0]
      ? currentBinding.keycodes[0]
      : 0x06 // C
  );
  const [customLabel, setCustomLabel] = useState<string>(
    currentBinding?.kind === 'custom_combo' ? currentBinding.label : ''
  );

  const filteredActions = useMemo(() => searchActions(query, category), [query, category]);
  const keycodeChoices = useMemo(
    () => CUSTOMIZABLE_KEYS.filter((k) => typeof k.keycode === 'number'),
    []
  );

  if (!open) return null;

  const currentAction = currentBinding ? resolveBindingToAction(currentBinding) : null;

  const toggleMod = (bit: number) => {
    setComboMods((m) => ((m & bit) !== 0 ? m & ~bit : m | bit));
  };

  const generatedComboLabel = formatCustomComboLabel(
    comboMods,
    primaryKeycode > 0 ? [primaryKeycode] : []
  );

  const handleSaveCustomCombo = (e: React.FormEvent) => {
    e.preventDefault();
    const keycodes = primaryKeycode > 0 ? [primaryKeycode] : [];
    if (keycodes.length === 0 && comboMods === 0) return;
    onSelectBinding({
      kind: 'custom_combo',
      label: customLabel.trim() || generatedComboLabel,
      modifiers: comboMods,
      keycodes,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Assign HID action to ${targetTitle}`}
    >
      <div className="w-full sm:max-w-2xl max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#30343D] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
              Assign Action · {targetTitle}
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#A0A5B1] truncate mt-0.5">
              Current:{' '}
              <span className="font-medium text-[#2563EB] dark:text-[#6B9BFF]">
                {currentAction ? currentAction.label : 'Default Behavior'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentBinding && (
              <button
                type="button"
                onClick={() => {
                  onResetDefault();
                  onClose();
                }}
                className="min-h-[36px] px-3 rounded-xl border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5 transition-colors duration-150"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] flex items-center justify-center text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7] transition-colors duration-150"
              aria-label="Close action picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="px-5 pt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('library')}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors duration-150 ${
              mode === 'library'
                ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                : 'border-[#E5E7EB] dark:border-[#30343D] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Action Library</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('custom_combo')}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors duration-150 ${
              mode === 'custom_combo'
                ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                : 'border-[#E5E7EB] dark:border-[#30343D] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Custom Shortcut Builder</span>
          </button>
        </div>

        {mode === 'library' ? (
          <>
            {/* Search & Category Filters */}
            <div className="px-5 py-3 space-y-2.5 border-b border-[#E5E7EB] dark:border-[#30343D]">
              <div className="relative">
                <Search className="h-4 w-4 text-[#667085] dark:text-[#A0A5B1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search actions (e.g. Play, Volume, Ctrl+C, Browser Back, Esc)..."
                  className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] text-sm text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#6B9BFF]"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                      category === cat.id
                        ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                        : 'bg-[#ECEEF2] dark:bg-[#222630] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredActions.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#667085] dark:text-[#A0A5B1]">
                  No matching HID actions found. Try another search term or switch to Custom
                  Shortcut Builder.
                </div>
              ) : (
                filteredActions.map((action) => {
                  const selected =
                    currentBinding?.kind === 'library' && currentBinding.actionId === action.id;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        onSelectBinding({ kind: 'library', actionId: action.id });
                        onClose();
                      }}
                      className={`w-full text-left rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 ${
                        selected
                          ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38]'
                          : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
                            {action.label}
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wide text-[#667085] dark:text-[#A0A5B1]">
                            {action.category} · {action.osScope}
                          </span>
                        </div>
                        <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
                          {action.description}
                        </p>
                      </div>

                      {selected ? (
                        <Check className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
                      ) : (
                        <span className="text-[11px] font-mono font-medium text-[#2563EB] dark:text-[#6B9BFF] shrink-0">
                          {action.shortLabel}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Multi-Key HID Shortcut Builder */
          <form onSubmit={handleSaveCustomCombo} className="p-5 space-y-4 overflow-y-auto">
            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]">
                <Keyboard className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
                <span>1. Select Modifier Keys</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Ctrl', bit: KEY_MOD_LCTRL },
                  { label: 'Shift', bit: KEY_MOD_LSHIFT },
                  { label: 'Alt', bit: KEY_MOD_LALT },
                  { label: 'Win / Cmd', bit: KEY_MOD_LGUI },
                ].map((m) => {
                  const active = (comboMods & m.bit) !== 0;
                  return (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => toggleMod(m.bit)}
                      className={`min-h-[42px] rounded-xl border text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                          : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1]'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-2.5">
              <label
                htmlFor="custom-combo-key"
                className="block text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]"
              >
                2. Select Target HID Key
              </label>
              <select
                id="custom-combo-key"
                value={primaryKeycode}
                onChange={(e) => setPrimaryKeycode(Number(e.target.value))}
                className="w-full min-h-[42px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] px-3 text-sm text-[#172033] dark:text-[#F4F5F7]"
              >
                <option value={0}>Modifier only (no extra key)</option>
                {keycodeChoices.map((k) => (
                  <option key={k.keyId} value={k.keycode}>
                    {k.label} (HID 0x{(k.keycode ?? 0).toString(16).toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-2">
              <label
                htmlFor="custom-combo-label"
                className="block text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]"
              >
                3. Display Label (Optional)
              </label>
              <input
                id="custom-combo-label"
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={`Defaults to "${generatedComboLabel}"`}
                className="w-full min-h-[42px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] px-3 text-sm text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-xs text-[#667085] dark:text-[#A0A5B1]">
                Preview:{' '}
                <span className="font-mono font-semibold text-[#2563EB] dark:text-[#6B9BFF]">
                  {customLabel.trim() || generatedComboLabel}
                </span>
              </div>
              <button
                type="submit"
                disabled={comboMods === 0 && primaryKeycode === 0}
                className="min-h-[42px] px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] disabled:opacity-50 text-white dark:text-[#111318] text-sm font-semibold transition-colors duration-150"
              >
                Save Shortcut Mapping
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
