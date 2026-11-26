import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { bluetoothHidBridge } from '../bridge/bluetoothHidBridge';
import {
  clampInt8,
  createKeyboardDiagnostic,
  createMouseDiagnostic,
  mapLogicalButtonsToPhysical,
} from '../hid/hidReports';
import { mapTextToHidSequence } from '../hid/usQwertyKeymap';
import type {
  BlueMouseSettings,
  HidPacketDiagnostic,
  KeyboardReportPayload,
  MouseReportPayload,
} from '../types/bluetooth';

export type DiagnosticListener = (entry: HidPacketDiagnostic) => void;

class BluetoothHidService {
  private diagnosticListeners = new Set<DiagnosticListener>();
  private currentButtons = 0;
  private activeModifiers = 0;
  private activeKeycodes: number[] = [];

  // Accumulator for high-frequency pointer moves (60Hz cap)
  private pendingDx = 0;
  private pendingDy = 0;
  private pendingWheel = 0;
  private pendingHWheel = 0;
  private flushRafId: number | null = null;
  private lastFlushTime = 0;
  private handedness: 'right' | 'left' = 'right';

  setHandedness(handedness: 'right' | 'left') {
    this.handedness = handedness;
  }

  subscribeDiagnostics(listener: DiagnosticListener): () => void {
    this.diagnosticListeners.add(listener);
    return () => {
      this.diagnosticListeners.delete(listener);
    };
  }

  private emitDiagnostic(diag: HidPacketDiagnostic) {
    this.diagnosticListeners.forEach((cb) => cb(diag));
  }

  async triggerHaptic(enabled: boolean, strength: 'light' | 'medium' | 'heavy' = 'light') {
    if (!enabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const style =
          strength === 'heavy'
            ? ImpactStyle.Heavy
            : strength === 'medium'
              ? ImpactStyle.Medium
              : ImpactStyle.Light;
        await Haptics.impact({ style });
      } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(strength === 'heavy' ? 24 : strength === 'medium' ? 14 : 8);
      }
    } catch {
      // Haptics optional
    }
  }

  queueMouseDelta(
    dx: number,
    dy: number,
    wheel: number,
    hWheel: number,
    settings: BlueMouseSettings
  ) {
    this.handedness = settings.handedness;
    this.pendingDx += dx;
    this.pendingDy += dy;
    this.pendingWheel += wheel;
    this.pendingHWheel += hWheel;

    if (this.flushRafId !== null) return;

    this.flushRafId = requestAnimationFrame(() => {
      this.flushRafId = null;
      const now = performance.now();
      if (now - this.lastFlushTime < 14) {
        this.flushRafId = requestAnimationFrame(() => {
          this.flushRafId = null;
          this.flushMouseAccumulators();
        });
        return;
      }
      this.flushMouseAccumulators();
    });
  }

  private flushMouseAccumulators() {
    this.lastFlushTime = performance.now();
    const dx = clampInt8(this.pendingDx);
    const dy = clampInt8(this.pendingDy);
    const wheel = clampInt8(this.pendingWheel);
    const hWheel = clampInt8(this.pendingHWheel);

    // Preserve sub-pixel fractional remainder
    this.pendingDx -= dx;
    this.pendingDy -= dy;
    this.pendingWheel -= wheel;
    this.pendingHWheel -= hWheel;

    if (dx === 0 && dy === 0 && wheel === 0 && hWheel === 0) return;

    const payload: MouseReportPayload = {
      buttons: mapLogicalButtonsToPhysical(this.currentButtons, this.handedness),
      dx,
      dy,
      wheel,
      hWheel,
    };

    this.emitDiagnostic(createMouseDiagnostic(payload));
    void bluetoothHidBridge.sendMouseReport(payload);
  }

  async setMouseButtonState(
    logicalButtonMask: number,
    pressed: boolean,
    handedness: 'right' | 'left'
  ) {
    this.handedness = handedness;
    if (pressed) {
      this.currentButtons |= logicalButtonMask;
    } else {
      this.currentButtons &= ~logicalButtonMask;
    }
    const payload: MouseReportPayload = {
      buttons: mapLogicalButtonsToPhysical(this.currentButtons, handedness),
      dx: 0,
      dy: 0,
      wheel: 0,
      hWheel: 0,
    };
    this.emitDiagnostic(createMouseDiagnostic(payload));
    await bluetoothHidBridge.sendMouseReport(payload);
  }

  async clickMouseButton(logicalButtonMask: number, handedness: 'right' | 'left') {
    await this.setMouseButtonState(logicalButtonMask, true, handedness);
    await new Promise((r) => setTimeout(r, 24));
    await this.setMouseButtonState(logicalButtonMask, false, handedness);
  }

  async doubleClickLeft(handedness: 'right' | 'left') {
    await this.clickMouseButton(0x01, handedness);
    await new Promise((r) => setTimeout(r, 65));
    await this.clickMouseButton(0x01, handedness);
  }

  async releaseAllMouseButtons(handedness: 'right' | 'left') {
    this.currentButtons = 0;
    const payload: MouseReportPayload = {
      buttons: 0,
      dx: 0,
      dy: 0,
      wheel: 0,
      hWheel: 0,
    };
    this.handedness = handedness;
    this.emitDiagnostic(createMouseDiagnostic(payload));
    await bluetoothHidBridge.sendMouseReport(payload);
  }

  async setKeyboardState(modifiers: number, keycodes: number[]) {
    this.activeModifiers = modifiers & 0xff;
    this.activeKeycodes = keycodes.slice(0, 6);
    const payload: KeyboardReportPayload = {
      modifiers: this.activeModifiers,
      keycodes: this.activeKeycodes,
    };
    this.emitDiagnostic(createKeyboardDiagnostic(payload));
    await bluetoothHidBridge.sendKeyboardReport(payload);
  }

  async pressKey(keycode: number, extraModifiers = 0) {
    const nextMods = this.activeModifiers | extraModifiers;
    const nextKeys = this.activeKeycodes.includes(keycode)
      ? this.activeKeycodes
      : [...this.activeKeycodes, keycode].slice(0, 6);
    await this.setKeyboardState(nextMods, nextKeys);
  }

  async releaseKey(keycode: number, releaseModifiers = 0) {
    const nextMods = this.activeModifiers & ~releaseModifiers;
    const nextKeys = this.activeKeycodes.filter((k) => k !== keycode);
    await this.setKeyboardState(nextMods, nextKeys);
  }

  async sendKeyTap(keycode: number, modifiers = 0) {
    const combinedMods = this.activeModifiers | modifiers;
    await this.setKeyboardState(combinedMods, [keycode]);
    await new Promise((r) => setTimeout(r, 26));
    await this.setKeyboardState(this.activeModifiers, []);
  }

  async sendShortcut(modifiers: number, keycodes: number[]) {
    await this.setKeyboardState(modifiers, keycodes);
    await new Promise((r) => setTimeout(r, 45));
    await this.releaseAllKeys();
  }

  async releaseAllKeys() {
    this.activeModifiers = 0;
    this.activeKeycodes = [];
    const payload: KeyboardReportPayload = { modifiers: 0, keycodes: [] };
    this.emitDiagnostic(createKeyboardDiagnostic(payload));
    await bluetoothHidBridge.sendKeyboardReport(payload);
  }

  async sendTextString(text: string): Promise<{ sentCount: number; unsupportedChars: string[] }> {
    const { mappings, unsupportedChars } = mapTextToHidSequence(text);
    for (const item of mappings) {
      await this.setKeyboardState(item.modifiers, [item.keycode]);
      await new Promise((r) => setTimeout(r, 18));
      await this.setKeyboardState(0, []);
      await new Promise((r) => setTimeout(r, 16));
    }
    await this.releaseAllKeys();
    return { sentCount: mappings.length, unsupportedChars };
  }
}

export const bluetoothService = new BluetoothHidService();
