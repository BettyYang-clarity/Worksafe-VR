import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Eye,
  Flame,
  Footprints,
  HelpCircle,
  Layers,
  MessageSquare,
  Pause,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  CameraViewMode,
  EhsDecisionFeedback,
  EquippedPPE,
  FloatingDelta,
  HazardIncident,
  PreAlarmState,
  ProtocolStep,
  RequiredPPECode,
  SectorId,
  SectorState,
  SectorTuneParams,
  TroubleshootingOption,
  WaferLotMission,
  GameDifficulty,
} from '../types/game';
import { INITIAL_SECTORS } from '../data/protocols';
import { ON_SITE_DISTANCE_THRESHOLD_M, OffscreenIndicator } from '../3d/FabScene';
import { ActionEffectType } from '../3d/ParticleEffects';

interface HUDOverlayProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenInstructions: () => void;
  onOpenFeedback: () => void;
  onSilenceAlarm: () => void;
  shiftTimeRemainingSec: number;
  overallYieldPct: number;
  totalWafersProduced: number;
  defectiveWafers: number;
  safetyScore: number;
  fabValueSavedMillionsUSD: number;
  activeHazard: HazardIncident | null;
  activePreAlarm: PreAlarmState | null;
  sectors: Record<SectorId, SectorState>;
  selectedSectorId: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
  onWalkToSector: (sectorId: SectorId) => void;
  onPreventPreAlarm: (sectorId: SectorId, option?: TroubleshootingOption) => void;
  onSelectProtocolStep: (step: ProtocolStep) => void;
  onHitEmo: (sectorId: SectorId) => void;
  onTriggerPhysicalAction: (type: ActionEffectType, sectorId: SectorId) => void;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraView: CameraViewMode;
  onChangeCameraView: (mode: CameraViewMode) => void;
  ehsDecisionFeedback: EhsDecisionFeedback | null;
  onDismissFeedback: () => void;
  flowStateSeconds?: number;
  floatingDeltas?: FloatingDelta[];
  playerName?: string;
  onTuneSectorParams?: (sectorId: SectorId, params: SectorTuneParams) => void;
  bayDistances: Record<SectorId, number>;
  isAutoWalking: boolean;
  walkingTargetSector: SectorId | null;
  offscreenIndicators: OffscreenIndicator[];
  equippedPPE: EquippedPPE;
  onTogglePPE: (key: keyof EquippedPPE) => void;
  lotMission: WaferLotMission | null;
  difficultyMode?: GameDifficulty;
  isTutorialActive?: boolean;
}

const PPE_META: Record<
  RequiredPPECode,
  { key: keyof EquippedPPE; icon: string; nameEn: string; nameZh: string }
> = {
  SCBA: {
    key: 'scba',
    icon: '😷',
    nameEn: 'Positive-Pressure SCBA Respirator',
    nameZh: 'SCBA 正壓自給式呼吸器',
  },
  ACID_SUIT: {
    key: 'acidSuit',
    icon: '🧤',
    nameEn: 'Chemical Acid Apron & Face Shield',
    nameZh: '防酸化學防護服與面罩',
  },
  HV_GLOVES: {
    key: 'hvGloves',
    icon: '⚡',
    nameEn: 'Class-00 HV Insulating / LOTO Gloves',
    nameZh: 'Class-00 高壓絕緣/防夾手套',
  },
};

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  language,
  onToggleLanguage,
  onOpenInstructions,
  onOpenFeedback,
  onSilenceAlarm,
  shiftTimeRemainingSec,
  overallYieldPct,
  totalWafersProduced,
  safetyScore,
  fabValueSavedMillionsUSD,
  activeHazard,
  activePreAlarm,
  sectors,
  selectedSectorId,
  onSelectSector,
  onWalkToSector,
  onPreventPreAlarm,
  onSelectProtocolStep,
  onHitEmo,
  onTriggerPhysicalAction,
  onPause,
  isMuted,
  onToggleMute,
  cameraView,
  onChangeCameraView,
  ehsDecisionFeedback,
  onDismissFeedback,
  floatingDeltas = [],
  playerName,
  onTuneSectorParams,
  bayDistances,
  isAutoWalking,
  walkingTargetSector,
  offscreenIndicators,
  equippedPPE,
  onTogglePPE,
  lotMission,
  difficultyMode = 'ASSISTED',
  isTutorialActive = false,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';
  const [isDockCollapsed, setIsDockCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Auto-collapse bottom dock on short screens (mobile landscape <= 540px) during incidents
  // On desktop / laptop (where window.innerHeight >= 700px), this NEVER triggers so PC layout is 100% untouched.
  useEffect(() => {
    if ((activeHazard || activePreAlarm) && typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsDockCollapsed(true);
    }
  }, [activeHazard, activePreAlarm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedSector = sectors[selectedSectorId] || Object.values(sectors)[0];
  const selectedBayDist = bayDistances[selectedSectorId] ?? 10.0;
  const isSelectedBayOnSite = selectedBayDist <= ON_SITE_DISTANCE_THRESHOLD_M;

  const hazardBayDist = activeHazard ? bayDistances[activeHazard.sectorId] ?? 10.0 : 0;
  const isHazardBayOnSite = activeHazard ? hazardBayDist <= ON_SITE_DISTANCE_THRESHOLD_M : true;

  const preAlarmBayDist = activePreAlarm ? bayDistances[activePreAlarm.sectorId] ?? 10.0 : 0;
  const isPreAlarmBayOnSite = activePreAlarm
    ? preAlarmBayDist <= ON_SITE_DISTANCE_THRESHOLD_M
    : true;

  // Check Required PPE for Active Hazard
  const requiredPpeCode: RequiredPPECode | null = activeHazard
    ? activeHazard.ehsPillars.recommendedPPE
    : null;
  const requiredPpeInfo = requiredPpeCode ? PPE_META[requiredPpeCode] : null;
  const isRequiredPpeEquipped = requiredPpeInfo ? equippedPPE[requiredPpeInfo.key] : true;

  // Unprotected exposure warning if standing < 5.5m near an active hazard without required PPE
  const isUnprotectedHazardExposure = Boolean(
    activeHazard && isHazardBayOnSite && !isRequiredPpeEquipped
  );

  const anyPpeEquipped = equippedPPE.scba || equippedPPE.acidSuit || equippedPPE.hvGloves;

  const pipelineOrder: SectorId[] = [
    'PHOTOLITHOGRAPHY',
    'ETCH_CVD',
    'CMP_WET_BENCH',
    'DIFFUSION_FURNACE',
    'ION_IMPLANTATION',
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2 md:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] overflow-hidden select-none">
      {/* ==================================================== */}
      {/* SCENE PPE VISOR HUD & UNPROTECTED EXPOSURE VIGNETTE  */}
      {/* ==================================================== */}
      {isUnprotectedHazardExposure && requiredPpeInfo && (
        <div className="fixed inset-0 pointer-events-none z-20 border-[6px] border-rose-500/80 shadow-[inset_0_0_75px_rgba(244,63,94,0.45)] animate-pulse flex items-end justify-center pb-36">
          <div className="px-4 py-1.5 rounded-full bg-rose-950/95 border-2 border-rose-400 text-rose-100 font-mono text-xs font-bold shadow-2xl">
            🚨{' '}
            {isZh
              ? `危險暴露警告！您已進入事故現場 (<5.5m) 但尚未穿戴【${requiredPpeInfo.icon} ${requiredPpeInfo.nameZh}】！`
              : `UNPROTECTED EXPOSURE! You are On-Site (<5.5m) without [${requiredPpeInfo.icon} ${requiredPpeInfo.nameEn}]!`}
          </div>
        </div>
      )}

      {anyPpeEquipped && !isUnprotectedHazardExposure && (
        <div className="fixed inset-0 pointer-events-none z-10 border-[3px] border-emerald-400/35 shadow-[inset_0_0_35px_rgba(16,185,129,0.12)]" />
      )}

      {/* ==================================================== */}
      {/* OFF-SCREEN DIRECTIONAL THREAT POINTERS                */}
      {/* ==================================================== */}
      {offscreenIndicators.map((ind) => {
        const bayCode = INITIAL_SECTORS[ind.sectorId]?.code.split('/')[0].trim() || ind.sectorId;
        const isCrit = ind.status === 'CRITICAL';
        return (
          <button
            key={ind.sectorId}
            onClick={() => {
              onSelectSector(ind.sectorId);
              onWalkToSector(ind.sectorId);
            }}
            style={{
              left: `${ind.xPct}%`,
              top: `${ind.yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`pointer-events-auto fixed z-30 px-2.5 py-1.5 rounded-full border-2 font-mono text-[11px] font-bold flex items-center space-x-1.5 shadow-2xl transition-transform hover:scale-110 cursor-pointer ${
              isCrit
                ? 'bg-rose-950/95 border-rose-400 text-rose-200 animate-pulse'
                : 'bg-amber-950/95 border-amber-400 text-amber-200'
            }`}
            title={isZh ? '點擊立即轉向並走往該機台' : 'Click to walk to this alerting bay'}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isCrit ? '🚨' : '⚠️'} {bayCode} ({ind.distanceM.toFixed(1)}m)
            </span>
          </button>
        );
      })}

      {/* ==================================================== */}
      {/* 1. TOP STATUS, PIPELINE & CAMERA SWITCHER BAR         */}
      {/* ==================================================== */}
      <div className="w-full pointer-events-auto space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/70 shadow-xl text-xs font-mono">
          {/* Left Cluster: Engineer Badge, Yield, Good/Scrap, Value Saved & 5-Bay CMOS Pipeline */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto min-w-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[11px] text-cyan-300 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="truncate max-w-[125px]">{playerName || 'Alex Chen #402'}</span>
            </div>

            {difficultyMode === 'ASSISTED' ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-[10px] text-emerald-300 font-bold shrink-0">
                🟢 {isZh ? 'AI 引導' : 'AI Guided'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-[10px] text-rose-300 font-bold shrink-0">
                🔴 {isZh ? '專業模式' : 'PRO'}
              </span>
            )}

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
                {isZh ? '良品' : 'Good'}: <strong className="text-white">{totalWafersProduced}</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-amber-300 hidden sm:inline" title="Protected Fab Asset Value">
                💎 <strong>${fabValueSavedMillionsUSD.toFixed(1)}M</strong>
              </span>
            </div>

            {/* Live 5-Bay CMOS Wafer Pipeline Strip */}
            <div className="hidden lg:flex items-center space-x-1 pl-2 border-l border-slate-700/60 shrink-0">
              {pipelineOrder.map((secId, idx) => {
                const sec = sectors[secId];
                if (!sec) return null;
                const isSelected = selectedSectorId === secId;
                const hasCrisis = sec.activeHazardId !== null;
                const hasPreAlarm = sec.preAlarm !== null;
                const dist = bayDistances[secId] ?? 10;
                const isHere = dist <= ON_SITE_DISTANCE_THRESHOLD_M;

                return (
                  <React.Fragment key={secId}>
                    <button
                      onClick={() => onSelectSector(secId)}
                      onDoubleClick={() => onWalkToSector(secId)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
                        hasCrisis
                          ? 'bg-rose-500/30 border border-rose-500 text-rose-200 font-bold animate-pulse'
                          : hasPreAlarm
                          ? 'bg-amber-500/30 border border-amber-400 text-amber-200 font-bold animate-pulse'
                          : isSelected
                          ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={`${sec.name} (${dist.toFixed(1)}m) - Double-click to Walk Here`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasCrisis
                            ? 'bg-rose-400 animate-ping'
                            : hasPreAlarm
                            ? 'bg-amber-400 animate-ping'
                            : isHere
                            ? 'bg-cyan-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>{sec.code.split('/')[0].replace('BAY-', 'B')}</span>
                      {isHere && <span className="text-[9px] text-cyan-300">📍</span>}
                    </button>
                    {idx < pipelineOrder.length - 1 && (
                      <span className="text-[9px] text-cyan-500/70 font-bold">➔</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Cluster: EHS Score, Clock, 1/2/3 Camera View Switcher (incl. Whole Fab View 2), Help, Feedback, Mute, Pause */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-auto">
            {/* EHS Compliance Score */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px]">
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
            <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-bold text-white tabular-nums">
              {formatTime(shiftTimeRemainingSec)}
            </div>

            {/* 1 / 2 / 3 Camera View Switcher (Preserves Whole Fab View 2!) */}
            <div className="flex items-center space-x-0.5 bg-slate-900/95 border border-slate-700/80 rounded-lg p-0.5">
              <button
                onClick={() => onChangeCameraView('VR_FIRST_PERSON')}
                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                  cameraView === 'VR_FIRST_PERSON'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="1: First-Person Walkthrough View"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden xl:inline">{isZh ? '1 第一人稱' : '1 Walk'}</span>
                <span className="xl:hidden">1</span>
              </button>
              <button
                onClick={() => onChangeCameraView('SUPERVISOR_ISOMETRIC')}
                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                  cameraView === 'SUPERVISOR_ISOMETRIC'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="2: Whole Fab Bird's-Eye View (See your 3D Engineer Avatar & PPE!)"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden xl:inline">{isZh ? '2 全廠俯視' : '2 Whole Fab'}</span>
                <span className="xl:hidden">2</span>
              </button>
              <button
                onClick={() => onChangeCameraView('INSPECTION')}
                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                  cameraView === 'INSPECTION'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="3: Close-Up Machine Inspection View"
              >
                <Camera className="w-3 h-3" />
                <span className="hidden xl:inline">{isZh ? '3 機台特寫' : '3 Inspect'}</span>
                <span className="xl:hidden">3</span>
              </button>
            </div>

            {/* 4-Pillar EHS Field Guide Button */}
            <button
              onClick={onOpenInstructions}
              className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 hover:bg-cyan-500/30 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
              title={t.howToPlay}
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden md:inline">{isZh ? '工安手冊' : 'Guide'}</span>
            </button>

            {/* In-Game Feedback Button */}
            <button
              onClick={onOpenFeedback}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 hover:text-white cursor-pointer transition-colors"
              title={isZh ? '問卷回饋' : 'Feedback'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300 hover:text-white text-[10px] font-bold cursor-pointer transition-colors"
              title="Toggle Language"
            >
              {isZh ? 'EN' : '繁中'}
            </button>

            {/* Mute */}
            <button
              onClick={onToggleMute}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title={isMuted ? t.unmuteAudio : t.muteAudio}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
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

        {/* ==================================================== */}
        {/* 2. ALWAYS-ON LIVE ENGINEER CO-PILOT BANNER           */}
        {/* ==================================================== */}
        {!activeHazard && !activePreAlarm && (
          <div className="mx-auto max-w-4xl w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono font-bold text-[10px] shrink-0 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>{isZh ? '工程師即時指引' : 'ENGINEER CO-PILOT'}</span>
              </span>
              {lotMission ? (
                <div className="text-slate-200 truncate flex items-center space-x-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    {lotMission.lotCode}
                  </span>
                  <span className="text-slate-100 font-bold">
                    {isZh ? '巡廠目標：' : 'Shift Goal: '}
                  </span>
                  <span className="text-slate-300">
                    {isZh
                      ? `巡視機台或微調下方滑桿提升良率；請隨時留意突發警報 (${lotMission.titleZh})`
                      : `Inspect bays or tune sliders to boost yield; watch for alarms (${lotMission.title})`}
                  </span>
                </div>
              ) : (
                <div className="text-slate-200">
                  {isZh
                    ? '各區運轉正常！請巡視機台並微調下方配方滑桿以提升良率，隨時留意突發警報。'
                    : 'All bays nominal! Walk fab and tune recipe sliders to boost yield; watch for alerts.'}
                </div>
              )}
            </div>

            {lotMission && (
              <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                  {isZh ? '批次進度' : 'Lot'}:{' '}
                  {Math.min(
                    lotMission.targetWaferCount,
                    Math.max(0, totalWafersProduced - lotMission.startWaferCount)
                  )}
                  /{lotMission.targetWaferCount}
                </span>
                <button
                  onClick={() => {
                    onSelectSector(lotMission.targetSectorId);
                    onWalkToSector(lotMission.targetSectorId);
                  }}
                  className="px-2.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/60 text-cyan-200 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Footprints className="w-3 h-3" />
                  <span>
                    {isZh
                      ? `前往 ${INITIAL_SECTORS[lotMission.targetSectorId].code.split('/')[0].trim()}`
                      : `Walk to ${INITIAL_SECTORS[lotMission.targetSectorId].code.split('/')[0].trim()}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Animated Score / Yield Delta Badges */}
      {floatingDeltas.length > 0 && (
        <div className="pointer-events-none fixed top-24 right-5 flex flex-col items-end gap-1.5 z-30">
          {floatingDeltas.slice(-4).map((d) => (
            <div
              key={d.id}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold shadow-xl animate-fade-in ${
                d.type === 'YIELD_UP'
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/70'
                  : d.type === 'WAFER_GOOD'
                  ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/70'
                  : d.type === 'WAFER_SCRAP' || d.type === 'YIELD_DOWN'
                  ? 'bg-rose-950/90 text-rose-200 border border-rose-500/70'
                  : 'bg-amber-950/90 text-amber-200 border border-amber-500/70'
              }`}
            >
              {d.text}
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. AMBER EQUIPMENT DIAGNOSTIC & TROUBLESHOOTING CARD */}
      {/* ==================================================== */}
      {activePreAlarm && !activeHazard && (
        <div className="mx-auto max-w-3xl w-full pointer-events-auto mt-1 mb-auto animate-fade-in max-h-[50vh] md:max-h-[calc(100dvh-70px)] overflow-y-auto pr-1">
          <div className="rounded-2xl border-2 border-amber-400/90 bg-slate-950/95 p-3 md:p-4 shadow-2xl backdrop-blur-md space-y-2 md:space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                <div>
                  <div className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    {isZh
                      ? '🔧 [製程設備故障診斷 · 工程師排障挑戰]'
                      : '🔧 [EQUIPMENT DIAGNOSTIC & TROUBLESHOOTING PUZZLE]'}
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white">
                    {isZh ? activePreAlarm.titleZh : activePreAlarm.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2 font-mono">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    isPreAlarmBayOnSite
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900 border-amber-400/60 text-amber-200'
                  }`}
                >
                  {isPreAlarmBayOnSite
                    ? isZh
                      ? `📍 已在現場 (${preAlarmBayDist.toFixed(1)}m)`
                      : `📍 ON-SITE (${preAlarmBayDist.toFixed(1)}m)`
                    : isZh
                    ? `📡 距離機台 ${preAlarmBayDist.toFixed(1)}m`
                    : `📡 Distance ${preAlarmBayDist.toFixed(1)}m`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold tabular-nums">
                  ⏳ {activePreAlarm.timeRemainingSec}s
                </span>
              </div>
            </div>

            {/* Live Chamber Diagnostic Clues + Wafer Defect Pattern */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="md:col-span-2 p-2.5 rounded-xl bg-slate-900/95 border border-amber-500/40">
                <div className="font-bold text-amber-300 text-[11px] mb-1 flex items-center justify-between">
                  <span>
                    {isZh ? '📊 機台即時感測器異常線索 (Sensor Clues)：' : '📊 Live Chamber Sensor Symptoms:'}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {isZh ? '請依線索判斷根因' : 'Diagnose Root Cause'}
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-200 font-mono">
                  {(isZh ? activePreAlarm.symptomsZh : activePreAlarm.symptoms).map((sym, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-400 font-bold">▸</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-rose-300 text-[11px] mb-0.5">
                    {isZh ? '🔬 晶圓缺陷圖譜 (Wafer Map)：' : '🔬 Wafer Defect Signature:'}
                  </div>
                  <p className="text-amber-100 text-[11px] font-mono leading-snug">
                    {isZh ? activePreAlarm.waferDefectPatternZh : activePreAlarm.waferDefectPattern}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-rose-500/20 text-[10px] text-rose-200/90">
                  <strong>{isZh ? '⚠️ 誤判後果：' : '⚠️ If Misdiagnosed: '}</strong>
                  {isZh ? activePreAlarm.consequenceIfIgnoredZh : activePreAlarm.consequenceIfIgnored}
                </div>
              </div>
            </div>

            {/* Step 1: Walk to Bay OR Step 2: 3 Engineering Troubleshooting Options */}
            <div className="pt-1">
              {!isPreAlarmBayOnSite ? (
                <button
                  onClick={() => {
                    onSelectSector(activePreAlarm.sectorId);
                    onWalkToSector(activePreAlarm.sectorId);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
                >
                  <Footprints className="w-4 h-4" />
                  <span>
                    {isAutoWalking && walkingTargetSector === activePreAlarm.sectorId
                      ? isZh
                        ? `🏃 正在走往 ${INITIAL_SECTORS[activePreAlarm.sectorId].code.split('/')[0]} 診斷 (${preAlarmBayDist.toFixed(1)}m)...`
                        : `🏃 Walking to Bay to Diagnose (${preAlarmBayDist.toFixed(1)}m)...`
                      : isZh
                      ? `🏃 第一步：點擊走往 ${INITIAL_SECTORS[activePreAlarm.sectorId].code.split('/')[0]} 現場 (<5.5m) 開啟 3 項工程排障決策`
                      : `🏃 Step 1: Click to Walk to ${INITIAL_SECTORS[activePreAlarm.sectorId].code.split('/')[0]} (<5.5m) to Unlock 3 Troubleshooting Fixes`}
                  </span>
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300">
                      {isZh
                        ? '🧠 第二步：請根據上方感測器線索，選擇正確的「工程故障排除方案」：'
                        : '🧠 Step 2: Based on the sensor symptoms above, choose the Root-Cause Engineering Fix:'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      {isZh ? '不同選擇將產生截然不同的結果！' : 'Choices have distinct outcomes!'}
                    </span>
                  </div>

                  {(difficultyMode === 'ASSISTED' || isTutorialActive) && activePreAlarm.howToPreventZh && (
                    <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold text-emerald-300">
                          {isZh ? '💡 AI 診斷導引：' : '💡 AI Diagnostic Hint: '}
                        </span>
                        <span>{isZh ? activePreAlarm.howToPreventZh : activePreAlarm.howToPrevent}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activePreAlarm.troubleshootingOptions.map((opt, idx) => (
                      <button
                        key={opt.id || idx}
                        onClick={() => onPreventPreAlarm(activePreAlarm.sectorId, opt)}
                        className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 hover:border-amber-400 hover:bg-slate-800/95 text-left transition-all group cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono text-slate-400">
                              {isZh ? `方案 ${idx + 1}` : `Option ${idx + 1}`}
                            </span>
                            {(difficultyMode === 'ASSISTED' || isTutorialActive) && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  opt.outcomeType === 'SOLVE'
                                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                                    : opt.outcomeType === 'PARTIAL'
                                    ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                                    : 'bg-rose-950/80 border-rose-400 text-rose-300'
                                }`}
                              >
                                {opt.outcomeType === 'SOLVE'
                                  ? isZh
                                    ? '推薦'
                                    : 'Best'
                                  : opt.outcomeType === 'PARTIAL'
                                  ? isZh
                                    ? '治標'
                                    : 'Partial'
                                  : isZh
                                  ? '誤判'
                                  : 'Risk'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 leading-snug">
                            🔧 {isZh ? opt.labelZh : opt.label}
                          </div>
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center justify-between">
                          <span>{isZh ? '執行此方案' : 'Execute Fix'}</span>
                          <span>👉</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. RED EMERGENCY CRISIS CARD (PPE Crucial Step + SOP)*/}
      {/* ==================================================== */}
      {activeHazard && (
        <div className="mx-auto max-w-3xl w-full pointer-events-auto mt-1 mb-auto animate-fade-in max-h-[50vh] md:max-h-[calc(100dvh-70px)] overflow-y-auto pr-1">
          <div className="rounded-2xl border-2 border-rose-500/95 bg-slate-950/95 p-3 md:p-4 shadow-2xl backdrop-blur-md space-y-2 md:space-y-2.5">
            {/* Header with Level Tier, Mute Siren & Comfortable 60s Timer */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-500 animate-bounce shrink-0" />
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  {t.emergencyIncident}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-400 text-rose-200 text-[10px] font-mono font-bold">
                  {activeHazard.regulatoryStandard}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold">
                  ${activeHazard.ehsPillars.estimatedLossMillionsUSD.toFixed(1)}M Risk
                </span>
              </div>

              <div className="flex items-center space-x-2 font-mono">
                {!activeHazard.isSilenced && (
                  <button
                    onClick={onSilenceAlarm}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/60 text-[10px] text-amber-300 transition-colors cursor-pointer"
                  >
                    🔕 {t.silenceAlarm}
                  </button>
                )}
                <span className="text-xs font-bold text-rose-200 bg-rose-950/80 border border-rose-500/50 px-2.5 py-0.5 rounded-lg tabular-nums">
                  {t.timeCritical} {activeHazard.timeRemainingSec.toFixed(0)}s
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  activeHazard.timeRemainingSec > 20
                    ? 'bg-emerald-500'
                    : activeHazard.timeRemainingSec > 10
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (activeHazard.timeRemainingSec / activeHazard.timeLimitSec) * 100
                  )}%`,
                }}
              />
            </div>

            <div>
              <h3 className="text-sm md:text-base font-bold text-white">
                {isZh ? activeHazard.titleZh : activeHazard.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {isZh ? activeHazard.descZh : activeHazard.description}
              </p>
            </div>

            {/* ==================================================== */}
            {/* TWO-PHASE CONNECTION BADGE: PHASE 1 OUTCOME & CONTEXT */}
            {/* (Hidden for direct crises that had no Phase 1 troubleshooting) */}
            {/* ==================================================== */}
            {activeHazard.containmentMode && (
            <div
              className={`p-2 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                activeHazard.containmentMode === 'CONTROLLED'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : activeHazard.containmentMode === 'MODERATE'
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
              }`}
            >
              <span className="text-sm shrink-0">
                {activeHazard.containmentMode === 'CONTROLLED'
                  ? '🛡️'
                  : activeHazard.containmentMode === 'MODERATE'
                  ? '⚠️'
                  : '💥'}
              </span>
              <div>
                <span className="font-bold">
                  {activeHazard.containmentMode === 'CONTROLLED'
                    ? isZh
                      ? '第一階段工程排障受控（晶圓零報廢 · 3D 危害已抑制）'
                      : 'Phase 1 Controlled (Zero Wafer Scrap · Hazard Suppressed)'
                    : activeHazard.containmentMode === 'MODERATE'
                    ? isZh
                      ? '第一階段治標未治本（8 片晶圓異常報廢 · 罰扣 5 分）'
                      : 'Phase 1 Partial Fix (8 Wafers Scrapped · -5 Pts)'
                    : isZh
                    ? '第一階段排障失誤／超時（10~12 片晶圓報廢 · 罰扣 10~12 分）'
                    : 'Phase 1 Uncontrolled / Timed Out (10-12 Wafers Scrapped · -10-12 Pts)'}
                </span>
                <span className="opacity-90 ml-1">
                  ➔{' '}
                  {activeHazard.containmentMode === 'CONTROLLED'
                    ? isZh
                      ? '第二階段：請依規穿戴必備 PPE，完成現場殘留危害標準 SOP 隔離處置（每階段 70s）'
                      : 'Phase 2: Equip mandatory PPE & execute residual SOP isolation (70s per stage)'
                    : activeHazard.containmentMode === 'MODERATE'
                    ? isZh
                      ? '第二階段：殘留危害擴散，請立即穿戴 PPE 執行現場應變 SOP（每階段 60s）'
                      : 'Phase 2: Residual hazard spreading, equip PPE & execute SOP (60s per stage)'
                    : isZh
                    ? '第二階段：災情全面失控！請緊急穿戴 PPE 搶救現場（每階段 50s）'
                    : 'Phase 2: Outbreak! Equip PPE immediately for emergency containment (50s per stage)'}
                </span>
              </div>
            </div>
            )}

            {/* ==================================================== */}
            {/* CRUCIAL STEP 1: MANDATORY PPE INSTRUCTION BANNER      */}
            {/* ==================================================== */}
            {requiredPpeInfo && (
              <div
                className={`p-2.5 rounded-xl border-2 flex flex-wrap items-center justify-between gap-2 text-xs transition-all ${
                  isRequiredPpeEquipped
                    ? 'bg-emerald-950/60 border-emerald-400/80 text-emerald-100'
                    : 'bg-amber-950/80 border-amber-400 text-amber-100 animate-pulse'
                }`}
              >
                <div className="flex items-start space-x-2 flex-1 min-w-[240px]">
                  {isRequiredPpeEquipped ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold font-mono text-[11px]">
                      {isRequiredPpeEquipped
                        ? isZh
                          ? `✅ 關鍵防護步驟完成：已穿戴【${requiredPpeInfo.icon} ${requiredPpeInfo.nameZh}】`
                          : `✅ CRUCIAL PPE STEP VERIFIED: [${requiredPpeInfo.icon} ${requiredPpeInfo.nameEn}] Equipped`
                        : isZh
                        ? `🚨 關鍵步驟 1 (必備 PPE 指引)：請先穿戴【${requiredPpeInfo.icon} ${requiredPpeInfo.nameZh}】！`
                        : `🚨 CRUCIAL STEP 1 (MANDATORY PPE): Equip [${requiredPpeInfo.icon} ${requiredPpeInfo.nameEn}] First!`}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {isZh
                        ? activeHazard.ehsPillars.ppeInstructionZh
                        : activeHazard.ehsPillars.ppeInstruction}
                    </div>
                  </div>
                </div>

                {!isRequiredPpeEquipped && (
                  <button
                    onClick={() => onTogglePPE(requiredPpeInfo.key)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs flex items-center space-x-1.5 shrink-0 shadow-lg cursor-pointer"
                  >
                    <span>{requiredPpeInfo.icon}</span>
                    <span>
                      {isZh
                        ? `立即穿戴 ${requiredPpeInfo.nameZh.split(' ')[0]}`
                        : `Equip ${requiredPpeInfo.nameEn.split(' ')[0]} Now`}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Guided Step 2 (Walk On-Site) OR Step 3 (Make Critical SOP Decision) */}
            {!isHazardBayOnSite ? (
              <div className="p-3 rounded-xl bg-amber-950/50 border-2 border-amber-400/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-100">
                  <div className="font-bold text-amber-300">
                    {isZh
                      ? `📍 工程師指引 Step 2：您目前距離事故機台 ${hazardBayDist.toFixed(1)} 公尺`
                      : `📍 Co-Pilot Step 2: You are ${hazardBayDist.toFixed(1)}m away from the incident bay`}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {isZh
                      ? '請確認穿戴好上方指示之 PPE 後，走近事故機台 (< 5.5m) 解鎖 3 項關鍵緊急應變決策！'
                      : 'Equip the instructed PPE above and walk to the incident bay (< 5.5m) to unlock the 3 critical SOP choices!'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSelectSector(activeHazard.sectorId);
                    onWalkToSector(activeHazard.sectorId);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shrink-0 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  <Footprints className="w-4 h-4" />
                  <span>
                    {isAutoWalking && walkingTargetSector === activeHazard.sectorId
                      ? isZh
                        ? `🏃 正在趕往現場 (${hazardBayDist.toFixed(1)}m)...`
                        : `🏃 Walking to Bay (${hazardBayDist.toFixed(1)}m)...`
                      : isZh
                      ? `🏃 點擊立即趕往 ${INITIAL_SECTORS[activeHazard.sectorId].code.split('/')[0]}`
                      : `🏃 Walk to ${INITIAL_SECTORS[activeHazard.sectorId].code.split('/')[0]} Now`}
                  </span>
                </button>
              </div>
            ) : (
              /* Unspoiled Critical Player Decision (3 Randomized SOP Choices) */
              <div className="pt-1 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <div className="text-xs font-bold text-cyan-300">
                    🧠 {isZh ? activeHazard.currentPromptZh : activeHazard.currentPrompt}{' '}
                    <span className="text-[10px] font-mono text-slate-400">
                      (Stage {activeHazard.currentStageIndex + 1}/{activeHazard.totalStages})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                    {isZh
                      ? `📍 已在現場 (${hazardBayDist.toFixed(1)}m) · 選出正確應變決策`
                      : `📍 On-Site (${hazardBayDist.toFixed(1)}m) · Choose the correct SOP`}
                  </span>
                </div>

                {difficultyMode === 'ASSISTED' && activeHazard.ehsPillars?.whatShouldDoZh && (
                  <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-emerald-300">
                        {isZh ? '💡 AI 應變建議：' : '💡 AI SOP Hint: '}
                      </span>
                      <span>
                        {isZh
                          ? activeHazard.ehsPillars.whatShouldDoZh
                          : activeHazard.ehsPillars.whatShouldDo}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeHazard.protocolSteps.map((step, idx) => (
                    <button
                      key={step.id || idx}
                      onClick={() => onSelectProtocolStep(step)}
                      className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800/90 text-left transition-all group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {isZh ? `選項 ${idx + 1}` : `Option ${idx + 1}`}
                          </span>
                          {difficultyMode === 'ASSISTED' && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                step.isCorrect
                                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                                  : step.isFatalError
                                  ? 'bg-rose-950/80 border-rose-400 text-rose-300'
                                  : 'bg-amber-950/80 border-amber-400 text-amber-300'
                              }`}
                            >
                              {step.isCorrect
                                ? isZh
                                  ? '標準 SOP'
                                  : 'Standard SOP'
                                : step.isFatalError
                                ? isZh
                                  ? '危險'
                                  : 'Danger'
                                : isZh
                                ? '非標準'
                                : 'Non-Standard'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 leading-snug">
                          {isZh ? step.labelZh : step.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {isZh ? step.descZh : step.description}
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400 opacity-80 group-hover:opacity-100">
                        {isZh ? `👉 執行此方案` : `👉 Execute Option`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. 4-PILLAR CONSEQUENCE & LEARNING FEEDBACK TOAST    */}
      {/* ==================================================== */}
      {ehsDecisionFeedback && (
        <div className="mx-auto max-w-xl w-full pointer-events-auto my-1 animate-fade-in max-h-[calc(100dvh-75px)] overflow-y-auto pr-1">
          <div
            className={`p-3 md:p-3.5 rounded-2xl border-2 shadow-2xl backdrop-blur-md text-xs space-y-1.5 ${
              ehsDecisionFeedback.type === 'PREVENTED' ||
              ehsDecisionFeedback.type === 'CORRECT_STEP' ||
              ehsDecisionFeedback.type === 'HAZARD_RESOLVED'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                : 'bg-rose-950/95 border-rose-500 text-rose-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-sm">
                {ehsDecisionFeedback.type === 'WRONG_STEP' ||
                ehsDecisionFeedback.type === 'FATAL_ERROR' ||
                ehsDecisionFeedback.type === 'PPE_VIOLATION' ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>
                  {isZh ? ehsDecisionFeedback.titleZh : ehsDecisionFeedback.title}
                </span>
              </div>
              <button
                onClick={onDismissFeedback}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-slate-300 cursor-pointer"
                title={isZh ? '立即關閉' : 'Dismiss'}
              >
                ✕
              </button>
            </div>
            <p className="leading-relaxed text-slate-100">
              {isZh ? ehsDecisionFeedback.explanationZh : ehsDecisionFeedback.explanation}
            </p>
            <div className="pt-1 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-amber-200">
              <span>
                {isZh ? ehsDecisionFeedback.consequenceNoteZh : ehsDecisionFeedback.consequenceNote}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-cyan-300">
                {ehsDecisionFeedback.standard}
              </span>
            </div>
            {/* Smooth auto-dismiss timer progress line */}
            <div className="w-full h-0.5 bg-black/40 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full animate-shrink-6s ${
                  ehsDecisionFeedback.type === 'PREVENTED' ||
                  ehsDecisionFeedback.type === 'CORRECT_STEP' ||
                  ehsDecisionFeedback.type === 'HAZARD_RESOLVED'
                    ? 'bg-emerald-400'
                    : 'bg-rose-400'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. BOTTOM ENGINEER CONSOLE (Sliders + On-Site Rack)  */}
      {/* ==================================================== */}
      <div className="pointer-events-auto mx-auto w-full max-w-5xl font-mono mt-auto flex flex-col gap-1 z-20">
        {/* Collapse / Expand Handle + PPE Quick-Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1 rounded-t-xl bg-slate-950/95 border border-b-0 border-slate-700/80 text-[11px]">
          {/* PPE Quick-Bar with Mandatory Highlight */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {isZh ? '個人防護具 (PPE):' : 'PPE GEAR:'}
            </span>
            <button
              onClick={() => onTogglePPE('scba')}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                equippedPPE.scba
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/30'
                  : requiredPpeCode === 'SCBA'
                  ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isZh ? '正壓自給式呼吸器 (防劇毒氣體 AsH3 / SiH4 / 高溫氫氣)' : 'Positive-Pressure SCBA Respirator'}
            >
              <span>😷 {isZh ? 'SCBA 呼吸器' : 'SCBA'}</span>
              <span className="font-mono">{equippedPPE.scba ? 'ON' : 'OFF'}</span>
              {requiredPpeCode === 'SCBA' && !equippedPPE.scba && (
                <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px]">
                  {isZh ? '必備!' : 'REQ!'}
                </span>
              )}
            </button>
            <button
              onClick={() => onTogglePPE('acidSuit')}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                equippedPPE.acidSuit
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/30'
                  : requiredPpeCode === 'ACID_SUIT'
                  ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isZh ? '防酸蝕圍裙與面罩 (防氫氟酸 HF 噴濺)' : 'Chemical Acid Apron & Face Shield'}
            >
              <span>🧤 {isZh ? '防酸防護衣' : 'Acid Suit'}</span>
              <span className="font-mono">{equippedPPE.acidSuit ? 'ON' : 'OFF'}</span>
              {requiredPpeCode === 'ACID_SUIT' && !equippedPPE.acidSuit && (
                <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px]">
                  {isZh ? '必備!' : 'REQ!'}
                </span>
              )}
            </button>
            <button
              onClick={() => onTogglePPE('hvGloves')}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                equippedPPE.hvGloves
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/30'
                  : requiredPpeCode === 'HV_GLOVES'
                  ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isZh ? 'Class 00 高壓絕緣手套 (防 200kV 電弧與機械夾傷)' : 'Class 00 High-Voltage Insulating Gloves'}
            >
              <span>⚡ {isZh ? '高壓絕緣手套' : 'HV Gloves'}</span>
              <span className="font-mono">{equippedPPE.hvGloves ? 'ON' : 'OFF'}</span>
              {requiredPpeCode === 'HV_GLOVES' && !equippedPPE.hvGloves && (
                <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px]">
                  {isZh ? '必備!' : 'REQ!'}
                </span>
              )}
            </button>
          </div>

          {/* Selected Bay Proximity Indicator + Walk to Bay Button */}
          <div className="flex items-center space-x-2 ml-auto">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isSelectedBayOnSite
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-amber-300'
              }`}
            >
              {isSelectedBayOnSite
                ? isZh
                  ? `📍 人在機台現場 (${selectedBayDist.toFixed(1)}m)`
                  : `📍 ON-SITE (${selectedBayDist.toFixed(1)}m)`
                : isZh
                ? `📡 遠端遙測中 (${selectedBayDist.toFixed(1)}m)`
                : `📡 REMOTE (${selectedBayDist.toFixed(1)}m)`}
            </span>

            {!isSelectedBayOnSite && (
              <button
                onClick={() => onWalkToSector(selectedSectorId)}
                className="px-2.5 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1 cursor-pointer shadow-sm"
              >
                <Footprints className="w-3 h-3" />
                <span>
                  {isAutoWalking && walkingTargetSector === selectedSectorId
                    ? isZh
                      ? '走動中...'
                      : 'Walking...'
                    : isZh
                    ? '🏃 走至此機台'
                    : '🏃 Walk Here'}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>{isZh ? '展開控制台' : 'Expand'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>{isZh ? '收合 (H)' : 'Collapse'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Console Body */}
        {!isDockCollapsed && (
          <div className="rounded-b-xl rounded-tr-xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-lg p-2.5 shadow-2xl text-xs">
            {/* Bay Selector Tabs (Bay 101 ~ 105) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {pipelineOrder.map((secId) => {
                  const s = sectors[secId];
                  if (!s) return null;
                  const isSelected = selectedSectorId === secId;
                  const isCrisis = s.activeHazardId !== null;
                  const isPre = s.preAlarm !== null;
                  const bayCode = s.code.split('/')[0].trim();
                  const dist = bayDistances[secId] ?? 10;

                  return (
                    <button
                      key={secId}
                      onClick={() => onSelectSector(secId)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                          : isCrisis
                          ? 'bg-rose-500/30 border border-rose-500 text-rose-200 animate-pulse'
                          : isPre
                          ? 'bg-amber-500/30 border border-amber-400 text-amber-200 animate-pulse'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCrisis
                            ? 'bg-rose-400 animate-ping'
                            : isPre
                            ? 'bg-amber-400 animate-ping'
                            : dist <= ON_SITE_DISTANCE_THRESHOLD_M
                            ? 'bg-cyan-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>{bayCode}</span>
                      <span className="text-[10px] opacity-80 hidden sm:inline">
                        {isZh
                          ? s.nameZh.substring(5, 9)
                          : s.code.split('/')[1]?.trim() || s.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Telemetry of Selected Bay */}
              <div className="flex items-center space-x-3 text-[11px] text-slate-300 shrink-0">
                <span>
                  {isZh ? '腔溫' : 'Temp'}:{' '}
                  <strong
                    className={
                      selectedSector.id === 'DIFFUSION_FURNACE'
                        ? selectedSector.temperatureC > 1135
                          ? 'text-rose-400'
                          : 'text-amber-300'
                        : selectedSector.temperatureC > 260
                        ? 'text-rose-400'
                        : 'text-white'
                    }
                  >
                    {selectedSector.temperatureC.toFixed(0)}°C
                  </strong>
                </span>
                <span>
                  {isZh ? '洗滌塔' : 'Scrubber'}:{' '}
                  <strong
                    className={
                      selectedSector.scrubberLoadPct > 85 ? 'text-amber-400' : 'text-emerald-400'
                    }
                  >
                    {Math.round(selectedSector.scrubberLoadPct)}%
                  </strong>
                </span>
                <span>
                  {isZh ? '產速' : 'Speed'}:{' '}
                  <strong className="text-cyan-300">{selectedSector.efficiency}%</strong>
                </span>
              </div>
            </div>

            {/* 4-Column Grid: 3 Remote Recipe Sliders + 1 On-Site Physical Maintenance & Action Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Slider 1: RF Power */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>
                      {difficultyMode === 'ASSISTED'
                        ? isZh
                          ? 'RF 射頻功率 (電漿火力)'
                          : 'RF Power (Plasma Firepower)'
                        : isZh
                        ? 'RF 射頻功率 (遠端可調)'
                        : 'RF Power (Remote)'}
                    </span>
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      selectedSector.rfPowerWatts >= 2000
                        ? 'text-rose-400 animate-pulse'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedSector.rfPowerWatts} W
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="50"
                  value={selectedSector.rfPowerWatts}
                  onChange={(e) =>
                    onTuneSectorParams?.(selectedSectorId, {
                      rfPowerWatts: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex items-center justify-between text-[9px] mt-1.5 text-slate-400">
                  <span>{isZh ? '安全區: 800~1750W' : 'Safe: 800-1750W'}</span>
                  <span className="text-cyan-300 font-bold">
                    {isZh ? `產速 ${selectedSector.efficiency}%` : `Speed ${selectedSector.efficiency}%`}
                  </span>
                </div>
              </div>

              {/* Slider 2: Gas Flow */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-cyan-400" />
                    <span>
                      {difficultyMode === 'ASSISTED'
                        ? isZh
                          ? '特氣流量 (原料氣體)'
                          : 'Gas Flow (Precursor Gas)'
                        : isZh
                        ? '特氣流量 (遠端可調)'
                        : 'Gas Flow (Remote)'}
                    </span>
                  </span>
                  <span className="font-bold text-cyan-400 tabular-nums">
                    {selectedSector.gasFlowSccm} sccm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="260"
                  step="5"
                  value={selectedSector.gasFlowSccm}
                  onChange={(e) =>
                    onTuneSectorParams?.(selectedSectorId, {
                      gasFlowSccm: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex items-center justify-between text-[9px] mt-1.5 text-slate-400">
                  <span>{isZh ? '安全區: 35~135 sccm' : 'Safe: 35-135 sccm'}</span>
                  <span
                    className={
                      selectedSector.scrubberLoadPct > 85
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400'
                    }
                  >
                    {isZh
                      ? `廢氣負載 ${Math.round(selectedSector.scrubberLoadPct)}%`
                      : `Scrubber ${Math.round(selectedSector.scrubberLoadPct)}%`}
                  </span>
                </div>
              </div>

              {/* Slider 3: Chamber Vacuum */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span>
                      {difficultyMode === 'ASSISTED'
                        ? isZh
                          ? '腔體真空度 (氣密程度)'
                          : 'Vacuum (Air Tightness)'
                        : isZh
                        ? '腔體真空度 (遠端可調)'
                        : 'Vacuum (Remote)'}
                    </span>
                  </span>
                  <span className="font-bold text-purple-400 tabular-nums">
                    {selectedSector.chamberVacuumTorr} Torr
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="760"
                  step="5"
                  value={selectedSector.chamberVacuumTorr}
                  onChange={(e) =>
                    onTuneSectorParams?.(selectedSectorId, {
                      chamberVacuumTorr: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex items-center justify-between text-[9px] mt-1.5 text-slate-400">
                  <span>
                    {isZh
                      ? `微塵: ${selectedSector.particleCountPPM.toFixed(1)} PPM`
                      : `Particles: ${selectedSector.particleCountPPM.toFixed(1)} PPM`}
                  </span>
                  <button
                    onClick={() =>
                      onTuneSectorParams?.(selectedSectorId, {
                        bypassActive: !selectedSector.bypassActive,
                      })
                    }
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${
                      selectedSector.bypassActive
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {selectedSector.bypassActive
                      ? isZh
                        ? '分流開啟中'
                        : 'Bypass ON'
                      : isZh
                      ? '繞道分流'
                      : 'Bypass'}
                  </button>
                </div>
              </div>

              {/* Column 4: On-Site Hands-On Engineering & Physical Action Box */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-cyan-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold text-cyan-300 flex items-center space-x-1">
                    <Wrench className="w-3 h-3" />
                    <span>{isZh ? '現場實體操作 (<5.5m)' : 'On-Site Actions (<5.5m)'}</span>
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {selectedBayDist.toFixed(1)}m
                  </span>
                </div>

                {!isSelectedBayOnSite ? (
                  <button
                    onClick={() => onWalkToSector(selectedSectorId)}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>
                      {isZh
                        ? `🏃 走近 ${selectedSector.code.split('/')[0]} 執行現場維護`
                        : `🏃 Walk to ${selectedSector.code.split('/')[0]} for On-Site Ops`}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        onPreventPreAlarm(selectedSectorId);
                        onTriggerPhysicalAction('N2_PURGE', selectedSectorId);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 cursor-pointer transition-all bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/70 text-emerald-200"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {isZh ? '🔧 現場例行 N2 吹驅與校準保養' : '🔧 Routine N2 Purge & Calibrate'}
                      </span>
                    </button>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => onTriggerPhysicalAction('DELUGE_SHOWER', selectedSectorId)}
                        className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[9px] font-bold cursor-pointer"
                        title="Test Emergency Deluge Shower"
                      >
                        💧 {isZh ? '沖淋' : 'Shower'}
                      </button>
                      <button
                        onClick={() => onTriggerPhysicalAction('ARC_SPARKS', selectedSectorId)}
                        className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[9px] font-bold cursor-pointer"
                        title="Apply 10kV Grounding Discharge Stick"
                      >
                        ⚡ {isZh ? '接地棒' : 'Ground'}
                      </button>
                      <button
                        onClick={() => onHitEmo(selectedSectorId)}
                        className="py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold cursor-pointer"
                        title="Slam Machine EMO Button"
                      >
                        🛑 EMO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
