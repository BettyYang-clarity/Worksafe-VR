import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 40; // Max displacement radius in px

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setIsActive(true);

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, RADIUS);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      onMove({
        x: kx / RADIUS,
        y: -(ky / RADIUS), // Positive Y is forward
      });
    },
    [onMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const dx = touch.clientX - centerX;
          const dy = touch.clientY - centerY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, RADIUS);

          const kx = Math.cos(angle) * clampedDist;
          const ky = Math.sin(angle) * clampedDist;

          setKnobPos({ x: kx, y: ky });
          onMove({
            x: kx / RADIUS,
            y: -(ky / RADIUS),
          });
          break;
        }
      }
    },
    [onMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setIsActive(false);
          setKnobPos({ x: 0, y: 0 });
          onEnd();
          break;
        }
      }
    },
    [onEnd]
  );

  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      className={`fixed bottom-28 left-5 z-25 pointer-events-auto block lg:hidden select-none transition-opacity duration-200 ${
        isActive ? 'opacity-90' : 'opacity-60 hover:opacity-85'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Outer Boundary Ring */}
      <div className="relative w-24 h-24 rounded-full bg-slate-950/70 border-2 border-emerald-500/50 backdrop-blur-md shadow-xl flex items-center justify-center">
        {/* Subtle Crosshairs */}
        <div className="absolute w-full h-[1px] bg-emerald-500/20 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-emerald-500/20 pointer-events-none" />

        {/* Center Knob */}
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border border-emerald-200/80 shadow-lg shadow-emerald-500/50 flex items-center justify-center pointer-events-none transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
        </div>
      </div>
      <div className="text-[9px] font-mono text-center text-emerald-400/80 mt-1 pointer-events-none font-bold">
        🕹️ 走動搖桿
      </div>
    </div>
  );
};
