import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SectorId } from '../types/game';
import { Footprints } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
  onWalkToSector?: (sectorId: SectorId) => void;
  currentSectorId?: SectorId;
  hidden?: boolean;
}

const BAYS: { id: SectorId; code: string; label: string }[] = [
  { id: 'PHOTOLITHOGRAPHY', code: '101', label: '微影' },
  { id: 'ETCH_CVD', code: '102', label: '蝕刻' },
  { id: 'CMP_WET_BENCH', code: '103', label: '化研' },
  { id: 'DIFFUSION_FURNACE', code: '104', label: '擴散' },
  { id: 'ION_IMPLANTATION', code: '105', label: '離子' },
];

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onEnd,
  onWalkToSector,
  currentSectorId,
  hidden = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 42; // Max displacement radius in px

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setIsActive(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

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
        y: -(ky / RADIUS), // Positive Y is forward in 3D
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
          e.preventDefault();
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

  if (hidden) return null;

  return (
    <div
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[50] pointer-events-auto block lg:hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Virtual Joystick Disc (Lowered to bottom edge for thumb ergonomics) */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        className={`relative w-20 h-20 rounded-full bg-slate-950/85 border-2 border-emerald-400/60 backdrop-blur-lg shadow-2xl flex items-center justify-center transition-transform active:scale-95 ${
          isActive ? 'ring-2 ring-emerald-400/80 border-emerald-300' : ''
        }`}
      >
        {/* Direction Indicator Crosshairs */}
        <div className="absolute w-full h-[1px] bg-emerald-400/25 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-emerald-400/25 pointer-events-none" />

        {/* Center Thumb Knob */}
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border border-emerald-200/90 shadow-lg shadow-emerald-500/60 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isActive ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
        </div>
      </div>
    </div>
  );
};
