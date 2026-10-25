import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActionEffectType } from './3d/ParticleEffects';
import { FabScene, OffscreenIndicator, ON_SITE_DISTANCE_THRESHOLD_M } from './3d/FabScene';
import { soundManager } from './audio/soundManager';
import { DebriefModal } from './components/DebriefModal';
import { GoogleFormModal } from './components/GoogleFormModal';
import { HUDOverlay } from './components/HUDOverlay';
import { InstructionsModal } from './components/InstructionsModal';
import { ManagerAnalyticsModal } from './components/ManagerAnalyticsModal';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { HAZARD_DEFINITIONS, INITIAL_SECTORS, shuffleChoices } from './data/protocols';
import { Language } from './i18n/translations';
import {
  CameraViewMode,
  ChoiceOutcomeRecord,
  DecisionTimelineEvent,
  EhsDecisionFeedback,
  EquippedPPE,
  FloatingDelta,
  GameState,
  HazardIncident,
  IncidentRecord,
  PreAlarmState,
  ProtocolStep,
  SectorId,
  SectorState,
  SimulationMetrics,
  TroubleshootingOption,
  UserCareerRecord,
  WaferLotMission,
} from './types/game';

const CAREER_STORAGE_KEY = 'worksafe_vr_career_record';
const LANGUAGE_STORAGE_KEY = 'worksafe_vr_lang_preference';

const DEFAULT_CAREER: UserCareerRecord = {
  totalShiftsCompleted: 0,
  totalIncidentsHandled: 0,
  bestComplianceScore: 0,
  averageReactionTimeMs: 0,
  certificationLevel: 'CLEANROOM_ROOKIE',
  incidentHistory: [],
};

const LOT_MISSION_TEMPLATES: Omit<WaferLotMission, 'id' | 'startWaferCount'>[] = [
  {
    lotCode: 'LOT #N3-101',
    title: '3nm EUV/DUV Lithography Alignment Lot',
    titleZh: '3奈米微影曝光精準對位批次',
    targetSectorId: 'PHOTOLITHOGRAPHY',
    hint: 'Keep Bay 101 RF 900-1400W & Vacuum clean for +18 wafers',
    hintZh: '巡視 Bay 101 並維持 RF 900~1400W 衝刺 18 片良品晶圓',
    targetWaferCount: 18,
    rewardScore: 200,
  },
  {
    lotCode: 'LOT #CVD-204',
    title: 'Silicon Nitride Gate Spacer Deposition',
    titleZh: '氮化矽閘極間隔層 CVD 沉積批次',
    targetSectorId: 'ETCH_CVD',
    hint: 'Balance Bay 102 Gas Flow <125 sccm while producing 20 wafers',
    hintZh: '調校 Bay 102 氣體流量 (<125 sccm) 並完成 20 片晶圓產出',
    targetWaferCount: 20,
    rewardScore: 250,
  },
  {
    lotCode: 'LOT #CMP-309',
    title: 'Copper Interconnect Planarization & HF Clean',
    titleZh: '銅導線化學機械平坦化與酸洗批次',
    targetSectorId: 'CMP_WET_BENCH',
    hint: 'Keep Bay 103 running smoothly for 18 wafers',
    hintZh: '維持 Bay 103 酸洗與研磨穩定運轉，產出 18 片晶圓',
    targetWaferCount: 18,
    rewardScore: 200,
  },
  {
    lotCode: 'LOT #OX-412',
    title: '1100°C Pyrogenic Gate Oxide Annealing',
    titleZh: '1100°C 高溫擴散閘極氧化退火批次',
    targetSectorId: 'DIFFUSION_FURNACE',
    hint: 'Keep Bay 104 Temp <1135°C and complete 20 wafers',
    hintZh: '監控 Bay 104 爐溫 (<1135°C) 並完成 20 片退火晶圓',
    targetWaferCount: 20,
    rewardScore: 250,
  },
  {
    lotCode: 'LOT #IMP-505',
    title: '200kV Source/Drain Dopant Implantation',
    titleZh: '200kV 源極/汲極高能離子植入批次',
    targetSectorId: 'ION_IMPLANTATION',
    hint: 'Maintain deep vacuum in Bay 105 and produce 20 wafers',
    hintZh: '維持 Bay 105 高真空度與洗滌塔負載，產出 20 片晶圓',
    targetWaferCount: 20,
    rewardScore: 250,
  },
];

export default function App() {
  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (savedLang === 'en' || savedLang === 'zh-TW') return savedLang;
    } catch {
      // Ignore
    }
    return 'zh-TW';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const nextLang: Language = prev === 'zh-TW' ? 'en' : 'zh-TW';
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      } catch {
        // Ignore
      }
      return nextLang;
    });
  }, []);

  // Core Game & Modal States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [cameraView, setCameraView] = useState<CameraViewMode>('VR_FIRST_PERSON');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isManagerAuditOpen, setIsManagerAuditOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // Player Proximity & Off-Screen Threat Pointers from 3D Scene
  const [bayDistances, setBayDistances] = useState<Record<SectorId, number>>({
    PHOTOLITHOGRAPHY: 14.5,
    ETCH_CVD: 15.2,
    CMP_WET_BENCH: 11.4,
    DIFFUSION_FURNACE: 11.4,
    ION_IMPLANTATION: 14.5,
  });
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);
  const [walkingTargetSector, setWalkingTargetSector] = useState<SectorId | null>(null);
  const [offscreenIndicators, setOffscreenIndicators] = useState<OffscreenIndicator[]>([]);

  // Equipped PPE State
  const [equippedPPE, setEquippedPPE] = useState<EquippedPPE>({
    scba: false,
    acidSuit: false,
    hvGloves: false,
  });

  // Sector States for all 5 CMOS Pipeline Bays
  const [sectors, setSectors] = useState<Record<SectorId, SectorState>>(() => {
    const init: Partial<Record<SectorId, SectorState>> = {};
    (Object.keys(INITIAL_SECTORS) as SectorId[]).forEach((secId) => {
      const def = INITIAL_SECTORS[secId];
      init[secId] = {
        id: secId,
        name: language === 'zh-TW' ? def.nameZh : def.name,
        nameZh: def.nameZh,
        code: def.code,
        description: language === 'zh-TW' ? def.descZh : def.description,
        health: 100,
        efficiency: 85,
        temperatureC: def.nominalTemp,
        pressureTorr: def.nominalPressure,
        particleCountPPM: def.nominalParticles,
        highVoltageKV: def.nominalHighVoltageKV,
        rfPowerWatts: def.nominalRfPowerWatts,
        gasFlowSccm: def.nominalGasFlowSccm,
        chamberVacuumTorr: def.nominalChamberVacuumTorr,
        scrubberLoadPct: def.nominalScrubberLoadPct,
        status: 'OPTIMAL',
        activeHazardId: null,
        preAlarm: null,
        wafersInProcess: 25,
        inputQueue: 20,
        outputQueue: 15,
        wafersCompleted: 0,
        wafersDefective: 0,
        bypassActive: false,
      };
    });
    return init as Record<SectorId, SectorState>;
  });
  const [selectedSectorId, setSelectedSectorId] = useState<SectorId>('PHOTOLITHOGRAPHY');

  // Sync sector names when language changes
  useEffect(() => {
    setSectors((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as SectorId[]).forEach((sId) => {
        const def = INITIAL_SECTORS[sId];
        updated[sId] = {
          ...updated[sId],
          name: language === 'zh-TW' ? def.nameZh : def.name,
          description: language === 'zh-TW' ? def.descZh : def.description,
        };
      });
      return updated;
    });
  }, [language]);

  // Active Hazard, Pre-Alarm & Educational Feedback Tracking
  const [activeHazard, setActiveHazard] = useState<HazardIncident | null>(null);
  const [activePreAlarm, setActivePreAlarm] = useState<PreAlarmState | null>(null);
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>([]);
  const [ehsDecisionFeedback, setEhsDecisionFeedback] = useState<EhsDecisionFeedback | null>(null);

  // Shift Telemetry & Impact Counters
  const [shiftMode, setShiftMode] = useState<'FULL_SHIFT' | 'HAZARD_DRILL' | 'CERTIFICATION_EXAM'>(
    'FULL_SHIFT'
  );
  const [shiftDurationSec, setShiftDurationSec] = useState<number>(360);
  const [shiftTimeRemaining, setShiftTimeRemaining] = useState<number>(360);
  const [totalWafersProduced, setTotalWafersProduced] = useState<number>(0);
  const [totalDefectiveWafers, setTotalDefectiveWafers] = useState<number>(0);
  const [safetyComplianceScore, setSafetyComplianceScore] = useState<number>(100);
  const [accumulatedFines, setAccumulatedFines] = useState<number>(0);
  const [flowStateSeconds, setFlowStateSeconds] = useState<number>(0);
  const [preAlarmsPrevented, setPreAlarmsPrevented] = useState<number>(0);
  const [livesProtected, setLivesProtected] = useState<number>(5);
  const [fabValueSavedMillionsUSD, setFabValueSavedMillionsUSD] = useState<number>(1.2);
  const [lotMissionIndex, setLotMissionIndex] = useState<number>(0);
  const [lotMission, setLotMission] = useState<WaferLotMission | null>(null);

  // Gamification states
  const [floatingDeltas, setFloatingDeltas] = useState<FloatingDelta[]>([]);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionTimelineEvent[]>([]);
  const [choiceOutcomes, setChoiceOutcomes] = useState<ChoiceOutcomeRecord[]>([]);
  const [fatalShutdownTriggered, setFatalShutdownTriggered] = useState<boolean>(false);
  const [knowledgeGaps, setKnowledgeGaps] = useState<SimulationMetrics['knowledgeGaps']>([]);

  // User Career Records (Persisted)
  const [careerRecord, setCareerRecord] = useState<UserCareerRecord>(() => {
    try {
      const saved = localStorage.getItem(CAREER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return DEFAULT_CAREER;
  });

  // 3D Scene Ref & Timers
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneInstanceRef = useRef<FabScene | null>(null);
  const nextEventTimerRef = useRef<number>(12);
  const hazardDeckRef = useRef<string[]>([]);
  const hazardStartTimeRef = useRef<number>(0);
  const firstActionTimeRef = useRef<number | null>(null);
  const hitEmoHandlerRef = useRef<(secId: SectorId) => void>(() => {});

  // Operator Name State
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('worksafe_operator_name');
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return 'Alex Chen #402';
  });

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    try {
      localStorage.setItem('worksafe_operator_name', name);
    } catch {
      // Ignore
    }
  }, []);

  const saveCareer = useCallback((updated: UserCareerRecord) => {
    setCareerRecord(updated);
    try {
      localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }, []);

  // Floating Delta helper
  const addFloatingDelta = useCallback((text: string, type: FloatingDelta['type']) => {
    const id = `delta-${Date.now()}-${Math.random()}`;
    setFloatingDeltas((prev) => [...prev.slice(-4), { id, text, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setFloatingDeltas((prev) => prev.filter((d) => d.id !== id));
    }, 2400);
  }, []);

  // Decision Timeline Logging
  const addDecisionEvent = useCallback(
    (bayCode: string, description: string, isGoodDecision: boolean, violationStandard?: string) => {
      const elapsed = shiftDurationSec - shiftTimeRemaining;
      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      setDecisionTimeline((prev) => [
        ...prev,
        {
          id,
          timestampSec: elapsed,
          formattedTime,
          bayCode,
          title: isGoodDecision ? 'SOP Compliant Action' : 'EHS Process Violation',
          description,
          type: isGoodDecision ? 'GOOD_ACTION' : 'VIOLATION',
          isGoodDecision,
          violationStandard,
        },
      ]);
    },
    [shiftDurationSec, shiftTimeRemaining]
  );

  // Initialize 3D Canvas
  useEffect(() => {
    if (!canvasMountRef.current) return;
    if (sceneInstanceRef.current) return;

    const scene = new FabScene({
      container: canvasMountRef.current,
      onSelectSector: (secId) => {
        setSelectedSectorId(secId);
        soundManager.playUiClick();
      },
      onHitEmo: (secId) => {
        hitEmoHandlerRef.current(secId);
      },
      onProximityUpdate: (report) => {
        setBayDistances(report.distances);
        setIsAutoWalking(report.isAutoWalking);
        setWalkingTargetSector(report.walkingTargetSector);
        setOffscreenIndicators(report.offscreenIndicators);
      },
    });

    sceneInstanceRef.current = scene;

    return () => {
      scene.destroy();
      sceneInstanceRef.current = null;
    };
  }, []);

  const handleChangeCameraView = useCallback((mode: CameraViewMode) => {
    setCameraView(mode);
    sceneInstanceRef.current?.setCameraView(mode);
    soundManager.playUiClick();
  }, []);

  const handleWalkToSector = useCallback((sectorId: SectorId) => {
    soundManager.playUiClick();
    setSelectedSectorId(sectorId);
    sceneInstanceRef.current?.walkToSector(sectorId);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTogglePPE = useCallback(
    (key: keyof EquippedPPE) => {
      soundManager.playUiClick();
      setEquippedPPE((prev) => {
        const nextVal = !prev[key];
        const next = { ...prev, [key]: nextVal };
        sceneInstanceRef.current?.setEquippedPPE(next);
        addFloatingDelta(
          nextVal ? `🛡️ PPE ${key.toUpperCase()} ON` : `PPE ${key.toUpperCase()} OFF`,
          'COMBO_REFLEX'
        );
        return next;
      });
    },
    [addFloatingDelta]
  );

  const handleTriggerActionEffect = useCallback(
    (type: ActionEffectType, sectorId?: SectorId) => {
      soundManager.playSuccessChime();
      sceneInstanceRef.current?.triggerActionEffect(type, sectorId);
    },
    []
  );

  // Spawn a full Red Emergency Crisis (comfortable 60s decision timer)
  const spawnHazard = useCallback(
    (specificTypeId?: string) => {
      if (activeHazard) return;

      let randDef = HAZARD_DEFINITIONS[0];
      if (specificTypeId) {
        randDef =
          HAZARD_DEFINITIONS.find((h) => h.typeId === specificTypeId) || HAZARD_DEFINITIONS[0];
      } else {
        if (hazardDeckRef.current.length === 0) {
          hazardDeckRef.current = shuffleChoices(HAZARD_DEFINITIONS.map((h) => h.typeId));
        }
        const nextTypeId = hazardDeckRef.current.shift()!;
        randDef = HAZARD_DEFINITIONS.find((h) => h.typeId === nextTypeId) || HAZARD_DEFINITIONS[0];
      }

      const sectorId = randDef.defaultSector;
      const stage0 = randDef.steps[0];
      const isZh = language === 'zh-TW';

      const localizedChoices: ProtocolStep[] = shuffleChoices(
        stage0.choices.map((c) => ({
          id: c.id,
          label: isZh ? c.labelZh : c.label,
          labelZh: c.labelZh,
          description: isZh ? c.descZh : c.description,
          descZh: c.descZh,
          isCorrect: c.isCorrect,
          explanation: isZh ? c.explanationZh : c.explanation,
          explanationZh: c.explanationZh,
          isFatalError: c.isFatalError,
        }))
      );

      const newIncident: HazardIncident = {
        id: `INC-${Date.now().toString().slice(-5)}`,
        typeId: randDef.typeId,
        level: randDef.level,
        sectorId,
        title: randDef.title,
        titleZh: randDef.titleZh,
        description: randDef.description,
        descZh: randDef.descZh,
        severity: randDef.severity,
        timeLimitSec: 60,
        timeRemainingSec: 60,
        startTime: Date.now(),
        currentStageIndex: 0,
        totalStages: randDef.steps.length,
        currentPrompt: stage0.prompt,
        currentPromptZh: stage0.promptZh,
        protocolSteps: localizedChoices,
        ehsPillars: randDef.ehsPillars,
        resolved: false,
        failed: false,
        isSilenced: false,
        regulatoryStandard: randDef.regulatoryStandard,
      };

      setActivePreAlarm(null);
      setActiveHazard(newIncident);
      setSelectedSectorId(sectorId);
      hazardStartTimeRef.current = Date.now();
      firstActionTimeRef.current = null;

      setSectors((prev) => {
        const next = {
          ...prev,
          [sectorId]: {
            ...prev[sectorId],
            activeHazardId: newIncident.id,
            preAlarm: null,
            status: 'CRITICAL' as const,
            efficiency: Math.max(25, prev[sectorId].efficiency - 25),
          },
        };
        sceneInstanceRef.current?.updateSectorStatus(next);
        return next;
      });

      sceneInstanceRef.current?.setHazardActive(sectorId, true, randDef.typeId);
      soundManager.startEmergencyAlarm();
    },
    [activeHazard, language]
  );

  // Spawn an Amber Equipment Diagnostic & Troubleshooting Pre-Alarm (comfortable 45s window)
  const spawnPreAlarm = useCallback(
    (specificTypeId?: string) => {
      if (activeHazard || activePreAlarm) return;

      if (hazardDeckRef.current.length === 0) {
        hazardDeckRef.current = shuffleChoices(HAZARD_DEFINITIONS.map((h) => h.typeId));
      }
      const nextTypeId = specificTypeId || hazardDeckRef.current.shift()!;
      const def = HAZARD_DEFINITIONS.find((h) => h.typeId === nextTypeId) || HAZARD_DEFINITIONS[0];
      const sectorId = def.defaultSector;

      const pre: PreAlarmState = {
        id: `PRE-${Date.now().toString().slice(-5)}`,
        hazardTypeId: def.typeId,
        sectorId,
        title: def.preAlarmConfig.title,
        titleZh: def.preAlarmConfig.titleZh,
        whatIsHappening: def.preAlarmConfig.whatIsHappening,
        whatIsHappeningZh: def.preAlarmConfig.whatIsHappeningZh,
        howToPrevent: def.preAlarmConfig.howToPrevent,
        howToPreventZh: def.preAlarmConfig.howToPreventZh,
        consequenceIfIgnored: def.preAlarmConfig.consequenceIfIgnored,
        consequenceIfIgnoredZh: def.preAlarmConfig.consequenceIfIgnoredZh,
        maintenanceButtonLabel: def.preAlarmConfig.maintenanceButtonLabel,
        maintenanceButtonLabelZh: def.preAlarmConfig.maintenanceButtonLabelZh,
        symptoms: def.preAlarmConfig.symptoms,
        symptomsZh: def.preAlarmConfig.symptomsZh,
        waferDefectPattern: def.preAlarmConfig.waferDefectPattern,
        waferDefectPatternZh: def.preAlarmConfig.waferDefectPatternZh,
        troubleshootingOptions: shuffleChoices(def.preAlarmConfig.troubleshootingOptions),
        timeRemainingSec: 45,
        totalTimeSec: 45,
      };

      setActivePreAlarm(pre);
      soundManager.playUiClick();

      setSectors((prev) => {
        const curr = prev[sectorId];
        const next = {
          ...prev,
          [sectorId]: {
            ...curr,
            status: 'PRE_ALARM' as const,
            preAlarm: pre,
            scrubberLoadPct: Math.max(87, curr.scrubberLoadPct),
          },
        };
        sceneInstanceRef.current?.updateSectorStatus(next);
        return next;
      });
    },
    [activeHazard, activePreAlarm]
  );

  // Handle Equipment Troubleshooting Option or Routine On-Site Calibration
  const handlePreventPreAlarm = useCallback(
    (sectorId: SectorId, option?: TroubleshootingOption) => {
      const dist = bayDistances[sectorId] ?? 10;
      if (dist > ON_SITE_DISTANCE_THRESHOLD_M) {
        handleWalkToSector(sectorId);
        return;
      }

      const isZh = language === 'zh-TW';
      const pre = activePreAlarm && activePreAlarm.sectorId === sectorId ? activePreAlarm : null;
      const def = pre
        ? HAZARD_DEFINITIONS.find((h) => h.typeId === pre.hazardTypeId)
        : HAZARD_DEFINITIONS.find((h) => h.defaultSector === sectorId);
      const nominal = INITIAL_SECTORS[sectorId];

      // If player selected a specific Troubleshooting Option during Amber Pre-Alarm:
      if (pre && option) {
        const solveOpt = pre.troubleshootingOptions.find((o) => o.outcomeType === 'SOLVE');
        const escalateOpt = pre.troubleshootingOptions.find((o) => o.outcomeType === 'ESCALATE');

        if (option.outcomeType === 'ESCALATE') {
          // Wrong diagnosis! Backfires in 3D and triggers the Red EHS Crisis!
          soundManager.playErrorBuzzer();
          sceneInstanceRef.current?.triggerActionEffect('BACKFIRE_EXPLOSION', sectorId);
          setActivePreAlarm(null);
          setSafetyComplianceScore((s) => Math.max(0, s - 10));
          setTotalDefectiveWafers((d) => d + 10);
          addFloatingDelta(
            isZh ? '💥 排障誤判！引發緊急工安事故' : '💥 Wrong Fix! Crisis Triggered!',
            'WAFER_SCRAP'
          );

          setChoiceOutcomes((prev) => [
            ...prev,
            {
              id: `co-${Date.now()}`,
              bayCode: nominal.code.split('/')[0].trim(),
              eventTitle: isZh ? pre.titleZh : pre.title,
              category: 'TROUBLESHOOTING',
              chosenAction: isZh ? option.labelZh : option.label,
              outcomeImpact: isZh ? option.explanationZh : option.explanation,
              alternativeComparison: isZh
                ? `若選擇正確方案「${solveOpt?.labelZh || ''}」，原可挽救機台並避免事故爆發！`
                : `Choosing "${solveOpt?.label || ''}" would have solved the root cause & prevented the crisis!`,
              isPositive: false,
              financialDeltaMillionsUSD: -1.5,
            },
          ]);

          setEhsDecisionFeedback({
            id: `fb-${Date.now()}`,
            type: 'WRONG_STEP',
            title: `Troubleshooting Backfired! Escalated to ${def?.title || pre.title}`,
            titleZh: `💥 工程排障誤判！引發「${def?.titleZh || pre.titleZh}」`,
            explanation: option.explanation,
            explanationZh: option.explanationZh,
            consequenceNote: `Correct Root-Cause Fix was: ${solveOpt?.label || ''}`,
            consequenceNoteZh: `✅ 正確根因排除應為：${solveOpt?.labelZh || ''}`,
            standard: def?.regulatoryStandard || 'SEMI S2 Engineering Control',
            timestamp: Date.now(),
          });

          spawnHazard(pre.hazardTypeId);
          return;
        }

        if (option.outcomeType === 'PARTIAL') {
          // Partial band-aid: clears pre-alarm, but scraps wafers and drops yield
          soundManager.playUiClick();
          sceneInstanceRef.current?.triggerActionEffect('SMOKE_SMOTHER', sectorId);
          setActivePreAlarm(null);
          setTotalDefectiveWafers((d) => d + 8);
          setFabValueSavedMillionsUSD((v) => Math.max(0, Number((v - 0.4).toFixed(1))));

          setSectors((prev) => {
            const curr = prev[sectorId];
            const next = {
              ...prev,
              [sectorId]: {
                ...curr,
                status: 'OPTIMAL' as const,
                preAlarm: null,
                efficiency: Math.max(60, curr.efficiency - 12),
                scrubberLoadPct: nominal.nominalScrubberLoadPct + 10,
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });

          setChoiceOutcomes((prev) => [
            ...prev,
            {
              id: `co-${Date.now()}`,
              bayCode: nominal.code.split('/')[0].trim(),
              eventTitle: isZh ? pre.titleZh : pre.title,
              category: 'TROUBLESHOOTING',
              chosenAction: isZh ? option.labelZh : option.label,
              outcomeImpact: isZh ? option.explanationZh : option.explanation,
              alternativeComparison: isZh
                ? `最佳根因解法為：「${solveOpt?.labelZh || ''}」（可零報廢保住全批晶圓）`
                : `Optimal fix was "${solveOpt?.label || ''}" (zero wafer loss + full stabilization).`,
              isPositive: false,
              financialDeltaMillionsUSD: -0.4,
            },
          ]);

          addFloatingDelta(
            isZh ? '⚠️ 治標處置：8 片晶圓報廢 (-$0.4M)' : '⚠️ Partial Fix: 8 Wafers Scrapped (-$0.4M)',
            'YIELD_DOWN'
          );

          setEhsDecisionFeedback({
            id: `fb-${Date.now()}`,
            type: 'WRONG_STEP',
            title: `Partial Band-Aid Applied (-8 Wafers Scrapped)`,
            titleZh: `⚠️ 治標未治本（造成 8 片晶圓異常報廢）`,
            explanation: option.explanation,
            explanationZh: option.explanationZh,
            consequenceNote: `Best Root-Cause Fix: ${solveOpt?.label || ''}`,
            consequenceNoteZh: `💡 最佳根因排除方案：${solveOpt?.labelZh || ''}`,
            standard: def?.regulatoryStandard || 'SEMI S2 Process Control',
            timestamp: Date.now(),
          });

          nextEventTimerRef.current = 24;
          return;
        }

        // option.outcomeType === 'SOLVE': Root-cause solved!
        soundManager.playSuccessChime();
        sceneInstanceRef.current?.triggerActionEffect('N2_PURGE', sectorId);

        setSectors((prev) => {
          const curr = prev[sectorId];
          const next = {
            ...prev,
            [sectorId]: {
              ...curr,
              status: 'OPTIMAL' as const,
              preAlarm: null,
              health: Math.min(100, curr.health + 12),
              efficiency: Math.min(96, Math.max(86, curr.efficiency + 6)),
              rfPowerWatts: Math.min(curr.rfPowerWatts, nominal.nominalRfPowerWatts + 150),
              gasFlowSccm: Math.min(curr.gasFlowSccm, nominal.nominalGasFlowSccm + 15),
              scrubberLoadPct: nominal.nominalScrubberLoadPct,
              temperatureC: nominal.nominalTemp,
            },
          };
          sceneInstanceRef.current?.updateSectorStatus(next);
          return next;
        });

        setActivePreAlarm(null);
        setPreAlarmsPrevented((p) => p + 1);
        setSafetyComplianceScore((s) => Math.min(100, s + 5));
        const savedVal = def ? Number((def.ehsPillars.estimatedLossMillionsUSD * 0.6).toFixed(1)) : 2.5;
        setFabValueSavedMillionsUSD((v) => Number((v + savedVal).toFixed(1)));
        setLivesProtected((l) => l + 1);

        addDecisionEvent(
          nominal.code,
          `Solved ${pre.title} via root-cause fix: ${option.label}`,
          true,
          def?.regulatoryStandard || 'SEMI S2'
        );

        setChoiceOutcomes((prev) => [
          ...prev,
          {
            id: `co-${Date.now()}`,
            bayCode: nominal.code.split('/')[0].trim(),
            eventTitle: isZh ? pre.titleZh : pre.title,
            category: 'TROUBLESHOOTING',
            chosenAction: isZh ? option.labelZh : option.label,
            outcomeImpact: isZh ? option.explanationZh : option.explanation,
            alternativeComparison: isZh
              ? `成功避免誤選「${escalateOpt?.labelZh || ''}」而引爆 $${def?.ehsPillars.estimatedLossMillionsUSD || 4.0}M 危機！`
              : `Avoided "${escalateOpt?.label || ''}" which would have triggered a $${def?.ehsPillars.estimatedLossMillionsUSD || 4.0}M crisis!`,
            isPositive: true,
            financialDeltaMillionsUSD: savedVal,
          },
        ]);

        addFloatingDelta(`🛡️ +300 排障成功 ($${savedVal}M Saved)`, 'YIELD_UP');

        setEhsDecisionFeedback({
          id: `fb-${Date.now()}`,
          type: 'PREVENTED',
          title: `Root-Cause Solved! Avoided ${def?.title || pre.title}`,
          titleZh: `✅ 根因排障成功！消弭「${def?.titleZh || pre.titleZh}」`,
          explanation: option.explanation,
          explanationZh: option.explanationZh,
          consequenceNote: option.consequenceSummary,
          consequenceNoteZh: `💎 ${option.consequenceSummaryZh}`,
          standard: def?.regulatoryStandard || 'SEMI S2 Preventive Maintenance',
          timestamp: Date.now(),
        });

        nextEventTimerRef.current = 28;
        return;
      }

      // Routine calibration when no pre-alarm is active
      soundManager.playSuccessChime();
      sceneInstanceRef.current?.triggerActionEffect('N2_PURGE', sectorId);
      setSectors((prev) => {
        const curr = prev[sectorId];
        const next = {
          ...prev,
          [sectorId]: {
            ...curr,
            status: 'OPTIMAL' as const,
            preAlarm: null,
            health: Math.min(100, curr.health + 8),
            scrubberLoadPct: nominal.nominalScrubberLoadPct,
          },
        };
        sceneInstanceRef.current?.updateSectorStatus(next);
        return next;
      });
      addFloatingDelta('🔧 現場例行校準完成 (+1.5% 良率)', 'YIELD_UP');
    },
    [
      activePreAlarm,
      bayDistances,
      language,
      handleWalkToSector,
      addDecisionEvent,
      addFloatingDelta,
      spawnHazard,
    ]
  );

  // Handle Protocol Step Selection during Red Crisis (with Crucial PPE Step Verification!)
  const handleSelectProtocolStep = useCallback(
    (step: ProtocolStep) => {
      if (!activeHazard) return;

      const dist = bayDistances[activeHazard.sectorId] ?? 10;
      if (dist > ON_SITE_DISTANCE_THRESHOLD_M) {
        handleWalkToSector(activeHazard.sectorId);
        return;
      }

      const hazardDef = HAZARD_DEFINITIONS.find((h) => h.typeId === activeHazard.typeId);
      if (!hazardDef) return;

      const isZh = language === 'zh-TW';
      const nominal = INITIAL_SECTORS[activeHazard.sectorId];

      // 1. Check Crucial PPE Step before allowing hands-on containment!
      const reqPpe = hazardDef.ehsPillars.recommendedPPE;
      const hasRequiredPpe =
        reqPpe === 'SCBA'
          ? equippedPPE.scba
          : reqPpe === 'ACID_SUIT'
          ? equippedPPE.acidSuit
          : equippedPPE.hvGloves;

      const ppeNameZh =
        reqPpe === 'SCBA'
          ? '😷 SCBA 正壓呼吸器'
          : reqPpe === 'ACID_SUIT'
          ? '🧤 防酸化學防護服'
          : '⚡ 高壓絕緣/防夾手套';
      const ppeNameEn =
        reqPpe === 'SCBA'
          ? '😷 SCBA Respirator'
          : reqPpe === 'ACID_SUIT'
          ? '🧤 Acid Chemical Suit'
          : '⚡ Class-00 HV Gloves';

      if (!hasRequiredPpe) {
        soundManager.playErrorBuzzer();
        sceneInstanceRef.current?.triggerActionEffect('BACKFIRE_EXPLOSION', activeHazard.sectorId);
        const ppeFine = 15000;
        setAccumulatedFines((prev) => prev + ppeFine);
        setSafetyComplianceScore((prev) => Math.max(0, prev - 15));
        addDecisionEvent(
          nominal.code,
          `Attempted on-site SOP without mandatory PPE (${ppeNameEn})`,
          false,
          'OSHA 1910.132 (PPE)'
        );
        addFloatingDelta(
          isZh ? `🚨 未穿戴 ${ppeNameZh}！(-15% 工安)` : `🚨 Missing ${ppeNameEn}! (-15% EHS)`,
          'WAFER_SCRAP'
        );

        setChoiceOutcomes((prev) => [
          ...prev,
          {
            id: `co-ppe-${Date.now()}`,
            bayCode: nominal.code.split('/')[0].trim(),
            eventTitle: isZh ? activeHazard.titleZh : activeHazard.title,
            category: 'PPE_STEP',
            chosenAction: isZh
              ? `未穿戴【${ppeNameZh}】直接觸碰危險源`
              : `Acted without equipping [${ppeNameEn}]`,
            outcomeImpact: isZh
              ? `遭受現場危害直接暴露傷害（扣 15 分工安、OSHA 罰鍰 $15,000）`
              : `Direct personal hazard exposure (-15 EHS Score, $15,000 OSHA PPE Fine)`,
            alternativeComparison: isZh
              ? `關鍵原則：依指引先點擊穿戴【${ppeNameZh}】再執行搶救，即可零傷害完成處置！`
              : `Crucial Rule: Equip [${ppeNameEn}] first as instructed to prevent personal injury!`,
            isPositive: false,
            financialDeltaMillionsUSD: -0.8,
          },
        ]);

        setEhsDecisionFeedback({
          id: `fb-ppe-${Date.now()}`,
          type: 'PPE_VIOLATION',
          title: `CRUCIAL PPE STEP SKIPPED! Equip [${ppeNameEn}] First!`,
          titleZh: `🚨 遺漏關鍵 PPE 步驟！請先穿戴【${ppeNameZh}】再執行處置！`,
          explanation: hazardDef.ehsPillars.ppeInstruction,
          explanationZh: `${hazardDef.ehsPillars.ppeInstructionZh} 您在未穿戴防護具下直接操作，導致人員暴露受傷！請先點擊上方或下方 PPE 按鈕穿戴防護具。`,
          consequenceNote: `OSHA 1910.132 PPE Violation (-$15,000 Fine). Click [Equip PPE] in the banner above!`,
          consequenceNoteZh: `⚠️ 違反 OSHA 1910.132 個人防護規定 (-$15,000 罰鍰)。請立即點擊橫幅上的【穿戴 PPE】按鈕！`,
          standard: 'OSHA 1910.132 / SEMI S2 PPE Mandate',
          timestamp: Date.now(),
        });
        return;
      }

      const now = Date.now();
      if (firstActionTimeRef.current === null) {
        firstActionTimeRef.current = now;
      }

      const reactionTime = (firstActionTimeRef.current || now) - hazardStartTimeRef.current;
      const currentStageIndex = activeHazard.currentStageIndex;
      const isLastStage = currentStageIndex >= hazardDef.steps.length - 1;
      const wrongAlternative = activeHazard.protocolSteps.find((s) => !s.isCorrect);
      const rightAlternative = activeHazard.protocolSteps.find((s) => s.isCorrect);

      if (step.isCorrect) {
        soundManager.playSuccessChime();

        if (step.id.includes('shower') || step.id.includes('water')) {
          handleTriggerActionEffect('DELUGE_SHOWER', activeHazard.sectorId);
        } else if (
          step.id.includes('purge') ||
          step.id.includes('nitrogen') ||
          step.id.includes('sds') ||
          step.id.includes('n2')
        ) {
          handleTriggerActionEffect('N2_PURGE', activeHazard.sectorId);
        } else if (
          step.id.includes('arc') ||
          step.id.includes('ground') ||
          step.id.includes('loto')
        ) {
          handleTriggerActionEffect('ARC_SPARKS', activeHazard.sectorId);
        } else {
          handleTriggerActionEffect('SMOKE_SMOTHER', activeHazard.sectorId);
        }

        soundManager.stopEmergencyAlarm();

        if (isLastStage) {
          const completionTime = now - hazardStartTimeRef.current;
          addDecisionEvent(nominal.code, step.label, true);

          const savedM = hazardDef.ehsPillars.estimatedLossMillionsUSD;
          setFabValueSavedMillionsUSD((v) => Number((v + savedM).toFixed(1)));
          setLivesProtected((l) => l + 2);
          addFloatingDelta(`🏆 危機解除！挽救 $${savedM.toFixed(1)}M`, 'YIELD_UP');

          setChoiceOutcomes((prev) => [
            ...prev,
            {
              id: `co-sop-${Date.now()}`,
              bayCode: nominal.code.split('/')[0].trim(),
              eventTitle: isZh ? activeHazard.titleZh : activeHazard.title,
              category: 'EHS_SOP',
              chosenAction: `${isZh ? step.labelZh : step.label} (${ppeNameZh})`,
              outcomeImpact: isZh ? step.explanationZh : step.explanation,
              alternativeComparison: isZh
                ? `對照錯誤選項「${wrongAlternative?.labelZh || ''}」：${wrongAlternative?.explanationZh || ''}`
                : `Vs. Wrong Choice "${wrongAlternative?.label || ''}": ${wrongAlternative?.explanation || ''}`,
              isPositive: true,
              financialDeltaMillionsUSD: savedM,
            },
          ]);

          setEhsDecisionFeedback({
            id: `fb-${Date.now()}`,
            type: 'HAZARD_RESOLVED',
            title: `Crisis Contained! ${hazardDef.title}`,
            titleZh: `🏆 重大危機全數排除！${hazardDef.titleZh}`,
            explanation: step.explanation,
            explanationZh: step.explanationZh,
            consequenceNote: `Saved $${savedM.toFixed(1)}M & protected workers. Prevention tip: ${hazardDef.ehsPillars.howToPrevent}`,
            consequenceNoteZh: `💎 成功保護現場同仁與 $${savedM.toFixed(1)}M 資產！日後預防之道：${hazardDef.ehsPillars.howToPreventZh}`,
            standard: activeHazard.regulatoryStandard,
            timestamp: Date.now(),
          });

          const record: IncidentRecord = {
            incidentId: activeHazard.id,
            title: isZh ? activeHazard.titleZh : activeHazard.title,
            sectorName: isZh ? nominal.nameZh : nominal.name,
            severity: activeHazard.severity,
            level: activeHazard.level,
            reactionTimeMs: reactionTime,
            completionTimeMs: completionTime,
            targetTimeMs: 60000,
            stepsTaken: [
              {
                stepId: step.id,
                stepLabel: isZh ? step.labelZh : step.label,
                wasCorrect: true,
                explanation: isZh ? step.explanationZh : step.explanation,
              },
            ],
            success: true,
            fatalError: false,
            regulatoryStandard: activeHazard.regulatoryStandard,
            oshaViolationFine: 0,
            safetyScoreEarned: 25,
          };

          setIncidentRecords((prev) => [...prev, record]);
          setSafetyComplianceScore((prev) => Math.min(100, prev + 5));
          setActiveHazard(null);
          sceneInstanceRef.current?.setHazardActive(null, false);

          setSectors((prev) => {
            const next = {
              ...prev,
              [activeHazard.sectorId]: {
                ...prev[activeHazard.sectorId],
                activeHazardId: null,
                preAlarm: null,
                status: 'OPTIMAL' as const,
                health: Math.min(100, prev[activeHazard.sectorId].health + 12),
                scrubberLoadPct: nominal.nominalScrubberLoadPct,
                temperatureC: nominal.nominalTemp,
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });

          nextEventTimerRef.current = 30;
        } else {
          // Advance to next stage & visibly shrink 3D hazard diorama by 45%!
          const nextStageIdx = currentStageIndex + 1;
          const nextStage = hazardDef.steps[nextStageIdx];
          sceneInstanceRef.current?.setHazardMitigationProgress(nextStageIdx === 1 ? 0.55 : 0.35);
          addDecisionEvent(nominal.code, step.label, true);
          addFloatingDelta(
            isZh ? `✓ 第 ${currentStageIndex + 1} 階段抑制成功 (火勢/氣體減半)` : `✓ Stage ${currentStageIndex + 1} Contained (Hazard Reduced 50%)`,
            'COMBO_REFLEX'
          );

          const localizedChoices: ProtocolStep[] = shuffleChoices(
            nextStage.choices.map((c) => ({
              id: c.id,
              label: isZh ? c.labelZh : c.label,
              labelZh: c.labelZh,
              description: isZh ? c.descZh : c.description,
              descZh: c.descZh,
              isCorrect: c.isCorrect,
              explanation: isZh ? c.explanationZh : c.explanation,
              explanationZh: c.explanationZh,
              isFatalError: c.isFatalError,
            }))
          );

          setEhsDecisionFeedback({
            id: `fb-${Date.now()}`,
            type: 'CORRECT_STEP',
            title: `Stage ${currentStageIndex + 1} Contained — Proceed to Stage ${nextStageIdx + 1}`,
            titleZh: `✓ 第 ${currentStageIndex + 1} 階段抑制成功（3D 災害規模已減半）！請執行下一階段`,
            explanation: step.explanation,
            explanationZh: step.explanationZh,
            consequenceNote: `Next: ${nextStage.prompt}`,
            consequenceNoteZh: `下一步：${nextStage.promptZh}`,
            standard: activeHazard.regulatoryStandard,
            timestamp: Date.now(),
          });

          setActiveHazard({
            ...activeHazard,
            currentStageIndex: nextStageIdx,
            currentPrompt: nextStage.prompt,
            currentPromptZh: nextStage.promptZh,
            protocolSteps: localizedChoices,
            timeRemainingSec: 60,
            timeLimitSec: 60,
            isSilenced: true,
          });
        }
      } else {
        // Wrong choice / OSHA violation -> Trigger 3D Backfire Explosion & Camera Shake!
        soundManager.playErrorBuzzer();
        sceneInstanceRef.current?.triggerActionEffect('BACKFIRE_EXPLOSION', activeHazard.sectorId);

        const fine = step.isFatalError ? 75000 : 14500;
        const lossM = step.isFatalError ? hazardDef.ehsPillars.estimatedLossMillionsUSD : 1.4;
        setAccumulatedFines((prev) => prev + fine);
        setSafetyComplianceScore((prev) => Math.max(0, prev - (step.isFatalError ? 25 : 12)));
        setFabValueSavedMillionsUSD((v) => Math.max(0, Number((v - lossM * 0.4).toFixed(1))));
        addDecisionEvent(nominal.code, step.label, false, activeHazard.regulatoryStandard);
        addFloatingDelta(`💥 處置失誤！-$${(fine / 1000).toFixed(0)}k Fine`, 'WAFER_SCRAP');

        setChoiceOutcomes((prev) => [
          ...prev,
          {
            id: `co-err-${Date.now()}`,
            bayCode: nominal.code.split('/')[0].trim(),
            eventTitle: isZh ? activeHazard.titleZh : activeHazard.title,
            category: 'EHS_SOP',
            chosenAction: isZh ? step.labelZh : step.label,
            outcomeImpact: isZh ? step.explanationZh : step.explanation,
            alternativeComparison: isZh
              ? `若選擇正確 SOP「${rightAlternative?.labelZh || ''}」：${rightAlternative?.explanationZh || ''}`
              : `Correct SOP "${rightAlternative?.label || ''}" would have safely contained the hazard!`,
            isPositive: false,
            financialDeltaMillionsUSD: -lossM,
          },
        ]);

        if (step.isFatalError) {
          setFatalShutdownTriggered(true);
        }

        setKnowledgeGaps((prev) => [
          ...prev,
          {
            category: isZh ? hazardDef.titleZh : hazardDef.title,
            description: isZh
              ? `在「${hazardDef.titleZh}」中誤選了：「${step.labelZh}」。後果：${step.explanationZh}`
              : `Selected unsafe action "${step.label}": ${step.explanation}`,
            severity: step.isFatalError ? 'HIGH' : 'MEDIUM',
            remedialAction: isZh
              ? `正確應變 SOP：${hazardDef.ehsPillars.whatShouldDoZh}`
              : `Correct SOP: ${hazardDef.ehsPillars.whatShouldDo}`,
          },
        ]);

        setEhsDecisionFeedback({
          id: `fb-${Date.now()}`,
          type: step.isFatalError ? 'FATAL_ERROR' : 'WRONG_STEP',
          title: step.isFatalError
            ? `FATAL SAFETY BACKFIRE (-$${fine.toLocaleString()})`
            : `Unsafe Action Backfired (-$${fine.toLocaleString()})`,
          titleZh: step.isFatalError
            ? `💥 致命處置反噬爆炸！(-$${fine.toLocaleString()} 罰鍰)`
            : `⚠️ 錯誤處置導致災情擴大！(-$${fine.toLocaleString()} 罰鍰)`,
          explanation: step.explanation,
          explanationZh: step.explanationZh,
          consequenceNote: `Correct SOP: ${rightAlternative?.label || hazardDef.ehsPillars.whatShouldDo}`,
          consequenceNoteZh: `✅ 正確選項應為：${rightAlternative?.labelZh || hazardDef.ehsPillars.whatShouldDoZh}`,
          standard: activeHazard.regulatoryStandard,
          timestamp: Date.now(),
        });

        if (step.isFatalError) {
          const completionTime = now - hazardStartTimeRef.current;
          const record: IncidentRecord = {
            incidentId: activeHazard.id,
            title: isZh ? activeHazard.titleZh : activeHazard.title,
            sectorName: isZh ? nominal.nameZh : nominal.name,
            severity: activeHazard.severity,
            level: activeHazard.level,
            reactionTimeMs: reactionTime,
            completionTimeMs: completionTime,
            targetTimeMs: 60000,
            stepsTaken: [
              {
                stepId: step.id,
                stepLabel: isZh ? step.labelZh : step.label,
                wasCorrect: false,
                explanation: isZh ? step.explanationZh : step.explanation,
              },
            ],
            success: false,
            fatalError: true,
            failureReason: isZh ? step.explanationZh : step.explanation,
            regulatoryStandard: activeHazard.regulatoryStandard,
            oshaViolationFine: fine,
            safetyScoreEarned: 0,
          };

          setIncidentRecords((prev) => [...prev, record]);
          setActiveHazard(null);
          soundManager.stopEmergencyAlarm();
          sceneInstanceRef.current?.setHazardActive(null, false);

          setSectors((prev) => {
            const next = {
              ...prev,
              [activeHazard.sectorId]: {
                ...prev[activeHazard.sectorId],
                activeHazardId: null,
                preAlarm: null,
                status: 'OPTIMAL' as const,
                health: Math.max(25, prev[activeHazard.sectorId].health - 30),
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });

          nextEventTimerRef.current = 30;
        }
      }
    },
    [
      activeHazard,
      bayDistances,
      equippedPPE,
      handleWalkToSector,
      language,
      handleTriggerActionEffect,
      addDecisionEvent,
      addFloatingDelta,
    ]
  );

  // Direct EMO Hit trigger
  const handleHitEmoDirect = useCallback(
    (secId: SectorId) => {
      const dist = bayDistances[secId] ?? 10;
      if (dist > ON_SITE_DISTANCE_THRESHOLD_M) {
        handleWalkToSector(secId);
        return;
      }

      soundManager.playEmoHit();
      sceneInstanceRef.current?.triggerActionEffect('ARC_SPARKS', secId);

      if (activeHazard && activeHazard.sectorId === secId) {
        const emoChoice = activeHazard.protocolSteps.find(
          (c) =>
            c.id.includes('emo') ||
            c.id.includes('breaker') ||
            c.label.toLowerCase().includes('emo') ||
            c.labelZh.includes('EMO') ||
            c.labelZh.includes('斷路器')
        );

        if (emoChoice) {
          handleSelectProtocolStep(emoChoice);
          return;
        }
      }

      if (activePreAlarm && activePreAlarm.sectorId === secId) {
        handlePreventPreAlarm(secId);
        return;
      }

      addFloatingDelta(`🛑 ${INITIAL_SECTORS[secId].code.split('/')[0]} EMO Tested`, 'COMBO_REFLEX');
    },
    [
      activeHazard,
      activePreAlarm,
      bayDistances,
      handleWalkToSector,
      handleSelectProtocolStep,
      handlePreventPreAlarm,
      addFloatingDelta,
    ]
  );

  useEffect(() => {
    hitEmoHandlerRef.current = handleHitEmoDirect;
  }, [handleHitEmoDirect]);

  const handleSilenceAlarm = useCallback(() => {
    soundManager.stopEmergencyAlarm();
    soundManager.playUiClick();
    setActiveHazard((prev) => (prev ? { ...prev, isSilenced: true } : null));
  }, []);

  // Dynamic Parameter Tuning with Real-Time Physical Feedback
  const handleUpdateSectorParams = useCallback(
    (sectorId: SectorId, params: Partial<SectorState>) => {
      soundManager.playUiClick();
      setSectors((prev) => {
        const sec = prev[sectorId];
        if (!sec) return prev;

        const rf = params.rfPowerWatts !== undefined ? params.rfPowerWatts : sec.rfPowerWatts;
        const gas = params.gasFlowSccm !== undefined ? params.gasFlowSccm : sec.gasFlowSccm;
        const vac =
          params.chamberVacuumTorr !== undefined ? params.chamberVacuumTorr : sec.chamberVacuumTorr;
        const bypass = params.bypassActive !== undefined ? params.bypassActive : sec.bypassActive;

        const eff = Math.min(100, Math.max(35, Math.round(42 + (rf / 2500) * 58)));
        const temp =
          sectorId === 'DIFFUSION_FURNACE'
            ? Math.round(1010 + (rf / 2500) * 150)
            : Math.round(20 + (rf / 2500) * 290);
        const scrubber = Math.min(
          115,
          Math.max(15, Math.round((gas / 260) * 85 + (rf / 2500) * 20))
        );
        const particles = Math.max(0.2, Number(((vac / 760) * 5.2).toFixed(1)));

        // If a pre-alarm is active on this sector and the user de-escalates RF & Gas into safe range, auto-prevent!
        if (sec.preAlarm && rf <= 1450 && gas <= 105 && scrubber <= 82) {
          setTimeout(() => handlePreventPreAlarm(sectorId), 120);
        }

        // Check if extreme manual overload triggers immediate crisis (Fixed ASH3_TOXIC_GAS -> ARSINE_GAS_LEAK)
        if (scrubber >= 102 && !activeHazard) {
          const gasHazardId =
            sectorId === 'ETCH_CVD'
              ? 'SILANE_GAS_LEAK'
              : sectorId === 'CMP_WET_BENCH'
              ? 'HF_ACID_SPILL'
              : 'ARSINE_GAS_LEAK';
          setTimeout(() => {
            spawnHazard(gasHazardId);
          }, 400);
        } else if (rf >= 2350 && !activeHazard) {
          const rfHazardId =
            sectorId === 'DIFFUSION_FURNACE'
              ? 'FURNACE_QUARTZ_BREACH'
              : sectorId === 'PHOTOLITHOGRAPHY'
              ? 'ROBOTIC_FOUP_PINCH'
              : 'ION_HV_ARC_XRAY';
          setTimeout(() => {
            spawnHazard(rfHazardId);
          }, 400);
        }

        let status: SectorState['status'] = 'OPTIMAL';
        if (sec.activeHazardId) {
          status = 'CRITICAL';
        } else if (sec.preAlarm) {
          status = 'PRE_ALARM';
        } else if (scrubber > 85 || rf > 2050) {
          status = 'WARNING';
        }

        const next = {
          ...sec,
          ...params,
          rfPowerWatts: rf,
          gasFlowSccm: gas,
          chamberVacuumTorr: vac,
          bypassActive: bypass,
          efficiency: eff,
          temperatureC: temp,
          scrubberLoadPct: scrubber,
          particleCountPPM: particles,
          status,
        };

        const nextAll = { ...prev, [sectorId]: next };
        sceneInstanceRef.current?.updateSectorStatus(nextAll);
        return nextAll;
      });
    },
    [activeHazard, spawnHazard, handlePreventPreAlarm]
  );

  // Start new game / shift (6:00 / 360s standard shift with calm engineering intervals)
  const handleStartGame = useCallback(
    (mode: 'FULL_SHIFT' | 'HAZARD_DRILL' | 'CERTIFICATION_EXAM') => {
      const duration = mode === 'HAZARD_DRILL' ? 240 : mode === 'CERTIFICATION_EXAM' ? 360 : 360;
      setShiftMode(mode);
      setShiftDurationSec(duration);
      setShiftTimeRemaining(duration);
      setGameState('PLAYING');
      setSafetyComplianceScore(100);
      setAccumulatedFines(0);
      setTotalWafersProduced(0);
      setTotalDefectiveWafers(0);
      setPreAlarmsPrevented(0);
      setLivesProtected(5);
      setFabValueSavedMillionsUSD(1.2);
      setIncidentRecords([]);
      setKnowledgeGaps([]);
      setFlowStateSeconds(0);
      setActiveHazard(null);
      setActivePreAlarm(null);
      setEhsDecisionFeedback(null);
      setDecisionTimeline([]);
      setChoiceOutcomes([]);
      setFloatingDeltas([]);
      setFatalShutdownTriggered(false);
      setEquippedPPE({ scba: false, acidSuit: false, hvGloves: false });
      sceneInstanceRef.current?.setEquippedPPE({ scba: false, acidSuit: false, hvGloves: false });

      const firstTemplate = LOT_MISSION_TEMPLATES[0];
      setLotMissionIndex(0);
      setLotMission({
        ...firstTemplate,
        id: `lot-0-${Date.now()}`,
        startWaferCount: 0,
      });

      // Guarantee all 6 incidents (across all 5 bays) appear in random order
      hazardDeckRef.current = shuffleChoices(HAZARD_DEFINITIONS.map((h) => h.typeId));
      // Give player 22 seconds of calm cleanroom engineering at shift start (or 8s in quick drill mode)
      nextEventTimerRef.current = mode === 'HAZARD_DRILL' ? 8 : 22;

      soundManager.startAmbientHum();
      soundManager.stopEmergencyAlarm();

      setSectors((prev) => {
        const reset = { ...prev };
        (Object.keys(reset) as SectorId[]).forEach((sId) => {
          const def = INITIAL_SECTORS[sId];
          reset[sId] = {
            ...reset[sId],
            status: 'OPTIMAL',
            health: 100,
            efficiency: 85,
            activeHazardId: null,
            preAlarm: null,
            inputQueue: 20,
            outputQueue: 15,
            wafersCompleted: 0,
            wafersDefective: 0,
            bypassActive: false,
            rfPowerWatts: def.nominalRfPowerWatts,
            gasFlowSccm: def.nominalGasFlowSccm,
            chamberVacuumTorr: def.nominalChamberVacuumTorr,
            scrubberLoadPct: def.nominalScrubberLoadPct,
            temperatureC: def.nominalTemp,
          };
        });
        sceneInstanceRef.current?.updateSectorStatus(reset);
        return reset;
      });

      sceneInstanceRef.current?.setHazardActive(null, false);
      sceneInstanceRef.current?.setCameraView('VR_FIRST_PERSON');
      setCameraView('VR_FIRST_PERSON');
    },
    []
  );

  // Track Lot Mission completion
  useEffect(() => {
    if (gameState !== 'PLAYING' || !lotMission) return;
    const progress = totalWafersProduced - lotMission.startWaferCount;
    if (progress >= lotMission.targetWaferCount) {
      soundManager.playSuccessChime();
      addFloatingDelta(`📦 ${lotMission.lotCode} 完成！+$0.8M 產值`, 'YIELD_UP');
      setFabValueSavedMillionsUSD((v) => Number((v + 0.8).toFixed(1)));
      const nextIdx = (lotMissionIndex + 1) % LOT_MISSION_TEMPLATES.length;
      const nextTpl = LOT_MISSION_TEMPLATES[nextIdx];
      setLotMissionIndex(nextIdx);
      setLotMission({
        ...nextTpl,
        id: `lot-${nextIdx}-${Date.now()}`,
        startWaferCount: totalWafersProduced,
      });
    }
  }, [totalWafersProduced, gameState, lotMission, lotMissionIndex, addFloatingDelta]);

  // Finish Shift
  const finishShift = useCallback(() => {
    soundManager.stopEmergencyAlarm();
    soundManager.stopAmbientHum();
    setGameState('DEBRIEF');

    const totalIncidents = incidentRecords.length;
    const avgReaction =
      totalIncidents > 0
        ? incidentRecords.reduce((acc, r) => acc + r.reactionTimeMs, 0) / totalIncidents
        : 2400;

    let newCert = careerRecord.certificationLevel;
    if (safetyComplianceScore >= 95 && careerRecord.totalShiftsCompleted >= 2) {
      newCert = 'MASTER_SAFETY_DIRECTOR';
    } else if (safetyComplianceScore >= 85) {
      newCert = 'HAZMAT_WARDEN';
    } else if (safetyComplianceScore >= 70) {
      newCert = 'FAB_SPECIALIST';
    }

    const updatedCareer: UserCareerRecord = {
      totalShiftsCompleted: careerRecord.totalShiftsCompleted + 1,
      totalIncidentsHandled:
        careerRecord.totalIncidentsHandled + totalIncidents + preAlarmsPrevented,
      bestComplianceScore: Math.max(careerRecord.bestComplianceScore, safetyComplianceScore),
      averageReactionTimeMs: avgReaction,
      certificationLevel: newCert,
      incidentHistory: [...careerRecord.incidentHistory, ...incidentRecords].slice(-30),
    };

    saveCareer(updatedCareer);
  }, [incidentRecords, preAlarmsPrevented, safetyComplianceScore, careerRecord, saveCareer]);

  // Main 1-Second Simulation Tick Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. Shift Clock
      setShiftTimeRemaining((prev) => {
        if (prev <= 1) {
          finishShift();
          return 0;
        }
        return prev - 1;
      });

      // 2. Active Pre-Alarm Countdown (30s comfortable prevention window)
      if (activePreAlarm && !activeHazard) {
        if (activePreAlarm.timeRemainingSec <= 1) {
          // Escalate unaddressed Pre-Alarm into full Red Crisis!
          const escalateTypeId = activePreAlarm.hazardTypeId;
          setActivePreAlarm(null);
          spawnHazard(escalateTypeId);
        } else {
          const nextRemaining = activePreAlarm.timeRemainingSec - 1;
          const updatedPre = { ...activePreAlarm, timeRemainingSec: nextRemaining };
          setActivePreAlarm(updatedPre);
          setSectors((prev) => {
            const next = {
              ...prev,
              [activePreAlarm.sectorId]: {
                ...prev[activePreAlarm.sectorId],
                preAlarm: updatedPre,
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });
        }
      }

      // 3. Active Red Hazard Countdown (50s comfortable decision window)
      setActiveHazard((curr) => {
        if (!curr) return null;
        if (curr.timeRemainingSec <= 1) {
          soundManager.playErrorBuzzer();
          soundManager.stopEmergencyAlarm();
          sceneInstanceRef.current?.setHazardActive(null, false);

          const isZh = language === 'zh-TW';
          const record: IncidentRecord = {
            incidentId: curr.id,
            title: isZh ? curr.titleZh : curr.title,
            sectorName: isZh
              ? INITIAL_SECTORS[curr.sectorId].nameZh
              : INITIAL_SECTORS[curr.sectorId].name,
            severity: curr.severity,
            level: curr.level,
            reactionTimeMs: curr.timeLimitSec * 1000,
            completionTimeMs: curr.timeLimitSec * 1000,
            targetTimeMs: curr.timeLimitSec * 1000,
            stepsTaken: [],
            success: false,
            fatalError: false,
            failureReason: isZh
              ? '超過應變時間，系統自動觸發安全隔離。'
              : 'Decision window expired; automatic safety isolation triggered.',
            regulatoryStandard: curr.regulatoryStandard,
            oshaViolationFine: 25000,
            safetyScoreEarned: 0,
          };
          setIncidentRecords((prev) => [...prev, record]);
          setSafetyComplianceScore((prev) => Math.max(0, prev - 15));
          setAccumulatedFines((prev) => prev + 25000);
          setSectors((prevSec) => ({
            ...prevSec,
            [curr.sectorId]: {
              ...prevSec[curr.sectorId],
              activeHazardId: null,
              status: 'OPTIMAL',
              health: Math.max(40, prevSec[curr.sectorId].health - 20),
            },
          }));
          nextEventTimerRef.current = 28;
          return null;
        }
        return {
          ...curr,
          timeRemainingSec: curr.timeRemainingSec - 1,
        };
      });

      // 4. Spawn Equipment Drift / Troubleshooting Pre-Alarm (or Drill Crisis) when timer hits 0
      if (!activeHazard && !activePreAlarm) {
        nextEventTimerRef.current -= 1;
        if (nextEventTimerRef.current <= 0) {
          if (shiftMode === 'HAZARD_DRILL') {
            spawnHazard();
          } else {
            // In FULL_SHIFT & CERTIFICATION_EXAM, always start as a quiet Amber Troubleshooting Diagnostic first!
            // Red EHS sirens only trigger if troubleshooting fails or is ignored!
            spawnPreAlarm();
          }
        }
      }

      // 5. Continuous Equipment Drift & Sequential 5-Bay CMOS Wafer Pipeline
      setSectors((prev) => {
        const pipeline: SectorId[] = [
          'PHOTOLITHOGRAPHY',
          'ETCH_CVD',
          'CMP_WET_BENCH',
          'DIFFUSION_FURNACE',
          'ION_IMPLANTATION',
        ];

        let newGood = 0;
        let newScrap = 0;
        const nextState = { ...prev };

        const allOptimal = pipeline.every((id) => nextState[id].status === 'OPTIMAL');
        if (allOptimal) {
          setFlowStateSeconds((s) => s + 1);
        } else {
          setFlowStateSeconds(0);
        }

        for (let i = 0; i < pipeline.length; i++) {
          const sId = pipeline[i];
          const curr = { ...nextState[sId] };
          nextState[sId] = curr;

          if (curr.status === 'SHUTDOWN') continue;

          // Gentle natural drift when running high power
          if (!curr.activeHazardId && !curr.preAlarm && curr.rfPowerWatts > 1550) {
            curr.scrubberLoadPct = Math.min(96, curr.scrubberLoadPct + 0.35);
          }

          const rate = (curr.efficiency / 100) * 0.8;
          const isHazard = curr.activeHazardId !== null;
          const defectChance = isHazard
            ? 0.28
            : Math.max(
                0.005,
                curr.particleCountPPM * 0.015 +
                  (curr.gasFlowSccm < 30 ? 0.04 : 0) +
                  (100 - curr.health) * 0.0015
              );

          if (curr.inputQueue > 0 && Math.random() < rate) {
            const batchSize = Math.min(curr.inputQueue, Math.floor(Math.random() * 3) + 1);
            curr.inputQueue -= batchSize;

            if (Math.random() < defectChance) {
              newScrap += batchSize;
              curr.wafersDefective += batchSize;
            } else {
              if (i === pipeline.length - 1) {
                newGood += batchSize;
                curr.wafersCompleted += batchSize;
              } else {
                const nextBayId = pipeline[i + 1];
                const nextBay = { ...nextState[nextBayId] };
                nextState[nextBayId] = nextBay;
                nextBay.inputQueue = nextBay.bypassActive
                  ? Math.min(25, nextBay.inputQueue + batchSize)
                  : nextBay.inputQueue + batchSize;
              }
            }
          }

          if (i === 0 && curr.inputQueue < 16) {
            curr.inputQueue += 20;
          }
        }

        if (newGood > 0) {
          setTotalWafersProduced((g) => g + newGood);
        }
        if (newScrap > 0) {
          setTotalDefectiveWafers((d) => d + newScrap);
        }

        sceneInstanceRef.current?.updateSectorStatus(nextState);
        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameState,
    activeHazard,
    activePreAlarm,
    shiftMode,
    spawnHazard,
    spawnPreAlarm,
    finishShift,
    language,
  ]);

  // Keyboard shortcuts (`1/2/3` Camera Views including Whole Fab View `2`, `Esc` Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (isInstructionsOpen) {
          setIsInstructionsOpen(false);
          return;
        }
        if (isFeedbackModalOpen) {
          setIsFeedbackModalOpen(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          soundManager.stopEmergencyAlarm();
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          if (activeHazard && !activeHazard.isSilenced) soundManager.startEmergencyAlarm();
        }
      }
      if (e.key === '1') handleChangeCameraView('VR_FIRST_PERSON');
      if (e.key === '2') handleChangeCameraView('SUPERVISOR_ISOMETRIC');
      if (e.key === '3') handleChangeCameraView('INSPECTION');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    activeHazard,
    isInstructionsOpen,
    isFeedbackModalOpen,
    handleChangeCameraView,
  ]);

  const totalWafers = totalWafersProduced + totalDefectiveWafers;
  const overallYieldPct = totalWafers > 0 ? (totalWafersProduced / totalWafers) * 100 : 96.5;

  const currentMetrics: SimulationMetrics = {
    totalShiftTimeSec: shiftDurationSec - shiftTimeRemaining,
    incidentsEncountered: incidentRecords.length,
    incidentsResolved: incidentRecords.filter((r) => r.success).length,
    incidentsFailed: incidentRecords.filter((r) => !r.success).length,
    preAlarmsPrevented,
    livesProtected,
    fabValueSavedMillionsUSD,
    averageReactionTimeMs:
      incidentRecords.length > 0
        ? incidentRecords.reduce((acc, r) => acc + r.reactionTimeMs, 0) / incidentRecords.length
        : 2200,
    protocolAccuracyPct:
      incidentRecords.length > 0
        ? (incidentRecords.filter((r) => r.success).length / incidentRecords.length) * 100
        : 100,
    totalWafersProduced,
    totalWafersDefective: totalDefectiveWafers,
    overallYieldPct,
    safetyComplianceScore,
    regulatoryFinesTotal: accumulatedFines,
    zeroIncidentStreak: careerRecord.totalShiftsCompleted,
    flowStateSeconds,
    knowledgeGaps,
    decisionTimeline,
    choiceOutcomes,
    fatalShutdownTriggered,
    operatorName: playerName,
    socialTitle:
      overallYieldPct >= 95 && safetyComplianceScore >= 95
        ? 'FAB_DIRECTOR'
        : overallYieldPct >= 95 && safetyComplianceScore < 75
        ? 'YIELD_DEMON'
        : safetyComplianceScore >= 95
        ? 'SAFETY_SAINT'
        : 'CLEANROOM_ROOKIE',
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Three.js 3D Cleanroom Canvas */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          language={language}
          onToggleLanguage={toggleLanguage}
          onStartGame={handleStartGame}
          careerRecord={careerRecord}
          onOpenManagerAudit={() => setIsManagerAuditOpen(true)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
        />
      )}

      {/* Active In-Game HUD Overlay */}
      {gameState === 'PLAYING' && (
        <HUDOverlay
          language={language}
          onToggleLanguage={toggleLanguage}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          onSilenceAlarm={handleSilenceAlarm}
          shiftTimeRemainingSec={shiftTimeRemaining}
          overallYieldPct={overallYieldPct}
          totalWafersProduced={totalWafersProduced}
          defectiveWafers={totalDefectiveWafers}
          safetyScore={safetyComplianceScore}
          fabValueSavedMillionsUSD={fabValueSavedMillionsUSD}
          activeHazard={activeHazard}
          activePreAlarm={activePreAlarm}
          sectors={sectors}
          selectedSectorId={selectedSectorId}
          onSelectSector={(sId) => {
            setSelectedSectorId(sId);
            sceneInstanceRef.current?.focusSector(sId);
            soundManager.playUiClick();
          }}
          onWalkToSector={handleWalkToSector}
          onPreventPreAlarm={handlePreventPreAlarm}
          onSelectProtocolStep={handleSelectProtocolStep}
          onHitEmo={handleHitEmoDirect}
          onTriggerPhysicalAction={handleTriggerActionEffect}
          onPause={() => {
            setGameState('PAUSED');
            soundManager.stopEmergencyAlarm();
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          cameraView={cameraView}
          onChangeCameraView={handleChangeCameraView}
          ehsDecisionFeedback={ehsDecisionFeedback}
          onDismissFeedback={() => setEhsDecisionFeedback(null)}
          flowStateSeconds={flowStateSeconds}
          floatingDeltas={floatingDeltas}
          playerName={playerName}
          onTuneSectorParams={handleUpdateSectorParams}
          bayDistances={bayDistances}
          isAutoWalking={isAutoWalking}
          walkingTargetSector={walkingTargetSector}
          offscreenIndicators={offscreenIndicators}
          equippedPPE={equippedPPE}
          onTogglePPE={handleTogglePPE}
          lotMission={lotMission}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          language={language}
          onToggleLanguage={toggleLanguage}
          onResume={() => {
            setGameState('PLAYING');
            if (activeHazard && !activeHazard.isSilenced) soundManager.startEmergencyAlarm();
          }}
          onRestart={() => handleStartGame(shiftMode)}
          onReturnToTitle={() => {
            setGameState('TITLE');
            soundManager.stopEmergencyAlarm();
            soundManager.stopAmbientHum();
          }}
          onOpenTrainingManual={() => setIsInstructionsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Post-Simulation 1-Page Share Card & Debrief Modal */}
      {gameState === 'DEBRIEF' && (
        <DebriefModal
          language={language}
          metrics={currentMetrics}
          incidentRecords={incidentRecords}
          onRestart={() => handleStartGame(shiftMode)}
          onOpenTrainingManual={() => setIsInstructionsOpen(true)}
          onReturnToTitle={() => setGameState('TITLE')}
        />
      )}

      {/* Manager Compliance & Knowledge Gap Audit Modal */}
      {isManagerAuditOpen && (
        <ManagerAnalyticsModal
          language={language}
          careerRecord={careerRecord}
          onClose={() => setIsManagerAuditOpen(false)}
          onResetCareer={() => {
            saveCareer(DEFAULT_CAREER);
            setIsManagerAuditOpen(false);
          }}
        />
      )}

      {/* Unified 4-Pillar EHS Field Guide & Instructions Modal */}
      {isInstructionsOpen && (
        <InstructionsModal
          language={language}
          onClose={() => setIsInstructionsOpen(false)}
          onStartShift={() => {
            setIsInstructionsOpen(false);
            if (gameState === 'TITLE') {
              handleStartGame('FULL_SHIFT');
            }
          }}
        />
      )}

      {/* Zero-Redirect In-Game Google Form Feedback Modal */}
      {isFeedbackModalOpen && (
        <GoogleFormModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          language={language}
          metrics={currentMetrics}
        />
      )}
    </div>
  );
}
