import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { Language } from '../i18n/translations';
import { SimulationMetrics } from '../types/game';
import { GOOGLE_FORM_CONFIG, submitFeedbackToGoogleForm } from '../config/feedbackConfig';

interface GoogleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  metrics?: SimulationMetrics;
}

export const GoogleFormModal: React.FC<GoogleFormModalProps> = ({
  isOpen,
  onClose,
  language,
  metrics,
}) => {
  const isZh = language === 'zh-TW';
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentToRemote, setSentToRemote] = useState(false);

  // 6 Recommended Google Form Fields
  const [overallRating, setOverallRating] = useState(5);
  const [ehsClarity, setEhsClarity] = useState('Very Clear and Practical');
  const [memorableHazard, setMemorableHazard] = useState('Bay 103: HF Acid Spill & First Aid');
  const [gameplayFunRating, setGameplayFunRating] = useState(5);
  const [playerBackground, setPlayerBackground] = useState('Semiconductor Fab Engineer (EE / PE)');
  const [comments, setComments] = useState('');

  if (!isOpen) return null;

  const telemetrySummary = metrics
    ? `Operator: ${metrics.operatorName || 'Anonymous'} | Yield: ${metrics.overallYieldPct.toFixed(1)}% | Compliance: ${metrics.safetyComplianceScore}/100 | Prevented: ${metrics.preAlarmsPrevented} | Resolved: ${metrics.incidentsResolved}/${metrics.incidentsEncountered} | Saved: $${metrics.fabValueSavedMillionsUSD.toFixed(1)}M`
    : 'Submitted from shift menu';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitFeedbackToGoogleForm({
      overallRating,
      ehsClarity,
      memorableHazard,
      gameplayFunRating,
      playerBackground,
      comments,
      telemetrySummary,
    });
    setSentToRemote(result.sentToGoogleForm);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCopyFeedback = () => {
    const text =
      `【WorkSafe VR Feedback】\n` +
      `1. Overall Rating: ${overallRating}/5\n` +
      `2. 4-Pillar EHS Clarity: ${ehsClarity}\n` +
      `3. Most Memorable Hazard: ${memorableHazard}\n` +
      `4. Walkthrough & Recipe Tuning Fun: ${gameplayFunRating}/5\n` +
      `5. Background: ${playerBackground}\n` +
      `6. Suggestions: ${comments || 'N/A'}\n` +
      `Telemetry: ${telemetrySummary}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {isZh
                  ? '體驗心得與工安建議'
                  : 'Experience Feedback & Suggestions'}
              </h3>
              <p className="text-xs text-cyan-400/80">
                {isZh
                  ? '歡迎分享您對模擬操作、SOP 指引或遊戲體驗的想法'
                  : 'Share your thoughts on cleanroom scenarios, guidance, and gameplay.'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-white">
                {isZh ? '感謝您的寶貴回饋！' : 'Thank You for Your Feedback!'}
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {isZh
                  ? '感謝您的寶貴回饋！您的意見與本班次紀錄已成功送達。'
                  : 'Thank you for your feedback! Your response has been submitted successfully.'}
              </p>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyFeedback}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copied
                    ? isZh
                      ? '已複製內容！'
                      : 'Copied!'
                    : isZh
                    ? '複製回饋摘要'
                    : 'Copy Feedback Summary'}
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  {isZh ? '完成並返回遊戲' : 'Done & Return'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Q1: Overall Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  {isZh
                    ? '1. 您對《WorkSafe VR》整體工安訓練與模擬體驗的評分？'
                    : '1. Overall rating of WorkSafe VR as an EHS training simulator?'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        overallRating === star
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: 4-Pillar EHS Educational Clarity */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  {isZh
                    ? '2. 遊戲是否清楚傳達「可能發生什麼、如何預防、該怎麼做、嚴重後果」四大工安觀念？'
                    : '2. Did the simulation clearly teach What May Happen, How to Prevent, What Should Do, and Consequence?'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'Very Clear and Practical',
                      label: isZh ? '非常清楚明確' : 'Very Clear & Practical',
                    },
                    {
                      id: 'Moderate',
                      label: isZh ? '大致清楚' : 'Moderate',
                    },
                    {
                      id: 'Needs More Details',
                      label: isZh ? '希望再增加說明' : 'Needs More Details',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEhsClarity(opt.id)}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        ehsClarity === opt.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Most Memorable Hazard Scenario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    {isZh
                      ? '3. 哪一項半導體危害情境讓您印象最深刻？'
                      : '3. Most memorable semiconductor hazard scenario?'}
                  </label>
                  <select
                    value={memorableHazard}
                    onChange={(e) => setMemorableHazard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Bay 103: HF Acid Spill & First Aid">
                      {isZh ? 'Bay 103 氫氟酸 (HF) 破裂與沖淋解毒' : 'Bay 103 HF Acid Spill & First Aid'}
                    </option>
                    <option value="Bay 102: Pyrophoric Silane (SiH4) Fire">
                      {isZh ? 'Bay 102 矽甲烷 (SiH4) 自燃大火 (禁水)' : 'Bay 102 Pyrophoric Silane Fire'}
                    </option>
                    <option value="Bay 104: 1100°C Quartz Furnace Breach & H2 Leak">
                      {isZh ? 'Bay 104 1100°C 高溫石英爐管卡死與氫氣外洩' : 'Bay 104 1100°C Quartz Furnace Breach'}
                    </option>
                    <option value="Bay 105: Arsine (AsH3) Toxic Gas Leak">
                      {isZh ? 'Bay 105 砷化氫 (AsH3) 劇毒氣體外洩' : 'Bay 105 Arsine Toxic Gas Leak'}
                    </option>
                    <option value="Bay 105: 200kV HV Arc & X-Ray Radiation">
                      {isZh ? 'Bay 105 200kV 高壓電弧跳火與 X 光輻射' : 'Bay 105 200kV HV Arc & X-Ray'}
                    </option>
                    <option value="Bay 101: OHT Mechanical Pinch & LOTO">
                      {isZh ? 'Bay 101 OHT 天車機械夾傷與 LOTO 上鎖' : 'Bay 101 OHT Mechanical Pinch & LOTO'}
                    </option>
                  </select>
                </div>

                {/* Q5: Player Background */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    {isZh ? '4. 您的專業背景或身份？' : '4. Your professional background / role?'}
                  </label>
                  <select
                    value={playerBackground}
                    onChange={(e) => setPlayerBackground(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Semiconductor Fab Engineer (EE / PE)">
                      {isZh ? '半導體設備 / 製程工程師 (EE/PE)' : 'Semiconductor Equipment / Process Engineer'}
                    </option>
                    <option value="EHS / Industrial Safety Specialist">
                      {isZh ? '環安衛 / 工安專家 (EHS Specialist)' : 'EHS / Safety Specialist'}
                    </option>
                    <option value="STEM Student / Academic Researcher">
                      {isZh ? '理工科系學生 / 研究人員' : 'STEM Student / Researcher'}
                    </option>
                    <option value="General Simulation Player / Tech Enthusiast">
                      {isZh ? '一般模擬遊戲玩家' : 'General Simulation Player'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Q4: Walkthrough & Recipe Tuning Fun Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  {isZh
                    ? '5. 無塵室現場走動巡檢、配方調校與預警防範的互動趣味度？'
                    : '5. How engaging was the cleanroom walkthrough, recipe tuning & pre-alarm prevention?'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setGameplayFunRating(star)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        gameplayFunRating === star
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Q6: Open Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  {isZh
                    ? '6. 其他建議、想新增的機台危害或體驗心得 (選填)'
                    : '6. Open suggestions or hazard scenarios you would like to see added (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    isZh
                      ? '歡迎分享您對 3D 動畫、SOP 決策提示或遊戲平衡的想法...'
                      : 'Share any thoughts on 3D animations, SOP guidance, or fab mechanics...'
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Privacy & Impact reassurance footer */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isZh
                    ? '您的回饋將作為後續優化工安模擬訓練與機台情境之參考'
                    : 'Your feedback directly helps improve cleanroom safety training.'}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {isZh ? '稍後再填' : 'Later'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? isZh
                        ? '送出中...'
                        : 'Submitting...'
                      : isZh
                      ? '送出回饋'
                      : 'Submit Feedback'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
