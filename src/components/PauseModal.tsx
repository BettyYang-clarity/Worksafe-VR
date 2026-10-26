import React from 'react';
import { Play, RotateCcw, Home, BookOpen, Volume2, VolumeX, Globe } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface PauseModalProps {
  language: Language;
  onToggleLanguage: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onOpenTrainingManual: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  onToggleLanguage,
  onResume,
  onRestart,
  onReturnToTitle,
  onOpenTrainingManual,
  isMuted,
  onToggleMute,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="hud-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-6">
        <div>
          <span className="px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-semibold tracking-wider">
            {t.simulationPaused}
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-100 mt-2">
            {t.fabSuspended}
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {t.suspendedSub}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.resumeSimulation}</span>
          </button>

          <button
            onClick={onOpenTrainingManual}
            className="w-full py-2.5 rounded-xl hud-border text-cyan-300 hover:text-white text-xs font-mono flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.reviewSops}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleLanguage}
              className="py-2.5 rounded-xl hud-border text-amber-300 hover:text-white text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{isZh ? 'English (EN)' : '切換繁體中文'}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="py-2.5 rounded-xl hud-border text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? t.unmuteAudio : t.muteAudio}</span>
            </button>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.restartShift}</span>
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-mono flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t.abortTitle}</span>
          </button>
        </div>

        {/* Quick controls reminder */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 text-left">
          <div className="font-semibold text-slate-400 mb-1">{t.cleanroomControls}</div>
          <div>• <strong>WASD / 方向鍵：</strong> {isZh ? '無塵室漫步巡查' : 'Walk on cleanroom floor'}</div>
          <div>• <strong>{isZh ? '滑鼠按住拖曳：' : 'Mouse Drag:'}</strong> {isZh ? '360° 環視檢視設備' : 'Inspect machinery in 3D'}</div>
          <div>• <strong>{isZh ? '點擊紅色 EMO：' : 'Click EMO:'}</strong> {isZh ? '實體緊急斷電停機' : 'Direct Emergency Machine Off button'}</div>
          <div>• <strong>H key：</strong> {isZh ? '收合 / 展開下方控制台' : 'Collapse / Expand protocol console'}</div>
        </div>
      </div>
    </div>
  );
};
