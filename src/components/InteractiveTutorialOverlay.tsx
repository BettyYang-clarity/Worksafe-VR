import React from 'react';
import {
  Footprints,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FastForward,
} from 'lucide-react';
import { Language } from '../i18n/translations';

interface InteractiveTutorialOverlayProps {
  language: Language;
  step: 1 | 2 | 3;
  onSkip: () => void;
  // Step 1: Walk
  isBay101Nearby: boolean;
  distanceToBay101: number;
  onWalkToBay101: () => void;
  onAdvanceToStep2: () => void;
  // Step 2: Sliders
  currentRfPowerWatts: number;
  currentEfficiency: number;
  onAutoTuneSlider: () => void;
  onAdvanceToStep3: () => void;
  // Step 3: Pre-Alarm
  isStep3Resolved: boolean;
  onStartShift: () => void;
}

export const InteractiveTutorialOverlay: React.FC<InteractiveTutorialOverlayProps> = ({
  language,
  step,
  onSkip,
  isBay101Nearby,
  distanceToBay101,
  onWalkToBay101,
  onAdvanceToStep2,
  currentRfPowerWatts,
  currentEfficiency,
  onAutoTuneSlider,
  onAdvanceToStep3,
  isStep3Resolved,
  onStartShift,
}) => {
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-x-0 top-12 md:top-14 z-30 pointer-events-none flex justify-center px-2 sm:px-3 animate-fade-in font-sans">
      <div className="w-full max-w-2xl pointer-events-auto rounded-2xl border-2 border-emerald-400 bg-slate-950/95 shadow-2xl shadow-emerald-950/60 p-3.5 sm:p-4 md:p-5 backdrop-blur-md space-y-3 max-h-[70vh] overflow-y-auto">
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
                  ? '（實習期間不倒數、不扣分，等您確認操作後才進入下一步）'
                  : '(No timers or penalties; advances only when you confirm each step)'}
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

        {/* Step 1: Walk to Bay 101 */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 mt-0.5">
                <Footprints className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200">
                  {isZh
                    ? '第 1 步：學習走動巡視機台'
                    : 'Step 1: Walk & inspect the machines'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  {isZh ? (
                    <>
                      <span className="hidden md:inline">請使用鍵盤 W / A / S / D 走動</span>
                      <span className="md:hidden">請滑動左下角搖桿走動</span>
                      ，或點擊右側按鈕直接前往【Bay 101 微影曝光機】現場 (&lt;5.5m)。
                    </>
                  ) : (
                    <>
                      <span className="hidden md:inline">Use WASD keys to walk</span>
                      <span className="md:hidden">Use the bottom-left joystick to walk</span>
                      , or click below to walk to [Bay 101 Lithography] (&lt;5.5m).
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-mono">
                {isBay101Nearby ? (
                  <span className="text-emerald-300 flex items-center space-x-1 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isZh
                        ? '✅ 已抵達 Bay 101 現場！請點擊右側繼續'
                        : '✅ Arrived at Bay 101! Click next to continue'}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {isZh
                      ? `📍 目前距離 Bay 101: ${distanceToBay101.toFixed(1)}m (需 <5.5m)`
                      : `📍 Distance to Bay 101: ${distanceToBay101.toFixed(1)}m (<5.5m required)`}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!isBay101Nearby && (
                  <button
                    onClick={onWalkToBay101}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors shadow-lg"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>{isZh ? '🏃 一鍵走往 Bay 101' : '🏃 Walk to Bay 101'}</span>
                  </button>
                )}

                {isBay101Nearby && (
                  <button
                    onClick={onAdvanceToStep2}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer animate-pulse"
                  >
                    <span>
                      {isZh
                        ? '👉 進入第 2 步：調節配方良率'
                        : '👉 Proceed to Step 2: Tune Sliders'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tune Sliders */}
        {step === 2 && (
          <div className="space-y-3">
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
                    ? '請在畫面下方控制台拖動【RF 射頻功率 (電漿火力)】滑桿至安全綠色區 (800~1750W)，體驗良率與產速變化。確認完成後請點擊右側按鈕繼續。'
                    : 'At the bottom console, drag the [RF Power (Plasma)] slider into the green safe zone (800-1750W). Click next when ready.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-300">
                  {isZh ? '當前功率: ' : 'Current RF: '}
                  <strong
                    className={
                      currentRfPowerWatts >= 800 && currentRfPowerWatts <= 1750
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {currentRfPowerWatts}W
                  </strong>
                  {' '}
                  ({isZh ? `產速 ${currentEfficiency}%` : `Speed ${currentEfficiency}%`})
                </span>
                {currentRfPowerWatts >= 800 && currentRfPowerWatts <= 1750 && (
                  <span className="text-emerald-400 font-bold hidden sm:inline">
                    {isZh ? '（安全綠色區間）' : '(Safe Range)'}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onAutoTuneSlider}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isZh ? '🎛️ 一鍵調至 1200W' : '🎛️ Set to 1200W'}</span>
                </button>

                <button
                  onClick={onAdvanceToStep3}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  <span>
                    {isZh
                      ? '👉 完成調校，進入第 3 步排障'
                      : '👉 Proceed to Step 3: Alarm Response'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Alarm Response */}
        {step === 3 && (
          <div className="space-y-3">
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
                  {isStep3Resolved
                    ? isZh
                      ? '🎉 太棒了！您已成功排除異常並保護整批晶圓！點擊右側按鈕即可正式展開輪班。'
                      : '🎉 Excellent! You solved the root cause and protected the wafer lot! Click below to start shift.'
                    : isZh
                    ? '畫面中央出現了模擬的黃色預警卡片！請依 AI 指引，點選標記【推薦】的正確工程方案。'
                    : 'A demo amber warning card is active below! Click the fix marked [Recommended] as guided by AI.'}
                </p>
              </div>
            </div>

            {!isStep3Resolved ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 flex items-center justify-between text-xs font-mono text-emerald-300">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
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
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-xs font-mono text-emerald-300 flex items-center space-x-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isZh
                      ? '✅ 實習圓滿完成！您已掌握三大核心操作'
                      : '✅ Onboarding Completed! 3 core skills mastered'}
                  </span>
                </span>

                <button
                  onClick={onStartShift}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-xl shadow-emerald-500/40 cursor-pointer animate-bounce"
                >
                  <span>{isZh ? '🚀 開始正式輪班' : '🚀 Start Shift Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
