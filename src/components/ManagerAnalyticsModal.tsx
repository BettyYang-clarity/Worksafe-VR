import React from 'react';
import { BarChart3, X, Download, ShieldCheck, Clock, RotateCcw } from 'lucide-react';
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(careerRecord, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `worksafe_vr_compliance_audit_${Date.now()}.json`);
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
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-slate-100">
                {isZh ? '晶圓廠主管稽核與員工知識缺口分析儀表板' : 'FAB MANAGER COMPLIANCE & KNOWLEDGE GAP AUDIT'}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {isZh ? 'SEMI S2 法規事故處置歷程追蹤與訓練成效紀錄' : 'REGULATORY INCIDENT PERFORMANCE & TRAINING TRACKER'}
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

            <div className="hud-border rounded-xl p-3.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {t.bestCompliance}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                {careerRecord.bestComplianceScore}%
              </div>
            </div>
          </div>

          {/* Current Certification Tier */}
          <div className="p-4 rounded-xl hud-border bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <div>
                <div className="text-xs font-mono text-slate-400">{t.currentCertification}</div>
                <div className="text-base font-bold font-display text-slate-100">
                  {t[careerRecord.certificationLevel] || careerRecord.certificationLevel.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Validated under SEMI S2-0712 Section 13.4
            </div>
          </div>

          {/* Incident History Audit Log */}
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isZh ? '歷史應變日誌紀錄' : 'Historical Incident Audit Entries'} ({careerRecord.incidentHistory.length})
              </span>
            </h3>

            {careerRecord.incidentHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-500 text-center">
                {isZh
                  ? '目前尚無演練紀錄。完成輪班模擬後將自動產出稽核數據。'
                  : 'No past incident records logged yet. Complete a shift simulation to populate audit data.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {careerRecord.incidentHistory.slice(-10).reverse().map((inc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <span className={inc.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {inc.success ? (isZh ? '✓ 成功排除' : '✓ RESOLVED') : (isZh ? '✗ 處置失敗' : '✗ FAILED')}
                      </span>
                      <span className="text-slate-200 font-semibold ml-2">{inc.title}</span>
                      <span className="text-slate-400 ml-2">({inc.sectorName})</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400">
                      <span>{(inc.reactionTimeMs / 1000).toFixed(2)}s {isZh ? '反應' : 'reaction'}</span>
                      <span className={inc.oshaViolationFine > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
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
              if (confirm(isZh ? '確定要重置技術員的所有訓練紀錄與認證等級嗎？' : 'Reset operator training history and certification levels?')) {
                onResetCareer();
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isZh ? '重設受訓紀錄' : 'Reset Training Records'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
              className="px-4 py-2 rounded-xl hud-border text-xs font-mono text-cyan-300 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZh ? '匯出稽核 JSON' : 'Export Compliance JSON'}</span>
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
