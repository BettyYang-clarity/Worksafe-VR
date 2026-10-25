import React, { useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Clock,
  TrendingUp,
  Share2,
  Copy,
  Download,
  MessageSquare,
  ShieldAlert,
  Flame,
  FileText,
} from 'lucide-react';
import { IncidentRecord, SimulationMetrics, SocialEngineerTitle } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { GoogleFormModal } from './GoogleFormModal';

interface DebriefModalProps {
  language: Language;
  metrics: SimulationMetrics;
  incidentRecords: IncidentRecord[];
  onRestart: () => void;
  onOpenTrainingManual: () => void;
  onReturnToTitle: () => void;
}

export const DebriefModal: React.FC<DebriefModalProps> = ({
  language,
  metrics,
  incidentRecords,
  onRestart,
  onOpenTrainingManual,
  onReturnToTitle,
}) => {
  const isZh = language === 'zh-TW';
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive dynamic Social Title if not provided
  const getSocialTitle = (): { title: string; tag: string; emoji: string } => {
    if (metrics.fatalShutdownTriggered) {
      return {
        title: isZh ? '停線檢討中 · 廠區引渡者' : 'Mandatory Fab Shutdown · Fab Hazard',
        tag: 'CRITICAL_INCIDENT',
        emoji: '💥',
      };
    }
    if (metrics.safetyComplianceScore >= 95 && metrics.overallYieldPct >= 95) {
      return {
        title: isZh ? '雙料傳奇 · 無塵室救世主' : 'Dual Ace · Cleanroom Savior',
        tag: 'DUAL_ACE',
        emoji: '👑',
      };
    }
    if (metrics.overallYieldPct >= 96 && metrics.safetyComplianceScore < 75) {
      return {
        title: isZh ? '良率狂魔 · 工安稽核黑名單' : 'Yield Demon · OSHA Audit Target',
        tag: 'YIELD_DEMON',
        emoji: '🔥',
      };
    }
    if (metrics.safetyComplianceScore >= 95) {
      return {
        title: isZh ? '聖人級工安官 · 零失誤守護者' : 'Safety Compliance Saint · Flawless Warden',
        tag: 'SAFETY_SAINT',
        emoji: '🛡️',
      };
    }
    return {
      title: isZh ? '資深晶圓設備工程師' : 'Senior Fab Equipment Engineer',
      tag: 'SENIOR_EE',
      emoji: '⚡',
    };
  };

  const socialTitle = getSocialTitle();

  const getGrade = (score: number, fatal?: boolean) => {
    if (fatal) {
      return {
        grade: 'SHUTDOWN',
        text: isZh ? '重大工安停線處分 (OSHA 立即停工令)' : 'FATAL FAILURE: Mandatory Fab Shutdown',
        color: 'text-rose-500',
      };
    }
    if (score >= 95)
      return {
        grade: 'A+',
        text: isZh ? '特級無塵室工安專家 (卓越合規)' : 'Master Cleanroom Safety Specialist',
        color: 'text-emerald-400',
      };
    if (score >= 85)
      return {
        grade: 'A',
        text: isZh ? '合格半導體防災官 (高度合規)' : 'Certified Fab Safety Warden',
        color: 'text-cyan-400',
      };
    if (score >= 70)
      return {
        grade: 'B',
        text: isZh ? '合格操作技術員 (具輕微知識缺口)' : 'Qualified Operator (Minor Gaps)',
        color: 'text-blue-400',
      };
    if (score >= 55)
      return {
        grade: 'C',
        text: isZh ? '附條件通過 (強烈建議再教育訓練)' : 'Conditional Pass (Retraining Advised)',
        color: 'text-amber-400',
      };
    return {
      grade: 'FAIL',
      text: isZh ? '嚴重不合格 (重大 OSHA 工安違規處分)' : 'Non-Compliant (Severe OSHA Hazards)',
      color: 'text-rose-500',
    };
  };

  const gradeInfo = getGrade(metrics.safetyComplianceScore, metrics.fatalShutdownTriggered);

  // Copy 1-page Social Card Text for LinkedIn / X / Threads
  const handleCopySocialPost = () => {
    const text =
      `🚨 I just completed a high-stakes shift in WorkSafe VR Fab!\n` +
      `👤 Operator: ${metrics.operatorName || 'Alex Chen #402'}\n` +
      `🏅 Title: ${socialTitle.emoji} ${socialTitle.title}\n` +
      `📈 Fab Yield: ${metrics.overallYieldPct.toFixed(1)}% | 🛡️ OSHA Compliance: ${metrics.safetyComplianceScore}/100\n` +
      `⚡ Incidents Resolved: ${metrics.incidentsResolved}/${metrics.incidentsEncountered} | Avg Reaction: ${(metrics.averageReactionTimeMs / 1000).toFixed(2)}s\n` +
      `⚖️ Regulatory Fines: $${metrics.regulatoryFinesTotal.toLocaleString()}\n` +
      `Can you balance semiconductor output and zero-fatal EHS safety? Try WorkSafe VR!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download 1-page Canvas Badge PNG
  const handleDownloadBadge = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1000, 620);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 620);

    // Glowing cleanroom border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 968, 588);

    // Title & Logo
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('WORKSAFE VR · SEMICONDUCTOR FAB SAFETY SIMULATOR', 40, 60);

    // Operator Name Badge
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`OPERATOR: ${(metrics.operatorName || 'ALEX CHEN #402').toUpperCase()}`, 40, 95);

    // Social Title Badge
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(40, 115, 920, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`${socialTitle.emoji} ${socialTitle.title}`, 60, 160);

    // Grid of Stats
    const drawStatBox = (x: number, y: number, w: number, h: number, label: string, val: string, color: string) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      ctx.fillText(label, x + 20, y + 36);

      ctx.fillStyle = color;
      ctx.font = 'bold 36px monospace';
      ctx.fillText(val, x + 20, y + 82);
    };

    drawStatBox(40, 205, 440, 110, 'FAB YIELD RATE (產線良率)', `${metrics.overallYieldPct.toFixed(1)}%`, '#10b981');
    drawStatBox(520, 205, 440, 110, 'EHS COMPLIANCE (工安合規)', `${metrics.safetyComplianceScore} / 100`, gradeInfo.grade === 'A+' ? '#10b981' : '#38bdf8');
    drawStatBox(40, 335, 440, 110, 'INCIDENTS RESOLVED (事故處置)', `${metrics.incidentsResolved} / ${metrics.incidentsEncountered}`, '#f59e0b');
    drawStatBox(520, 335, 440, 110, 'AVG REACTION TIME (平均反應)', `${(metrics.averageReactionTimeMs / 1000).toFixed(2)}s`, '#a855f7');

    // Bottom Stamp & Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace';
    ctx.fillText('CERTIFIED SEMI S2 & OSHA 1910.147 COMPLIANCE AUDIT · ONE-PAGE SOCIAL BADGE', 40, 495);
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString()} · RECORD HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 40, 525);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Play at: WorkSafe VR Cleanroom', 680, 525);

    const link = document.createElement('a');
    link.download = `WorkSafe_VR_${(metrics.operatorName || 'Operator').replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border-2 border-cyan-500/40 bg-slate-950 my-auto">
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold font-display text-white">
                  {isZh ? '8D 事故調查報告與個人績效審核' : '8D Incident Investigation & Performance Audit'}
                </h2>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                  RCA / 8D
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                {isZh
                  ? 'SEMI S2 安全準則 · OSHA 1910.147 根因分析 · 雙軌雙面刃評估'
                  : 'SEMI S2 / OSHA 1910.147 Root Cause Analysis & Double-Edged Metric Audit'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* User Feedback Form Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title={isZh ? '填寫體驗心得或改善建議' : 'Submit Feedback & Suggestions'}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isZh ? '心得/改善建議' : 'Feedback'}</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5">
          {/* ==================================================== */}
          {/* UNIFIED DIRECT ONE-PAGE SHAREABLE CERTIFICATE CARD   */}
          {/* ==================================================== */}
          <div className="p-5 md:p-6 rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 shadow-2xl relative overflow-hidden">
            {/* Top decorative seal glow */}
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase">
                    SEMI S2 & OSHA 1910.147 CERTIFIED AUDIT
                  </div>
                  <div className="text-sm font-display font-bold text-slate-200">
                    {isZh ? '半導體晶圓廠 · 個人安全與製程綜合認證' : 'Semiconductor Fab · Safety & Yield Certification'}
                  </div>
                </div>
              </div>

              {/* Operator Badge Stamp */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">{isZh ? '認證工程師:' : 'Operator:'}</span>
                <strong className="text-cyan-300 font-bold">{metrics.operatorName || 'Alex Chen #402'}</strong>
              </div>
            </div>

            {/* Social Title & Rating Lockup */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-5">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{socialTitle.emoji}</span>
                <div>
                  <div className="text-lg md:text-xl font-bold font-display text-white">
                    {socialTitle.title}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {gradeInfo.text}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">AUDIT RATING</div>
                  <div className={`text-2xl font-black font-display ${gradeInfo.color}`}>
                    GRADE {gradeInfo.grade}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Big Stat Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400">{isZh ? '晶圓良率' : 'Fab Yield'}</div>
                <div className="text-2xl font-black font-mono text-emerald-400 my-1 tabular-nums">
                  {metrics.overallYieldPct.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isZh
                    ? `良品: ${metrics.totalWafersProduced} | 報廢: ${metrics.totalWafersDefective}`
                    : `Good: ${metrics.totalWafersProduced}`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400">{isZh ? '工安合規分' : 'Compliance'}</div>
                <div className="text-2xl font-black font-mono text-cyan-400 my-1 tabular-nums">
                  {metrics.safetyComplianceScore}/100
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {metrics.regulatoryFinesTotal === 0 ? (
                    <span className="text-emerald-400">✓ 零法規罰鍰</span>
                  ) : (
                    <span className="text-rose-400">罰鍰 ${metrics.regulatoryFinesTotal.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400">{isZh ? '事故排除' : 'Resolved'}</div>
                <div className="text-2xl font-black font-mono text-amber-400 my-1 tabular-nums">
                  {metrics.incidentsResolved} / {metrics.incidentsEncountered}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {metrics.incidentsFailed === 0 ? '✓ 全數安全排除' : `${metrics.incidentsFailed} 件處置失誤`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400">{isZh ? '平均反應' : 'Reaction Time'}</div>
                <div className="text-2xl font-black font-mono text-purple-400 my-1 tabular-nums">
                  {(metrics.averageReactionTimeMs / 1000).toFixed(2)}s
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {metrics.averageReactionTimeMs < 10000 ? '✓ 卓越反應水準' : '反應稍慢'}
                </div>
              </div>
            </div>

            {/* Direct 1-Click Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadBadge}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isZh ? '📸 下載個人榮譽圖卡 (PNG)' : 'Download Badge (PNG)'}</span>
                </button>

                <button
                  onClick={handleCopySocialPost}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? (isZh ? '✓ 已複製貼文！' : 'Copied!') : (isZh ? '📋 複製社群文案' : 'Copy Post')}</span>
                </button>

                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>{isZh ? '💬 心得與改善建議' : 'Feedback'}</span>
                </button>
              </div>

              <button
                onClick={() => setShowDetailedReport(!showDetailedReport)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {showDetailedReport
                  ? isZh
                    ? '▴ 收合 8D 詳細報告'
                    : '▴ Hide 8D Detailed Audit'
                  : isZh
                  ? '▾ 查看完整 8D 根因分析報告'
                  : '▾ View Full 8D Root Cause Analysis'}
              </button>
            </div>
          </div>

          {/* Fatal Alert Banner if Mandated Shutdown */}
          {metrics.fatalShutdownTriggered && (
            <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-950/70 text-rose-200 space-y-1 animate-pulse">
              <div className="flex items-center space-x-2 text-rose-300 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>{isZh ? '【全廠緊急停線】發生致命級事故，產線全面停工' : '【MANDATORY FAB SHUTDOWN】Fatal Level 3 Event Bypassed'}</span>
              </div>
              <p className="text-xs text-rose-300/90 font-mono">
                {isZh
                  ? '未於3秒內拍下 EMO 或違反 LOTO 帶電開啟腔體，觸發 SEMI S2 第 12 條緊急制動條款，產出歸零並移送工安委員會。'
                  : 'Failed to strike EMO within safety window or bypassed LOTO. Immediate OSHA halt enforced.'}
              </p>
            </div>
          )}

          {/* Collapsible Detailed 8D Audit & Incident History */}
          {showDetailedReport && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-fade-in">
              {/* Top Grade & Score Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Compliance Grade Card */}
            <div className="md:col-span-2 rounded-xl border border-slate-800 p-4 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center space-x-5">
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner shrink-0">
                <span className={`text-3xl font-display font-black ${gradeInfo.color}`}>
                  {gradeInfo.grade}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{isZh ? '評等' : 'Grade'}</span>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  {t.auditEvaluation}
                </div>
                <div className={`text-sm md:text-base font-bold font-display mt-0.5 ${gradeInfo.color}`}>
                  {gradeInfo.text}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-2 flex items-center space-x-4">
                  <span>
                    {t.score}: <strong className="text-slate-100">{metrics.safetyComplianceScore}/100</strong>
                  </span>
                  <span>
                    {t.fines}:{' '}
                    <strong className={metrics.regulatoryFinesTotal > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      ${metrics.regulatoryFinesTotal.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Card 1: Reaction Time */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{t.avgReaction}</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums my-1">
                {(metrics.averageReactionTimeMs / 1000).toFixed(2)}s
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {t.reactionTarget}
              </div>
            </div>

            {/* Metric Card 2: Production Yield */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{t.fabYieldAndWafers}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums my-1">
                {metrics.overallYieldPct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {t.goodVsDefect
                  .replace('{good}', String(metrics.totalWafersProduced))
                  .replace('{defect}', String(metrics.totalWafersDefective))}
              </div>
            </div>
          </div>

          {/* 8D Incident RCA Timeline Section */}
          <div>
            <h3 className="text-sm font-display font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>
                {isZh ? '8D 關鍵決策時間軸與處置軌跡 (Decision Timeline)' : '8D Critical Decision Timeline & SOP Trace'}
              </span>
            </h3>

            {metrics.decisionTimeline && metrics.decisionTimeline.length > 0 ? (
              <div className="space-y-2">
                {metrics.decisionTimeline.map((ev, eIdx) => (
                  <div
                    key={eIdx}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-start justify-between gap-3 ${
                      ev.isGoodDecision
                        ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                        : 'bg-rose-950/40 border-rose-900 text-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold shrink-0">
                        {ev.formattedTime}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200">
                          [{ev.bayCode}] {ev.description}
                        </div>
                        {ev.violationStandard && (
                          <div className="text-[11px] text-amber-400 mt-0.5">
                            Standard: {ev.violationStandard}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`font-bold ${ev.isGoodDecision ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ev.isGoodDecision ? '✓ COMPLIANT' : '✗ HAZARD'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 text-center">
                {isZh ? '本輪未記錄到重大偏差決策，處置流程穩定。' : 'No critical deviations logged during this shift.'}
              </div>
            )}
          </div>

          {/* Granular Incident Log */}
          <div>
            <h3 className="text-sm font-display font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>
                {t.incidentLog} ({incidentRecords.length} {isZh ? '件事故' : 'Incidents'})
              </span>
            </h3>

            {incidentRecords.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 text-center">
                {t.zeroIncidents}
              </div>
            ) : (
              <div className="space-y-3">
                {incidentRecords.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border transition-all ${
                      rec.success
                        ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                        : 'bg-rose-950/30 border-rose-900/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        {rec.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-display font-bold text-slate-200">
                          {rec.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {rec.sectorName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-slate-400">
                          {t.reaction}{' '}
                          <strong className="text-amber-400 tabular-nums">
                            {(rec.reactionTimeMs / 1000).toFixed(2)}s
                          </strong>
                        </span>
                        <span className="text-slate-400">
                          {t.total}{' '}
                          <strong className="text-slate-200 tabular-nums">
                            {(rec.completionTimeMs / 1000).toFixed(1)}s
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Steps evaluation */}
                    <div className="space-y-1.5 mt-2">
                      {rec.stepsTaken.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-xs font-mono flex items-start space-x-2 text-slate-300"
                        >
                          <span className={step.wasCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                            {step.wasCorrect ? '✓' : '✗'}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200">{step.stepLabel}: </span>
                            <span className="text-slate-400">{step.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {rec.failureReason && (
                      <div className="mt-2.5 p-2 rounded bg-rose-950/60 border border-rose-800/60 text-xs font-mono text-rose-300">
                        <strong>{isZh ? '違規肇因：' : 'Violation:'}</strong> {rec.failureReason}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>{t.standard} {rec.regulatoryStandard}</span>
                      <span>{t.penalty} ${rec.oshaViolationFine.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manager's Knowledge Gap & Remedial Actions */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-sm font-display font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>{t.managerKnowledgeGap}</span>
            </h3>

            {metrics.knowledgeGaps.length === 0 ? (
              <p className="text-xs font-mono text-emerald-400">
                {t.noGaps}
              </p>
            ) : (
              <div className="space-y-2 mt-3">
                {metrics.knowledgeGaps.map((gap, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400 font-semibold uppercase">{gap.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        {gap.severity} RISK
                      </span>
                    </div>
                    <div className="text-slate-300 mb-1">{gap.description}</div>
                    <div className="text-cyan-300 text-[11px]">
                      <strong>{t.remedialTraining}</strong> {gap.remedialAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

        {/* Modal Footer Controls */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onReturnToTitle}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.returnTitle}
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenTrainingManual}
              className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-slate-800 text-xs font-mono text-cyan-300 hover:text-cyan-200 hover:bg-slate-750 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.reviewProtocols}</span>
            </button>

            <button
              onClick={onRestart}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-bold text-xs tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.startNextShift}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Google Form / Player Feedback Modal */}
      {isFeedbackOpen && (
        <GoogleFormModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          language={language}
        />
      )}
    </div>
  );
};
