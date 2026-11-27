import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { bluetoothHidBridge } from '../bridge/bluetoothHidBridge';
import {
  clampInt8,
  createConsumerDiagnostic,
  createKeyboardDiagnostic,
  createMouseDiagnostic,
  mapLogicalButtonsToPhysical,
} from '../hid/hidReports';
import { mapTextToHidSequence } from '../hid/usQwertyKeymap';
import type {
  BlueMouseSettings,
  ConsumerReportPayload,
  HidActionDefinition,
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
  private activeConsumerUsage = 0;

  private static readonly MIN_MOUSE_INTERVAL_MS = 8;

  // Coalesced accumulator + bridge backpressure for smooth low-latency pointer delivery
  private pendingDx = 0;
  private pendingDy = 0;
  private pendingWheel = 0;
  private pendingHWheel = 0;
  private mouseFlushTimerId: number | null = null;
  private mouseSendInFlight = false;
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
    this.scheduleMouseFlush();
  }

  private hasFlushableMouseDelta(): boolean {
    return (
      Math.abs(this.pendingDx) >= 0.5 ||
      Math.abs(this.pendingDy) >= 0.5 ||
      Math.abs(this.pendingWheel) >= 0.5 ||
      Math.abs(this.pendingHWheel) >= 0.5
    );
  }

  private scheduleMouseFlush() {
    if (this.mouseSendInFlight || !this.hasFlushableMouseDelta()) {
      return;
    }

    const elapsed = performance.now() - this.lastFlushTime;
    if (elapsed >= BluetoothHidService.MIN_MOUSE_INTERVAL_MS) {
      if (this.mouseFlushTimerId !== null) {
        window.clearTimeout(this.mouseFlushTimerId);
        this.mouseFlushTimerId = null;
      }
      this.flushMouseAccumulators();
      return;
    }

    if (this.mouseFlushTimerId === null) {
      const delay = Math.max(1, Math.ceil(BluetoothHidService.MIN_MOUSE_INTERVAL_MS - elapsed));
      this.mouseFlushTimerId = window.setTimeout(() => {
        this.mouseFlushTimerId = null;
        this.flushMouseAccumulators();
      }, delay);
    }
  }

  private flushMouseAccumulators() {
    if (this.mouseSendInFlight) return;

    const dx = clampInt8(this.pendingDx);
    const dy = clampInt8(this.pendingDy);
    const wheel = clampInt8(this.pendingWheel);
    const hWheel = clampInt8(this.pendingHWheel);

    if (dx === 0 && dy === 0 && wheel === 0 && hWheel === 0) return;

    // Preserve sub-pixel fractional remainder
    this.pendingDx -= dx;
    this.pendingDy -= dy;
    this.pendingWheel -= wheel;
    this.pendingHWheel -= hWheel;

    this.lastFlushTime = performance.now();
    this.mouseSendInFlight = true;

    const payload: MouseReportPayload = {
      buttons: mapLogicalButtonsToPhysical(this.currentButtons, this.handedness),
      dx,
      dy,
      wheel,
      hWheel,
    };

    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createMouseDiagnostic(payload));
    }

    void bluetoothHidBridge.sendMouseReport(payload).finally(() => {
      this.mouseSendInFlight = false;
      this.scheduleMouseFlush();
    });
  }

  getActiveButtons(): number {
    return this.currentButtons;
  }

  async setMouseButtonState(
    logicalButtonMask: number,
    pressed: boolean,
    handedness: 'right' | 'left'
  ) {
    const nextButtons = pressed
      ? this.currentButtons | logicalButtonMask
      : this.currentButtons & ~logicalButtonMask;

    if (nextButtons === this.currentButtons && this.handedness === handedness) {
      return;
    }

    this.handedness = handedness;
    this.currentButtons = nextButtons;
    const payload: MouseReportPayload = {
      buttons: mapLogicalButtonsToPhysical(this.currentButtons, handedness),
      dx: 0,
      dy: 0,
      wheel: 0,
      hWheel: 0,
    };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createMouseDiagnostic(payload));
    }
    await bluetoothHidBridge.sendMouseReport(payload);
  }

  async clickMouseButton(logicalButtonMask: number, handedness: 'right' | 'left') {
    await this.setMouseButtonState(logicalButtonMask, true, handedness);
    await new Promise((r) => setTimeout(r, 28));
    await this.setMouseButtonState(logicalButtonMask, false, handedness);
  }

  async doubleClickLeft(handedness: 'right' | 'left') {
    if (this.currentButtons & 0x01) {
      await this.setMouseButtonState(0x01, false, handedness);
      await new Promise((r) => setTimeout(r, 25));
    }
    await this.clickMouseButton(0x01, handedness);
    await new Promise((r) => setTimeout(r, 65));
    await this.clickMouseButton(0x01, handedness);
  }

  async sendMouseScrollStep(wheel: number, hWheel = 0, handedness: 'right' | 'left' = this.handedness) {
    const payload: MouseReportPayload = {
      buttons: mapLogicalButtonsToPhysical(this.currentButtons, handedness),
      dx: 0,
      dy: 0,
      wheel: clampInt8(wheel),
      hWheel: clampInt8(hWheel),
    };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createMouseDiagnostic(payload));
    }
    await bluetoothHidBridge.sendMouseReport(payload);
  }

  async releaseAllMouseButtons(handedness: 'right' | 'left') {
    if (this.mouseFlushTimerId !== null) {
      window.clearTimeout(this.mouseFlushTimerId);
      this.mouseFlushTimerId = null;
    }
    this.pendingDx = 0;
    this.pendingDy = 0;
    this.pendingWheel = 0;
    this.pendingHWheel = 0;
    this.handedness = handedness;

    if (this.currentButtons === 0) {
      return;
    }

    this.currentButtons = 0;
    const payload: MouseReportPayload = {
      buttons: 0,
      dx: 0,
      dy: 0,
      wheel: 0,
      hWheel: 0,
    };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createMouseDiagnostic(payload));
    }
    await bluetoothHidBridge.sendMouseReport(payload);
  }

  async setKeyboardState(modifiers: number, keycodes: number[]) {
    this.activeModifiers = modifiers & 0xff;
    this.activeKeycodes = keycodes.slice(0, 6);
    const payload: KeyboardReportPayload = {
      modifiers: this.activeModifiers,
      keycodes: this.activeKeycodes,
    };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createKeyboardDiagnostic(payload));
    }
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

  async setConsumerState(usageCode: number) {
    const clean = Math.max(0, Math.min(0x03ff, Math.round(usageCode)));
    this.activeConsumerUsage = clean;
    const payload: ConsumerReportPayload = { usageCode: clean };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createConsumerDiagnostic(payload));
    }
    await bluetoothHidBridge.sendConsumerReport(payload);
  }

  async sendConsumerTap(usageCode: number) {
    await this.setConsumerState(usageCode);
    await new Promise((r) => setTimeout(r, 32));
    await this.setConsumerState(0);
  }

  async releaseAllKeys() {
    this.activeModifiers = 0;
    this.activeKeycodes = [];
    const payload: KeyboardReportPayload = { modifiers: 0, keycodes: [] };
    if (this.diagnosticListeners.size > 0) {
      this.emitDiagnostic(createKeyboardDiagnostic(payload));
    }
    await bluetoothHidBridge.sendKeyboardReport(payload);

    if (this.activeConsumerUsage !== 0) {
      await this.setConsumerState(0);
    }
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

  async executeActionPress(
    action: HidActionDefinition,
    handedness: 'right' | 'left',
    extraModifiers = 0,
    onToggleDragLock?: () => void
  ) {
    switch (action.actionType) {
      case 'key_tap':
        if (typeof action.keycode === 'number') {
          await this.pressKey(action.keycode, extraModifiers | (action.modifiers ?? 0));
        }
        break;
      case 'key_combo':
        await this.setKeyboardState(
          extraModifiers | (action.modifiers ?? 0),
          (action.keycodes ?? []).slice(0, 6)
        );
        break;
      case 'mouse_click':
        if (typeof action.mouseButtonMask === 'number') {
          await this.setMouseButtonState(action.mouseButtonMask, true, handedness);
        }
        break;
      case 'mouse_double_click':
        await this.doubleClickLeft(handedness);
        break;
      case 'mouse_scroll':
        await this.sendMouseScrollStep(action.wheelDelta ?? 0, action.hWheelDelta ?? 0, handedness);
        break;
      case 'consumer_tap':
        if (typeof action.consumerUsage === 'number') {
          await this.setConsumerState(action.consumerUsage);
        }
        break;
      case 'drag_lock_toggle':
        onToggleDragLock?.();
        break;
      case 'noop':
      default:
        break;
    }
  }

  async executeActionRelease(
    action: HidActionDefinition,
    handedness: 'right' | 'left',
    clearModifiers = 0
  ) {
    switch (action.actionType) {
      case 'key_tap':
        if (typeof action.keycode === 'number') {
          await this.releaseKey(action.keycode, clearModifiers | (action.modifiers ?? 0));
        }
        break;
      case 'key_combo':
        await this.releaseAllKeys();
        break;
      case 'mouse_click':
        if (typeof action.mouseButtonMask === 'number') {
          await this.setMouseButtonState(action.mouseButtonMask, false, handedness);
        }
        break;
      case 'consumer_tap':
        await this.setConsumerState(0);
        break;
      case 'mouse_double_click':
      case 'mouse_scroll':
      case 'drag_lock_toggle':
      case 'noop':
      default:
        break;
    }
  }

  async executeActionTap(
    action: HidActionDefinition,
    handedness: 'right' | 'left',
    onToggleDragLock?: () => void
  ) {
    switch (action.actionType) {
      case 'key_tap':
        if (typeof action.keycode === 'number') {
          await this.sendKeyTap(action.keycode, action.modifiers ?? 0);
        }
        break;
      case 'key_combo':
        await this.sendShortcut(action.modifiers ?? 0, action.keycodes ?? []);
        break;
      case 'mouse_click':
        if (typeof action.mouseButtonMask === 'number') {
          await this.clickMouseButton(action.mouseButtonMask, handedness);
        }
        break;
      case 'mouse_double_click':
        await this.doubleClickLeft(handedness);
        break;
      case 'mouse_scroll':
        await this.sendMouseScrollStep(action.wheelDelta ?? 0, action.hWheelDelta ?? 0, handedness);
        break;
      case 'consumer_tap':
        if (typeof action.consumerUsage === 'number') {
          await this.sendConsumerTap(action.consumerUsage);
        }
        break;
      case 'drag_lock_toggle':
        onToggleDragLock?.();
        break;
      case 'noop':
      default:
        break;
    }
  }
}

export const bluetoothService = new BluetoothHidService();

