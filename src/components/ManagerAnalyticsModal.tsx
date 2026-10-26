import React from 'react';
import { Award, X, Download, ShieldCheck, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { UserCareerRecord } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface ManagerAnalyticsModalProps {
  language: Language;
  careerRecord: UserCareerRecord;
  onClose: () => void;
  onResetCareer: () => void;
}

export const ManagerAnalyticsModal: React.FC<ManagerAnalyticsModalProps> = ({
  language,
  careerRecord,
  onClose,
  onResetCareer,
}) => {
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  const exportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(careerRecord, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `worksafe_vr_achievements_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 overflow-y-auto">
      <div className="hud-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-slate-100">
                {isZh ? '成就榮譽與歷次遊玩戰績' : 'CAREER ACHIEVEMENTS & PLAY RECORDS'}
              </h2>
              <p className="text-xs font-mono text-purple-300/80">
                {isZh
                  ? '半導體無塵室工安認證等級與近期值班成績單'
                  : 'Cleanroom EHS Certification Rank & Shift Records'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="hud-border rounded-xl p-3.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {t.shiftsCompleted}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                {careerRecord.totalShiftsCompleted}
              </div>
            </div>

            <div className="hud-border rounded-xl p-3.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {t.bestCompliance}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                {careerRecord.bestComplianceScore}%
              </div>
            </div>

            <div className="hud-border rounded-xl p-3.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {t.incidentsResolved}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                {careerRecord.totalIncidentsHandled}
              </div>
            </div>

            <div className="hud-border rounded-xl p-3.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {t.meanReactionTime}
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                {careerRecord.averageReactionTimeMs > 0
                  ? `${(careerRecord.averageReactionTimeMs / 1000).toFixed(2)}s`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Current Certification Tier */}
          <div className="p-4 rounded-xl hud-border bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 flex flex-wrap items-center justify-between gap-3 border border-purple-500/30">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400">{t.currentCertification}</div>
                <div className="text-base font-bold font-display text-white tracking-wide">
                  {t[careerRecord.certificationLevel] ||
                    careerRecord.certificationLevel.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
              {isZh ? 'SEMI S2 / NFPA 318 認證規範' : 'Validated under SEMI S2 Standards'}
            </div>
          </div>

          {/* Recent Shifts History (這幾次遊玩的成績) */}
          <div>
            <h3 className="text-xs font-mono text-purple-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>{isZh ? '近期遊玩成績單' : 'Recent Shift Records'}</span>
                <span className="text-slate-500 font-normal">
                  ({careerRecord.shiftHistory?.length || 0})
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isZh ? '系統自動紀錄每場成績' : 'Auto-recorded per shift'}
              </span>
            </h3>

            {!careerRecord.shiftHistory || careerRecord.shiftHistory.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 text-center space-y-1.5">
                <div className="text-slate-300 font-semibold">
                  {isZh ? '尚無完成的輪班成績' : 'No shift records logged yet'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {isZh
                    ? '點擊首頁「開始輪班模擬」完成一次值班，系統即會在此生成您的完整評分成績單！'
                    : 'Complete a shift simulation to see your full performance scorecard here!'}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {careerRecord.shiftHistory.map((shift, idx) => {
                  const isS = shift.grade === 'S';
                  const isA = shift.grade === 'A';
                  const isFail = shift.grade === 'FAIL';
                  const gradeBadgeColor = isS
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                    : isA
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isFail
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                  return (
                    <div
                      key={shift.id || idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs font-mono flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-9 h-9 rounded-lg border font-display font-bold text-base flex items-center justify-center shrink-0 ${gradeBadgeColor}`}
                        >
                          {shift.grade}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-200 font-bold">
                              {shift.operatorName || 'Operator'}
                            </span>
                            <span className="text-[10px] text-slate-500">{shift.timestamp}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                            <span>
                              {isZh ? '良率:' : 'Yield:'}{' '}
                              <strong className="text-slate-200">
                                {shift.yieldPct.toFixed(1)}%
                              </strong>
                            </span>
                            <span>·</span>
                            <span>
                              {isZh ? '工安合規:' : 'Safety:'}{' '}
                              <strong
                                className={
                                  shift.safetyScore >= 90
                                    ? 'text-emerald-400'
                                    : shift.safetyScore >= 70
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }
                              >
                                {shift.safetyScore}{isZh ? '分' : ' pts'}
                              </strong>
                            </span>
                            <span>·</span>
                            <span>
                              {isZh ? '產出:' : 'Wafers:'}{' '}
                              <strong className="text-cyan-300">
                                {shift.wafersProduced} {isZh ? '片' : 'pcs'}
                              </strong>
                            </span>
                            <span>·</span>
                            <span>
                              {isZh ? '化解事故:' : 'Hazards:'}{' '}
                              <strong className="text-cyan-300">
                                {shift.incidentsResolved}/{shift.incidentsEncountered}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-right text-[11px]">
                        <div>
                          <div className="text-slate-500">{isZh ? '保全產值' : 'Value Saved'}</div>
                          <div className="text-emerald-400 font-bold">
                            +${shift.fabValueSavedM.toFixed(1)}M
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incident History Audit Log */}
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isZh ? '重大事故處置歷程' : 'Historical Hazard Responses'} (
                {careerRecord.incidentHistory.length})
              </span>
            </h3>

            {careerRecord.incidentHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-500 text-center">
                {isZh ? '目前尚無事故應變紀錄。' : 'No past hazard records logged yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {careerRecord.incidentHistory.slice(-10).reverse().map((inc, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={
                          inc.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                        }
                      >
                        {inc.success ? (isZh ? '✓ 成功排除' : '✓ RESOLVED') : isZh ? '✗ 處置失敗' : '✗ FAILED'}
                      </span>
                      <span className="text-slate-200 font-semibold ml-2">{inc.title}</span>
                      <span className="text-slate-400 ml-2">({inc.sectorName})</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400">
                      <span>
                        {(inc.reactionTimeMs / 1000).toFixed(2)}s {isZh ? '反應' : 'reaction'}
                      </span>
                      <span
                        className={inc.oshaViolationFine > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}
                      >
                        ${inc.oshaViolationFine} {isZh ? '罰鍰' : 'fines'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              if (
                confirm(
                  isZh
                    ? '確定要重置技術員的所有訓練紀錄與認證等級嗎？'
                    : 'Reset operator training history and certification levels?'
                )
              ) {
                onResetCareer();
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isZh ? '重設戰績紀錄' : 'Reset Records'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
              className="px-4 py-2 rounded-xl hud-border text-xs font-mono text-cyan-300 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZh ? '匯出戰績 JSON' : 'Export JSON'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              {isZh ? '完成' : 'DONE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
