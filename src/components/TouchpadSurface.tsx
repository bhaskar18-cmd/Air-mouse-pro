import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, MousePointer2 } from 'lucide-react';
import { MOUSE_BUTTON_LEFT } from '../hid/hidReports';
import { bluetoothService } from '../services/bluetoothService';
import type { BlueMouseSettings, DeviceProfile } from '../types/bluetooth';
import { MouseButtonsBar } from './MouseButtonsBar';

interface TouchpadSurfaceProps {
  settings: BlueMouseSettings;
  compact?: boolean;
  expanded?: boolean;
  isConnected: boolean;
  activeProfile?: DeviceProfile | null;
}

interface TouchPoint {
  x: number;
  y: number;
  t: number;
}

/**
 * Computes 2D radial speed-curve scaling so diagonal cursor movement stays straight
 * and frame-rate variations (60Hz/90Hz/120Hz) do not introduce velocity jumps.
 * Raw position deltas are never lagged/smoothed; only the scalar gain tracks finger speed.
 */
function computeRadialCursorDelta(
  rawDx: number,
  rawDy: number,
  dtMs: number,
  sensitivity: number,
  curve: BlueMouseSettings['pointerSpeed'],
  speedEmaRef: { current: number }
): { dx: number; dy: number } {
  if (curve === 'linear') {
    speedEmaRef.current = 0;
    return {
      dx: rawDx * sensitivity,
      dy: rawDy * sensitivity,
    };
  }

  const dist = Math.hypot(rawDx, rawDy);
  const clampedDt = Math.max(4, Math.min(40, dtMs));
  const instSpeed = dist / clampedDt; // CSS px per ms
  const smoothedSpeed = speedEmaRef.current === 0 ? instSpeed : speedEmaRef.current * 0.55 + instSpeed * 0.45;
  speedEmaRef.current = smoothedSpeed;

  let curveGain = 1;
  if (curve === 'adaptive') {
    curveGain = 0.85 + Math.min(smoothedSpeed * 0.65, 1.35);
  } else if (curve === 'precision') {
    curveGain = smoothedSpeed < 0.25 ? 0.65 : 0.85 + Math.min(smoothedSpeed * 0.45, 0.75);
  }

  const totalScale = sensitivity * curveGain;
  return {
    dx: rawDx * totalScale,
    dy: rawDy * totalScale,
  };
}

export function TouchpadSurface({
  settings,
  compact = false,
  expanded = false,
  isConnected,
  activeProfile = null,
}: TouchpadSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const gestureHintSpanRef = useRef<HTMLSpanElement | null>(null);
  const gestureHintValueRef = useRef<string>('Ready');

  const [dragLockActive, setDragLockActive] = useState(false);

  // Latest props in refs so native passive:false touch listeners never rebind mid-gesture
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const dragLockRef = useRef(dragLockActive);
  dragLockRef.current = dragLockActive;

  // Active touch tracking (strictly cursor movement & two-finger scroll; never tap-to-click)
  const touchMapRef = useRef<Map<number, TouchPoint>>(new Map());
  const isScrollingGestureRef = useRef(false);
  const speedEmaRef = useRef(0);
  const pointerDownMouseRef = useRef(false);
  const lastMousePosRef = useRef<TouchPoint | null>(null);

  const setGestureHint = useCallback((hint: string) => {
    if (gestureHintValueRef.current === hint) return;
    gestureHintValueRef.current = hint;
    if (gestureHintSpanRef.current) {
      gestureHintSpanRef.current.textContent = hint;
    }
  }, []);

  const toggleDragLock = useCallback(async () => {
    const next = !dragLockRef.current;
    setDragLockActive(next);
    setGestureHint(next ? 'Drag lock active' : 'Drag lock released');
    await bluetoothService.triggerHaptic(settingsRef.current.hapticFeedback, next ? 'medium' : 'light');
    await bluetoothService.setMouseButtonState(MOUSE_BUTTON_LEFT, next, settingsRef.current.handedness);
  }, [setGestureHint]);

  // Attach native { passive: false } touch listeners directly for minimum latency & zero synthetic overhead
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const now = e.timeStamp || performance.now();
      const touches = e.touches;
      for (let i = 0; i < touches.length; i++) {
        const t = touches[i];
        touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY, t: now });
      }

      if (touches.length >= 2) {
        isScrollingGestureRef.current = true;
        speedEmaRef.current = 0;
        setGestureHint('Two-finger scroll');
      } else if (touches.length === 1 && !isScrollingGestureRef.current) {
        speedEmaRef.current = 0;
        setGestureHint(dragLockRef.current ? 'Drag lock active' : 'Cursor ready');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const now = e.timeStamp || performance.now();
      const touches = e.touches;
      const currSettings = settingsRef.current;

      if (touches.length === 1) {
        const t = touches[0];
        const prev = touchMapRef.current.get(t.identifier);
        touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY, t: now });

        // Suppress stray 1-finger delta if user is finishing a 2-finger scroll
        if (isScrollingGestureRef.current || !prev) {
          return;
        }

        const rawDx = t.clientX - prev.x;
        const rawDy = t.clientY - prev.y;
        if (rawDx === 0 && rawDy === 0) {
          return;
        }

        const dt = now - prev.t;
        if (dt > 80) {
          speedEmaRef.current = 0;
        }

        const { dx, dy } = computeRadialCursorDelta(
          rawDx,
          rawDy,
          dt,
          currSettings.mouseSensitivity,
          currSettings.pointerSpeed,
          speedEmaRef
        );
        bluetoothService.queueMouseDelta(dx, dy, 0, 0, currSettings);
        setGestureHint(dragLockRef.current ? 'Dragging (left held)' : 'Moving cursor');
      } else if (touches.length >= 2) {
        isScrollingGestureRef.current = true;
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
          touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY, t: now });
        }

        if (count > 0) {
          const avgDx = sumDx / count;
          const avgDy = sumDy / count;
          if (avgDx === 0 && avgDy === 0) {
            return;
          }

          const scrollDirection = currSettings.naturalScrolling ? 1 : -1;
          const wheelDelta = (avgDy / 12) * currSettings.scrollSpeed * scrollDirection;
          const hWheelDelta = (avgDx / 14) * currSettings.scrollSpeed * -scrollDirection;
          bluetoothService.queueMouseDelta(0, 0, wheelDelta, hWheelDelta, currSettings);
          setGestureHint('Two-finger scroll');
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const now = e.timeStamp || performance.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        touchMapRef.current.delete(e.changedTouches[i].identifier);
      }

      // Re-sync remaining touch coordinates cleanly; never trigger any click on lift or tap
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        touchMapRef.current.set(t.identifier, { x: t.clientX, y: t.clientY, t: now });
      }

      if (e.touches.length === 0) {
        isScrollingGestureRef.current = false;
        speedEmaRef.current = 0;
        setGestureHint(dragLockRef.current ? 'Drag lock active' : 'Ready');
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [setGestureHint]);

  // Desktop mouse preview fallback: dragging moves cursor only, never clicks
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ('ontouchstart' in window && e.nativeEvent instanceof PointerEvent) return;
    pointerDownMouseRef.current = true;
    speedEmaRef.current = 0;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp || performance.now() };
    setGestureHint(dragLockActive ? 'Drag lock active' : 'Cursor ready');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownMouseRef.current || !lastMousePosRef.current) return;
    const now = e.timeStamp || performance.now();
    const rawDx = e.clientX - lastMousePosRef.current.x;
    const rawDy = e.clientY - lastMousePosRef.current.y;
    const dt = now - lastMousePosRef.current.t;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, t: now };
    if (rawDx === 0 && rawDy === 0) return;

    const { dx, dy } = computeRadialCursorDelta(
      rawDx,
      rawDy,
      dt,
      settings.mouseSensitivity,
      settings.pointerSpeed,
      speedEmaRef
    );
    bluetoothService.queueMouseDelta(dx, dy, 0, 0, settings);
    setGestureHint(dragLockActive ? 'Dragging (left held)' : 'Moving cursor');
  };

  const handleMouseUp = () => {
    if (!pointerDownMouseRef.current) return;
    pointerDownMouseRef.current = false;
    lastMousePosRef.current = null;
    speedEmaRef.current = 0;
    setGestureHint(dragLockActive ? 'Drag lock active' : 'Ready');
  };

  const handleWheelPreview = (e: React.WheelEvent<HTMLDivElement>) => {
    const dir = settings.naturalScrolling ? -1 : 1;
    const wheelDelta = (e.deltaY > 0 ? -1 : 1) * settings.scrollSpeed * dir;
    const hWheelDelta = e.deltaX !== 0 ? (e.deltaX > 0 ? 1 : -1) * settings.scrollSpeed * dir : 0;
    bluetoothService.queueMouseDelta(0, 0, wheelDelta, hWheelDelta, settings);
    setGestureHint('Two-finger scroll');
  };

  const heightClass = compact
    ? 'h-52 sm:h-60'
    : expanded
      ? 'h-[54vh] min-h-[340px] sm:h-[58vh] lg:h-[62vh] max-h-[680px]'
      : 'h-[46vh] min-h-[290px] max-h-[520px]';

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Main Precision Touchpad (Cursor movement + Two-finger scroll only) */}
      <div
        ref={surfaceRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheelPreview}
        onClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        className={`touch-surface relative w-full ${heightClass} rounded-2xl border transition-colors duration-150 ${
          dragLockActive
            ? 'border-[#2563EB] dark:border-[#6B9BFF] bg-[#F5F8FF] dark:bg-[#1D222D]'
            : 'border-[#E5E7EB] dark:border-[#30343D] bg-white dark:bg-[#1A1D24]'
        } overflow-hidden cursor-crosshair`}
        aria-label="Bluetooth wireless touchpad area"
      >
        {/* Top subtle status row inside touchpad */}
        <div className="pointer-events-none absolute top-3.5 left-4 right-4 flex items-center justify-between text-xs text-[#667085] dark:text-[#A0A5B1]">
          <div className="flex items-center gap-2">
            <Hand className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#6B9BFF]" />
            <span ref={gestureHintSpanRef}>Ready</span>
          </div>
          <span className="tabular-nums font-mono">
            {settings.mouseSensitivity.toFixed(2)}x · {settings.pointerSpeed}
          </span>
        </div>

        {/* Center restrained guide */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <MousePointer2 className="h-5 w-5 text-[#667085] dark:text-[#A0A5B1] mb-2" />
          <p className="text-xs font-medium text-[#667085] dark:text-[#A0A5B1] max-w-xs">
            {isConnected
              ? '1 finger moves cursor · 2 fingers scroll · Use buttons below to click & drag'
              : '1 finger moves cursor · 2 fingers scroll · Connect a host to send reports'}
          </p>
        </div>
      </div>

      {/* Physical-Style Mouse Buttons & Custom Mapped Slots */}
      <MouseButtonsBar
        settings={settings}
        isConnected={isConnected}
        dragLockActive={dragLockActive}
        onToggleDragLock={() => void toggleDragLock()}
        onSetDragLock={setDragLockActive}
        onGestureHint={setGestureHint}
        activeProfile={activeProfile}
        compact={compact}
      />
    </div>
  );
}
