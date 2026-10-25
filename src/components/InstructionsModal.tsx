import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  Footprints,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { HAZARD_DEFINITIONS } from '../data/protocols';

interface InstructionsModalProps {
  language: Language;
  onClose: () => void;
  onStartShift?: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  language,
  onClose,
  onStartShift,
}) => {
  const [activeTab, setActiveTab] = useState<'HAZARDS' | 'PIPELINE' | 'CONTROLS' | 'SCORING'>(
    'HAZARDS'
  );
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/90 overflow-y-auto">
      <div className="hud-border rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-slate-100">
                {t.instructionsTitle}
              </h2>
              <p className="text-xs font-mono text-slate-400">{t.instructionsSub}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex flex-wrap gap-2 p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('HAZARDS')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'HAZARDS'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t.tabHazards}</span>
          </button>

          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'PIPELINE'
                ? 'bg-blue-500/20 border border-blue-400 text-blue-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.tabObjectives}</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'CONTROLS'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t.tabControls}</span>
          </button>

          <button
            onClick={() => setActiveTab('SCORING')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'SCORING'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{t.tabScoring}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-slate-300 font-sans text-sm leading-relaxed flex-1">
          {/* TAB 1: 4-PILLAR EHS HAZARD ENCYCLOPEDIA */}
          {activeTab === 'HAZARDS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm md:text-base font-bold text-amber-300 font-display">
                    {isZh
                      ? '半導體無塵室 6 大危害「環安四大支柱」百科 (SEMI S2 / OSHA 1910)'
                      : '6-Hazard Semiconductor 4-Pillar EHS Field Guide (SEMI S2 / OSHA 1910)'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isZh
                      ? '每一項危機皆完整說明：(1) 可能發生什麼、(2) 如何預防、(3) 發生時該怎麼做、(4) 嚴重後果。'
                      : 'Every scenario clearly teaches: (1) What May Happen, (2) How to Prevent, (3) What Should Do, and (4) Consequence.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-amber-500/40 text-[11px] font-mono text-amber-300">
                  ALL 5 BAYS COVERED
                </span>
              </div>

              <div className="space-y-4">
                {HAZARD_DEFINITIONS.map((h, idx) => (
                  <div
                    key={h.typeId}
                    className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm md:text-base">
                          {isZh ? h.titleZh : h.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                          {h.regulatoryStandard}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-red-300">
                          ${h.ehsPillars.estimatedLossMillionsUSD.toFixed(1)}M Risk
                        </span>
                      </div>
                    </div>

                    {/* Crucial PPE Step Banner */}
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/60 flex items-center justify-between gap-2 text-xs">
                      <div className="text-amber-200 font-medium">
                        <strong className="text-amber-300 font-mono">
                          {isZh ? '🛡️ 關鍵必備個人防護具 (Crucial PPE Step)：' : '🛡️ Crucial PPE Step: '}
                        </strong>
                        {isZh ? h.ehsPillars.ppeInstructionZh : h.ehsPillars.ppeInstruction}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400 text-amber-200 font-mono font-bold text-[10px] shrink-0">
                        {h.ehsPillars.recommendedPPE === 'SCBA'
                          ? '😷 SCBA'
                          : h.ehsPillars.recommendedPPE === 'ACID_SUIT'
                          ? '🧤 ACID SUIT'
                          : '⚡ HV GLOVES'}
                      </span>
                    </div>

                    {/* 4-Pillar Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Pillar 1: What May Happen */}
                      <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30">
                        <div className="font-bold text-amber-300 flex items-center space-x-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {isZh ? '1. 可能發生什麼 (What May Happen)' : '1. What May Happen'}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {isZh ? h.ehsPillars.whatMayHappenZh : h.ehsPillars.whatMayHappen}
                        </p>
                      </div>

                      {/* Pillar 2: How to Prevent */}
                      <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30">
                        <div className="font-bold text-cyan-300 flex items-center space-x-1.5 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {isZh ? '2. 如何事先預防 (How to Prevent)' : '2. How to Prevent'}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {isZh ? h.ehsPillars.howToPreventZh : h.ehsPillars.howToPrevent}
                        </p>
                      </div>

                      {/* Pillar 3: What Should Do */}
                      <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
                        <div className="font-bold text-emerald-300 flex items-center space-x-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isZh ? '3. 發生時該怎麼做 (What Should Do)' : '3. What Should Do (SOP)'}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {isZh ? h.ehsPillars.whatShouldDoZh : h.ehsPillars.whatShouldDo}
                        </p>
                      </div>

                      {/* Pillar 4: Consequence */}
                      <div className="p-3 rounded-xl bg-red-950/25 border border-red-500/30">
                        <div className="font-bold text-red-300 flex items-center space-x-1.5 mb-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>
                            {isZh
                              ? '4. 錯誤處置之嚴重後果 (Consequence)'
                              : '4. Consequence of Failure'}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {isZh ? h.ehsPillars.consequenceZh : h.ehsPillars.consequence}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE RECIPE TUNING & PREVENTATIVE PRE-ALARM LOOP */}
          {activeTab === 'PIPELINE' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-blue-300 font-display">
                {isZh
                  ? '製程工程師核心循環：配方微調 ➔ 預警防範 (Pre-Alarm) ➔ 危機決策'
                  : 'Active Fab Engineer Loop: Recipe Tuning ➔ Pre-Alarm Prevention ➔ Crisis SOP'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-2">
                  <div className="font-bold text-cyan-300 text-sm">
                    {isZh ? '① 常態生產：微調配方衝刺良率' : '1. Normal Ops: Tune Recipes for Yield'}
                  </div>
                  <p className="text-slate-300">
                    {isZh
                      ? '在無事故時，您可調整各區的 RF 射頻功率、特氣流量與真空度以提升晶圓產速與良率，完成「產線批次任務 (Wafer Lot Mission)」。'
                      : 'Tune RF Power, Gas Flow, and Chamber Vacuum across all 5 bays to boost wafer output and complete active Wafer Lot Missions.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-2">
                  <div className="font-bold text-amber-300 text-sm">
                    {isZh ? '② 琥珀色預警 (30秒)：事前預防事故！' : '2. Amber Pre-Alarm (30s): Prevent Crises!'}
                  </div>
                  <p className="text-slate-300">
                    {isZh
                      ? '機台長時間高負載運轉會產生漂移並觸發「琥珀色預警」。只要在 30 秒內走近機台點擊【🔧 現場預防維護】或調降過載參數，就能將事故消弭於無形 (+300 分)！'
                      : 'Before a disaster erupts, drifting bays trigger a 30-second Amber Pre-Alarm. Walk to the bay and click the On-Site Maintenance button (or lower overloaded sliders) to prevent the accident (+300 pts)!'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/40 space-y-2">
                  <div className="font-bold text-red-300 text-sm">
                    {isZh ? '③ 紅色突發危機 (50秒)：關鍵 SOP 決策' : '3. Red Crisis (50s): Critical SOP Decision'}
                  </div>
                  <p className="text-slate-300">
                    {isZh
                      ? '若預警未排除或於演練模式中爆發危機，請先走近機台 (<5.5m)，觀察 3D 災害動畫，並從 3 個選項中沉著選出正確的 SEMI S2 / OSHA 應變步驟！'
                      : 'If a full crisis erupts, walk to the bay (<5.5m), inspect the 3D hazard animation, and carefully choose the correct SEMI S2 / OSHA SOP step from 3 choices.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>
                    {isZh
                      ? 'CMOS 5 大製程串聯管線 (Bay 101 ➔ 102 ➔ 103 ➔ 104 ➔ 105)'
                      : 'CMOS 5-Bay Sequential Pipeline (Bay 101 ➔ 102 ➔ 103 ➔ 104 ➔ 105)'}
                  </span>
                </div>
                <p className="text-slate-300">
                  {isZh
                    ? '左側管線面板即時顯示晶圓在 5 大區域間的流動。若某區因事故停機，您可在下方控制台開啟「繞道分流 (Wafer Bypass)」避免上游回堵報廢！'
                    : 'The left pipeline sidebar visualizes live wafer flow across all 5 bays. If a bay halts, toggle Wafer Bypass on the bottom console to prevent upstream backlog scrap.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLS & WALKTHROUGH */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 font-display flex items-center space-x-2">
                <Footprints className="w-5 h-5" />
                <span>
                  {isZh
                    ? '無塵室現場走動 (Walk-to-Bay) 與 1 / 2 / 3 視角切換'
                    : 'Cleanroom Walkthrough (Walk-to-Bay) & 1 / 2 / 3 Camera Views'}
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">
                    {isZh ? 'W / A / S / D 或 方向鍵' : 'W / A / S / D or Arrow Keys'}
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {isZh ? '親自走動巡視無塵室各機台' : 'Walk around the 300mm Cleanroom'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/40 flex justify-between items-center">
                  <span className="text-cyan-200">
                    {isZh ? '【🏃 前往機台 Walk to Bay】按鈕' : '[🏃 Walk to Bay] Button'}
                  </span>
                  <span className="text-emerald-300 font-bold">
                    {isZh ? '一鍵自動走至目標機台前 (<5.5m)' : '1-Click Auto-Walk to Bay (<5.5m)'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? '1 / 2 / 3 視角按鈕' : '1 / 2 / 3 View Keys'}</span>
                  <span className="text-indigo-300 font-bold">
                    {isZh
                      ? '1: 第一人稱 / 2: 全廠俯視 / 3: 機台特寫'
                      : '1: 1st Person / 2: Whole Fab / 3: Inspect'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? '滑鼠拖曳 / 點擊' : 'Mouse Drag / Click'}</span>
                  <span className="text-cyan-300 font-bold">
                    {isZh ? '環視 3D 場景 / 點擊 3D 紅色 EMO' : 'Look Around / Click 3D Red EMO'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="font-bold text-cyan-300">
                  🎯 {isZh ? '為什麼需要走近機台 (< 5.5m)？' : 'Why Walk On-Site (< 5.5m)?'}
                </div>
                <p className="text-slate-300">
                  {isZh
                    ? '如同真實晶圓廠，您可從遠端微調配方滑桿；但「現場預防保養 (N2 吹驅 / 對位校準)」、「拍擊實體 EMO / 拉下沖淋拉桿」與「緊急事故 SOP 處置」必須人在機台現場 (< 5.5 公尺) 才能執行！切換至【2 全廠俯視】時，還可看到您的 3D 工程師角色在廠區內走動。'
                    : 'Just like a real fab, recipe sliders can be tuned remotely, but hands-on Preventative Maintenance, Physical EMO/Shower actions, and Emergency SOP steps require you to be On-Site (< 5.5m from the machine). Switch to Whole Fab View (2) anytime to watch your 3D Engineer Avatar walk across the floor!'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SCORING & CERTIFICATION */}
          {activeTab === 'SCORING' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-emerald-300 font-display">
                {isZh
                  ? '工安合規評分、守護生命數與資產保護價值 ($M USD)'
                  : 'EHS Compliance Scoring, Lives Protected & Fab Value Saved ($M USD)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/40 space-y-2">
                  <div className="font-bold text-emerald-300">
                    {isZh ? '🏆 正向獎勵與資產保護' : '🏆 Positive Rewards & Asset Protection'}
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>
                      {isZh
                        ? '於琥珀色預警階段成功預防事故：+300 分、合規率 +5%、累加百萬美元機台保護價值！'
                        : 'Preventing an Amber Pre-Alarm before crisis: +300 Score, +5% Safety Compliance, and millions in protected fab value!'}
                    </li>
                    <li>
                      {isZh
                        ? '危機中穿戴正確個人防護具 (SCBA / 防酸衣 / 絕緣手套) 並選出正確 SOP：完美守護現場人員生命！'
                        : 'Equipping proper PPE (SCBA / Acid Suit / HV Gloves) and selecting the right SOP step protects technician lives.'}
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-2">
                  <div className="font-bold text-amber-300">
                    {isZh ? '📸 一頁式社群分享證書與無跳轉回饋' : '📸 1-Page Social Share Card & In-Game Feedback'}
                  </div>
                  <p className="text-slate-300">
                    {isZh
                      ? '輪班結束後將生成專屬「一頁式半導體環安工程師認證卡」，可一鍵下載 1200×630 高畫質證書圖片或複製連結邀請朋友挑戰，亦可在視窗內直接填寫回饋表單（免跳轉頁面）。'
                      : 'At the end of your shift, download a 1200×630 HD Qualification Card showing your Grade, Yield, Lives Protected, and Fab Value Saved ($M), or submit feedback directly in-game without any page redirect.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <span className="text-xs font-mono text-slate-500">SEMI S2 / NFPA 318 / OSHA 1910</span>
          <button
            onClick={() => {
              onClose();
              if (onStartShift) onStartShift();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold font-mono text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <span>{t.gotItStart}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
