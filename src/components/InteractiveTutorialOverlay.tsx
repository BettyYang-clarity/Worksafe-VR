import React from 'react';
import {
  Footprints,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  FastForward,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { SectorId } from '../types/game';

interface InteractiveTutorialOverlayProps {
  language: Language;
  step: 1 | 2 | 3;
  onSkip: () => void;
  onCompleteStep: (step: 1 | 2 | 3) => void;
  isBay101Nearby: boolean;
  onWalkToBay101: () => void;
  onAutoTuneSlider: () => void;
}

export const InteractiveTutorialOverlay: React.FC<InteractiveTutorialOverlayProps> = ({
  language,
  step,
  onSkip,
  onCompleteStep,
  isBay101Nearby,
  onWalkToBay101,
  onAutoTuneSlider,
}) => {
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-x-0 top-14 z-30 pointer-events-none flex justify-center px-3 animate-fade-in font-sans">
      <div className="w-full max-w-2xl pointer-events-auto rounded-2xl border-2 border-emerald-400 bg-slate-950/95 shadow-2xl shadow-emerald-950/60 p-4 md:p-5 backdrop-blur-md space-y-3">
        {/* Header Bar: Badge, Title, Skip */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs sm:text-sm">
                  {isZh ? '🎓 無塵室新人實習引導' : '🎓 Cleanroom Onboarding Tutorial'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-400 text-emerald-300">
                  Step {step} / 3
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {isZh
                  ? '（實習期間不倒數、不扣分，帶您實際操作一次核心流程）'
                  : '(No timers or penalties during tutorial; practice the 3 core actions)'}
              </span>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1 transition-colors cursor-pointer"
            title={isZh ? '直接進入正式輪班' : 'Skip to full shift'}
          >
            <span>{isZh ? '跳過教學' : 'Skip'}</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step-Specific Instruction & Actions */}
        {step === 1 && (
          <div className="space-y-2.5">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 mt-0.5">
                <Footprints className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200">
                  {isZh
                    ? '第 1 步：學習走動巡視機台'
                    : 'Step 1: Walk and inspect the machines'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  {isZh
                    ? '請使用鍵盤 W / A / S / D 走動，或點擊下方按鈕直接走往【Bay 101 微影曝光機】現場 (<5.5m)。'
                    : 'Use WASD keys to walk, or click below to walk to [Bay 101 Lithography] (<5.5m).'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs font-mono text-emerald-300 flex items-center space-x-1">
                {isBay101Nearby ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isZh ? '✅ 已在 Bay 101 現場！正在進入下一步...' : '✅ At Bay 101! Moving to Step 2...'}</span>
                  </>
                ) : (
                  <span>{isZh ? '👉 請前往 Bay 101 觸發完成' : '👉 Approach Bay 101 to complete'}</span>
                )}
              </span>

              {!isBay101Nearby && (
                <button
                  onClick={onWalkToBay101}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>{isZh ? '🏃 一鍵走往 Bay 101 現場' : '🏃 Walk to Bay 101 Now'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 mt-0.5">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  {isZh
                    ? '第 2 步：學習微調配方滑桿提升良率'
                    : 'Step 2: Tune recipe sliders to boost yield'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  {isZh
                    ? '在畫面下方控制台，找到【RF 射頻功率 (電漿火力)】滑桿，拖動至安全綠色區 (800~1750W)。'
                    : 'At the bottom console, drag the [RF Power (Plasma)] slider into the green safe zone (800-1750W).'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs font-mono text-slate-400">
                {isZh
                  ? '💡 提示：也可以點擊右側按鈕自動完成調校'
                  : '💡 Hint: You can also click the quick-tune button'}
              </span>

              <button
                onClick={onAutoTuneSlider}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isZh ? '🎛️ 一鍵調至安全區 (1200W)' : '🎛️ Quick-Tune to Safe (1200W)'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2.5">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  {isZh
                    ? '第 3 步：學習機台異常排障'
                    : 'Step 3: Respond to equipment alarms'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  {isZh
                    ? '現在畫面中央出現了模擬的黃色預警卡片！請依 AI 指引，點選標記【推薦】的正確工程方案。'
                    : 'A demo amber warning card is active below! Click the fix marked [Recommended] as guided by AI.'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 flex items-center justify-between text-xs font-mono text-emerald-300">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isZh
                    ? '👇 請在下方黃色卡片中點選：【暫停交接、歸零 Z 軸光學編碼器並清潔安全光柵鏡面】'
                    : '👇 Click the fix below: [Pause Handoff, Re-Zero Z-Axis Optical Encoder & Wipe Light Curtain]'}
                </span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold shrink-0">
                {isZh ? '推薦' : 'Best'}
              </span>
            </div>
          </div>
        )}

        {/* 3 Steps Progress Dots */}
        <div className="flex items-center justify-center space-x-2 pt-1 border-t border-slate-800/80">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step
                  ? 'w-8 bg-emerald-400'
                  : s < step
                  ? 'w-3 bg-emerald-500/60'
                  : 'w-3 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
