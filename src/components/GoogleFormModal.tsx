import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { Language } from '../i18n/translations';

interface GoogleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const GoogleFormModal: React.FC<GoogleFormModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isZh = language === 'zh-TW';
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [role, setRole] = useState('EQUIPMENT_ENGINEER');
  const [rating, setRating] = useState(5);
  const [bestFeature, setBestFeature] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [contact, setContact] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store in localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('worksafe_feedback') || '[]');
      existing.push({
        timestamp: new Date().toISOString(),
        role,
        rating,
        bestFeature,
        suggestions,
        contact,
      });
      localStorage.setItem('worksafe_feedback', JSON.stringify(existing));
    } catch {
      // ignore
    }
    setSubmitted(true);
  };

  const handleCopyFeedback = () => {
    const text = `【WorkSafe VR Feedback】\n` +
      `Role: ${role}\n` +
      `Rating: ${rating}/5\n` +
      `Favorite Aspect: ${bestFeature || 'N/A'}\n` +
      `Improvement Suggestions: ${suggestions || 'N/A'}\n` +
      `Contact/ID: ${contact || 'Anonymous'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {isZh ? '玩家心得分享與改善建議' : 'Player Feedback & Improvement Suggestions'}
              </h3>
              <p className="text-xs text-cyan-400/80">
                {isZh ? '您的反饋將協助我們持續優化晶圓廠安全教育與遊戲體驗' : 'Help us refine semiconductor fab safety education & gameplay'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-white">
                {isZh ? '感謝您的寶貴反饋！' : 'Thank You for Your Feedback!'}
              </h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {isZh
                  ? '您的心得與建議已成功記錄。我們將持續根據產業標準與玩家意見升級 WorkSafe VR。'
                  : 'Your experience and suggestions have been recorded to help us elevate WorkSafe VR.'}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyFeedback}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 text-xs font-semibold transition-all"
                >
                  <Copy className="w-4 h-4" />
                  {copied
                    ? (isZh ? '已複製內容！' : 'Copied!')
                    : (isZh ? '複製反饋文本' : 'Copy Feedback Text')}
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/30"
                >
                  {isZh ? '完成並返回' : 'Done & Return'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isZh ? '您的專業背景 / 角色' : 'Your Background / Role'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="EQUIPMENT_ENGINEER">{isZh ? '半導體設備 / 製程工程師 (EE/PE)' : 'Semiconductor Equipment / Process Engineer'}</option>
                  <option value="EHS_SPECIALIST">{isZh ? '工安 / 環安衛專家 (EHS / Safety Specialist)' : 'EHS / Safety Specialist'}</option>
                  <option value="STUDENT">{isZh ? '大專院校學生 / 研究生 (STEM Student)' : 'STEM Student / Researcher'}</option>
                  <option value="GAMER">{isZh ? '一般模擬遊戲玩家 (Simulator Gamer)' : 'Simulator / Overcooked Gamer'}</option>
                  <option value="OTHER">{isZh ? '其他科技製造領域 (Other High-Tech)' : 'Other Tech Industry'}</option>
                </select>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isZh ? '綜合遊戲與教育體驗評分' : 'Overall Game & Educational Experience Rating'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        rating === star
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* What did you like most? */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isZh ? '最喜歡的機制或特色 (可選)' : 'Favorite Feature or Mechanism (Optional)'}
                </label>
                <input
                  type="text"
                  value={bestFeature}
                  onChange={(e) => setBestFeature(e.target.value)}
                  placeholder={isZh ? '例如：3D機台細節、參數調整負回饋、事故8D分析報告...' : 'e.g. 3D bay fidelity, parameter trade-offs, 8D RCA report...'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isZh ? '具體改善建議或想增加的功能' : 'Improvement Suggestions or Desired Features'}
                  <span className="text-cyan-400 ml-1">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder={isZh ? '請分享您覺得哪些地方可以更好、需要修正的SOP細節，或任何體驗心得...' : 'Share your thoughts on gameplay balance, SOP realism, UI or audio...'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Contact (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isZh ? '聯絡方式 / 社群暱稱 (可選)' : 'Contact / Social Handle (Optional)'}
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={isZh ? 'Email 或 LinkedIn / 留空即匿名提交' : 'Email or handle / leave blank for anonymous'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href="https://forms.gle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isZh ? 'Google 表單外開' : 'Open in Google Forms'}
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    {isZh ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isZh ? '送出反饋' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
