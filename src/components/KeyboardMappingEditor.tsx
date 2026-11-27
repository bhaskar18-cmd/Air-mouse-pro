import { useMemo, useState } from 'react';
import { Keyboard, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { resolveBindingToAction } from '../hid/actionLibrary';
import {
  CUSTOMIZABLE_KEYS,
  type CustomizableKeyDefinition,
  type CustomizableKeyGroup,
  getKeyDefinitionById,
} from '../hid/usQwertyKeymap';
import type { CustomKeyBinding, DeviceProfile } from '../types/bluetooth';
import { ActionLibraryPicker } from './ActionLibraryPicker';

interface KeyboardMappingEditorProps {
  profile: DeviceProfile;
  onSaveKeyMapping: (keyId: string, binding: CustomKeyBinding | null) => void;
  onNotify: (tone: 'success' | 'info' | 'error', message: string) => void;
}

const KEY_GROUP_TABS: Array<{ id: CustomizableKeyGroup | 'all'; label: string }> = [
  { id: 'all', label: 'All Keys' },
  { id: 'function', label: 'F1–F12' },
  { id: 'letters', label: 'A–Z' },
  { id: 'numbers', label: '0–9' },
  { id: 'modifiers', label: 'Modifiers' },
  { id: 'editing', label: 'Editing' },
  { id: 'navigation', label: 'Nav & Arrows' },
  { id: 'symbols', label: 'Symbols' },
];

export function KeyboardMappingEditor({
  profile,
  onSaveKeyMapping,
  onNotify,
}: KeyboardMappingEditorProps) {
  const [groupFilter, setGroupFilter] = useState<CustomizableKeyGroup | 'all'>('all');
  const [keySearch, setKeySearch] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('key_f1');
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleKeys = useMemo(() => {
    const q = keySearch.trim().toLowerCase();
    return CUSTOMIZABLE_KEYS.filter((k) => {
      if (groupFilter !== 'all' && k.group !== groupFilter) return false;
      if (!q) return true;
      return k.label.toLowerCase().includes(q) || k.shortLabel.toLowerCase().includes(q);
    });
  }, [groupFilter, keySearch]);

  const selectedKey: CustomizableKeyDefinition | undefined = getKeyDefinitionById(selectedKeyId);
  const currentBinding = profile.keyMappings[selectedKeyId];
  const resolvedAction = currentBinding ? resolveBindingToAction(currentBinding) : null;

  const customMappedKeys = useMemo(
    () =>
      Object.entries(profile.keyMappings)
        .map(([keyId, binding]) => ({
          keyDef: getKeyDefinitionById(keyId),
          keyId,
          action: resolveBindingToAction(binding),
        }))
        .filter((item) => item.action !== null),
    [profile.keyMappings]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Selected Key Mapping Inspector */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 rounded-xl border border-[#2563EB]/30 dark:border-[#6B9BFF]/35 bg-[#EFF4FF] dark:bg-[#232A38] flex items-center justify-center font-mono text-sm font-bold text-[#2563EB] dark:text-[#6B9BFF] shrink-0">
            {selectedKey?.shortLabel ?? selectedKeyId}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#A0A5B1]">
              Selected Key
            </p>
            <h3 className="text-lg font-semibold text-[#172033] dark:text-[#F4F5F7]">
              {selectedKey?.label ?? selectedKeyId}
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
              Assigned Action:{' '}
              <span
                className={
                  resolvedAction
                    ? 'font-semibold text-[#2563EB] dark:text-[#6B9BFF]'
                    : 'font-medium text-[#667085] dark:text-[#A0A5B1]'
                }
              >
                {resolvedAction
                  ? `${resolvedAction.label} (${resolvedAction.shortLabel})`
                  : `Standard HID Key (${selectedKey?.shortLabel ?? 'Default'})`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-h-[42px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors duration-150"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Assign Action / Shortcut</span>
          </button>

          {currentBinding && (
            <button
              type="button"
              onClick={() => {
                onSaveKeyMapping(selectedKeyId, null);
                onNotify('success', `Reset ${selectedKey?.label ?? selectedKeyId} to default key.`);
              }}
              className="min-h-[42px] px-3.5 rounded-xl border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 transition-colors duration-150"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
              Select Any Keyboard Key to Customize ({CUSTOMIZABLE_KEYS.length} keys)
            </h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-[#667085] dark:text-[#A0A5B1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={keySearch}
              onChange={(e) => setKeySearch(e.target.value)}
              placeholder="Filter keys..."
              className="w-full min-h-[38px] pl-8 pr-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] text-xs text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#6B9BFF]"
            />
          </div>
        </div>

        {/* Group Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {KEY_GROUP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGroupFilter(tab.id)}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                groupFilter === tab.id
                  ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                  : 'bg-[#ECEEF2] dark:bg-[#222630] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visual Interactive Key Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {visibleKeys.map((keyDef) => {
            const binding = profile.keyMappings[keyDef.keyId];
            const mapped = binding ? resolveBindingToAction(binding) : null;
            const isSelected = keyDef.keyId === selectedKeyId;
            return (
              <button
                key={keyDef.keyId}
                type="button"
                onClick={() => {
                  setSelectedKeyId(keyDef.keyId);
                  setPickerOpen(true);
                }}
                className={`min-h-[54px] rounded-xl border px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 text-center ${
                  isSelected
                    ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38]'
                    : mapped
                      ? 'border-[#2563EB]/40 dark:border-[#6B9BFF]/45 bg-[#EFF4FF]/60 dark:bg-[#232A38]/70 hover:bg-[#EFF4FF] dark:hover:bg-[#232A38]'
                      : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#222630] hover:border-[#667085] dark:hover:border-[#A0A5B1]'
                }`}
              >
                <span className="text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]">
                  {keyDef.shortLabel}
                </span>
                <span
                  className={`text-[10px] truncate max-w-full ${
                    mapped
                      ? 'font-mono font-semibold text-[#2563EB] dark:text-[#6B9BFF]'
                      : 'text-[#667085] dark:text-[#A0A5B1]'
                  }`}
                >
                  {mapped ? mapped.shortLabel : 'Default'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Custom Key Mappings Summary */}
      {customMappedKeys.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#A0A5B1]">
            Active Custom Key Mappings ({customMappedKeys.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {customMappedKeys.map(({ keyId, keyDef, action }) => (
              <div
                key={keyId}
                className="inline-flex items-center gap-2 rounded-xl border border-[#2563EB]/30 dark:border-[#6B9BFF]/35 bg-[#EFF4FF] dark:bg-[#232A38] px-3 py-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKeyId(keyId);
                    setPickerOpen(true);
                  }}
                  className="font-medium text-[#172033] dark:text-[#F4F5F7] hover:underline"
                >
                  <span className="font-mono font-bold text-[#2563EB] dark:text-[#6B9BFF]">
                    {keyDef?.shortLabel ?? keyId}
                  </span>{' '}
                  → {action?.label}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveKeyMapping(keyId, null);
                    onNotify('success', `Reset ${keyDef?.shortLabel ?? keyId} to default.`);
                  }}
                  className="text-[#667085] dark:text-[#A0A5B1] hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150"
                  aria-label={`Reset ${keyDef?.label ?? keyId}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ActionLibraryPicker
        open={pickerOpen}
        targetTitle={selectedKey?.label ?? selectedKeyId}
        currentBinding={currentBinding}
        onSelectBinding={(binding) => {
          onSaveKeyMapping(selectedKeyId, binding);
          const resolved = resolveBindingToAction(binding);
          onNotify(
            'success',
            `Mapped ${selectedKey?.shortLabel ?? selectedKeyId} to ${resolved?.label ?? 'custom action'}.`
          );
        }}
        onResetDefault={() => {
          onSaveKeyMapping(selectedKeyId, null);
          onNotify('success', `Reset ${selectedKey?.label ?? selectedKeyId} to default key.`);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
