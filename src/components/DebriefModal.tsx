import React, { useState } from 'react';
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
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';
import { IncidentRecord, SimulationMetrics } from '../types/game';
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

  const shareUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://github.com/BettyYang-clarity/Worksafe-VR';

  const isPro = metrics.difficulty === 'PRO';

  const getSocialTitle = (): { title: string; tag: string; emoji: string } => {
    if (metrics.fatalShutdownTriggered) {
      return {
        title: isZh
          ? isPro
            ? '停線檢討中 · 廠區引渡者'
            : '體驗中斷 · 觸發防護停機'
          : isPro
          ? 'Mandatory Fab Shutdown · Fab Hazard'
          : 'Simulation Halted · Safety Shutdown',
        tag: 'CRITICAL_INCIDENT',
        emoji: '💥',
      };
    }
    if (metrics.safetyComplianceScore >= 95 && metrics.overallYieldPct >= 95) {
      return {
        title: isZh
          ? isPro
            ? '雙料傳奇 · 無塵室環安救世主'
            : '雙料達人 · 無塵室防護模範生'
          : isPro
          ? 'Dual Ace · Cleanroom EHS Savior'
          : 'Dual Ace · Cleanroom Safety Model',
        tag: 'DUAL_ACE',
        emoji: '👑',
      };
    }
    if (metrics.preAlarmsPrevented >= 2 && metrics.safetyComplianceScore >= 90) {
      return {
        title: isZh
          ? isPro
            ? '先知級製程工程師 · 零事故防範大師'
            : '敏銳學員 · 零事故通關達人'
          : isPro
          ? 'Preventive Oracle · Zero-Incident Master'
          : 'Sharp Observer · Zero-Incident Explorer',
        tag: 'PREVENTIVE_MASTER',
        emoji: '🛡️',
      };
    }
    if (metrics.overallYieldPct >= 96 && metrics.safetyComplianceScore < 75) {
      return {
        title: isZh
          ? isPro
            ? '良率狂魔 · 工安稽核黑名單'
            : '良率衝刺者 · 工安待加強'
          : isPro
          ? 'Yield Demon · OSHA Audit Target'
          : 'Yield Chaser · Safety In Progress',
        tag: 'YIELD_DEMON',
        emoji: '🔥',
      };
    }
    if (metrics.safetyComplianceScore >= 90) {
      return {
        title: isZh
          ? isPro
            ? '聖人級工安官 · 零失誤守護者'
            : '模範守護者 · 零失誤通關'
          : isPro
          ? 'Safety Compliance Saint · Flawless Warden'
          : 'Model Guardian · Zero-Error Explorer',
        tag: 'SAFETY_SAINT',
        emoji: '✨',
      };
    }
    return {
      title: isZh
        ? isPro
          ? '資深晶圓製程與環安工程師'
          : '半導體科普體驗學員 · 順利結業'
        : isPro
        ? 'Senior Fab Process & Safety Engineer'
        : 'Semiconductor Explorer · Shift Completed',
      tag: 'SENIOR_EE',
      emoji: '⚡',
    };
  };

  const socialTitle = getSocialTitle();

  const getGrade = (score: number, fatal?: boolean) => {
    if (fatal) {
      return {
        grade: 'F',
        text: isZh
          ? isPro
            ? '重大工安停線處分 (OSHA 立即停工令)'
            : '未能通關 (觸發防護停機 · 建議複習指引)'
          : isPro
          ? 'FATAL FAILURE: Mandatory Fab Shutdown'
          : 'Failed to Pass (Safety Shutdown Triggered)',
        color: 'text-rose-500',
        hex: '#f43f5e',
      };
    }
    if (score >= 95)
      return {
        grade: 'S',
        text: isZh
          ? isPro
            ? '特級無塵室工安總監 (卓越零災害合規)'
            : '特優體驗評級 (AI 導航卓越通關)'
          : isPro
          ? 'Master Cleanroom Safety Director'
          : 'Excellence Pass (AI-Guided Excellence)',
        color: 'text-emerald-400',
        hex: '#10b981',
      };
    if (score >= 85)
      return {
        grade: 'A',
        text: isZh
          ? isPro
            ? '合格半導體防災工程師 (高度合規)'
            : '良好體驗評級 (高度安全合規)'
          : isPro
          ? 'Certified Fab Safety Engineer'
          : 'High Pass (High Safety Compliance)',
        color: 'text-cyan-400',
        hex: '#22d3ee',
      };
    if (score >= 70)
      return {
        grade: 'B',
        text: isZh
          ? isPro
            ? '合格操作工程師 (具輕微知識缺口)'
            : '合格體驗評級 (順利完成輪班)'
          : isPro
          ? 'Qualified Engineer (Minor Gaps)'
          : 'Qualified Pass (Shift Completed)',
        color: 'text-blue-400',
        hex: '#60a5fa',
      };
    return {
      grade: 'C',
      text: isZh
        ? isPro
          ? '附條件通過 (建議複習工安四大支柱手冊)'
          : '基礎體驗評級 (建議複習科普指引)'
        : isPro
        ? 'Conditional Pass (Review EHS Field Guide)'
        : 'Basic Pass (Review Safety Concepts)',
      color: 'text-amber-400',
      hex: '#fbbf24',
    };
  };

  const gradeInfo = getGrade(metrics.safetyComplianceScore, metrics.fatalShutdownTriggered);

  const buildShareText = () =>
    isZh
      ? isPro
        ? `🏭 我剛在《WorkSafe VR 半導體工安模擬器》以【🔴 專業模式（實戰零輔助）】完成了 300mm 無塵室輪班認證！\n` +
          `👤 認證工程師：${metrics.operatorName || 'Alex Chen #402'}\n` +
          `🏅 榮譽稱號：${socialTitle.emoji} ${socialTitle.title} (PRO GRADE ${gradeInfo.grade})\n` +
          `📈 晶圓良率：${metrics.overallYieldPct.toFixed(1)}% (${metrics.totalWafersProduced} 片良品) | 🛡️ 工安合規：${metrics.safetyComplianceScore}/100\n` +
          `🔧 第一階段排障：${metrics.preAlarmsPrevented} 起成功 | ⚡ 第二階段處置：${metrics.incidentsResolved}/${metrics.incidentsEncountered} 起\n` +
          `💎 守護廠區成果：保護 ${metrics.livesProtected} 名同仁安全 · 挽救 $${metrics.fabValueSavedMillionsUSD.toFixed(1)}M 美元資產！\n` +
          `👉 你能通過半導體 SEMI S2 實戰考驗嗎？立即挑戰：${shareUrl}`
        : `🏭 我剛在《WorkSafe VR 半導體工安模擬器》以【🟢 AI 引導模式】完成了無塵室工安科普體驗！\n` +
          `👤 體驗學員：${metrics.operatorName || 'Alex Chen #402'}\n` +
          `🏅 結業成果：${socialTitle.emoji} ${socialTitle.title} (GRADE ${gradeInfo.grade})\n` +
          `📈 晶圓良率：${metrics.overallYieldPct.toFixed(1)}% (${metrics.totalWafersProduced} 片良品) | 🛡️ 工安合規：${metrics.safetyComplianceScore}/100\n` +
          `🔧 預警故障排除：${metrics.preAlarmsPrevented} 起成功 | ⚡ 緊急處置：${metrics.incidentsResolved}/${metrics.incidentsEncountered} 起\n` +
          `💎 守護成果：保護 ${metrics.livesProtected} 名同仁安全 · 挽救 $${metrics.fabValueSavedMillionsUSD.toFixed(1)}M 美元資產！\n` +
          `👉 零門檻親身體驗晶圓廠無塵室工安：${shareUrl}`
      : isPro
      ? `🏭 I just passed the 300mm cleanroom shift in WorkSafe VR [PRO MODE: ZERO HINTS]!\n` +
        `👤 Engineer: ${metrics.operatorName || 'Alex Chen #402'}\n` +
        `🏅 Rank: ${socialTitle.emoji} ${socialTitle.title} (PRO GRADE ${gradeInfo.grade})\n` +
        `📈 Fab Yield: ${metrics.overallYieldPct.toFixed(1)}% (${metrics.totalWafersProduced} good wafers) | 🛡️ EHS Compliance: ${metrics.safetyComplianceScore}/100\n` +
        `🔧 Phase 1 Troubleshooting: ${metrics.preAlarmsPrevented} Saved | ⚡ Phase 2 Containment: ${metrics.incidentsResolved}/${metrics.incidentsEncountered}\n` +
        `💎 Fab Impact: ${metrics.livesProtected} Lives Protected · $${metrics.fabValueSavedMillionsUSD.toFixed(1)}M Fab Value Saved!\n` +
        `👉 Challenge SEMI S2 Cleanroom Safety: ${shareUrl}`
      : `🏭 I just completed the Cleanroom Safety Experience in WorkSafe VR [AI GUIDED MODE]!\n` +
        `👤 Explorer: ${metrics.operatorName || 'Alex Chen #402'}\n` +
        `🏅 Honors: ${socialTitle.emoji} ${socialTitle.title} (GRADE ${gradeInfo.grade})\n` +
        `📈 Fab Yield: ${metrics.overallYieldPct.toFixed(1)}% (${metrics.totalWafersProduced} good wafers) | 🛡️ EHS Compliance: ${metrics.safetyComplianceScore}/100\n` +
        `🔧 Diagnostics: ${metrics.preAlarmsPrevented} Saved | ⚡ Emergency Actions: ${metrics.incidentsResolved}/${metrics.incidentsEncountered}\n` +
        `💎 Impact: ${metrics.livesProtected} Lives Protected · $${metrics.fabValueSavedMillionsUSD.toFixed(1)}M Fab Value Saved!\n` +
        `👉 Try the semiconductor cleanroom experience: ${shareUrl}`;

  // Generate 1200x630 Social OpenGraph / LinkedIn / IG Share PNG Card (Bilingual matched to user language)
  const generateShareCardCanvas = (): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Deep Cleanroom Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.55, '#0f172a');
    grad.addColorStop(1, '#083344');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle Grid Overlay
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Outer Neon Frame (Cyan for PRO, Emerald for ASSISTED)
    ctx.strokeStyle = isPro ? '#06b6d4' : '#10b981';
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, 1160, 590);

    // Top Header Banner
    ctx.fillStyle = isPro ? '#38bdf8' : '#34d399';
    ctx.font = 'bold 24px "JetBrains Mono", monospace, sans-serif';
    ctx.fillText(
      isZh
        ? isPro
          ? 'WORKSAFE VR · 300MM 半導體晶圓廠專業工安資格證書'
          : 'WORKSAFE VR · 無塵室工安科普體驗 · 榮譽結業證書'
        : isPro
        ? 'WORKSAFE VR · 300MM SEMICONDUCTOR FAB PRO QUALIFICATION'
        : 'WORKSAFE VR · CLEANROOM EHS EXPLORER CERTIFICATE',
      48,
      66
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(
      isZh
        ? isPro
          ? 'SEMI S2 / OSHA 1910.147 晶圓廠專業工程師實戰認證卡'
          : '半導體無塵室科普體驗 · AI 智慧導引結業證明'
        : isPro
        ? 'SEMI S2 / OSHA 1910.147 PROFESSIONAL EHS QUALIFICATION'
        : 'SEMICONDUCTOR CLEANROOM SAFETY · AI-ASSISTED COMPLETION',
      48,
      94
    );

    // Grade Emblem Box (Top Right)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = gradeInfo.hex;
    ctx.lineWidth = 4;
    ctx.fillRect(980, 42, 170, 130);
    ctx.strokeRect(980, 42, 170, 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      isZh
        ? isPro
          ? '專業稽核評級'
          : 'AI 體驗評級'
        : isPro
        ? 'PRO AUDIT'
        : 'AI GRADE',
      1018,
      70
    );

    ctx.fillStyle = gradeInfo.hex;
    ctx.font = 'bold 68px system-ui, sans-serif';
    ctx.fillText(gradeInfo.grade, 1038, 145);

    // Operator & Title Banner
    ctx.fillStyle = isPro ? 'rgba(8, 145, 178, 0.25)' : 'rgba(5, 150, 105, 0.25)';
    ctx.fillRect(48, 115, 905, 82);
    ctx.strokeStyle = isPro ? '#0ea5e9' : '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 115, 905, 82);

    const difficultyTag = isPro
      ? isZh
        ? ' [ 模式：🔴 專業實戰認證 (難度：高) ]'
        : ' [ MODE: PRO CERTIFIED (High) ]'
      : isZh
      ? ' [ 模式：🟢 AI 引導體驗 (難度：低) ]'
      : ' [ MODE: AI GUIDED (Low) ]';

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(
      `${isZh ? (isPro ? '認證工程師' : '體驗學員') : (isPro ? 'ENGINEER ID' : 'EXPLORER ID')}: ${(metrics.operatorName || 'ALEX CHEN #402').toUpperCase()}${difficultyTag}`,
      68,
      145
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`${socialTitle.emoji} ${socialTitle.title}`, 68, 182);

    // 6 Key Metric Cards (2x3 Grid)
    const drawStat = (
      x: number,
      y: number,
      w: number,
      h: number,
      label: string,
      value: string,
      sub: string,
      color: string
    ) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(label, x + 22, y + 34);

      ctx.fillStyle = color;
      ctx.font = 'bold 40px monospace';
      ctx.fillText(value, x + 22, y + 84);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(sub, x + 22, y + 114);
    };

    drawStat(
      48,
      220,
      355,
      135,
      isZh ? '晶圓良率 (FAB YIELD)' : 'FAB YIELD',
      `${metrics.overallYieldPct.toFixed(1)}%`,
      isZh
        ? `合格良品產出 ${metrics.totalWafersProduced} 片`
        : `${metrics.totalWafersProduced} Good Wafers Produced`,
      '#10b981'
    );
    drawStat(
      422,
      220,
      355,
      135,
      isZh ? '工安合規 (COMPLIANCE)' : 'EHS COMPLIANCE',
      `${metrics.safetyComplianceScore}/100`,
      metrics.regulatoryFinesTotal === 0
        ? isZh
          ? '零 OSHA 違規裁罰'
          : 'Zero OSHA Violations'
        : `${isZh ? '裁罰' : 'Fines'}: $${metrics.regulatoryFinesTotal.toLocaleString()}`,
      '#38bdf8'
    );
    drawStat(
      796,
      220,
      355,
      135,
      isZh ? '保護資產 (VALUE SAVED)' : 'FAB VALUE SAVED',
      `$${metrics.fabValueSavedMillionsUSD.toFixed(1)}M`,
      isZh
        ? `守護 ${metrics.livesProtected} 名同仁現場安全`
        : `${metrics.livesProtected} Cleanroom Lives Protected`,
      '#fbbf24'
    );

    drawStat(
      48,
      375,
      355,
      135,
      isZh ? '第一階段排障 (PHASE 1)' : 'PHASE 1 TROUBLESHOOTING',
      `${metrics.preAlarmsPrevented} ${isZh ? '起成功' : 'SAVED'}`,
      isZh ? '根因排除 · 晶圓零損毀' : 'Root-cause prevented wafer scrap',
      '#22d3ee'
    );
    drawStat(
      422,
      375,
      355,
      135,
      isZh ? '第二階段處置 (PHASE 2)' : 'PHASE 2 SOP CONTAINMENT',
      `${metrics.incidentsResolved} / ${metrics.incidentsEncountered}`,
      isZh ? 'SEMI S2 / LOTO 緊急 SOP 處置' : 'SEMI S2 / LOTO Emergency SOPs',
      '#a855f7'
    );
    drawStat(
      796,
      375,
      355,
      135,
      isZh ? '平均決策時間 (DECISION TIME)' : 'MEAN DECISION TIME',
      `${(metrics.averageReactionTimeMs / 1000).toFixed(1)}s`,
      isZh ? '沉著冷靜、精準應變' : 'Calm, accurate hazard response',
      '#34d399'
    );

    // Call-To-Action Footer Banner
    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.fillRect(48, 530, 1103, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(
      isZh
        ? '🚀 你能在衝刺良率的同時守住零工安事故嗎？挑戰 WorkSafe VR：'
        : '🚀 Can you balance 300mm wafer yield & zero-accident cleanroom safety? Play now:',
      68,
      565
    );
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(shareUrl, isZh ? 700 : 800, 565);

    return canvas;
  };

  const handleShareOrCopy = async () => {
    const text = buildShareText();
    const canvas = generateShareCardCanvas();

    if (canvas && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File(
            [blob],
            `WorkSafe_VR_Result_${(metrics.operatorName || 'Engineer').replace(/\s+/g, '_')}.png`,
            { type: 'image/png' }
          );

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: isZh ? 'WorkSafe VR 半導體工安榮譽證書' : 'WorkSafe VR Fab Safety Certificate',
              text,
              url: shareUrl,
              files: [file],
            });
            return;
          }
        }
      } catch {
        // Fall back to text share or clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: isZh ? 'WorkSafe VR 半導體工安榮譽證書' : 'WorkSafe VR Fab Safety Certificate',
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2800);
  };

  const handleDownloadBadge = () => {
    const canvas = generateShareCardCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `WorkSafe_VR_Certificate_${(metrics.operatorName || 'Engineer').replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in font-sans pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
      <div className="rounded-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border-2 border-cyan-500/40 bg-slate-950 my-auto">
        {/* Compact Top Header (Responsive, Non-Deforming Survey Button) */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div
              className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                isPro
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold font-display text-white leading-tight">
                  {isZh
                    ? isPro
                      ? '半導體晶圓廠 · SEMI S2 專業認證書'
                      : '半導體晶圓廠 · 無塵室工安科普結業卡'
                    : isPro
                    ? 'Semiconductor Fab · SEMI S2 Cert'
                    : 'Semiconductor Fab · Safety Cert'}
                </h2>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${
                    isPro
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isPro ? 'PRO AUDIT' : 'AI EXPLORER'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 shadow"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap font-bold">{isZh ? '問卷回饋 📝' : 'Feedback 📝'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4">
          {/* ==================================================== */}
          {/* 1-PAGE VISUAL SOCIAL SHARE CERTIFICATE CARD           */}
          {/* ==================================================== */}
          <div
            className={`p-5 md:p-6 rounded-2xl border-2 shadow-2xl relative overflow-hidden ${
              isPro
                ? 'border-cyan-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 shadow-cyan-500/10'
                : 'border-emerald-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 shadow-emerald-500/10'
            }`}
          >
            <div
              className={`absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 rounded-full blur-2xl pointer-events-none ${
                isPro ? 'bg-cyan-500/10' : 'bg-emerald-500/10'
              }`}
            />

            {/* Certificate Header */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b ${
                isPro ? 'border-cyan-500/30' : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-xl border ${
                    isPro
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                      isPro ? 'text-cyan-400' : 'text-emerald-400'
                    }`}
                  >
                    {isPro
                      ? 'WORKSAFE VR · 300MM PROFESSIONAL EHS QUALIFICATION'
                      : 'WORKSAFE VR · CLEANROOM SAFETY EXPLORER HONORS'}
                  </div>
                  <div className="text-sm font-display font-bold text-slate-200">
                    {isZh
                      ? isPro
                        ? 'SEMI S2 / OSHA 1910.147 晶圓廠專業工程師實戰認證卡'
                        : '半導體無塵室工安科普體驗 · 榮譽結業證書'
                      : isPro
                      ? 'SEMI S2 / OSHA 1910.147 Process & Safety Qualification'
                      : 'Semiconductor Cleanroom Safety · Explorer Honors Certificate'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono">
                  <span className="text-slate-400">
                    {isZh ? (isPro ? '認證工程師:' : '體驗學員:') : isPro ? 'Engineer:' : 'Explorer:'}
                  </span>
                  <strong className={isPro ? 'text-cyan-300 font-bold' : 'text-emerald-300 font-bold'}>
                    {metrics.operatorName || 'Alex Chen #402'}
                  </strong>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-bold font-mono border ${
                    isPro
                      ? 'bg-rose-950/90 border-rose-500/80 text-rose-300'
                      : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300'
                  }`}
                >
                  {isPro
                    ? isZh
                      ? '🔴 專業模式 (實戰零輔助)'
                      : '🔴 PRO (Zero Hints)'
                    : isZh
                    ? '🟢 AI 引導模式 (普通人)'
                    : '🟢 AI GUIDED (Explorer)'}
                </span>
              </div>
            </div>

            {/* Mode Certification Seal Strip */}
            <div
              className={`mb-4 px-3.5 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                isPro
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{isPro ? '🎖️' : '🎓'}</span>
                <span>
                  {isZh
                    ? isPro
                      ? '考核規格：半導體標準 SEMI S2 / OSHA 實戰考核（純工程術語 · 無提示）'
                      : '結業規格：半導體無塵室科普體驗（AI 即時導航 · 白話術語輔助）'
                    : isPro
                    ? 'Standard: Full SEMI S2 / OSHA Professional Drill (Zero hints)'
                    : 'Standard: Educational Explorer Edition (AI Guided & Plain-terms)'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isPro
                    ? 'bg-rose-900/60 border-rose-400 text-rose-300'
                    : 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                }`}
              >
                {isPro
                  ? isZh
                    ? '難度：高 (專業實戰)'
                    : 'DIFFICULTY: HIGH (PRO)'
                  : isZh
                  ? '難度：低 (AI 導引)'
                  : 'DIFFICULTY: LOW (GUIDED)'}
              </span>
            </div>

            {/* Rank & Grade Hero Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/85 border border-slate-800 mb-4">
              <div className="flex items-center space-x-3.5">
                <span className="text-4xl">{socialTitle.emoji}</span>
                <div>
                  <div className="text-lg md:text-xl font-bold font-display text-white">
                    {socialTitle.title}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{gradeInfo.text}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    {isPro
                      ? isZh
                        ? '專業稽核評級'
                        : 'PRO AUDIT GRADE'
                      : isZh
                      ? 'AI 體驗評級'
                      : 'AI EXPLORER GRADE'}
                  </div>
                  <div className={`text-3xl font-black font-display ${gradeInfo.color}`}>
                    GRADE {gradeInfo.grade}
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Highlight Strip: Lives Protected & Fab Value Saved ($M) */}
            <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-cyan-950/50 to-slate-900 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs md:text-sm font-bold text-emerald-200">
                    {isZh
                      ? `💎 本班次環安價值：成功守護 ${metrics.livesProtected} 名無塵室同仁生命安全！`
                      : `💎 EHS Impact: Protected ${metrics.livesProtected} Cleanroom Personnel Lives!`}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {isZh
                      ? `透過事前預警防範 (${metrics.preAlarmsPrevented} 次) 與標準 SOP 處置，避免機台損毀與停工損失`
                      : `Prevented ${metrics.preAlarmsPrevented} pre-alarms & contained crises before catastrophic loss`}
                  </div>
                </div>
              </div>
              <div className="px-3.5 py-1.5 rounded-lg bg-slate-950/90 border border-amber-500/40 text-right">
                <div className="text-[10px] font-mono text-amber-300 uppercase">
                  {isZh ? '挽救晶圓廠資產價值' : 'FAB VALUE PROTECTED'}
                </div>
                <div className="text-lg font-black font-mono text-amber-400 tabular-nums">
                  ${metrics.fabValueSavedMillionsUSD.toFixed(1)}M USD
                </div>
              </div>
            </div>

            {/* 4 Core Metric Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  {isZh ? '晶圓良率 (Yield)' : 'Fab Yield'}
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 my-0.5 tabular-nums">
                  {metrics.overallYieldPct.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isZh
                    ? `良品 ${metrics.totalWafersProduced} 片 · 報廢 ${metrics.totalWafersDefective}`
                    : `${metrics.totalWafersProduced} good wafers`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  {isZh ? '工安合規 (Safety)' : 'EHS Compliance'}
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400 my-0.5 tabular-nums">
                  {metrics.safetyComplianceScore}/100
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {metrics.regulatoryFinesTotal === 0 ? (
                    <span className="text-emerald-400">
                      {isZh ? '✓ 零 OSHA 違規罰鍰' : '✓ Zero OSHA Fines'}
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      {isZh ? '罰鍰' : 'Fine'} ${metrics.regulatoryFinesTotal.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  {isZh ? '預警防範 / 危機排除' : 'Prevented / Resolved'}
                </div>
                <div className="text-2xl font-black font-mono text-amber-400 my-0.5 tabular-nums">
                  {metrics.preAlarmsPrevented} / {metrics.incidentsResolved}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isZh
                    ? `預警防範 ${metrics.preAlarmsPrevented} · 危機排除 ${metrics.incidentsResolved}/${metrics.incidentsEncountered}`
                    : `${metrics.preAlarmsPrevented} prevented · ${metrics.incidentsResolved}/${metrics.incidentsEncountered} SOP`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  {isZh ? '平均決策時間' : 'Mean Decision Time'}
                </div>
                <div className="text-2xl font-black font-mono text-purple-400 my-0.5 tabular-nums">
                  {(metrics.averageReactionTimeMs / 1000).toFixed(1)}s
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isZh ? '✓ 沉著準確執行 SOP' : '✓ Thoughtful SOP Execution'}
                </div>
              </div>
            </div>

            {/* YOUR CHOICES & REAL-WORLD OUTCOME COMPARISON */}
            {metrics.choiceOutcomes && metrics.choiceOutcomes.length > 0 && (
              <div className="mb-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider">
                    {isZh
                      ? '⚖️ 您的關鍵決策與結果差異對照 (Your Choices vs. Alternative Outcomes)'
                      : '⚖️ Your Decisions & Choice Outcome Comparison'}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isZh ? `共記錄 ${metrics.choiceOutcomes.length} 項關鍵抉擇` : `${metrics.choiceOutcomes.length} Key Choices`}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {metrics.choiceOutcomes.slice(-6).map((co) => (
                    <div
                      key={co.id}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                        co.isPositive
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-bold">
                            {co.bayCode} · {co.category}
                          </span>
                          <span
                            className={`font-bold ${
                              co.financialDeltaMillionsUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {co.financialDeltaMillionsUSD >= 0
                              ? `+$${co.financialDeltaMillionsUSD.toFixed(1)}M Saved`
                              : `-$${Math.abs(co.financialDeltaMillionsUSD).toFixed(1)}M Loss`}
                          </span>
                        </div>
                        <div className="font-bold text-white mt-1 leading-snug">
                          {co.isPositive ? '✅ ' : '❌ '}
                          {co.chosenAction}
                        </div>
                        <div className="text-[11px] opacity-90 mt-0.5">{co.outcomeImpact}</div>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-white/10 text-[10px] font-mono text-amber-300/90">
                        💡 {co.alternativeComparison}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Viral Social Share Call-to-Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadBadge}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isZh
                      ? '📸 下載 1200×630 社群分享證書 (PNG)'
                      : '📸 Download 1200×630 Share Card (PNG)'}
                  </span>
                </button>

                <button
                  onClick={handleShareOrCopy}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>
                    {copied
                      ? isZh
                        ? '✓ 已複製戰績與遊戲邀請連結！'
                        : '✓ Copied Result & Game Invite Link!'
                      : isZh
                      ? '🚀 一鍵分享戰績邀請朋友挑戰'
                      : '🚀 Share Result & Invite Friends'}
                  </span>
                </button>

                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>{isZh ? '💬 填寫回饋問卷' : '💬 Give Feedback'}</span>
                </button>
              </div>

              <button
                onClick={() => setShowDetailedReport(!showDetailedReport)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
              >
                {showDetailedReport
                  ? isZh
                    ? '▴ 收合詳細稽核日誌'
                    : '▴ Hide Audit Log'
                  : isZh
                  ? '▾ 展開 8D 決策軌跡與知識診斷'
                  : '▾ View 8D Audit Log & Gap Diagnosis'}
              </button>
            </div>
          </div>

          {/* Fatal Alert Banner if Mandated Shutdown */}
          {metrics.fatalShutdownTriggered && (
            <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-950/70 text-rose-200 space-y-1">
              <div className="flex items-center space-x-2 text-rose-300 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>
                  {isZh
                    ? '【全廠緊急停線】發生致命級工安違規，產線強制停工檢討'
                    : '【MANDATORY FAB SHUTDOWN】Fatal Level 3 Safety Breach'}
                </span>
              </div>
              <p className="text-xs text-rose-300/90 font-mono">
                {isZh
                  ? '採取了致命錯誤處置（如對矽甲烷噴水、未斷電拉扯受困人員或忽略氫氟酸沖淋），觸發 SEMI S2 緊急停工條款。請點擊下方「查閱工安四大支柱手冊」複習正確應變步驟！'
                  : 'A fatal protocol error triggered a mandatory SEMI S2 shutdown. Review the 4-Pillar EHS Field Guide below to master the correct procedure.'}
              </p>
            </div>
          )}

          {/* Collapsible Detailed 8D Audit & Incident History */}
          {showDetailedReport && (
            <div className="space-y-5 pt-3 border-t border-slate-800 animate-fade-in">
              {/* 8D Incident RCA Timeline Section */}
              <div>
                <h3 className="text-sm font-display font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isZh
                      ? '8D 關鍵決策時間軸與處置軌跡 (Decision Timeline)'
                      : '8D Critical Decision Timeline & SOP Trace'}
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
                        <span
                          className={`font-bold shrink-0 ${
                            ev.isGoodDecision ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {ev.isGoodDecision ? '✓ SAFE' : '✗ VIOLATION'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 text-center">
                    {isZh
                      ? '本輪未記錄到重大偏差決策，處置流程穩定。'
                      : 'No critical deviations logged during this shift.'}
                  </div>
                )}
              </div>

              {/* Granular Incident Log */}
              <div>
                <h3 className="text-sm font-display font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
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

                        <div className="space-y-1.5 mt-2">
                          {rec.stepsTaken.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="text-xs font-mono flex items-start space-x-2 text-slate-300"
                            >
                              <span
                                className={step.wasCorrect ? 'text-emerald-400' : 'text-rose-400'}
                              >
                                {step.wasCorrect ? '✓' : '✗'}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {step.stepLabel}:{' '}
                                </span>
                                <span className="text-slate-400">{step.explanation}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {rec.failureReason && (
                          <div className="mt-2.5 p-2 rounded bg-rose-950/60 border border-rose-800/60 text-xs font-mono text-rose-300">
                            <strong>{isZh ? '違規肇因：' : 'Violation:'}</strong>{' '}
                            {rec.failureReason}
                          </div>
                        )}
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
                  <p className="text-xs font-mono text-emerald-400">{t.noGaps}</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {metrics.knowledgeGaps.map((gap, gIdx) => (
                      <div
                        key={gIdx}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-amber-400 font-semibold uppercase">
                            {gap.category}
                          </span>
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onReturnToTitle}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.returnTitle}
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenTrainingManual}
              className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-slate-800 text-xs font-mono text-cyan-300 hover:text-cyan-200 hover:bg-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
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

      {/* Zero-Redirect In-Game Google Form Feedback Modal */}
      {isFeedbackOpen && (
        <GoogleFormModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          language={language}
          metrics={metrics}
        />
      )}
    </div>
  );
};
