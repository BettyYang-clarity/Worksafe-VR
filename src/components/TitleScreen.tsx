import React, { useEffect } from 'react';
import {
  Play,
  Award,
  BarChart3,
  Volume2,
  VolumeX,
  BookOpen,
  Globe,
  User,
  MessageSquare,
  Linkedin,
  Info,
} from 'lucide-react';
import { UserCareerRecord } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface TitleScreenProps {
  language: Language;
  onToggleLanguage: () => void;
  onStartGame: (mode: 'FULL_SHIFT' | 'HAZARD_DRILL' | 'CERTIFICATION_EXAM') => void;
  careerRecord: UserCareerRecord;
  onOpenManagerAudit: () => void;
  onOpenInstructions: () => void;
  onOpenFeedback: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  onToggleLanguage,
  onStartGame,
  careerRecord,
  onOpenManagerAudit,
  onOpenInstructions,
  onOpenFeedback,
  isMuted,
  onToggleMute,
  playerName,
  onPlayerNameChange,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  // Listen for Enter or Space to start game ONLY when not typing inside an input field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartGame('FULL_SHIFT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 pointer-events-auto flex flex-col justify-between p-6 md:p-10 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/75">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-semibold tracking-wider flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{t.semiCompliant}</span>
          </div>
          <span className="text-xs font-mono text-slate-400 tracking-widest hidden md:inline">
            {t.cleanroomClass}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="px-3 py-1.5 rounded-lg hud-border text-xs font-mono text-amber-300 hover:text-white hover:border-amber-400/50 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Toggle Language / 切換繁體中文與英文"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{isZh ? 'EN' : '繁體中文'}</span>
          </button>

          {/* Unified 4-Pillar EHS Field Guide & Instructions Button */}
          <button
            onClick={onOpenInstructions}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-xs font-mono text-cyan-200 hover:bg-cyan-500/30 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
            <span className="font-semibold">{t.howToPlay}</span>
          </button>

          {/* Achievements & Audit */}
          <button
            onClick={onOpenManagerAudit}
            className="px-3 py-1.5 rounded-lg hud-border text-xs font-mono text-purple-300 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Achievements & Play Records / 查看成就紀錄與歷史戰績"
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{isZh ? '成就紀錄' : 'Achievements'}</span>
          </button>

          {/* In-Game Direct Feedback */}
          <button
            onClick={onOpenFeedback}
            className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm shadow-amber-500/10"
            title="Open Feedback Form / 填寫意見回饋"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>{isZh ? '問卷回饋' : 'Feedback'}</span>
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg hud-border text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece & Title Lockup */}
      <div className="max-w-3xl my-auto">
        <div className="mb-4">
          <svg
            className="w-full max-w-xl h-auto"
            viewBox="0 0 580 92"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
            </defs>
            <path
              d="M34 10L64 26V60L34 76L4 60V26L34 10Z"
              stroke="#38BDF8"
              strokeWidth="2.5"
              fill="rgba(56, 189, 248, 0.12)"
            />
            <circle cx="34" cy="43" r="17" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
            <path d="M34 30V39M34 47V49" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

            <text
              x="84"
              y="44"
              fontFamily="Chakra Petch, Inter, sans-serif"
              fontWeight="700"
              fontSize="36"
              fill="url(#titleGrad)"
              letterSpacing="2"
            >
              WORKSAFE VR
            </text>
            <text
              x="86"
              y="68"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="500"
              fontSize="13"
              fill="url(#subGrad)"
              letterSpacing="3.5"
            >
              {isZh
                ? '工安實境 VR · 半導體晶圓廠製程與環安模擬器'
                : 'SEMICONDUCTOR FAB PROCESS & EHS SIMULATOR'}
            </text>
          </svg>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-display font-semibold text-xs md:text-sm mb-4">
          <span>
            {isZh
              ? '🏭 現場走動巡檢 · 配方良率調校 · 設備異常預警防範 · 四大支柱工安決策'
              : '🏭 Cleanroom Walkthrough · Recipe Tuning · Preventive Pre-Alarms · 4-Pillar EHS Decisions'}
          </span>
        </div>

        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-5 max-w-2xl font-light">
          {t.heroDescription}
        </p>

        {/* Cleanroom Operator ID Badge Entry */}
        <div className="mb-6 max-w-md p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-950/40">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isZh ? '無塵室識別證登錄 / 工程師姓名' : 'Cleanroom Badge ID / Engineer Name'}
              </span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
              SEMI S2 PASS
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder={
                isZh
                  ? '輸入您的姓名或代號 (例: Alex Chen #402)'
                  : 'Enter Engineer Name / ID (e.g. Alex Chen #402)'
              }
              maxLength={24}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono tracking-wide placeholder-slate-500"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>
              {isZh
                ? '將登錄於結算榮譽證書與社群分享卡'
                : 'Displayed on your Shift Qualification Certificate & Share Card'}
            </span>
            <span className="text-slate-500">{playerName ? `${playerName.length}/24` : '0/24'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3.5 items-center">
          <button
            onClick={() => onStartGame('FULL_SHIFT')}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-bold text-base tracking-wide flex items-center space-x-2.5 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startSimulation}</span>
          </button>

          <button
            onClick={onOpenInstructions}
            className="px-5 py-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-display font-semibold text-sm tracking-wide flex items-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{t.howToPlay}</span>
          </button>

          {/* Achievements & Shift History Button */}
          <button
            onClick={onOpenManagerAudit}
            className="px-5 py-3.5 rounded-xl bg-slate-900/90 border border-purple-500/50 hover:border-purple-400 text-purple-300 font-display font-semibold text-sm tracking-wide flex items-center space-x-2 transition-all cursor-pointer shadow-md hover:bg-purple-950/30"
            title="Achievements & Play Records / 查看成就紀錄與這幾次遊玩的成績"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>{isZh ? '成就與戰績紀錄' : 'Achievements & History'}</span>
          </button>
        </div>

        {/* Operator Profile Summary Card */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap gap-6 text-xs font-mono">
          <div>
            <div className="text-slate-500">{t.currentCertification}</div>
            <div className="text-cyan-400 font-semibold mt-0.5">
              {t[careerRecord.certificationLevel] ||
                careerRecord.certificationLevel.replace(/_/g, ' ')}
            </div>
          </div>
          <div>
            <div className="text-slate-500">{t.shiftsCompleted}</div>
            <div className="text-slate-200 font-semibold mt-0.5 tabular-nums">
              {careerRecord.totalShiftsCompleted}
            </div>
          </div>
          <div>
            <div className="text-slate-500">{t.incidentsResolved}</div>
            <div className="text-slate-200 font-semibold mt-0.5 tabular-nums">
              {careerRecord.totalIncidentsHandled}
            </div>
          </div>
          <div>
            <div className="text-slate-500">{t.meanReactionTime}</div>
            <div className="text-amber-400 font-semibold mt-0.5 tabular-nums">
              {careerRecord.averageReactionTimeMs > 0
                ? `${(careerRecord.averageReactionTimeMs / 1000).toFixed(2)}s`
                : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">{t.bestCompliance}</div>
            <div className="text-emerald-400 font-semibold mt-0.5 tabular-nums">
              {careerRecord.bestComplianceScore}%
            </div>
          </div>
        </div>

        {/* Educational Demo Disclaimer */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400/90 leading-relaxed flex items-start space-x-2">
          <Info className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-300 font-medium">
              {isZh ? '免責聲明：' : 'Disclaimer: '}
            </strong>
            {isZh
              ? '本作品為工安模擬示範（Demo）專案，遊戲內之機台場景、操作參數及突發狀況處置皆為教學展示與體驗效果設計，非正式法規與完整作業標準。實際半導體無塵室作業，請務必遵循各產業、企業制定之標準作業程序（SOP）與專業教育訓練。'
              : 'WorkSafe VR is an educational simulation demo. Cleanroom equipment, parameters, and emergency workflows are designed for conceptual learning and demonstration, and do not represent formal industry standards. Always adhere to company-certified Standard Operating Procedures (SOP) and professional EHS training.'}
          </p>
        </div>
      </div>

      {/* Flat Control Hints Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500 pt-4 border-t border-slate-900/80">
        <div className="text-slate-400">{t.controlsHint}</div>

        <div className="flex items-center space-x-3">
          <a
            href="https://www.linkedin.com/in/betty-yu-ting-yang-a1bb8aaa/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-cyan-300 transition-colors py-0.5 px-2 rounded hover:bg-slate-800/60 cursor-pointer"
            title="Betty Yu-Ting Yang - LinkedIn Profile"
          >
            <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
            <span className="text-slate-300 hover:text-cyan-200">Betty Yang · LinkedIn</span>
          </a>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="text-slate-500 hidden sm:block">{t.standardsCompliance}</div>
        </div>
      </div>
    </div>
  );
};
