import { useMemo, useState } from 'react';
import { Keyboard, MousePointer2, Search, SlidersHorizontal } from 'lucide-react';
import { DeviceProfileManager } from '../components/DeviceProfileManager';
import { KeyboardMappingEditor } from '../components/KeyboardMappingEditor';
import { MouseMappingEditor } from '../components/MouseMappingEditor';
import {
  MOUSE_CONTROL_SLOTS,
  resolveBindingToAction,
  searchActions,
} from '../hid/actionLibrary';
import { getKeyDefinitionById } from '../hid/usQwertyKeymap';
import type {
  ActionCategory,
  CustomKeyBinding,
  DeviceConfigEntry,
  DeviceProfile,
  MouseControlSlotId,
  PairedBluetoothDevice,
  ProfileTemplateId,
  ProfileTouchpadSettings,
} from '../types/bluetooth';

interface ProfilesScreenProps {
  connectedDevice: PairedBluetoothDevice | null;
  allDevices: DeviceConfigEntry[];
  activeDeviceAddress: string;
  activeDeviceEntry: DeviceConfigEntry | null;
  activeProfile: DeviceProfile | null;
  onSelectDevice: (address: string) => void;
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: (templateId: ProfileTemplateId, name?: string) => void;
  onRenameProfile: (profileId: string, newName: string) => void;
  onDuplicateProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onSetDefaultProfile: (profileId: string) => void;
  onResetProfile: (profileId: string) => void;
  onSetKeyMapping: (keyId: string, binding: CustomKeyBinding | null) => void;
  onSetMouseMapping: (slotId: MouseControlSlotId, binding: CustomKeyBinding | null) => void;
  onUpdateTouchpad: (patch: Partial<ProfileTouchpadSettings>) => void;
  onExportJson: () => string;
  onImportJson: (jsonText: string) => { ok: boolean; error?: string };
  onNotify: (tone: 'success' | 'info' | 'error', message: string) => void;
}

export function ProfilesScreen({
  connectedDevice,
  allDevices,
  activeDeviceAddress,
  activeDeviceEntry,
  activeProfile,
  onSelectDevice,
  onSwitchProfile,
  onCreateProfile,
  onRenameProfile,
  onDuplicateProfile,
  onDeleteProfile,
  onSetDefaultProfile,
  onResetProfile,
  onSetKeyMapping,
  onSetMouseMapping,
  onUpdateTouchpad,
  onExportJson,
  onImportJson,
  onNotify,
}: ProfilesScreenProps) {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse' | 'library'>('keyboard');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<ActionCategory | 'all'>('all');

  const libraryPreview = useMemo(
    () => searchActions(librarySearch, libraryCategory),
    [librarySearch, libraryCategory]
  );

  const keyCount = activeProfile ? Object.keys(activeProfile.keyMappings).length : 0;
  const mouseCount = activeProfile ? Object.keys(activeProfile.mouseMappings).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#172033] dark:text-[#F4F5F7]">
            Custom Controls &amp; Device Profiles
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#A0A5B1] mt-0.5">
            Customize keyboard keys, mouse buttons, shortcuts, and device-specific profiles.
          </p>
        </div>

        {activeProfile && activeDeviceEntry && (
          <p className="text-xs text-[#667085] dark:text-[#A0A5B1]">
            Active:{' '}
            <span className="font-semibold text-[#2563EB] dark:text-[#6B9BFF]">
              {activeDeviceEntry.deviceName} · {activeProfile.name}
            </span>{' '}
            <span className="font-mono text-[11px]">
              · {keyCount} keys · {mouseCount} mouse
            </span>
          </p>
        )}
      </div>

      {/* Device & Profile Management */}
      <DeviceProfileManager
        connectedDevice={connectedDevice}
        allDevices={allDevices}
        activeDeviceAddress={activeDeviceAddress}
        activeDeviceEntry={activeDeviceEntry}
        activeProfile={activeProfile}
        onSelectDevice={onSelectDevice}
        onSwitchProfile={onSwitchProfile}
        onCreateProfile={onCreateProfile}
        onRenameProfile={onRenameProfile}
        onDuplicateProfile={onDuplicateProfile}
        onDeleteProfile={onDeleteProfile}
        onSetDefaultProfile={onSetDefaultProfile}
        onResetProfile={onResetProfile}
        onUpdateTouchpad={onUpdateTouchpad}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
        onNotify={onNotify}
      />

      {/* Editor Sub-Navigation Tabs */}
      {activeProfile && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('keyboard')}
              className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border whitespace-nowrap transition-colors duration-150 ${
                activeTab === 'keyboard'
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                  : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
              }`}
            >
              <Keyboard className="h-4 w-4" />
              <span>Keyboard Key Mapping ({keyCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mouse')}
              className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border whitespace-nowrap transition-colors duration-150 ${
                activeTab === 'mouse'
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                  : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
              }`}
            >
              <MousePointer2 className="h-4 w-4" />
              <span>Mouse Button Mapping ({mouseCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border whitespace-nowrap transition-colors duration-150 ${
                activeTab === 'library'
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#6B9BFF] dark:bg-[#6B9BFF] dark:text-[#111318]'
                  : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1] hover:text-[#172033] dark:hover:text-[#F4F5F7]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Action Library Reference</span>
            </button>
          </div>

          {activeTab === 'keyboard' && (
            <KeyboardMappingEditor
              profile={activeProfile}
              onSaveKeyMapping={onSetKeyMapping}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'mouse' && (
            <MouseMappingEditor
              profile={activeProfile}
              onSaveMouseMapping={onSetMouseMapping}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'library' && (
            <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7]">
                    Supported HID Action Library
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
                    All actions map strictly to native Android Bluetooth HID Mouse (ID 1), Keyboard
                    (ID 2), and Consumer Media (ID 3) reports.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 text-[#667085] dark:text-[#A0A5B1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search HID actions..."
                    className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] text-xs text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'shortcut', 'media', 'mouse', 'system', 'keyboard'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLibraryCategory(cat)}
                      className={`min-h-[34px] px-3 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors duration-150 ${
                        libraryCategory === cat
                          ? 'bg-[#2563EB] text-white dark:bg-[#6B9BFF] dark:text-[#111318]'
                          : 'bg-[#ECEEF2] dark:bg-[#222630] text-[#667085] dark:text-[#A0A5B1]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {libraryPreview.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-[#667085] dark:text-[#A0A5B1] truncate">
                        {action.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                      <span className="uppercase text-[#667085] dark:text-[#A0A5B1]">
                        {action.osScope}
                      </span>
                      <span className="font-semibold text-[#2563EB] dark:text-[#6B9BFF]">
                        {action.shortLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Profile Mappings Overview Preview */}
          <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7]">
              Active Mapping Preview ({activeProfile.name})
            </h3>
            {keyCount === 0 && mouseCount === 0 ? (
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1]">
                No key or mouse overrides configured in this profile yet. All controls use their
                standard USB HID defaults.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#667085] dark:text-[#A0A5B1] mb-2">
                    Mouse Overrides ({mouseCount})
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(activeProfile.mouseMappings).map(([slotId, binding]) => {
                      if (!binding) return null;
                      const slot = MOUSE_CONTROL_SLOTS.find((s) => s.slotId === slotId);
                      const act = resolveBindingToAction(binding);
                      return (
                        <div
                          key={slotId}
                          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] dark:border-[#30343D] px-3 py-2"
                        >
                          <span className="font-medium text-[#172033] dark:text-[#F4F5F7]">
                            {slot?.label ?? slotId}
                          </span>
                          <span className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                            {act?.label ?? 'Custom'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-[#667085] dark:text-[#A0A5B1] mb-2">
                    Keyboard Overrides ({keyCount})
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(activeProfile.keyMappings).map(([keyId, binding]) => {
                      const def = getKeyDefinitionById(keyId);
                      const act = resolveBindingToAction(binding);
                      return (
                        <div
                          key={keyId}
                          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] dark:border-[#30343D] px-3 py-2"
                        >
                          <span className="font-mono font-semibold text-[#172033] dark:text-[#F4F5F7]">
                            {def?.label ?? keyId}
                          </span>
                          <span className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                            {act?.label ?? 'Custom'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
