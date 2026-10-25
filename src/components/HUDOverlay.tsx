import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Flame,
  HelpCircle,
  Layers,
  Pause,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  CameraViewMode,
  FloatingDelta,
  HazardIncident,
  ProtocolStep,
  SectorId,
  SectorState,
  SectorTuneParams,
} from '../types/game';
import { INITIAL_SECTORS } from '../data/protocols';

interface HUDOverlayProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenInstructions: () => void;
  onSilenceAlarm: () => void;
  shiftTimeRemainingSec: number;
  overallYieldPct: number;
  totalWafersProduced: number;
  defectiveWafers: number;
  safetyScore: number;
  activeHazard: HazardIncident | null;
  sectors: Record<SectorId, SectorState>;
  selectedSectorId: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
  onSelectProtocolStep: (step: ProtocolStep) => void;
  onHitEmo: (sectorId: SectorId) => void;
  onTuneEfficiency: (sectorId: SectorId, delta: number) => void;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraView: CameraViewMode;
  onChangeCameraView: (mode: CameraViewMode) => void;
  lastFeedback: { text: string; isCorrect: boolean } | null;
  onOpenTablet: () => void;
  flowStateSeconds?: number;
  floatingDeltas?: FloatingDelta[];
  playerName?: string;
  onTuneSectorParams?: (sectorId: SectorId, params: SectorTuneParams) => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  language,
  onToggleLanguage,
  onOpenInstructions,
  onSilenceAlarm,
  shiftTimeRemainingSec,
  overallYieldPct,
  totalWafersProduced,
  defectiveWafers,
  safetyScore,
  activeHazard,
  sectors,
  selectedSectorId,
  onSelectSector,
  onSelectProtocolStep,
  onHitEmo,
  onTuneEfficiency,
  onPause,
  isMuted,
  onToggleMute,
  cameraView,
  onChangeCameraView,
  lastFeedback,
  onOpenTablet,
  flowStateSeconds = 0,
  floatingDeltas = [],
  playerName,
  onTuneSectorParams,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedSector = sectors[selectedSectorId] || Object.values(sectors)[0];

  const pipelineOrder: SectorId[] = [
    'PHOTOLITHOGRAPHY',
    'ION_IMPLANTATION',
    'ETCH_CVD',
    'CMP_WET_BENCH',
    'DIFFUSION_FURNACE',
  ];

  // Detect any creeping micro-anomalies (e.g. scrubber > 85% or temperature high)
  const anomalousSectors = Object.values(sectors).filter(
    (s) => s.scrubberLoadPct > 85 || s.temperatureC > 300 || s.health < 80
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2 md:p-3 overflow-hidden select-none">
      {/* ==================================================== */}
      {/* 1. TOP STATUS & CONTROL BAR (Responsive & Uncut)     */}
      {/* ==================================================== */}
      <div className="w-full pointer-events-auto">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/60 shadow-xl text-xs font-mono">
          {/* Left Cluster: Operator Badge, Live Yield, Wafer Counts & CMOS 5-Station Pills */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto min-w-0">
            {/* Operator Identification Tag */}
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[11px] text-cyan-300 font-bold shrink-0 shadow-sm shadow-cyan-950/50">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="truncate max-w-[130px]">{playerName || 'Operator #402'}</span>
            </div>

            {/* Yield & Wafer Counts */}
            <div className="flex items-center space-x-2 text-[11px] font-bold shrink-0">
              <span className="text-cyan-400">
                {isZh ? '良率' : 'Yield'}:{' '}
                <strong
                  className={
                    overallYieldPct >= 90
                      ? 'text-emerald-400'
                      : overallYieldPct >= 75
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                >
                  {overallYieldPct.toFixed(1)}%
                </strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                {isZh ? '產出' : 'Good'}: <strong className="text-white">{totalWafersProduced}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400">
                {isZh ? '報廢' : 'Scrap'}: <strong>{defectiveWafers}</strong>
              </span>
            </div>

            {/* CMOS 5-Station Pipeline Pills */}
            <div className="hidden md:flex items-center space-x-1 pl-2 border-l border-slate-700/60 shrink-0">
              {pipelineOrder.map((secId) => {
                const sec = sectors[secId];
                if (!sec) return null;
                const isSelected = selectedSectorId === secId;
                const hasAlert = sec.activeHazardId !== null;
                const isWarning = sec.scrubberLoadPct > 85 || sec.health < 80;

                return (
                  <button
                    key={secId}
                    onClick={() => onSelectSector(secId)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
                      hasAlert
                        ? 'bg-rose-500/30 border border-rose-500 text-rose-200 font-bold animate-pulse'
                        : sec.bypassActive
                        ? 'bg-indigo-500/30 border border-indigo-400 text-indigo-200'
                        : isWarning
                        ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                        : isSelected
                        ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${sec.name} - Queue: ${sec.inputQueue}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasAlert
                          ? 'bg-rose-400 animate-ping'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span>{sec.code.replace('BAY ', 'B')}</span>
                  </button>
                );
              })}
            </div>

            {/* Flow State Indicator */}
            {flowStateSeconds > 0 && (
              <span className="hidden xl:flex items-center space-x-1 text-[10px] text-emerald-400 font-bold shrink-0">
                <TrendingUp className="w-3 h-3" />
                <span>Flow {flowStateSeconds}s</span>
              </span>
            )}
          </div>

          {/* Right Cluster: Tablet Launcher, TGMS, Score, Clock & Control Icons (Flex-Shrink-0) */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-auto">
            {/* Engineer Diagnostic Tablet Launcher */}
            <button
              onClick={onOpenTablet}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-slate-900/90 text-cyan-300 hover:bg-slate-800 hover:border-cyan-400 transition cursor-pointer text-[11px] font-bold shadow-sm"
              title="Open Diagnostics Tablet & Process Tuning"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isZh ? '機台調校平板' : 'Diagnostic Pad'}</span>
            </button>

            {/* TGMS Indicator */}
            <div
              className={`hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] ${
                activeHazard
                  ? 'bg-rose-500/20 border border-rose-500 text-rose-300 font-bold animate-pulse'
                  : 'bg-slate-900/80 border border-slate-800 text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{activeHazard ? 'TGMS TRIP' : 'TGMS 0.0'}</span>
            </div>

            {/* Safety Score */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">{isZh ? '工安' : 'EHS'}:</span>
              <span
                className={`font-bold ${
                  safetyScore >= 85
                    ? 'text-emerald-400'
                    : safetyScore >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {safetyScore}%
              </span>
            </div>

            {/* Shift Clock */}
            <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-white tabular-nums">
              {formatTime(shiftTimeRemainingSec)}
            </div>

            {/* Camera View Switcher */}
            <div className="hidden sm:flex items-center space-x-0.5 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onChangeCameraView('VR_FIRST_PERSON')}
                className={`p-1 rounded ${
                  cameraView === 'VR_FIRST_PERSON'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="VR First-Person (1)"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeCameraView('SUPERVISOR_ISOMETRIC')}
                className={`p-1 rounded ${
                  cameraView === 'SUPERVISOR_ISOMETRIC'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fab Bird-Eye View (2)"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeCameraView('INSPECTION')}
                className={`p-1 rounded ${
                  cameraView === 'INSPECTION'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bay Inspection (3)"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300 hover:text-white text-[10px] font-bold cursor-pointer transition-colors"
              title="Toggle Language"
            >
              {isZh ? 'EN' : '繁中'}
            </button>

            {/* Help / SOP */}
            <button
              onClick={onOpenInstructions}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white cursor-pointer transition-colors"
              title={t.howToPlay}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Mute */}
            <button
              onClick={onToggleMute}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title={isMuted ? t.unmuteAudio : t.muteAudio}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            {/* Pause */}
            <button
              onClick={onPause}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-amber-400 hover:text-white cursor-pointer transition-colors"
              title="Pause (Esc)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle Micro-Anomaly Jitter Ticker (Creeping Disasters warning) */}
        {anomalousSectors.length > 0 && !activeHazard && (
          <div className="mt-1 flex items-center justify-center">
            <div className="px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/50 text-[10px] text-amber-300 flex items-center space-x-2 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>
                {isZh
                  ? `【感測微幅異常波動】${anomalousSectors.map((s) => s.code).join(', ')} 腔體負載升高，請留意是否持續惡化`
                  : `[Sensor Jitter Detected] Elevated backpressure in ${anomalousSectors.map((s) => s.code).join(', ')}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Animated Score / Yield Delta Badges */}
      {floatingDeltas.length > 0 && (
        <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-30">
          {floatingDeltas.map((d) => (
            <div
              key={d.id}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold shadow-lg animate-bounce ${
                d.type === 'YIELD_UP'
                  ? 'bg-emerald-500/90 text-white border border-emerald-300'
                  : d.type === 'WAFER_GOOD'
                  ? 'bg-cyan-500/90 text-white border border-cyan-300'
                  : d.type === 'WAFER_SCRAP' || d.type === 'YIELD_DOWN'
                  ? 'bg-rose-500/90 text-white border border-rose-300'
                  : 'bg-amber-500/90 text-black border border-amber-300'
              }`}
            >
              {d.text}
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. FLOATING EMERGENCY ALERT CARD (3-Tiered Hazards)  */}
      {/* ==================================================== */}
      {activeHazard && (
        <div className="mx-auto max-w-xl w-full pointer-events-auto my-auto animate-fade-in font-mono">
          <div className="rounded-xl border-2 border-rose-500/90 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md">
            {/* Header with Level Tier Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  {t.emergencyIncident}
                </span>

                {/* Level Tier Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    activeHazard.level === 'LEVEL_3_FATAL_CRISIS'
                      ? 'bg-rose-900/60 border-rose-400 text-rose-200 animate-pulse'
                      : activeHazard.level === 'LEVEL_2_CHEMICAL_LEAK'
                      ? 'bg-amber-900/60 border-amber-400 text-amber-200'
                      : 'bg-blue-900/60 border-blue-400 text-blue-200'
                  }`}
                >
                  {activeHazard.level === 'LEVEL_3_FATAL_CRISIS'
                    ? (isZh ? 'LEVEL 3 即時致命危機' : 'LEVEL 3 FATAL CRISIS')
                    : activeHazard.level === 'LEVEL_2_CHEMICAL_LEAK'
                    ? (isZh ? 'LEVEL 2 化學/特殊氣體洩漏' : 'LEVEL 2 CHEMICAL / GAS LEAK')
                    : (isZh ? 'LEVEL 1 機械/傳輸異常' : 'LEVEL 1 MECHANICAL / LOTO')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {!activeHazard.isSilenced && (
                  <button
                    onClick={onSilenceAlarm}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/60 text-[10px] text-amber-300 transition-colors cursor-pointer"
                  >
                    🔕 {t.silenceAlarm}
                  </button>
                )}
                <span className="text-xs font-bold text-rose-300">
                  {t.timeCritical} <strong className="text-rose-400 tabular-nums">{activeHazard.timeRemainingSec.toFixed(1)}s</strong>
                </span>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  activeHazard.timeRemainingSec > 15
                    ? 'bg-emerald-500'
                    : activeHazard.timeRemainingSec > 7
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, (activeHazard.timeRemainingSec / activeHazard.timeLimitSec) * 100)}%`,
                }}
              />
            </div>

            <h3 className="text-sm font-bold text-white mb-1 font-sans">
              {isZh ? activeHazard.titleZh : activeHazard.title}
            </h3>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed font-sans">
              {isZh ? activeHazard.descZh : activeHazard.description}
            </p>

            {/* Protocol Choices (Randomized) */}
            {activeHazard.protocolSteps && activeHazard.protocolSteps.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-cyan-300 mb-2 font-sans">
                  {isZh ? activeHazard.currentPromptZh : activeHazard.currentPrompt}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeHazard.protocolSteps.map((step, idx) => (
                    <button
                      key={step.id || idx}
                      onClick={() => onSelectProtocolStep(step)}
                      className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-700/80 hover:border-cyan-400 hover:bg-slate-800 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-300 leading-tight font-sans">
                        {isZh ? step.labelZh : step.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 font-sans">
                        {isZh ? step.descZh : step.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {lastFeedback && (
        <div className="mx-auto max-w-sm w-full pointer-events-none mb-1">
          <div
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center space-x-2 shadow-xl backdrop-blur-md ${
              lastFeedback.isCorrect
                ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500/80 text-rose-200'
            }`}
          >
            {lastFeedback.isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div className="leading-tight text-[11px]">{lastFeedback.text}</div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2.5 DYNAMIC SOP INSTRUCTION & GUIDANCE BANNER        */}
      {/* ==================================================== */}
      <div className="pointer-events-auto mx-auto w-full max-w-4xl font-mono mb-2">
        {activeHazard ? (
          <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/95 via-slate-950/90 to-amber-950/95 border-2 border-rose-500/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-rose-900/60">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <span className="font-bold text-rose-300 text-xs tracking-wider font-sans">
                  {isZh ? '🚨 [SOP 緊急處置標準引導步驟]' : '🚨 [SOP EMERGENCY CONTAINMENT INSTRUCTIONS]'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/50">
                  {isZh
                    ? `目標機台: ${INITIAL_SECTORS[activeHazard.sectorId]?.nameZh}`
                    : `Target Bay: ${INITIAL_SECTORS[activeHazard.sectorId]?.code}`}
                </span>
              </div>
              <span className="text-xs font-bold text-rose-400 tabular-nums">
                {activeHazard.timeRemainingSec.toFixed(1)}s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              {/* Step 1: Bay Selection & Target */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  selectedSectorId === activeHazard.sectorId
                    ? 'bg-slate-900/90 border-cyan-500/80 text-cyan-200'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200 animate-pulse'
                }`}
              >
                <div className="font-bold mb-0.5">
                  {isZh ? '步驟 1: 切換目標機台' : 'Step 1: Switch Target Bay'}
                </div>
                <div>
                  {selectedSectorId === activeHazard.sectorId ? (
                    <span className="text-emerald-400 font-bold">
                      {isZh ? '✓ 已鎖定目標機台' : '✓ Target Bay Locked'}
                    </span>
                  ) : (
                    <span className="cursor-pointer" onClick={() => onSelectSector(activeHazard.sectorId)}>
                      {isZh
                        ? `👉 點選下方「${INITIAL_SECTORS[activeHazard.sectorId]?.code.split('/')[0]}」`
                        : `👉 Click ${INITIAL_SECTORS[activeHazard.sectorId]?.code} below`}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: Parameter De-escalation Target */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-200">
                <div className="font-bold mb-0.5 text-amber-300">
                  {isZh ? '步驟 2: 製程參數安全抑制' : 'Step 2: Safety De-escalation'}
                </div>
                <div>
                  {activeHazard.level === 'LEVEL_3_FATAL_CRISIS' ? (
                    <span className="text-rose-400 font-bold animate-pulse">
                      {isZh ? '⚠️ 立即拍下下方 EMO 急停！' : '⚠️ Strike EMO Button Below!'}
                    </span>
                  ) : selectedSector.rfPowerWatts > 900 ? (
                    <span>
                      {isZh
                        ? `拉降 RF 至 < 900W (目前: ${selectedSector.rfPowerWatts}W)`
                        : `Pull RF < 900W (Now: ${selectedSector.rfPowerWatts}W)`}
                    </span>
                  ) : selectedSector.gasFlowSccm > 50 ? (
                    <span>
                      {isZh
                        ? `切斷特氣至 < 50 sccm (目前: ${selectedSector.gasFlowSccm})`
                        : `Cut Gas < 50 sccm (Now: ${selectedSector.gasFlowSccm})`}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">
                      {isZh ? '✓ 參數已在受控範圍' : '✓ In Controlled Zone'}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: SOP Protocol Resolution */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-200">
                <div className="font-bold mb-0.5 text-cyan-300">
                  {isZh ? '步驟 3: 執行標準處置' : 'Step 3: Execute Protocol'}
                </div>
                <div>
                  {isZh ? '點選上方正確 SOP 卡牌完成隔離' : 'Pick correct SOP protocol card above'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md shadow-lg flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-cyan-300">
              <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">SOP GUIDANCE</span>
              <span>
                {isZh
                  ? '💡 即時製程平衡：點選下方機台微調 RF (產能) 與特氣 (良率)，注意洗滌塔負載超過 90% 將引發外溢！'
                  : '💡 Fab Balancing: Tune RF (Throughput) & Gas Flow (Yield). Keep Scrubber <90% to avoid toxic spill!'}
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-400">
              <span>{isZh ? '當前操作員:' : 'Operator:'}</span>
              <strong className="text-white">{playerName || 'Tech #402'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 3. PERMANENT DOCKED BAY 101~105 TUNING RACK          */}
      {/* ==================================================== */}
      <div className="pointer-events-auto mx-auto w-full max-w-4xl font-mono">
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/95 backdrop-blur-lg p-2.5 shadow-2xl text-xs">
          {/* Bay Selector Tabs (Bay 101 ~ 105) */}
          <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-800 overflow-x-auto">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline">
                {isZh ? '機台切換:' : 'BAY SELECT:'}
              </span>
              {pipelineOrder.map((secId) => {
                const s = sectors[secId];
                if (!s) return null;
                const isSelected = selectedSectorId === secId;
                const isAlert = s.activeHazardId !== null;
                const isWarn = s.scrubberLoadPct > 85 || s.health < 80;
                const bayCode = s.code.split('/')[0].trim();

                return (
                  <button
                    key={secId}
                    onClick={() => onSelectSector(secId)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                        : isAlert
                        ? 'bg-rose-500/30 border border-rose-500 text-rose-200 animate-pulse'
                        : isWarn
                        ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAlert
                          ? 'bg-rose-400 animate-ping'
                          : isWarn
                          ? 'bg-amber-400'
                          : isSelected
                          ? 'bg-cyan-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span>{bayCode}</span>
                    <span className="text-[10px] opacity-75 hidden sm:inline">
                      {isZh ? s.nameZh.substring(0, 4) : s.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Status of currently inspected bay */}
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 shrink-0">
              <span className="hidden sm:inline">
                {isZh ? '腔溫' : 'Temp'}: <strong className="text-white">{selectedSector.temperatureC.toFixed(0)}°C</strong>
              </span>
              <span>
                {isZh ? '健康度' : 'Health'}: <strong className="text-emerald-400">{selectedSector.health}%</strong>
              </span>
              <span>
                {isZh ? '產速' : 'Speed'}: <strong className="text-cyan-300">{selectedSector.efficiency}%</strong>
              </span>
              <button
                onClick={onOpenTablet}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] hidden sm:flex items-center space-x-1 cursor-pointer"
                title="開啟檢驗診斷面板"
              >
                <Sliders className="w-3 h-3" />
                <span>{isZh ? '深度診斷' : 'Tablet'}</span>
              </button>
            </div>
          </div>

          {/* 4 Interactive Live Tuning Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
            {/* Slider 1: RF Power */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>RF 功率 (Power)</span>
                </span>
                <span className="font-bold text-amber-400 tabular-nums">{selectedSector.rfPowerWatts} W</span>
              </div>
              <input
                type="range"
                min="500"
                max="2500"
                step="50"
                value={selectedSector.rfPowerWatts}
                onChange={(e) =>
                  onTuneSectorParams?.(selectedSectorId, { rfPowerWatts: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>500W</span>
                <span className="text-cyan-400 font-bold">產出 +{Math.round(selectedSector.efficiency * 1.2)}/h</span>
                <span>2500W</span>
              </div>
            </div>

            {/* Slider 2: Gas Flow */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  <span>特氣流量 (Gas Flow)</span>
                </span>
                <span className="font-bold text-cyan-400 tabular-nums">{selectedSector.gasFlowSccm} sccm</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={selectedSector.gasFlowSccm}
                onChange={(e) =>
                  onTuneSectorParams?.(selectedSectorId, { gasFlowSccm: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>0 sccm</span>
                <span className="text-emerald-400 font-bold">
                  良率 +{Math.min(15, selectedSector.gasFlowSccm / 20).toFixed(1)}%
                </span>
                <span>300 sccm</span>
              </div>
            </div>

            {/* Slider 3: Chamber Vacuum */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-400" />
                  <span>腔體真空 (Vacuum)</span>
                </span>
                <span className="font-bold text-purple-400 tabular-nums">{selectedSector.chamberVacuumTorr} Torr</span>
              </div>
              <input
                type="range"
                min="1"
                max="760"
                step="5"
                value={selectedSector.chamberVacuumTorr}
                onChange={(e) =>
                  onTuneSectorParams?.(selectedSectorId, { chamberVacuumTorr: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>0.01T (真空)</span>
                <span className="text-slate-400">微塵 {selectedSector.particleCountPPM.toFixed(1)} PPM</span>
                <span>760T (大氣)</span>
              </div>
            </div>

            {/* Scrubber Gauge & Critical Action Buttons */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">洗滌塔排氣負載</span>
                <span
                  className={`font-bold tabular-nums ${
                    selectedSector.scrubberLoadPct > 90
                      ? 'text-rose-400 animate-pulse'
                      : selectedSector.scrubberLoadPct > 75
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {Math.round(selectedSector.scrubberLoadPct)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedSector.scrubberLoadPct > 90
                      ? 'bg-rose-500'
                      : selectedSector.scrubberLoadPct > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, selectedSector.scrubberLoadPct)}%` }}
                />
              </div>

              <div className="flex items-center gap-1.5 mt-auto">
                <button
                  onClick={() => onHitEmo(selectedSectorId)}
                  className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center space-x-1 cursor-pointer"
                  title="緊急斷電停機 / Emergency Off"
                >
                  <span>EMO 急停</span>
                </button>
                <button
                  onClick={() =>
                    onTuneSectorParams?.(selectedSectorId, { bypassActive: !selectedSector.bypassActive })
                  }
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    selectedSector.bypassActive
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="切換晶圓繞道分流"
                >
                  {selectedSector.bypassActive ? '分流中' : '繞道分流'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
