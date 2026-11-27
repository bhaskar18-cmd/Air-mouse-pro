import { useState } from 'react';
import { MousePointer2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  getActionById,
  MOUSE_CONTROL_SLOTS,
  resolveBindingToAction,
} from '../hid/actionLibrary';
import type { CustomKeyBinding, DeviceProfile, MouseControlSlotId } from '../types/bluetooth';
import { ActionLibraryPicker } from './ActionLibraryPicker';

interface MouseMappingEditorProps {
  profile: DeviceProfile;
  onSaveMouseMapping: (slotId: MouseControlSlotId, binding: CustomKeyBinding | null) => void;
  onNotify: (tone: 'success' | 'info' | 'error', message: string) => void;
}

export function MouseMappingEditor({
  profile,
  onSaveMouseMapping,
  onNotify,
}: MouseMappingEditorProps) {
  const [editingSlotId, setEditingSlotId] = useState<MouseControlSlotId | null>(null);

  const editingMeta = editingSlotId
    ? MOUSE_CONTROL_SLOTS.find((s) => s.slotId === editingSlotId) ?? null
    : null;
  const editingBinding = editingSlotId ? profile.mouseMappings[editingSlotId] : undefined;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-4">
      <div className="flex items-start gap-2.5">
        <MousePointer2 className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF] mt-0.5 shrink-0" />
        <div>
          <h3 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7]">
            Custom Mouse Button &amp; Scroll Mapping
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
            Assign any mouse action, media control, system action, or shortcut to buttons below the
            touchpad. Drag &amp; Drop Lock remains dedicated on the Drag Lock button.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOUSE_CONTROL_SLOTS.map((slot) => {
          const customBinding = profile.mouseMappings[slot.slotId];
          const resolved = customBinding
            ? resolveBindingToAction(customBinding)
            : getActionById(slot.defaultActionId);
          const isCustomized = Boolean(customBinding);

          return (
            <div
              key={slot.slotId}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors duration-150 ${
                isCustomized
                  ? 'border-[#2563EB]/45 dark:border-[#6B9BFF]/45 bg-[#EFF4FF]/60 dark:bg-[#232A38]/70'
                  : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
                    {slot.label}
                  </h4>
                  {isCustomized && (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] dark:text-[#6B9BFF]">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
                  {slot.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E5E7EB] dark:border-[#30343D]">
                <div className="min-w-0">
                  <span className="text-[11px] text-[#667085] dark:text-[#A0A5B1] block">
                    Assigned Action
                  </span>
                  <span className="text-xs font-semibold text-[#2563EB] dark:text-[#6B9BFF] truncate block">
                    {resolved?.label ?? 'Default'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        onSaveMouseMapping(slot.slotId, null);
                        onNotify('success', `Reset ${slot.label} to default action.`);
                      }}
                      className="min-h-[36px] px-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 transition-colors duration-150"
                      title="Reset button to default"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditingSlotId(slot.slotId)}
                    className="min-h-[36px] px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ActionLibraryPicker
        open={editingSlotId !== null}
        targetTitle={editingMeta?.label ?? ''}
        currentBinding={editingBinding}
        onSelectBinding={(binding) => {
          if (!editingSlotId) return;
          onSaveMouseMapping(editingSlotId, binding);
          const resolved = resolveBindingToAction(binding);
          onNotify(
            'success',
            `Mapped ${editingMeta?.label ?? editingSlotId} to ${resolved?.label ?? 'custom action'}.`
          );
        }}
        onResetDefault={() => {
          if (!editingSlotId) return;
          onSaveMouseMapping(editingSlotId, null);
          onNotify('success', `Reset ${editingMeta?.label ?? editingSlotId} to default.`);
        }}
        onClose={() => setEditingSlotId(null)}
      />
    </div>
  );
}
