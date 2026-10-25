import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActionEffectType } from './3d/ParticleEffects';
import { FabScene } from './3d/FabScene';
import { soundManager } from './audio/soundManager';
import { DebriefModal } from './components/DebriefModal';
import { HUDOverlay } from './components/HUDOverlay';
import { InspectionTabletModal } from './components/InspectionTabletModal';
import { InstructionsModal } from './components/InstructionsModal';
import { ManagerAnalyticsModal } from './components/ManagerAnalyticsModal';
import { PauseModal } from './components/PauseModal';
import { SupervisorDispatchModal } from './components/SupervisorDispatchModal';
import { TitleScreen } from './components/TitleScreen';
import { TrainingManualModal } from './components/TrainingManualModal';
import { HAZARD_DEFINITIONS, INITIAL_SECTORS, shuffleChoices } from './data/protocols';
import { Language, TRANSLATIONS } from './i18n/translations';
import {
  CameraViewMode,
  DecisionTimelineEvent,
  FloatingDelta,
  GameState,
  HazardIncident,
  IncidentRecord,
  PlayerRole,
  ProtocolStep,
  SectorId,
  SectorState,
  SimulationMetrics,
  UserCareerRecord,
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

  // Game States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [cameraView, setCameraView] = useState<CameraViewMode>('VR_FIRST_PERSON');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isManagerAuditOpen, setIsManagerAuditOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  // Dual Role State: Equipment Engineer vs. Shift Supervisor
  const [playerRole, setPlayerRole] = useState<PlayerRole>('EQUIPMENT_ENGINEER');
  const [isTabletOpen, setIsTabletOpen] = useState<boolean>(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState<boolean>(false);

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

  // Active Hazard & Incident Tracking
  const [activeHazard, setActiveHazard] = useState<HazardIncident | null>(null);
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  // Shift Simulation Telemetry & Flow State Streak
  const [shiftDurationSec, setShiftDurationSec] = useState<number>(150);
  const [shiftTimeRemaining, setShiftTimeRemaining] = useState<number>(150);
  const [totalWafersProduced, setTotalWafersProduced] = useState<number>(0);
  const [totalDefectiveWafers, setTotalDefectiveWafers] = useState<number>(0);
  const [safetyComplianceScore, setSafetyComplianceScore] = useState<number>(100);
  const [accumulatedFines, setAccumulatedFines] = useState<number>(0);
  const [flowStateSeconds, setFlowStateSeconds] = useState<number>(0);

  // New feedback & gamification states: Floating deltas, Decision timeline, Fatal shutdown
  const [floatingDeltas, setFloatingDeltas] = useState<FloatingDelta[]>([]);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionTimelineEvent[]>([]);
  const [fatalShutdownTriggered, setFatalShutdownTriggered] = useState<boolean>(false);

  // Knowledge gaps identified during shift
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

  // 3D Scene Ref & Mounting
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneInstanceRef = useRef<FabScene | null>(null);
  const nextHazardTimerRef = useRef<number>(18);
  const hazardDeckRef = useRef<string[]>([]);
  const hazardStartTimeRef = useRef<number>(0);
  const firstActionTimeRef = useRef<number | null>(null);

  // Operator Name State (Persisted)
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

  // Save career record helper
  const saveCareer = useCallback((updated: UserCareerRecord) => {
    setCareerRecord(updated);
    try {
      localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }, []);

  // Initialize or re-attach 3D Canvas
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
        handleHitEmoDirect(secId);
      },
    });

    sceneInstanceRef.current = scene;

    return () => {
      scene.destroy();
      sceneInstanceRef.current = null;
    };
  }, []);

  // Update 3D Camera view
  const handleChangeCameraView = useCallback((mode: CameraViewMode) => {
    setCameraView(mode);
    sceneInstanceRef.current?.setCameraView(mode);
    soundManager.playUiClick();
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Floating Delta & Gamification Notifications
  const addFloatingDelta = useCallback(
    (text: string, type: FloatingDelta['type']) => {
      const id = `delta-${Date.now()}-${Math.random()}`;
      setFloatingDeltas((prev) => [...prev.slice(-4), { id, text, type, timestamp: Date.now() }]);
      setTimeout(() => {
        setFloatingDeltas((prev) => prev.filter((d) => d.id !== id));
      }, 2200);
    },
    []
  );

  // Decision Timeline Logging for 8D RCA Incident Report
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

  // Trigger high-impact physical action effect in 3D
  const handleTriggerActionEffect = useCallback(
    (type: ActionEffectType, sectorId?: SectorId) => {
      sceneInstanceRef.current?.triggerActionEffect(type, sectorId);
    },
    []
  );

  // Direct EMO Hit trigger
  const handleHitEmoDirect = useCallback(
    (secId: SectorId) => {
      soundManager.playEmoHit();

      if (activeHazard && activeHazard.sectorId === secId) {
        const emoChoice = activeHazard.protocolSteps.find(
          (c) =>
            c.id.includes('emo') ||
            c.label.toLowerCase().includes('emo') ||
            c.label.toLowerCase().includes('急停') ||
            c.label.toLowerCase().includes('emergency machine off')
        );

        if (emoChoice) {
          handleSelectProtocolStep(emoChoice);
          return;
        }
      }

      setSectors((prev) => {
        const curr = prev[secId];
        return {
          ...prev,
          [secId]: {
            ...curr,
            status: 'SHUTDOWN',
            efficiency: 0,
          },
        };
      });

      const isZh = language === 'zh-TW';
      setLastFeedback({
        text: isZh
          ? `已手動觸發 ${INITIAL_SECTORS[secId].code} 之 EMO 緊急停機開關，電源已安全斷開。`
          : `Emergency Machine Off (EMO) tripped for ${INITIAL_SECTORS[secId].code}. Power isolated.`,
        isCorrect: true,
      });
      setTimeout(() => setLastFeedback(null), 3000);
    },
    [activeHazard, language]
  );

  // Silence Alarm manually
  const handleSilenceAlarm = useCallback(() => {
    soundManager.stopEmergencyAlarm();
    soundManager.playUiClick();
    setActiveHazard((prev) => (prev ? { ...prev, isSilenced: true } : null));
    const isZh = language === 'zh-TW';
    setLastFeedback({
      text: isZh
        ? '🔕 現場警報已消音，請專注依 SOP 執行處置'
        : '🔕 Alarm siren silenced. Continue following containment protocol.',
      isCorrect: true,
    });
    setTimeout(() => setLastFeedback(null), 3500);
  }, [language]);

  // Toggle Wafer Bypass for a Sector
  const handleToggleBypass = useCallback(
    (sectorId: SectorId) => {
      soundManager.playUiClick();
      setSectors((prev) => {
        const sec = prev[sectorId];
        const newBypass = !sec.bypassActive;
        addDecisionEvent(
          sec.code,
          newBypass ? 'Wafer bypass routing engaged to relieve line pressure' : 'Normal routing restored',
          true
        );
        addFloatingDelta(newBypass ? 'Bypass ON' : 'Normal Flow', 'COMBO_REFLEX');
        return {
          ...prev,
          [sectorId]: {
            ...sec,
            bypassActive: newBypass,
            inputQueue: newBypass ? Math.min(15, sec.inputQueue) : sec.inputQueue,
          },
        };
      });
    },
    [addDecisionEvent, addFloatingDelta]
  );

  // Calibrate Sector (Handheld tablet action)
  const handleCalibrateSector = useCallback(
    (sectorId: SectorId) => {
      soundManager.playSuccessChime();
      setSectors((prev) => {
        const sec = prev[sectorId];
        addDecisionEvent(sec.code, 'Calibrated tool recipe & impedance matching', true);
        addFloatingDelta('+1.5% Yield', 'YIELD_UP');
        const next = {
          ...prev,
          [sectorId]: {
            ...sec,
            status: 'OPTIMAL',
            health: Math.min(100, sec.health + 8),
            efficiency: Math.min(100, sec.efficiency + 5),
            particleCountPPM: Math.max(1, sec.particleCountPPM - 1.5),
          },
        };
        sceneInstanceRef.current?.updateSectorStatus(next);
        return next;
      });
    },
    [addDecisionEvent, addFloatingDelta]
  );

  // Dynamic Parameter Tuning with Real-Time Hazards
  const handleUpdateSectorParams = useCallback(
    (sectorId: SectorId, params: Partial<SectorState>) => {
      setSectors((prev) => {
        const sec = prev[sectorId];
        const next = { ...sec, ...params };

        if (params.rfPowerWatts && params.rfPowerWatts >= 2100) {
          addDecisionEvent(sec.code, `Pushed RF Power to ${params.rfPowerWatts}W (Arcing hazard threshold)`, false, 'NFPA 70E');
        }
        if (params.gasFlowSccm && params.gasFlowSccm >= 140) {
          addDecisionEvent(sec.code, `Pushed Gas Flow to ${params.gasFlowSccm} sccm (High scrubber load)`, false, 'SEMI S2');
        }

        // Check if scrubber overloaded > 100%
        if (next.scrubberLoadPct >= 100 && !activeHazard) {
          setTimeout(() => {
            spawnHazard('ARSINE_GAS_LEAK');
            addDecisionEvent(sec.code, 'Scrubber load exceeded 100% backflow limit -> Catastrophic leak', false, 'SEMI S2 / OSHA 1910.119');
            addFloatingDelta('CRITICAL LEAK!', 'WAFER_SCRAP');
          }, 400);
        } else if (next.rfPowerWatts >= 2200 && next.temperatureC > 360 && !activeHazard) {
          setTimeout(() => {
            spawnHazard('ION_HV_ARC_XRAY');
            addDecisionEvent(sec.code, 'RF Power arc-flash 200kV triggered', false, 'NFPA 70E');
            addFloatingDelta('200kV ARC FLASH!', 'WAFER_SCRAP');
          }, 400);
        }

        const nextAll = { ...prev, [sectorId]: next };
        sceneInstanceRef.current?.updateSectorStatus(nextAll);
        return nextAll;
      });
    },
    [activeHazard, addDecisionEvent, addFloatingDelta]
  );

  // Start new game / shift
  const handleStartGame = useCallback((mode: 'FULL_SHIFT' | 'HAZARD_DRILL' | 'CERTIFICATION_EXAM') => {
    const duration = mode === 'HAZARD_DRILL' ? 90 : mode === 'CERTIFICATION_EXAM' ? 180 : 150;
    setShiftDurationSec(duration);
    setShiftTimeRemaining(duration);
    setGameState('PLAYING');
    setSafetyComplianceScore(100);
    setAccumulatedFines(0);
    setTotalWafersProduced(0);
    setTotalDefectiveWafers(0);
    setIncidentRecords([]);
    setKnowledgeGaps([]);
    setFlowStateSeconds(0);
    setActiveHazard(null);
    setDecisionTimeline([]);
    setFloatingDeltas([]);
    setFatalShutdownTriggered(false);

    // Guarantee all 5 incidents appear in random order throughout the shift
    hazardDeckRef.current = shuffleChoices(HAZARD_DEFINITIONS.map((h) => h.typeId));
    nextHazardTimerRef.current = 14;

    soundManager.startAmbientHum();
    soundManager.stopEmergencyAlarm();

    // Reset sectors
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
          inputQueue: 20,
          outputQueue: 15,
          wafersCompleted: 0,
          wafersDefective: 0,
          bypassActive: false,
          rfPowerWatts: def.nominalRfPowerWatts,
          gasFlowSccm: def.nominalGasFlowSccm,
          chamberVacuumTorr: def.nominalChamberVacuumTorr,
          scrubberLoadPct: def.nominalScrubberLoadPct,
        };
      });
      return reset;
    });

    sceneInstanceRef.current?.setHazardActive(null, false);
    sceneInstanceRef.current?.setCameraView('VR_FIRST_PERSON');
    setCameraView('VR_FIRST_PERSON');
  }, []);

  // Spawn a Hazard Incident with shuffled choices and Level tag
  const spawnHazard = useCallback((specificTypeId?: string) => {
    if (activeHazard) return;

    let randDef: (typeof HAZARD_DEFINITIONS)[0];
    if (specificTypeId) {
      randDef = HAZARD_DEFINITIONS.find((h) => h.typeId === specificTypeId) || HAZARD_DEFINITIONS[0];
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

    const localizedChoices: ProtocolStep[] = shuffleChoices(stage0.choices.map((c) => ({
      id: c.id,
      label: isZh ? c.labelZh : c.label,
      labelZh: c.labelZh,
      description: isZh ? c.descZh : c.description,
      descZh: c.descZh,
      isCorrect: c.isCorrect,
      explanation: isZh ? c.explanationZh : c.explanation,
      explanationZh: c.explanationZh,
      isFatalError: c.isFatalError,
    })));

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
      timeLimitSec: 35,
      timeRemainingSec: 35,
      startTime: Date.now(),
      currentStageIndex: 0,
      totalStages: randDef.steps.length,
      currentPrompt: stage0.prompt,
      currentPromptZh: stage0.promptZh,
      protocolSteps: localizedChoices,
      resolved: false,
      failed: false,
      isSilenced: false,
      regulatoryStandard: randDef.regulatoryStandard,
    };

    setActiveHazard(newIncident);
    hazardStartTimeRef.current = Date.now();
    firstActionTimeRef.current = null;

    setSectors((prev) => {
      const next = {
        ...prev,
        [sectorId]: {
          ...prev[sectorId],
          activeHazardId: newIncident.id,
          status: 'WARNING',
          efficiency: Math.max(20, prev[sectorId].efficiency - 30),
        },
      };
      sceneInstanceRef.current?.updateSectorStatus(next);
      return next;
    });

    // Trigger 3D strobe beacons & hazard effect
    sceneInstanceRef.current?.setHazardActive(sectorId, true, randDef.typeId);

    // Audio alarm
    soundManager.startEmergencyAlarm();
  }, [activeHazard, language]);

  // Handle Protocol Step Selection
  const handleSelectProtocolStep = useCallback(
    (step: ProtocolStep) => {
      if (!activeHazard) return;

      const now = Date.now();
      if (firstActionTimeRef.current === null) {
        firstActionTimeRef.current = now;
      }

      const hazardDef = HAZARD_DEFINITIONS.find((h) => h.typeId === activeHazard.typeId);
      if (!hazardDef) return;

      const isZh = language === 'zh-TW';
      const reactionTime = (firstActionTimeRef.current || now) - hazardStartTimeRef.current;
      const currentStageIndex = activeHazard.currentStageIndex;
      const isLastStage = currentStageIndex >= hazardDef.steps.length - 1;

      if (step.isCorrect) {
        soundManager.playSuccessChime();

        // Trigger corresponding 3D physical particle effect!
        if (step.id.includes('shower') || step.id.includes('water')) {
          handleTriggerActionEffect('DELUGE_SHOWER', activeHazard.sectorId);
        } else if (step.id.includes('purge') || step.id.includes('nitrogen') || step.id.includes('sds')) {
          handleTriggerActionEffect('N2_PURGE', activeHazard.sectorId);
        } else if (step.id.includes('arc') || step.id.includes('ground') || step.id.includes('loto')) {
          handleTriggerActionEffect('ARC_SPARKS', activeHazard.sectorId);
        } else {
          handleTriggerActionEffect('SMOKE_SMOTHER', activeHazard.sectorId);
        }

        // Silence continuous siren once player takes first correct action
        soundManager.stopEmergencyAlarm();

        if (isLastStage) {
          const completionTime = now - hazardStartTimeRef.current;
          addDecisionEvent(INITIAL_SECTORS[activeHazard.sectorId].code, step.label, true);
          addFloatingDelta('+3.0% Yield', 'YIELD_UP');

          setLastFeedback({
            text: isZh
              ? `✓ 危機全數排除！${step.explanation}`
              : `✓ HAZARD FULLY RESOLVED! ${step.explanation}`,
            isCorrect: true,
          });
          setTimeout(() => setLastFeedback(null), 4500);

          const record: IncidentRecord = {
            incidentId: activeHazard.id,
            title: isZh ? activeHazard.titleZh : activeHazard.title,
            sectorName: isZh
              ? INITIAL_SECTORS[activeHazard.sectorId].nameZh
              : INITIAL_SECTORS[activeHazard.sectorId].name,
            severity: activeHazard.severity,
            level: activeHazard.level,
            reactionTimeMs: reactionTime,
            completionTimeMs: completionTime,
            targetTimeMs: 35000,
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
          soundManager.stopEmergencyAlarm();
          sceneInstanceRef.current?.setHazardActive(null, false);

          setSectors((prev) => {
            const next = {
              ...prev,
              [activeHazard.sectorId]: {
                ...prev[activeHazard.sectorId],
                activeHazardId: null,
                status: 'OPTIMAL' as const,
                health: Math.min(100, prev[activeHazard.sectorId].health + 10),
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });

          // Next hazard interval from shuffled queue
          nextHazardTimerRef.current = 14 + Math.floor(Math.random() * 6);
        } else {
          // Advance to next stage in multi-step protocol with shuffled choices
          const nextStageIdx = currentStageIndex + 1;
          const nextStage = hazardDef.steps[nextStageIdx];
          addDecisionEvent(INITIAL_SECTORS[activeHazard.sectorId].code, step.label, true);
          addFloatingDelta('+250 EHS Points', 'COMBO_REFLEX');

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

          setLastFeedback({
            text: isZh
              ? `第 ${currentStageIndex + 1} 階段成功！${step.explanation}`
              : `Stage ${currentStageIndex + 1} resolved! ${step.explanation}`,
            isCorrect: true,
          });
          setTimeout(() => setLastFeedback(null), 3500);

          // Refresh timer to fresh 35s for next stage
          setActiveHazard({
            ...activeHazard,
            currentStageIndex: nextStageIdx,
            currentPrompt: nextStage.prompt,
            currentPromptZh: nextStage.promptZh,
            protocolSteps: localizedChoices,
            timeRemainingSec: 35,
            timeLimitSec: 35,
            isSilenced: true,
          });
        }
      } else {
        // Wrong choice / OSHA violation
        soundManager.playErrorBuzzer();

        const fine = step.isFatalError ? 75000 : 14500;
        setAccumulatedFines((prev) => prev + fine);
        setSafetyComplianceScore((prev) => Math.max(0, prev - (step.isFatalError ? 30 : 15)));
        addDecisionEvent(INITIAL_SECTORS[activeHazard.sectorId].code, step.label, false, activeHazard.regulatoryStandard);
        addFloatingDelta(`-$${(fine / 1000).toFixed(0)}k Fine`, 'WAFER_SCRAP');

        if (step.isFatalError) {
          setFatalShutdownTriggered(true);
        }

        setKnowledgeGaps((prev) => [
          ...prev,
          {
            category: isZh ? '半導體危害應變防護' : hazardDef.title.split(' ')[0] + ' Safety',
            description: isZh
              ? `在「${hazardDef.titleZh}」中選擇了不當處置：「${step.label}」。原因：${step.explanation}`
              : `Incorrect action taken during ${hazardDef.title}: "${step.label}". ${step.explanation}`,
            severity: step.isFatalError ? 'HIGH' : 'MEDIUM',
            remedialAction: isZh
              ? `深入複習 ${activeHazard.regulatoryStandard} 法規之標準緊急應變作業規範。`
              : `Review ${activeHazard.regulatoryStandard} immediate containment steps.`,
          },
        ]);

        setLastFeedback({
          text: `${isZh ? '違規警告：' : 'VIOLATION: '} ${step.explanation} (-$${fine.toLocaleString()} OSHA Fine)`,
          isCorrect: false,
        });
        setTimeout(() => setLastFeedback(null), 5000);

        if (step.isFatalError) {
          const completionTime = now - hazardStartTimeRef.current;
          const record: IncidentRecord = {
            incidentId: activeHazard.id,
            title: isZh ? activeHazard.titleZh : activeHazard.title,
            sectorName: isZh
              ? INITIAL_SECTORS[activeHazard.sectorId].nameZh
              : INITIAL_SECTORS[activeHazard.sectorId].name,
            severity: activeHazard.severity,
            level: activeHazard.level,
            reactionTimeMs: reactionTime,
            completionTimeMs: completionTime,
            targetTimeMs: 35000,
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
            failureReason: step.explanation,
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
                status: 'CRITICAL' as const,
                health: Math.max(10, prev[activeHazard.sectorId].health - 40),
              },
            };
            sceneInstanceRef.current?.updateSectorStatus(next);
            return next;
          });

          nextHazardTimerRef.current = 15;
        }
      }
    },
    [activeHazard, language, handleTriggerActionEffect, addDecisionEvent, addFloatingDelta]
  );

  // Handle Sector Efficiency Tuning
  const handleTuneEfficiency = useCallback((sectorId: SectorId, delta: number) => {
    soundManager.playUiClick();
    setSectors((prev) => {
      const sec = prev[sectorId];
      let newEff = delta === 0 ? 85 : Math.max(20, Math.min(100, sec.efficiency + delta));
      return {
        ...prev,
        [sectorId]: {
          ...sec,
          efficiency: newEff,
          temperatureC: sec.temperatureC + (delta > 0 ? 1.5 : -1.0),
        },
      };
    });
  }, []);

  // Main 1-second Simulation Tick Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. Decrement shift clock
      setShiftTimeRemaining((prev) => {
        if (prev <= 1) {
          finishShift();
          return 0;
        }
        return prev - 1;
      });

      // 2. Active Hazard Countdown
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
            fatalError: true,
            failureReason: isZh
              ? '緊急處置時限超時！系統自動觸發全廠生命安全聯鎖隔離。'
              : 'Time limit exceeded. Automatic fab emergency safety lock tripped.',
            regulatoryStandard: curr.regulatoryStandard,
            oshaViolationFine: 50000,
            safetyScoreEarned: 0,
          };
          setIncidentRecords((prev) => [...prev, record]);
          setSafetyComplianceScore((prev) => Math.max(0, prev - 25));
          setAccumulatedFines((prev) => prev + 50000);
          setSectors((prevSec) => ({
            ...prevSec,
            [curr.sectorId]: {
              ...prevSec[curr.sectorId],
              activeHazardId: null,
              status: 'CRITICAL',
              health: Math.max(15, prevSec[curr.sectorId].health - 35),
            },
          }));
          nextHazardTimerRef.current = 45;
          return null;
        }
        return {
          ...curr,
          timeRemainingSec: curr.timeRemainingSec - 1,
        };
      });

      // 3. Hazard Spawning Interval
      if (!activeHazard) {
        nextHazardTimerRef.current -= 1;
        if (nextHazardTimerRef.current <= 0) {
          spawnHazard();
        }
      }

      // 4. Sequential CMOS 5-Bay Pipeline Interlock Simulation
      setSectors((prev) => {
        const pipeline: SectorId[] = [
          'PHOTOLITHOGRAPHY',
          'ION_IMPLANTATION',
          'ETCH_CVD',
          'CMP_WET_BENCH',
          'DIFFUSION_FURNACE',
        ];

        let newGood = 0;
        let newScrap = 0;
        const nextState = { ...prev };

        // Check if all bays are currently optimal
        const allOptimal = pipeline.every((id) => nextState[id].status === 'OPTIMAL');
        if (allOptimal) {
          setFlowStateSeconds((s) => s + 1);
        } else {
          setFlowStateSeconds(0);
        }

        // Pass wafers along pipeline
        for (let i = 0; i < pipeline.length; i++) {
          const sId = pipeline[i];
          const curr = nextState[sId];

          if (curr.status === 'SHUTDOWN') {
            // Machine is completely stopped
            continue;
          }

          // Production throughput rate
          const rate = (curr.efficiency / 100) * 0.55;
          const isHazard = curr.activeHazardId !== null;
          const defectChance = isHazard ? 0.35 : (100 - curr.health) * 0.0025;

          // Process wafers if input queue has inventory
          if (curr.inputQueue > 0 && Math.random() < rate) {
            const batchSize = Math.min(curr.inputQueue, Math.floor(Math.random() * 3) + 1);
            curr.inputQueue -= batchSize;

            if (Math.random() < defectChance) {
              newScrap += batchSize;
              curr.wafersDefective += batchSize;
            } else {
              // If last stage (Furnace), chips are completed!
              if (i === pipeline.length - 1) {
                newGood += batchSize;
                curr.wafersCompleted += batchSize;
              } else {
                // Transfer to next bay's input queue or bypass buffer
                const nextBayId = pipeline[i + 1];
                const nextBay = nextState[nextBayId];

                if (nextBay.bypassActive) {
                  // Bypass buffer routing (prevent backpressure)
                  nextBay.inputQueue = Math.min(25, nextBay.inputQueue + batchSize);
                } else if (nextBay.status === 'CRITICAL' || nextBay.status === 'SHUTDOWN') {
                  // Upstream piling up / backlog!
                  nextBay.inputQueue += batchSize;
                } else {
                  nextBay.inputQueue += batchSize;
                }
              }
            }
          }

          // Influx into Photolithography (Bay 1) from raw silicon stock
          if (i === 0 && curr.inputQueue < 15) {
            curr.inputQueue += 20;
          }
        }

        if (newGood > 0) {
          setTotalWafersProduced((g) => g + newGood);
          addFloatingDelta(`+${newGood} Wafers`, 'WAFER_GOOD');
        }
        if (newScrap > 0) {
          setTotalDefectiveWafers((d) => d + newScrap);
          addFloatingDelta(`-${newScrap} Scrap`, 'WAFER_SCRAP');
        }

        sceneInstanceRef.current?.updateSectorStatus(nextState);
        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, activeHazard, spawnHazard, language, addFloatingDelta]);

  // Finish Shift & Calculate Debrief Metrics
  const finishShift = useCallback(() => {
    soundManager.stopEmergencyAlarm();
    soundManager.stopAmbientHum();
    setGameState('DEBRIEF');

    const totalIncidents = incidentRecords.length;
    const avgReaction =
      totalIncidents > 0
        ? incidentRecords.reduce((acc, r) => acc + r.reactionTimeMs, 0) / totalIncidents
        : 1800;

    let newCert = careerRecord.certificationLevel;
    if (safetyComplianceScore >= 95 && careerRecord.totalShiftsCompleted >= 3) {
      newCert = 'MASTER_SAFETY_DIRECTOR';
    } else if (safetyComplianceScore >= 85) {
      newCert = 'HAZMAT_WARDEN';
    } else if (safetyComplianceScore >= 70) {
      newCert = 'FAB_SPECIALIST';
    }

    const updatedCareer: UserCareerRecord = {
      totalShiftsCompleted: careerRecord.totalShiftsCompleted + 1,
      totalIncidentsHandled: careerRecord.totalIncidentsHandled + totalIncidents,
      bestComplianceScore: Math.max(careerRecord.bestComplianceScore, safetyComplianceScore),
      averageReactionTimeMs: avgReaction,
      certificationLevel: newCert,
      incidentHistory: [...careerRecord.incidentHistory, ...incidentRecords].slice(-30),
    };

    saveCareer(updatedCareer);
  }, [incidentRecords, safetyComplianceScore, careerRecord, saveCareer]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsTabletOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (isTabletOpen) {
          setIsTabletOpen(false);
          return;
        }
        if (isDispatchOpen) {
          setIsDispatchOpen(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          soundManager.stopEmergencyAlarm();
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          if (activeHazard) soundManager.startEmergencyAlarm();
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
    isTabletOpen,
    isDispatchOpen,
    handleChangeCameraView,
  ]);

  // Calculate overall yield percentage
  const totalWafers = totalWafersProduced + totalDefectiveWafers;
  const overallYieldPct = totalWafers > 0 ? (totalWafersProduced / totalWafers) * 100 : 96.5;

  const currentMetrics: SimulationMetrics = {
    totalShiftTimeSec: shiftDurationSec - shiftTimeRemaining,
    incidentsEncountered: incidentRecords.length,
    incidentsResolved: incidentRecords.filter((r) => r.success).length,
    incidentsFailed: incidentRecords.filter((r) => !r.success).length,
    averageReactionTimeMs:
      incidentRecords.length > 0
        ? incidentRecords.reduce((acc, r) => acc + r.reactionTimeMs, 0) / incidentRecords.length
        : 1850,
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

  const sectorArray = Object.values(sectors);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated Three.js Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          language={language}
          onToggleLanguage={toggleLanguage}
          onStartGame={handleStartGame}
          careerRecord={careerRecord}
          onOpenTrainingManual={() => setIsManualOpen(true)}
          onOpenManagerAudit={() => setIsManagerAuditOpen(true)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
        />
      )}

      {/* In-Game Active HUD Overlay */}
      {gameState === 'PLAYING' && (
        <HUDOverlay
          language={language}
          onToggleLanguage={toggleLanguage}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onSilenceAlarm={handleSilenceAlarm}
          shiftTimeRemainingSec={shiftTimeRemaining}
          overallYieldPct={overallYieldPct}
          totalWafersProduced={totalWafersProduced}
          defectiveWafers={totalDefectiveWafers}
          safetyScore={safetyComplianceScore}
          activeHazard={activeHazard}
          sectors={sectors}
          selectedSectorId={selectedSectorId}
          onSelectSector={(sId) => {
            setSelectedSectorId(sId);
            soundManager.playUiClick();
          }}
          onSelectProtocolStep={handleSelectProtocolStep}
          onHitEmo={handleHitEmoDirect}
          onTuneEfficiency={handleTuneEfficiency}
          onPause={() => {
            setGameState('PAUSED');
            soundManager.stopEmergencyAlarm();
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          cameraView={cameraView}
          onChangeCameraView={handleChangeCameraView}
          lastFeedback={lastFeedback}
          onOpenTablet={() => setIsTabletOpen(true)}
          flowStateSeconds={flowStateSeconds}
          floatingDeltas={floatingDeltas}
          playerName={playerName}
          onTuneSectorParams={handleUpdateSectorParams}
        />
      )}

      {/* Equipment Engineer's Handheld Diagnostic Tablet Modal */}
      {isTabletOpen && (
        <InspectionTabletModal
          isOpen={isTabletOpen}
          onClose={() => setIsTabletOpen(false)}
          sectors={sectorArray}
          selectedSectorId={selectedSectorId}
          onSelectSector={(id) => setSelectedSectorId(id)}
          onCalibrateSector={handleCalibrateSector}
          onHitEmo={handleHitEmoDirect}
          onTriggerActionEffect={handleTriggerActionEffect}
          onUpdateParams={handleUpdateSectorParams}
          onToggleBypass={handleToggleBypass}
          language={language}
        />
      )}

      {/* Shift Supervisor's Dispatch & Buffer Balancing Modal */}
      {isDispatchOpen && (
        <SupervisorDispatchModal
          isOpen={isDispatchOpen}
          onClose={() => setIsDispatchOpen(false)}
          sectors={sectorArray}
          onToggleBypass={handleToggleBypass}
          flowStateSeconds={flowStateSeconds}
          language={language}
        />
      )}

      {/* Paused Screen Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          language={language}
          onToggleLanguage={toggleLanguage}
          onResume={() => {
            setGameState('PLAYING');
            if (activeHazard) soundManager.startEmergencyAlarm();
          }}
          onRestart={() => handleStartGame('FULL_SHIFT')}
          onReturnToTitle={() => {
            setGameState('TITLE');
            soundManager.stopEmergencyAlarm();
            soundManager.stopAmbientHum();
          }}
          onOpenTrainingManual={() => setIsManualOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Post-Simulation Debrief Modal */}
      {gameState === 'DEBRIEF' && (
        <DebriefModal
          language={language}
          metrics={currentMetrics}
          incidentRecords={incidentRecords}
          onRestart={() => handleStartGame('FULL_SHIFT')}
          onOpenTrainingManual={() => setIsManualOpen(true)}
          onReturnToTitle={() => setGameState('TITLE')}
        />
      )}

      {/* Cleanroom Safety SOP Training Manual Modal */}
      {isManualOpen && (
        <TrainingManualModal language={language} onClose={() => setIsManualOpen(false)} />
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

      {/* Instructions Modal (How to Play at Beginning Page) */}
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
    </div>
  );
}
