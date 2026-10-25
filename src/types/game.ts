export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'DEBRIEF';

export type CameraViewMode = 'VR_FIRST_PERSON' | 'SUPERVISOR_ISOMETRIC' | 'INSPECTION';

export type SectorId =
  | 'PHOTOLITHOGRAPHY'
  | 'ION_IMPLANTATION'
  | 'ETCH_CVD'
  | 'CMP_WET_BENCH'
  | 'DIFFUSION_FURNACE';

export type HazardLevel = 'LEVEL_1_MECHANICAL' | 'LEVEL_2_CHEMICAL_LEAK' | 'LEVEL_3_FATAL_CRISIS';

export type RequiredPPECode = 'SCBA' | 'ACID_SUIT' | 'HV_GLOVES';

export interface TroubleshootingOption {
  id: string;
  label: string;
  labelZh: string;
  outcomeType: 'SOLVE' | 'PARTIAL' | 'ESCALATE';
  explanation: string;
  explanationZh: string;
  consequenceSummary: string;
  consequenceSummaryZh: string;
}

export interface PreAlarmState {
  id: string;
  hazardTypeId: string;
  sectorId: SectorId;
  title: string;
  titleZh: string;
  whatIsHappening: string;
  whatIsHappeningZh: string;
  howToPrevent: string;
  howToPreventZh: string;
  consequenceIfIgnored: string;
  consequenceIfIgnoredZh: string;
  maintenanceButtonLabel: string;
  maintenanceButtonLabelZh: string;
  symptoms: string[];
  symptomsZh: string[];
  waferDefectPattern: string;
  waferDefectPatternZh: string;
  troubleshootingOptions: TroubleshootingOption[];
  timeRemainingSec: number;
  totalTimeSec: number;
}

export interface SectorState {
  id: SectorId;
  name: string;
  nameZh: string;
  code: string;
  description: string;
  health: number; // 0 - 100%
  efficiency: number; // 0 - 100%
  temperatureC: number;
  pressureTorr: number;
  particleCountPPM: number;
  highVoltageKV?: number; // For Ion Implanter
  rfPowerWatts: number; // Dynamic tuning: boosts wafer/hr but overheats chamber
  gasFlowSccm: number; // Dynamic tuning: boosts yield% but spikes exhaust backpressure
  chamberVacuumTorr: number; // Dynamic tuning: cuts defect PPM but strains O-rings
  scrubberLoadPct: number; // 0-120%, computed from gasFlow and temperature (>85% warning, >100% leak)
  status: 'OPTIMAL' | 'PRE_ALARM' | 'WARNING' | 'CRITICAL' | 'SHUTDOWN';
  activeHazardId: string | null;
  preAlarm: PreAlarmState | null;
  wafersInProcess: number;
  inputQueue: number; // Upstream backlog
  outputQueue: number; // Downstream buffer
  wafersCompleted: number;
  wafersDefective: number;
  bypassActive: boolean; // Wafer bypass routing directly accessible on each tool
}

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';

export interface EhsFourPillars {
  whatMayHappen: string;
  whatMayHappenZh: string;
  howToPrevent: string;
  howToPreventZh: string;
  whatShouldDo: string;
  whatShouldDoZh: string;
  consequence: string;
  consequenceZh: string;
  estimatedLossMillionsUSD: number;
  recommendedPPE: RequiredPPECode;
  ppeInstruction: string;
  ppeInstructionZh: string;
}

export interface ProtocolStep {
  id: string;
  label: string;
  labelZh: string;
  description: string;
  descZh: string;
  isCorrect: boolean;
  explanation: string;
  explanationZh: string;
  isFatalError?: boolean;
}

export interface HazardIncident {
  id: string;
  typeId: string;
  level: HazardLevel;
  sectorId: SectorId;
  title: string;
  titleZh: string;
  description: string;
  descZh: string;
  severity: HazardSeverity;
  timeLimitSec: number;
  timeRemainingSec: number;
  startTime: number;
  currentStageIndex: number;
  totalStages: number;
  currentPrompt: string;
  currentPromptZh: string;
  protocolSteps: ProtocolStep[];
  ehsPillars: EhsFourPillars;
  resolved: boolean;
  failed: boolean;
  isSilenced: boolean;
  failureReason?: string;
  regulatoryStandard: string;
}

export interface EquippedPPE {
  scba: boolean;
  acidSuit: boolean;
  hvGloves: boolean;
}

export interface WaferLotMission {
  id: string;
  lotCode: string;
  title: string;
  titleZh: string;
  targetSectorId: SectorId;
  hint: string;
  hintZh: string;
  targetWaferCount: number;
  startWaferCount: number;
  rewardScore: number;
}

export interface EhsDecisionFeedback {
  id: string;
  type: 'PREVENTED' | 'CORRECT_STEP' | 'HAZARD_RESOLVED' | 'WRONG_STEP' | 'FATAL_ERROR' | 'PPE_VIOLATION';
  title: string;
  titleZh: string;
  explanation: string;
  explanationZh: string;
  consequenceNote: string;
  consequenceNoteZh: string;
  standard: string;
  timestamp: number;
}

export interface ChoiceOutcomeRecord {
  id: string;
  bayCode: string;
  eventTitle: string;
  category: 'TROUBLESHOOTING' | 'EHS_SOP' | 'PPE_STEP';
  chosenAction: string;
  outcomeImpact: string;
  alternativeComparison: string;
  isPositive: boolean;
  financialDeltaMillionsUSD: number;
}

export interface DecisionTimelineEvent {
  id: string;
  timestampSec: number;
  formattedTime: string;
  bayCode: string;
  title: string;
  description: string;
  type: 'WARNING' | 'VIOLATION' | 'GOOD_ACTION' | 'FATAL_TRIP';
  isGoodDecision: boolean;
  violationStandard?: string;
  fineAmount?: number;
}

export interface IncidentRecord {
  incidentId: string;
  title: string;
  sectorName: string;
  severity: HazardSeverity;
  level: HazardLevel;
  reactionTimeMs: number;
  completionTimeMs: number;
  targetTimeMs: number;
  stepsTaken: {
    stepId: string;
    stepLabel: string;
    wasCorrect: boolean;
    explanation: string;
  }[];
  success: boolean;
  fatalError: boolean;
  failureReason?: string;
  regulatoryStandard: string;
  oshaViolationFine: number;
  safetyScoreEarned: number;
}

export interface FloatingDelta {
  id: string;
  text: string;
  type: 'YIELD_UP' | 'YIELD_DOWN' | 'WAFER_GOOD' | 'WAFER_SCRAP' | 'COMBO_REFLEX';
  timestamp: number;
}

export type SocialEngineerTitle =
  | 'YIELD_DEMON' // High yield but safety violations
  | 'SAFETY_SAINT' // 100% compliance
  | 'LOTO_MASTER' // Flawless mechanical / LOTO discipline
  | 'FAB_DIRECTOR' // High yield + High safety
  | 'CLEANROOM_ROOKIE';

export interface SimulationMetrics {
  totalShiftTimeSec: number;
  incidentsEncountered: number;
  incidentsResolved: number;
  incidentsFailed: number;
  preAlarmsPrevented: number;
  livesProtected: number;
  fabValueSavedMillionsUSD: number;
  averageReactionTimeMs: number;
  protocolAccuracyPct: number;
  totalWafersProduced: number;
  totalWafersDefective: number;
  overallYieldPct: number;
  safetyComplianceScore: number; // 0 - 100
  regulatoryFinesTotal: number;
  zeroIncidentStreak: number;
  flowStateSeconds: number; // Consecutive seconds of all 5 bays running optimally
  fatalShutdownTriggered: boolean; // Overrides yield if fatal safety breach occurred
  decisionTimeline: DecisionTimelineEvent[];
  choiceOutcomes?: ChoiceOutcomeRecord[];
  operatorName?: string;
  socialTitle?: SocialEngineerTitle;
  knowledgeGaps: {
    category: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    remedialAction: string;
  }[];
}

export interface SectorTuneParams {
  rfPowerWatts?: number;
  gasFlowSccm?: number;
  chamberVacuumTorr?: number;
  bypassActive?: boolean;
}

export interface ShiftHistoryEntry {
  id: string;
  timestamp: string;
  operatorName: string;
  yieldPct: number;
  safetyScore: number;
  wafersProduced: number;
  preAlarmsPrevented: number;
  incidentsResolved: number;
  incidentsEncountered: number;
  fabValueSavedM: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'FAIL';
  fatalShutdown?: boolean;
}

export interface UserCareerRecord {
  totalShiftsCompleted: number;
  totalIncidentsHandled: number;
  bestComplianceScore: number;
  averageReactionTimeMs: number;
  certificationLevel: 'CLEANROOM_ROOKIE' | 'FAB_SPECIALIST' | 'HAZMAT_WARDEN' | 'MASTER_SAFETY_DIRECTOR';
  incidentHistory: IncidentRecord[];
  shiftHistory?: ShiftHistoryEntry[];
}
