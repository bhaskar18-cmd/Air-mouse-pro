import { useCallback, useEffect, useRef, useState } from 'react';
import { GripHorizontal, Hand, Lock, MousePointerClick } from 'lucide-react';
import { MOUSE_BUTTON_LEFT, MOUSE_BUTTON_MIDDLE, MOUSE_BUTTON_RIGHT } from '../hid/hidReports';
import { bluetoothService } from '../services/bluetoothService';
import type { BlueMouseSettings } from '../types/bluetooth';

interface TouchpadSurfaceProps {
  settings: BlueMouseSettings;
  compact?: boolean;
  isConnected: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
}

function applySpeedCurve(
  delta: number,
  sensitivity: number,
  curve: BlueMouseSettings['pointerSpeed']
): number {
  const abs = Math.abs(delta);
  let multiplier = sensitivity;
  if (curve === 'adaptive') {
    const accel = 0.72 + Math.min(abs / 14, 1.55);
    multiplier = sensitivity * accel;
  } else if (curve === 'precision') {
    const damp = abs < 4 ? 0.55 : 0.9 + Math.min(abs / 28, 0.7);
    multiplier = sensitivity * damp;
  }
  return delta * multiplier;
}

export function TouchpadSurface({
  settings,
  compact = false,
  isConnected,
}: TouchpadSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragLockActive, setDragLockActive] = useState(false);
  const [longPressDragging, setLongPressDragging] = useState(false);
  const [activeRipple, setActiveRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [gestureHint, setGestureHint] = useState<string>('Ready');

  // Active touch tracking
  const touchMapRef = useRef<Map<number, TouchPoint>>(new Map());
  const gestureStartTimeRef = useRef(0);
  const totalMovedRef = useRef(0);
  const maxFingersRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerDownMouseRef = useRef(false);
  const lastMousePosRef = useRef<TouchPoint | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const showRippleAt = useCallback((clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    setActiveRipple({
      x: clientX - rect.left,
      y: clientY - rect.top,
      id: Date.now(),
    });
  }, []);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      void bluetoothService.releaseAllMouseButtons(settings.handedness);
    };
  }, [clearLongPressTimer, settings.handedness]);

  const toggleDragLock = useCallback(async () => {
    const next = !dragLockActive;
    setDragLockActive(next);
    setGestureHint(next ? 'Drag lock active' : 'Drag lock released');
    await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
    await bluetoothService.setMouseButtonState(MOUSE_BUTTON_LEFT, next, settings.handedness);
  }, [dragLockActive, settings.handedness, settings.hapticFeedback]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touches = e.touches;
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (touches.length === 1 && maxFingersRef.current === 0) {
      gestureStartTimeRef.current = performance.now();
      totalMovedRef.current = 0;
      maxFingersRef.current = 1;
      setGestureHint('Tracking');

      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(async () => {
        if (totalMovedRef.current < 8 && touchMapRef.current.size === 1) {
          setLongPressDragging(true);
          setGestureHint('Drag hold');
          await bluetoothService.triggerHaptic(settings.hapticFeedback, 'heavy');
          await bluetoothService.setMouseButtonState(MOUSE_BUTTON_LEFT, true, settings.handedness);
        }
      }, 450);
    } else if (touches.length >= 2) {
      clearLongPressTimer();
      maxFingersRef.current = Math.max(maxFingersRef.current, touches.length);
      setGestureHint('Two-finger scroll');
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && maxFingersRef.current === 1) {
      const t = touches[0];
      const prev = touchMapRef.current.get(t.identifier);
      if (prev) {
        const rawDx = t.clientX - prev.x;
        const rawDy = t.clientY - prev.y;
        totalMovedRef.current += Math.hypot(rawDx, rawDy);

        if (totalMovedRef.current > 8) {
          clearLongPressTimer();
        }

        const scaledDx = applySpeedCurve(rawDx, settings.mouseSensitivity, settings.pointerSpeed);
        const scaledDy = applySpeedCurve(rawDy, settings.mouseSensitivity, settings.pointerSpeed);
        bluetoothService.queueMouseDelta(scaledDx, scaledDy, 0, 0, settings);
      }
      touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    } else if (touches.length >= 2) {
      // Average delta across first two fingers for smooth scroll
      let sumDx = 0;
      let sumDy = 0;
      let count = 0;

      for (let i = 0; i < Math.min(2, touches.length); i++) {
        const t = touches[i];
        const prev = touchMapRef.current.get(t.identifier);
        if (prev) {
          sumDx += t.clientX - prev.x;
          sumDy += t.clientY - prev.y;
          count++;
        }
        touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }

      if (count > 0) {
        const avgDx = sumDx / count;
        const avgDy = sumDy / count;
        totalMovedRef.current += Math.hypot(avgDx, avgDy);

        const scrollDirection = settings.naturalScrolling ? 1 : -1;
        const wheelDelta = (avgDy / 12) * settings.scrollSpeed * scrollDirection;
        const hWheelDelta = (avgDx / 14) * settings.scrollSpeed * -scrollDirection;
        bluetoothService.queueMouseDelta(0, 0, wheelDelta, hWheelDelta, settings);
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    clearLongPressTimer();

    for (let i = 0; i < e.changedTouches.length; i++) {
      touchMapRef.current.delete(e.changedTouches[i].identifier);
    }

    if (e.touches.length === 0) {
      const elapsed = performance.now() - gestureStartTimeRef.current;
      const moved = totalMovedRef.current;
      const fingers = maxFingersRef.current;
      const lastTouch = e.changedTouches[0];

      if (longPressDragging) {
        setLongPressDragging(false);
        if (!dragLockActive) {
          await bluetoothService.setMouseButtonState(
            MOUSE_BUTTON_LEFT,
            false,
            settings.handedness
          );
        }
        setGestureHint('Drag released');
      } else if (elapsed < 260 && moved < 10) {
        if (lastTouch) showRippleAt(lastTouch.clientX, lastTouch.clientY);

        if (fingers === 1) {
          const now = performance.now();
          if (now - lastTapTimeRef.current < 280) {
            lastTapTimeRef.current = 0;
            setGestureHint('Double click');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
            await bluetoothService.doubleClickLeft(settings.handedness);
          } else {
            lastTapTimeRef.current = now;
            setGestureHint('Left click');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'light');
            await bluetoothService.clickMouseButton(MOUSE_BUTTON_LEFT, settings.handedness);
          }
        } else if (fingers >= 2) {
          setGestureHint('Right click');
          await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
          await bluetoothService.clickMouseButton(MOUSE_BUTTON_RIGHT, settings.handedness);
        }
      } else {
        setGestureHint('Ready');
      }

      maxFingersRef.current = 0;
    }
  };

  // Desktop mouse preview fallback so users inspecting in browser can also test relative movement
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ('ontouchstart' in window && e.nativeEvent instanceof PointerEvent) return;
    pointerDownMouseRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    totalMovedRef.current = 0;
    gestureStartTimeRef.current = performance.now();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownMouseRef.current || !lastMousePosRef.current) return;
    const rawDx = e.clientX - lastMousePosRef.current.x;
    const rawDy = e.clientY - lastMousePosRef.current.y;
    totalMovedRef.current += Math.hypot(rawDx, rawDy);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const scaledDx = applySpeedCurve(rawDx, settings.mouseSensitivity, settings.pointerSpeed);
    const scaledDy = applySpeedCurve(rawDy, settings.mouseSensitivity, settings.pointerSpeed);
    bluetoothService.queueMouseDelta(scaledDx, scaledDy, 0, 0, settings);
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownMouseRef.current) return;
    pointerDownMouseRef.current = false;
    lastMousePosRef.current = null;
    if (totalMovedRef.current < 6 && performance.now() - gestureStartTimeRef.current < 260) {
      showRippleAt(e.clientX, e.clientY);
      setGestureHint('Left click');
      await bluetoothService.clickMouseButton(MOUSE_BUTTON_LEFT, settings.handedness);
    }
  };

  const handleWheelPreview = (e: React.WheelEvent<HTMLDivElement>) => {
    const dir = settings.naturalScrolling ? -1 : 1;
    const wheelDelta = (e.deltaY > 0 ? -1 : 1) * settings.scrollSpeed * dir;
    bluetoothService.queueMouseDelta(0, 0, wheelDelta, 0, settings);
    setGestureHint('Scrolling');
  };

  const primaryLabel = settings.handedness === 'left' ? 'Right (Primary)' : 'Left Click';
  const secondaryLabel = settings.handedness === 'left' ? 'Left (Secondary)' : 'Right Click';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Precision Touchpad */}
      <div
        ref={surfaceRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          pointerDownMouseRef.current = false;
          lastMousePosRef.current = null;
        }}
        onWheel={handleWheelPreview}
        className={`touch-surface relative w-full ${
          compact ? 'h-52 sm:h-60' : 'h-[46vh] min-h-[290px] max-h-[520px]'
        } rounded-3xl border ${
          longPressDragging || dragLockActive
            ? 'border-cyan-400/80 ring-2 ring-cyan-500/25'
            : 'border-slate-200 dark:border-slate-800'
        } bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-[#0B1426] dark:via-[#081020] dark:to-[#060B16] touchpad-grid overflow-hidden shadow-inner cursor-crosshair`}
        aria-label="Bluetooth wireless touchpad area"
      >
        {/* Top subtle status row inside touchpad */}
        <div className="pointer-events-none absolute top-3.5 left-4 right-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Hand className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{gestureHint}</span>
          </div>
          <span className="tabular-nums font-mono">
            {settings.mouseSensitivity.toFixed(2)}x · {settings.pointerSpeed}
          </span>
        </div>

        {/* Center subtle target crosshair */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="h-12 w-12 rounded-2xl border border-slate-300/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 flex items-center justify-center mb-2.5">
            <MousePointerClick className="h-5 w-5 text-blue-600/80 dark:text-cyan-400/80" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs">
            {isConnected
              ? '1 finger move & tap · 2 finger scroll & right click · Hold to drag'
              : 'Touchpad ready — pair & connect a Bluetooth host to transmit HID cursor reports'}
          </p>
        </div>

        {/* Click ripple feedback */}
        {activeRipple && (
          <span
            key={activeRipple.id}
            style={{ left: activeRipple.x - 18, top: activeRipple.y - 18 }}
            className="pointer-events-none absolute h-9 w-9 rounded-full border-2 border-cyan-400/70 bg-cyan-400/15 animate-ping"
          />
        )}
      </div>

      {/* Physical Mouse Buttons + Quick Controls */}
      <div className="grid grid-cols-12 gap-2.5">
        <button
          type="button"
          onPointerDown={async () => {
            setGestureHint('Left held');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'light');
            await bluetoothService.setMouseButtonState(MOUSE_BUTTON_LEFT, true, settings.handedness);
          }}
          onPointerUp={async () => {
            if (!dragLockActive) {
              await bluetoothService.setMouseButtonState(
                MOUSE_BUTTON_LEFT,
                false,
                settings.handedness
              );
            }
            setGestureHint('Ready');
          }}
          onPointerCancel={async () => {
            if (!dragLockActive) {
              await bluetoothService.setMouseButtonState(
                MOUSE_BUTTON_LEFT,
                false,
                settings.handedness
              );
            }
          }}
          className="col-span-5 min-h-[54px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1629] hover:bg-slate-50 dark:hover:bg-[#131F38] active:scale-[0.98] text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center"
        >
          {primaryLabel}
        </button>

        <button
          type="button"
          onPointerDown={async () => {
            setGestureHint('Middle held');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'light');
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_MIDDLE,
              true,
              settings.handedness
            );
          }}
          onPointerUp={async () => {
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_MIDDLE,
              false,
              settings.handedness
            );
            setGestureHint('Ready');
          }}
          onPointerCancel={async () => {
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_MIDDLE,
              false,
              settings.handedness
            );
          }}
          className="col-span-2 min-h-[54px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1629] hover:bg-slate-50 dark:hover:bg-[#131F38] active:scale-[0.98] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center"
          aria-label="Middle Mouse Button"
        >
          Mid
        </button>

        <button
          type="button"
          onPointerDown={async () => {
            setGestureHint('Right held');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_RIGHT,
              true,
              settings.handedness
            );
          }}
          onPointerUp={async () => {
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_RIGHT,
              false,
              settings.handedness
            );
            setGestureHint('Ready');
          }}
          onPointerCancel={async () => {
            await bluetoothService.setMouseButtonState(
              MOUSE_BUTTON_RIGHT,
              false,
              settings.handedness
            );
          }}
          className="col-span-5 min-h-[54px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1629] hover:bg-slate-50 dark:hover:bg-[#131F38] active:scale-[0.98] text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center"
        >
          {secondaryLabel}
        </button>
      </div>

      {/* Secondary Actions: Double Click & Drag Lock */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={async () => {
            setGestureHint('Double click');
            await bluetoothService.triggerHaptic(settings.hapticFeedback, 'medium');
            await bluetoothService.doubleClickLeft(settings.handedness);
          }}
          className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1221] hover:bg-slate-50 dark:hover:bg-[#121D33] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <GripHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Double Click</span>
        </button>

        <button
          type="button"
          onClick={toggleDragLock}
          aria-pressed={dragLockActive}
          className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            dragLockActive
              ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
              : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1221] hover:bg-slate-50 dark:hover:bg-[#121D33] text-slate-700 dark:text-slate-200'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{dragLockActive ? 'Drag Lock: On' : 'Drag & Drop Lock'}</span>
        </button>
      </div>
    </div>
  );
}
