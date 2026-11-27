import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  Laptop,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { PROFILE_TEMPLATES } from '../services/profileStorage';
import type {
  DeviceConfigEntry,
  DeviceProfile,
  PairedBluetoothDevice,
  ProfileTemplateId,
  ProfileTouchpadSettings,
} from '../types/bluetooth';

interface DeviceProfileManagerProps {
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
  onUpdateTouchpad: (patch: Partial<ProfileTouchpadSettings>) => void;
  onExportJson: () => string;
  onImportJson: (jsonText: string) => { ok: boolean; error?: string };
  onNotify: (tone: 'success' | 'info' | 'error', message: string) => void;
}

export function DeviceProfileManager({
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
  onUpdateTouchpad,
  onExportJson,
  onImportJson,
  onNotify,
}: DeviceProfileManagerProps) {
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState<ProfileTemplateId>('custom');
  const [newProfileName, setNewProfileName] = useState('');

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');

  const [showImportBox, setShowImportBox] = useState(false);
  const [importText, setImportText] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProfile(newTemplateId, newProfileName);
    setNewProfileName('');
    setShowCreateBox(false);
    onNotify('success', 'Created and activated new device profile.');
  };

  const handleStartRename = () => {
    if (!activeProfile) return;
    setRenameText(activeProfile.name);
    setIsRenaming(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !renameText.trim()) return;
    onRenameProfile(activeProfile.id, renameText);
    setIsRenaming(false);
    onNotify('success', `Renamed profile to "${renameText.trim()}".`);
  };

  const handleExport = async () => {
    if (!activeProfile) return;
    const json = onExportJson();
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // Clipboard optional in restricted webviews
    }

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bluemouse-${activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // File download optional
    }

    onNotify('success', `Exported "${activeProfile.name}" configuration JSON.`);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onImportJson(importText);
    if (!res.ok) {
      onNotify('error', res.error || 'Invalid profile JSON.');
      return;
    }
    setImportText('');
    setShowImportBox(false);
    onNotify('success', 'Imported profile onto this device.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = onImportJson(text);
    if (!res.ok) {
      onNotify('error', res.error || 'Could not import file.');
    } else {
      setShowImportBox(false);
      onNotify('success', `Imported profile from ${file.name}.`);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Target Bluetooth Device Selector (Strictly isolated by MAC address) */}
      <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7] flex items-center gap-2">
              <Laptop className="h-4 w-4 text-[#2563EB] dark:text-[#6B9BFF]" />
              <span>Target Bluetooth Host Device</span>
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
              Profiles &amp; key mappings are saved per Bluetooth hardware MAC address.
            </p>
          </div>
          {connectedDevice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Live: {connectedDevice.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {allDevices.map((dev) => {
            const isSelected = dev.deviceAddress === activeDeviceAddress;
            const isLive =
              connectedDevice &&
              connectedDevice.address.trim().toUpperCase() === dev.deviceAddress;
            return (
              <button
                key={dev.deviceAddress}
                type="button"
                onClick={() => onSelectDevice(dev.deviceAddress)}
                className={`text-left rounded-xl border p-3.5 transition-colors duration-150 flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38]'
                    : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] hover:border-[#667085] dark:hover:border-[#A0A5B1]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#172033] dark:text-[#F4F5F7] truncate">
                    {dev.deviceName}
                  </p>
                  <p className="text-[11px] font-mono text-[#667085] dark:text-[#A0A5B1] truncate">
                    {dev.deviceAddress} · {dev.profiles.length} profile
                    {dev.profiles.length === 1 ? '' : 's'}
                  </p>
                </div>
                {isLive && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Device Profiles Bar & Management Actions */}
      {activeDeviceEntry && activeProfile && (
        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#172033] dark:text-[#F4F5F7]">
                Profiles for {activeDeviceEntry.deviceName}
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#A0A5B1] mt-0.5">
                Switching profiles applies immediately without disconnecting Bluetooth.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateBox((v) => !v)}
                className="min-h-[38px] px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportBox((v) => !v)}
                className="min-h-[38px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import</span>
              </button>

              <button
                type="button"
                onClick={() => void handleExport()}
                className="min-h-[38px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Profile Switcher Row */}
          <div className="flex flex-wrap items-center gap-2">
            {activeDeviceEntry.profiles.map((prof) => {
              const isActive = prof.id === activeProfile.id;
              const isDefault = prof.id === activeDeviceEntry.defaultProfileId;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    onSwitchProfile(prof.id);
                    onNotify('info', `Switched to profile "${prof.name}".`);
                  }}
                  className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors duration-150 ${
                    isActive
                      ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                      : 'border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] text-[#172033] dark:text-[#F4F5F7] hover:border-[#667085] dark:hover:border-[#A0A5B1]'
                  }`}
                >
                  {isDefault && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/40" />}
                  <span>{prof.name}</span>
                  <span className="text-[10px] font-mono uppercase opacity-75">
                    {prof.templateId}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Profile Actions Row */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#30343D] flex flex-wrap items-center justify-between gap-2.5">
            {isRenaming ? (
              <form onSubmit={handleSaveRename} className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  className="flex-1 min-h-[38px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] px-3 text-xs text-[#172033] dark:text-[#F4F5F7]"
                  placeholder="Profile name"
                />
                <button
                  type="submit"
                  className="min-h-[38px] px-3 rounded-xl bg-[#2563EB] dark:bg-[#6B9BFF] text-white dark:text-[#111318] text-xs font-semibold flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="min-h-[38px] px-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs text-[#667085] dark:text-[#A0A5B1]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDuplicateProfile(activeProfile.id);
                    onNotify('success', `Duplicated "${activeProfile.name}".`);
                  }}
                  className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </button>

                {activeDeviceEntry.defaultProfileId !== activeProfile.id && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetDefaultProfile(activeProfile.id);
                      onNotify('success', `"${activeProfile.name}" set as device default.`);
                    }}
                    className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] flex items-center gap-1.5 transition-colors duration-150"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    <span>Set Default</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onResetProfile(activeProfile.id);
                    onNotify('success', `Reset "${activeProfile.name}" to template defaults.`);
                  }}
                  className="min-h-[36px] px-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5 transition-colors duration-150"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Profile</span>
                </button>

                {activeDeviceEntry.profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProfile(activeProfile.id);
                      onNotify('info', `Deleted profile "${activeProfile.name}".`);
                    }}
                    className="min-h-[36px] px-3 rounded-xl border border-rose-500/35 bg-rose-500/10 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1.5 transition-colors duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Create Profile From Template Drawer */}
          {showCreateBox && (
            <form
              onSubmit={handleCreateSubmit}
              className="rounded-xl border border-[#2563EB]/30 dark:border-[#6B9BFF]/35 bg-[#EFF4FF]/60 dark:bg-[#232A38]/50 p-4 space-y-3"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#6B9BFF]">
                Create New Device Profile Template
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PROFILE_TEMPLATES.map((tpl) => {
                  const selected = newTemplateId === tpl.templateId;
                  return (
                    <button
                      key={tpl.templateId}
                      type="button"
                      onClick={() => setNewTemplateId(tpl.templateId)}
                      className={`text-left rounded-xl border p-3 transition-colors duration-150 ${
                        selected
                          ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38]'
                          : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#172033] dark:text-[#F4F5F7]">
                        {tpl.name}
                      </p>
                      <p className="text-[11px] text-[#667085] dark:text-[#A0A5B1] mt-0.5 leading-snug">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Optional custom profile name..."
                  className="flex-1 min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#111318] px-3 text-xs text-[#172033] dark:text-[#F4F5F7] placeholder:text-[#667085] dark:placeholder:text-[#A0A5B1]"
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] text-white dark:text-[#111318] text-xs font-semibold transition-colors duration-150"
                >
                  Create &amp; Activate
                </button>
              </div>
            </form>
          )}

          {/* Import Profile JSON Box */}
          {showImportBox && (
            <form
              onSubmit={handleImportSubmit}
              className="rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F4F5F7]">
                  Import Profile JSON
                </h3>
                <label className="min-h-[34px] px-3 rounded-lg border border-[#2563EB]/35 dark:border-[#6B9BFF]/35 bg-[#EFF4FF] dark:bg-[#232A38] text-xs font-semibold text-[#2563EB] dark:text-[#6B9BFF] cursor-pointer flex items-center">
                  <span>Choose .json File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => void handleImportFile(e)}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={4}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported BlueMouse profile JSON here..."
                className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] p-3 text-xs font-mono text-[#172033] dark:text-[#F4F5F7]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  className="min-h-[36px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs text-[#667085] dark:text-[#A0A5B1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importText.trim()}
                  className="min-h-[36px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#6B9BFF] dark:hover:bg-[#82ABFF] disabled:opacity-50 text-white dark:text-[#111318] text-xs font-semibold"
                >
                  Import JSON
                </button>
              </div>
            </form>
          )}

          {/* Per-Profile Touchpad Sensitivity & Behavior */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#30343D] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#667085] dark:text-[#A0A5B1]">Pointer Sensitivity</span>
                <span className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                  {activeProfile.touchpad.mouseSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.05}
                value={activeProfile.touchpad.mouseSensitivity}
                onChange={(e) =>
                  onUpdateTouchpad({ mouseSensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#667085] dark:text-[#A0A5B1]">Scroll Speed</span>
                <span className="font-mono text-[#2563EB] dark:text-[#6B9BFF]">
                  {activeProfile.touchpad.scrollSpeed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.05}
                value={activeProfile.touchpad.scrollSpeed}
                onChange={(e) => onUpdateTouchpad({ scrollSpeed: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB] dark:accent-[#6B9BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#667085] dark:text-[#A0A5B1] mb-1">
                Acceleration Curve
              </label>
              <select
                value={activeProfile.touchpad.pointerSpeed}
                onChange={(e) =>
                  onUpdateTouchpad({
                    pointerSpeed: e.target.value as ProfileTouchpadSettings['pointerSpeed'],
                  })
                }
                className="w-full min-h-[38px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-[#F7F8FA] dark:bg-[#111318] px-2.5 text-xs text-[#172033] dark:text-[#F4F5F7]"
              >
                <option value="linear">Linear (1:1 Raw)</option>
                <option value="adaptive">Adaptive Acceleration</option>
                <option value="precision">Precision Control</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateTouchpad({ naturalScrolling: !activeProfile.touchpad.naturalScrolling })
                }
                className={`flex-1 min-h-[38px] rounded-xl border text-xs font-medium transition-colors duration-150 ${
                  activeProfile.touchpad.naturalScrolling
                    ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                    : 'border-[#E5E7EB] dark:border-[#30343D] text-[#667085] dark:text-[#A0A5B1]'
                }`}
              >
                {activeProfile.touchpad.naturalScrolling ? 'Natural Scroll' : 'Classic Scroll'}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateTouchpad({
                    handedness: activeProfile.touchpad.handedness === 'right' ? 'left' : 'right',
                  })
                }
                className="min-h-[38px] px-3 rounded-xl border border-[#E5E7EB] dark:border-[#30343D] text-xs font-medium text-[#172033] dark:text-[#F4F5F7]"
              >
                {activeProfile.touchpad.handedness === 'right' ? 'Right' : 'Left'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
