import React, { useEffect } from 'react';
import { Play, ShieldAlert, Award, FileText, BarChart3, Volume2, VolumeX, HelpCircle, Globe, User } from 'lucide-react';
import { UserCareerRecord } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface TitleScreenProps {
  language: Language;
  onToggleLanguage: () => void;
  onStartGame: (mode: 'FULL_SHIFT' | 'HAZARD_DRILL' | 'CERTIFICATION_EXAM') => void;
  careerRecord: UserCareerRecord;
  onOpenTrainingManual: () => void;
  onOpenManagerAudit: () => void;
  onOpenInstructions: () => void;
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
  onOpenTrainingManual,
  onOpenManagerAudit,
  onOpenInstructions,
  isMuted,
  onToggleMute,
  playerName,
  onPlayerNameChange,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  // Listen for Enter or Space to start game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

          {/* Instructions Button */}
          <button
            onClick={onOpenInstructions}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-xs font-mono text-cyan-200 hover:bg-cyan-500/30 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
            <span className="font-semibold">{t.howToPlay}</span>
          </button>

          {/* Manager Audit */}
          <button
            onClick={onOpenManagerAudit}
            className="px-3 py-1.5 rounded-lg hud-border text-xs font-mono text-slate-300 hover:text-cyan-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{t.managerAudit}</span>
          </button>

          {/* SOP Manual */}
          <button
            onClick={onOpenTrainingManual}
            className="px-3 py-1.5 rounded-lg hud-border text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.sopManual}</span>
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg hud-border text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece & Title Lockup */}
      <div className="max-w-3xl my-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-4">
          <svg className="w-full max-w-xl h-auto" viewBox="0 0 580 92" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            {/* Hexagonal Hazard Icon */}
            <path
              d="M34 10L64 26V60L34 76L4 60V26L34 10Z"
              stroke="#38BDF8"
              strokeWidth="2.5"
              fill="rgba(56, 189, 248, 0.12)"
            />
            {/* Silicon Wafer Circle & Notch inside hex */}
            <circle cx="34" cy="43" r="17" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
            <path d="M34 30V39M34 47V49" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Main Title Text */}
            <text x="84" y="44" fontFamily="Chakra Petch, Inter, sans-serif" fontWeight="700" fontSize="36" fill="url(#titleGrad)" letterSpacing="2">
              WORKSAFE VR
            </text>
            <text x="86" y="68" fontFamily="JetBrains Mono, monospace" fontWeight="500" fontSize="13" fill="url(#subGrad)" letterSpacing="3.5">
              {isZh ? '工安實境 VR · 半導體晶圓廠工安模擬器' : 'SEMICONDUCTOR FAB INCIDENT & SAFETY SIMULATOR'}
            </text>
          </svg>
        </div>

        {isZh && (
          <div className="inline-block px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-display font-semibold text-sm mb-4">
            半導體先進製程 · 關鍵危害辨識 · 應變SOP標準模擬系統
          </div>
        )}

        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-5 max-w-2xl font-light">
          {t.heroDescription}
        </p>

        {/* Cleanroom Operator ID Badge Entry */}
        <div className="mb-6 max-w-md p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-950/40">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isZh ? '無塵室識別證登錄 / 工程師姓名' : 'Cleanroom Badge ID / Operator Name'}</span>
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
              placeholder={isZh ? '輸入您的姓名或代號 (例: Alex Chen #402)' : 'Enter Operator Name / ID (e.g. Alex Chen #402)'}
              maxLength={24}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono tracking-wide placeholder-slate-500"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{isZh ? '將登錄於 8D 調查報告與結算證書' : 'Will be certified on 8D RCA report & social card'}</span>
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
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{t.howToPlay}</span>
          </button>

          <button
            onClick={() => onStartGame('HAZARD_DRILL')}
            className="px-5 py-3.5 rounded-xl hud-border text-amber-300 hover:text-amber-200 hover:border-amber-400/50 font-display font-semibold text-sm tracking-wide flex items-center space-x-2 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{t.rapidDrill}</span>
          </button>

          <button
            onClick={() => onStartGame('CERTIFICATION_EXAM')}
            className="px-5 py-3.5 rounded-xl hud-border text-slate-300 hover:text-white hover:border-slate-400 font-display font-semibold text-sm tracking-wide flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>{t.officerExam}</span>
          </button>
        </div>

        {/* Operator Profile Summary Card */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap gap-6 text-xs font-mono">
          <div>
            <div className="text-slate-500">{t.currentCertification}</div>
            <div className="text-cyan-400 font-semibold mt-0.5">
              {t[careerRecord.certificationLevel] || careerRecord.certificationLevel.replace(/_/g, ' ')}
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
              {careerRecord.averageReactionTimeMs > 0 ? `${(careerRecord.averageReactionTimeMs / 1000).toFixed(2)}s` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">{t.bestCompliance}</div>
            <div className="text-emerald-400 font-semibold mt-0.5 tabular-nums">
              {careerRecord.bestComplianceScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Flat Control Hints Footer */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-slate-900">
        <div className="text-slate-400">
          {t.controlsHint}
        </div>
        <div className="text-slate-500 hidden sm:block">
          {t.standardsCompliance}
        </div>
      </div>
    </div>
  );
};
