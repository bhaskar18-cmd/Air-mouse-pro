import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  GripHorizontal,
  Lock,
} from 'lucide-react';
import { resolveBindingToAction } from '../hid/actionLibrary';
import {
  CONSUMER_USAGE,
  MOUSE_BUTTON_LEFT,
  MOUSE_BUTTON_MIDDLE,
  MOUSE_BUTTON_RIGHT,
} from '../hid/hidReports';
import { bluetoothService } from '../services/bluetoothService';
import type {
  BlueMouseSettings,
  DeviceProfile,
  MouseControlSlotId,
} from '../types/bluetooth';

interface MouseButtonsBarProps {
  settings: BlueMouseSettings;
  isConnected: boolean;
  dragLockActive: boolean;
  onToggleDragLock: () => void;
  onSetDragLock: (active: boolean) => void;
  onGestureHint: (hint: string) => void;
  activeProfile: DeviceProfile | null;
  compact?: boolean;
}

type PrimarySlot = 'left_click' | 'middle_click' | 'right_click';

export function MouseButtonsBar({
  settings,
  isConnected,
  dragLockActive,
  onToggleDragLock,
  onSetDragLock,
  onGestureHint,
  activeProfile,
  compact = false,
}: MouseButtonsBarProps) {
  const [pressedPrimary, setPressedPrimary] = useState<Record<PrimarySlot, boolean>>({
    left_click: false,
    middle_click: false,
    right_click: false,
  });
  const [showAuxRow, setShowAuxRow] = useState(false);

  const activePointersRef = useRef<Record<PrimarySlot, number | null>>({
    left_click: null,
    middle_click: null,
    right_click: null,
  });
  const doubleClickBusyRef = useRef(false);
  const prevHandednessRef = useRef(settings.handedness);

  const getCustomAction = useCallback(
    (slotId: MouseControlSlotId) => {
      const binding = activeProfile?.mouseMappings?.[slotId];
      return binding ? resolveBindingToAction(binding) : null;
    },
    [activeProfile]
  );

  const releaseAllButtonsAndState = useCallback(
    async (handedness: BlueMouseSettings['handedness']) => {
      activePointersRef.current = {
        left_click: null,
        middle_click: null,
        right_click: null,
      };
      setPressedPrimary({
        left_click: false,
        middle_click: false,
        right_click: false,
      });
      onSetDragLock(false);
      onGestureHint('Ready');
      await bluetoothService.releaseAllMouseButtons(handedness);
    },
    [onGestureHint, onSetDragLock]
  );

  useEffect(() => {
    if (!isConnected) {
      void releaseAllButtonsAndState(settings.handedness);
    }
  }, [isConnected, releaseAllButtonsAndState, settings.handedness]);

  useEffect(() => {
    if (prevHandednessRef.current !== settings.handedness) {
      const previousHandedness = prevHandednessRef.current;
      prevHandednessRef.current = settings.handedness;
      void releaseAllButtonsAndState(previousHandedness);
    }
  }, [releaseAllButtonsAndState, settings.handedness]);

  useEffect(() => {
    const handleWindowRelease = () => {
      if (
        bluetoothService.getActiveButtons() !== 0 ||
        activePointersRef.current.left_click !== null ||
        activePointersRef.current.middle_click !== null ||
        activePointersRef.current.right_click !== null
      ) {
        void releaseAllButtonsAndState(settings.handedness);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWindowRelease();
      }
    };

    window.addEventListener('blur', handleWindowRelease);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleWindowRelease);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void bluetoothService.releaseAllMouseButtons(settings.handedness);
    };
  }, [releaseAllButtonsAndState, settings.handedness]);

  const handlePrimaryPointerDown = async (
    slot: PrimarySlot,
    defaultMask: number,
    defaultHint: string,
    hapticStrength: 'light' | 'medium',
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (activePointersRef.current[slot] !== null) return;
    activePointersRef.current[slot] = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore environments without pointer capture
    }

    setPressedPrimary((prev) => ({ ...prev, [slot]: true }));
    await bluetoothService.triggerHaptic(settings.hapticFeedback, hapticStrength);

    const customAction = getCustomAction(slot);
    if (customAction) {
      onGestureHint(customAction.shortLabel);
      await bluetoothService.executeActionPress(
        customAction,
        settings.handedness,
        0,
        onToggleDragLock
      );
      return;
    }

    onGestureHint(defaultHint);
    await bluetoothService.setMouseButtonState(defaultMask, true, settings.handedness);
  };

  const handlePrimaryPointerUp = async (
    slot: PrimarySlot,
    defaultMask: number,
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (activePointersRef.current[slot] !== e.pointerId) return;
    activePointersRef.current[slot] = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore environments without pointer capture
    }

    setPressedPrimary((prev) => ({ ...prev, [slot]: false }));

    const customAction = getCustomAction(slot);
    if (customAction) {
      await bluetoothService.executeActionRelease(customAction, settings.handedness);
      onGestureHint(dragLockActive ? 'Drag lock active' : 'Ready');
      return;
    }

    if (slot === 'left_click' && dragLockActive) {
      onGestureHint('Drag lock active');
      return;
    }

    await bluetoothService.setMouseButtonState(defaultMask, false, settings.handedness);
    onGestureHint(dragLockActive ? 'Drag lock active' : 'Ready');
  };

  const handleDoubleClick = async () => {
    if (doubleClickBusyRef.current) return;
    doubleClickBusyRef.current = true;
    try {
      await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
      const customAction = getCustomAction('double_click');
      if (customAction) {
        onGestureHint(customAction.shortLabel);
        await bluetoothService.executeActionTap(
          customAction,
          settings.handedness,
          onToggleDragLock
        );
        onGestureHint(dragLockActive ? 'Drag lock active' : 'Ready');
        return;
      }

      if (dragLockActive) {
        onSetDragLock(false);
      }
      onGestureHint('Double click');
      await bluetoothService.doubleClickLeft(settings.handedness);
      onGestureHint('Ready');
    } finally {
      doubleClickBusyRef.current = false;
    }
  };

  const handleAuxSlotTap = async (slot: 'aux_back' | 'aux_forward' | 'scroll_up' | 'scroll_down') => {
    await bluetoothService.triggerHaptic(settings.hapticFeedback, 'light');
    const customAction = getCustomAction(slot);
    if (customAction) {
      onGestureHint(customAction.shortLabel);
      await bluetoothService.executeActionTap(
        customAction,
        settings.handedness,
        onToggleDragLock
      );
      return;
    }

    if (slot === 'aux_back') {
      onGestureHint('Browser Back');
      await bluetoothService.sendConsumerTap(CONSUMER_USAGE.AC_BACK);
    } else if (slot === 'aux_forward') {
      onGestureHint('Browser Forward');
      await bluetoothService.sendConsumerTap(CONSUMER_USAGE.AC_FORWARD);
    } else if (slot === 'scroll_up') {
      const delta = settings.naturalScrolling ? -3 : 3;
      onGestureHint('Scroll Up');
      await bluetoothService.sendMouseScrollStep(delta, 0, settings.handedness);
    } else {
      const delta = settings.naturalScrolling ? 3 : -3;
      onGestureHint('Scroll Down');
      await bluetoothService.sendMouseScrollStep(delta, 0, settings.handedness);
    }
  };

  const leftCustom = getCustomAction('left_click');
  const middleCustom = getCustomAction('middle_click');
  const rightCustom = getCustomAction('right_click');
  const doubleCustom = getCustomAction('double_click');
  const auxBackCustom = getCustomAction('aux_back');
  const auxForwardCustom = getCustomAction('aux_forward');
  const scrollUpCustom = getCustomAction('scroll_up');
  const scrollDownCustom = getCustomAction('scroll_down');

  const hasAuxCustom = Boolean(
    auxBackCustom || auxForwardCustom || scrollUpCustom || scrollDownCustom
  );

  const primaryLabel = leftCustom
    ? leftCustom.shortLabel
    : settings.handedness === 'left'
      ? 'Right (Primary)'
      : 'Left Click';
  const middleLabel = middleCustom ? middleCustom.shortLabel : 'Middle Click';
  const rightLabel = rightCustom
    ? rightCustom.shortLabel
    : settings.handedness === 'left'
      ? 'Left (Secondary)'
      : 'Right Click';

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Primary Physical-Style Click Row: Left · Middle · Right */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onPointerDown={(e) =>
            void handlePrimaryPointerDown('left_click', MOUSE_BUTTON_LEFT, 'Left held', 'light', e)
          }
          onPointerUp={(e) => void handlePrimaryPointerUp('left_click', MOUSE_BUTTON_LEFT, e)}
          onPointerCancel={(e) => void handlePrimaryPointerUp('left_click', MOUSE_BUTTON_LEFT, e)}
          onClick={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={`touch-surface min-h-[52px] rounded-xl border text-xs sm:text-sm font-semibold transition-colors duration-150 flex flex-col items-center justify-center px-2 ${
            pressedPrimary.left_click || (!leftCustom && dragLockActive)
              ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
              : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-[#172033] dark:text-[#F4F5F7]'
          }`}
        >
          <span>{primaryLabel}</span>
          {leftCustom && (
            <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#6B9BFF]">Custom</span>
          )}
        </button>

        <button
          type="button"
          onPointerDown={(e) =>
            void handlePrimaryPointerDown(
              'middle_click',
              MOUSE_BUTTON_MIDDLE,
              'Middle held',
              'light',
              e
            )
          }
          onPointerUp={(e) =>
            void handlePrimaryPointerUp('middle_click', MOUSE_BUTTON_MIDDLE, e)
          }
          onPointerCancel={(e) =>
            void handlePrimaryPointerUp('middle_click', MOUSE_BUTTON_MIDDLE, e)
          }
          onClick={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={`touch-surface min-h-[52px] rounded-xl border text-xs sm:text-sm font-semibold transition-colors duration-150 flex flex-col items-center justify-center px-2 ${
            pressedPrimary.middle_click
              ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
              : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-[#172033] dark:text-[#F4F5F7]'
          }`}
          aria-label="Middle Mouse Button"
        >
          <span>{middleLabel}</span>
          {middleCustom && (
            <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#6B9BFF]">Custom</span>
          )}
        </button>

        <button
          type="button"
          onPointerDown={(e) =>
            void handlePrimaryPointerDown(
              'right_click',
              MOUSE_BUTTON_RIGHT,
              'Right held',
              'medium',
              e
            )
          }
          onPointerUp={(e) => void handlePrimaryPointerUp('right_click', MOUSE_BUTTON_RIGHT, e)}
          onPointerCancel={(e) =>
            void handlePrimaryPointerUp('right_click', MOUSE_BUTTON_RIGHT, e)
          }
          onClick={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={`touch-surface min-h-[52px] rounded-xl border text-xs sm:text-sm font-semibold transition-colors duration-150 flex flex-col items-center justify-center px-2 ${
            pressedPrimary.right_click
              ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
              : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-[#172033] dark:text-[#F4F5F7]'
          }`}
        >
          <span>{rightLabel}</span>
          {rightCustom && (
            <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#6B9BFF]">Custom</span>
          )}
        </button>
      </div>

      {/* Secondary Row: Double Click & Drag Lock + Optional Aux Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleDoubleClick()}
          onContextMenu={(e) => e.preventDefault()}
          className="flex-1 touch-surface min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] active:opacity-80 text-xs font-medium text-[#172033] dark:text-[#F4F5F7] transition-colors duration-150 flex items-center justify-center gap-1.5 px-2"
        >
          <GripHorizontal className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
          <span className="truncate">{doubleCustom ? doubleCustom.shortLabel : 'Double Click'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleDragLock}
          onContextMenu={(e) => e.preventDefault()}
          aria-pressed={dragLockActive}
          className={`flex-1 touch-surface min-h-[44px] rounded-xl border text-xs font-medium transition-colors duration-150 flex items-center justify-center gap-1.5 px-2 ${
            dragLockActive
              ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
              : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] text-[#172033] dark:text-[#F4F5F7]'
          }`}
        >
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{dragLockActive ? 'Drag Lock: On' : 'Drag & Drop Lock'}</span>
        </button>

        {!compact && (
          <button
            type="button"
            onClick={() => setShowAuxRow((v) => !v)}
            className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-medium transition-colors duration-150 shrink-0 ${
              showAuxRow || hasAuxCustom
                ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#EFF4FF] dark:bg-[#232A38] text-[#2563EB] dark:text-[#6B9BFF]'
                : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] text-[#667085] dark:text-[#A0A5B1]'
            }`}
            title="Show or hide auxiliary side buttons and scroll step buttons"
          >
            Aux
          </button>
        )}
      </div>

      {/* Auxiliary Mapped Mouse Controls */}
      {!compact && (showAuxRow || hasAuxCustom) && (
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => void handleAuxSlotTap('aux_back')}
            className="touch-surface min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] active:opacity-80 text-[11px] font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center justify-center gap-1 px-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
            <span className="truncate">{auxBackCustom ? auxBackCustom.shortLabel : 'Back'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleAuxSlotTap('aux_forward')}
            className="touch-surface min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] active:opacity-80 text-[11px] font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center justify-center gap-1 px-1.5"
          >
            <span className="truncate">
              {auxForwardCustom ? auxForwardCustom.shortLabel : 'Forward'}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => void handleAuxSlotTap('scroll_up')}
            className="touch-surface min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] active:opacity-80 text-[11px] font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center justify-center gap-1 px-1.5"
          >
            <ArrowUp className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
            <span className="truncate">
              {scrollUpCustom ? scrollUpCustom.shortLabel : 'Scroll +'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleAuxSlotTap('scroll_down')}
            className="touch-surface min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24] hover:bg-[#F7F8FA] dark:hover:bg-[#222630] active:opacity-80 text-[11px] font-medium text-[#172033] dark:text-[#F4F5F7] flex items-center justify-center gap-1 px-1.5"
          >
            <ArrowDown className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF] shrink-0" />
            <span className="truncate">
              {scrollDownCustom ? scrollDownCustom.shortLabel : 'Scroll -'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
