import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SectorId } from '../types/game';
import { Footprints } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
  onWalkToSector?: (sectorId: SectorId) => void;
  currentSectorId?: SectorId;
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

  return (
    <div
      className="fixed bottom-14 left-3 z-[60] pointer-events-auto block lg:hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Quick Bay Hop Bar right above joystick */}
      {onWalkToSector && (
        <div className="flex items-center gap-1 mb-2 bg-slate-950/90 border border-slate-700/80 rounded-full px-2 py-1 shadow-2xl backdrop-blur-md">
          <Footprints className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">走往:</span>
          {BAYS.map((b) => (
            <button
              key={b.id}
              onClick={() => onWalkToSector(b.id)}
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                currentSectorId === b.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {b.code}
            </button>
          ))}
        </div>
      )}

      {/* Virtual Joystick Disc */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        className={`relative w-22 h-22 rounded-full bg-slate-950/80 border-2 border-emerald-400/60 backdrop-blur-lg shadow-2xl flex items-center justify-center transition-transform active:scale-95 ${
          isActive ? 'ring-2 ring-emerald-400/80 border-emerald-300' : ''
        }`}
      >
        {/* Direction Indicator Crosshairs */}
        <div className="absolute w-full h-[1px] bg-emerald-400/25 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-emerald-400/25 pointer-events-none" />

        {/* Center Thumb Knob */}
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border border-emerald-200/90 shadow-lg shadow-emerald-500/60 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isActive ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-3 h-3 rounded-full bg-white/90" />
        </div>
      </div>
      <div className="text-[9px] font-mono text-center text-emerald-400/90 mt-1 pointer-events-none font-bold drop-shadow">
        🕹️ 走動搖桿
      </div>
    </div>
  );
};
