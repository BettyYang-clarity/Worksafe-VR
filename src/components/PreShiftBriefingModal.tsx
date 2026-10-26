import React, { useEffect } from 'react';
import {
  Footprints,
  Sliders,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  Volume2,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { GameDifficulty } from '../types/game';
import { Language } from '../i18n/translations';

interface PreShiftBriefingModalProps {
  language: Language;
  difficulty: GameDifficulty;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PreShiftBriefingModal: React.FC<PreShiftBriefingModalProps> = ({
  language,
  difficulty,
  playerName,
  onConfirm,
  onCancel,
}) => {
  const isZh = language === 'zh-TW';
  const isPro = difficulty === 'PRO';

  // Hotkey support: Enter or Space to confirm, Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in font-sans pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={`w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-2xl border-2 p-4 sm:p-5 md:p-7 shadow-2xl bg-slate-950 text-white flex flex-col my-auto ${
          isPro
            ? 'border-cyan-500/60 shadow-cyan-950/60'
            : 'border-emerald-500/60 shadow-emerald-950/60'
        }`}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${
                isPro
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg md:text-xl font-bold font-display text-white">
                  {isZh
                    ? '🏭 300mm 晶圓廠無塵室 · 值班核心指引'
                    : '🏭 300mm Cleanroom Fab · Shift Core Orientation'}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                {isZh
                  ? `輪班人員：${playerName || 'Alex Chen #402'} ｜ 請掌握以下三大核心操作：`
                  : `Operator: ${playerName || 'Alex Chen #402'} | Master these 3 core actions:`}
              </p>
            </div>
          </div>

          <div
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold border shrink-0 ${
              isPro
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {isPro
              ? isZh
                ? '🔴 專業模式｜實戰無提示'
                : '🔴 PRO MODE | Zero Hints'
              : isZh
              ? '🟢 AI 引導模式｜白話導航'
              : '🟢 AI GUIDED | Beginner'}
          </div>
        </div>

        {/* Scrollable Middle Content */}
        <div className="overflow-y-auto flex-1 my-2.5 pr-1 space-y-3 overscroll-contain">
          {/* 3 Core Task Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Card 1: Walk & Inspect */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs sm:text-sm mb-1.5">
                  <Footprints className="w-4 h-4 shrink-0" />
                  <span>{isZh ? '1. 巡視機台' : '1. Walk & Inspect'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {isZh ? (
                    <>
                      <span className="hidden sm:inline">使用鍵盤 W / A / S / D 鍵在機台間走動，或直接點擊畫面下方機台按鈕前往現場。</span>
                      <span className="sm:hidden">使用左下角虛擬搖桿走動，或直接點擊上方機台代號前往現場。</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Use keyboard W / A / S / D keys to walk, or click bay buttons below to navigate.</span>
                      <span className="sm:hidden">Use the virtual joystick or tap bay buttons above to navigate on-site.</span>
                    </>
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400/90 flex items-center justify-between">
                <span>{isZh ? '搖桿 / WASD / 點擊' : 'Joystick / WASD / Click'}</span>
                <span>👟</span>
              </div>
            </div>

            {/* Card 2: Tune Recipe & Yield */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs sm:text-sm mb-1.5">
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>{isZh ? '2. 調節產能良率' : '2. Tune Yield'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {isZh
                    ? '點選機台微調「電漿火力／氣體流量」滑桿，讓產速維持在安全區以最大化良品。'
                    : 'Select bays & adjust RF / Gas Flow sliders into safe zones to maximize good wafers.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-400/90 flex items-center justify-between">
                <span>{isZh ? '微調配方滑桿' : 'Tune Recipe Sliders'}</span>
                <span>🎛️</span>
              </div>
            </div>

            {/* Card 3: Respond to Alarms */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs sm:text-sm mb-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{isZh ? '3. 應變排障' : '3. Respond & Contain'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {isZh
                    ? '當機台出現黃燈故障或紅燈警報時，跟隨提示走近現場（< 5.5m）選擇 SOP 解除危機！'
                    : 'When alerts flash yellow or red, walk on-site (<5.5m) to execute SOPs and contain hazards!'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-rose-400/90 flex items-center justify-between">
                <span>{isZh ? '靠近現場執行 SOP' : 'Approach & Execute'}</span>
                <span>🚨</span>
              </div>
            </div>
          </div>

          {/* Reassurance Note */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 font-sans ${
              isPro
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="leading-snug">
              {isZh
                ? isPro
                  ? '提示：專業模式將全程採用標準工程術語與嚴格時限，請依憑專業經驗守護廠區零工安事故。'
                  : '提示：AI 引導模式將提供白話術語說明與即時應變指引，初學者可安心跟隨指示體驗。'
                : isPro
                ? 'Pro Mode uses pure SEMI S2/OSHA terms with strict timers. Rely on engineering knowledge.'
                : 'AI Guided Mode offers plain-English terms and real-time hints. Beginners can follow prompts easily.'}
            </span>
          </div>

          {/* Experience Tips: Desktop Best / Audio / Mobile Friendly */}
          <div className="p-3 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 text-xs text-slate-200 space-y-1.5 shadow-md">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs">
              <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{isZh ? '💡 最佳遊玩體驗指引' : '💡 Best Experience Guide'}</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300 font-sans leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold shrink-0">🖥️</span>
                <span>
                  {isZh
                    ? '推薦使用電腦瀏覽器並開啟音效，享受最開闊的 3D 無塵室視野、鍵盤走動與真實警報！'
                    : 'Recommended on PC/Mac with sound on for expansive 3D view, keyboard walking & immersive sirens!'}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-300">
                <span className="text-emerald-400 font-bold shrink-0">📱</span>
                <span>
                  {isZh
                    ? '手機亦全面支援（建議直式遊玩；iPhone 請確認左側靜音開關已切至響鈴模式）。'
                    : 'Mobile is fully supported (portrait mode recommended; unmute switch on iPhone).'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons (Pinned Footer) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer text-center"
          >
            {isZh ? '← 返回重新選擇 (Esc)' : '← Back to Selection (Esc)'}
          </button>

          <button
            onClick={onConfirm}
            className={`w-full sm:w-auto px-6 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] shadow-xl cursor-pointer ${
              isPro
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {isZh
                ? '進入無塵室開始值班'
                : 'Enter Cleanroom & Start Shift'}
              <span className="hidden sm:inline font-mono text-[11px] font-normal ml-1">(Enter)</span>
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
