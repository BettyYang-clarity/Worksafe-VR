import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Cpu,
  Eye,
  Flame,
  HelpCircle,
  Radio,
  Share2,
  ShieldAlert,
  Sliders,
  UserCheck,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

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
  const [activeTab, setActiveTab] = useState<
    'CONTROLS' | 'PIPELINE' | 'ROLES' | 'HAZARDS' | 'SCORING'
  >('CONTROLS');
  const t = TRANSLATIONS[language];
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/90 overflow-y-auto">
      <div className="hud-border rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-6 h-6" />
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
            onClick={() => setActiveTab('CONTROLS')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'CONTROLS'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t.tabControls}</span>
          </button>

          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'PIPELINE'
                ? 'bg-blue-500/20 border border-blue-400 text-blue-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.tabObjectives}</span>
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'ROLES'
                ? 'bg-purple-500/20 border border-purple-400 text-purple-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.tabRoles}</span>
          </button>

          <button
            onClick={() => setActiveTab('HAZARDS')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'HAZARDS'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t.tabHazards}</span>
          </button>

          <button
            onClick={() => setActiveTab('SCORING')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
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
          {/* TAB 1: CONTROLS */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300 font-display">
                {isZh ? '無塵室操作與熱鍵指令' : 'Cleanroom Navigation & Hotkey Commands'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? 'W / A / S / D 鍵' : 'W / A / S / D Keys'}</span>
                  <span className="text-cyan-300 font-bold">
                    {isZh ? '無塵室前後左右走動巡檢' : 'Walk around Cleanroom'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? '滑鼠按住拖曳' : 'Mouse Click & Drag'}</span>
                  <span className="text-cyan-300 font-bold">
                    {isZh ? '360 度 VR 第一人稱環視' : '360° VR First-Person Look'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? 'Tab 鍵' : 'Tab Key'}</span>
                  <span className="text-amber-300 font-bold">
                    {isZh ? '自由切換：設備工程師 ⇋ 值班組長' : 'Toggle: Equip Eng ⇋ Supervisor'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? '1 / 2 / 3 數字鍵' : '1 / 2 / 3 Keys'}</span>
                  <span className="text-indigo-300 font-bold">
                    {isZh ? 'VR 第一人稱 / 全廠俯視 / 機台特寫' : 'VR View / Supervisor / Inspect'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? 'H 鍵' : 'H Key'}</span>
                  <span className="text-slate-200 font-bold">
                    {isZh ? '展開 / 收合下方緊急應變面板' : 'Toggle Bottom Dock Panel'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isZh ? 'Esc 鍵' : 'Esc Key'}</span>
                  <span className="text-amber-400 font-bold">
                    {isZh ? '暫停模擬 / 查看 SOP 手冊' : 'Pause Simulation / View SOPs'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
                <span className="font-bold text-cyan-300">💡 {isZh ? '實體 3D 互動：' : 'Physical 3D Interaction: '}</span>
                {isZh
                  ? '除了點選 HUD 按鈕外，在 3D 場景中可直接用滑鼠點擊各機台上的紅色香菇頭 EMO 急停按鈕，立即拍下急停！'
                  : 'You can directly click red mushroom EMO buttons mounted on 3D machine cabinets to instantly trigger an Emergency Machine Off!'}
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE */}
          {activeTab === 'PIPELINE' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-blue-300 font-display">
                {isZh ? 'CMOS 5 大先進製程連續流向與防回堵機制' : 'CMOS 5-Bay Sequential Pipeline & Interlocks'}
              </h3>
              <p className="text-xs text-slate-300">
                {isZh
                  ? '晶圓廠的生產是嚴格串聯的。每一片 300mm 晶圓依序通過 5 個站點：'
                  : 'Semiconductor fabs run on strict sequential interlocks. Every 300mm wafer traverses 5 critical stations:'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/40">
                  <span className="text-cyan-400 font-bold">01. LITHOGRAPHY</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {isZh ? 'Bay 101 微影曝光，光阻圖形化轉印' : 'ASML DUV Scanner optical patterning'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/40">
                  <span className="text-indigo-400 font-bold">02. ION IMPLANT</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {isZh ? 'Bay 105 離子植入，摻雜改變導電率' : '200kV dopant implantation'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/40">
                  <span className="text-cyan-400 font-bold">03. ETCH & CVD</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {isZh ? 'Bay 102 電漿乾蝕刻與化學氣相沉積' : 'Plasma dry etch & thin-film CVD'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/40">
                  <span className="text-emerald-400 font-bold">04. CMP BENCH</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {isZh ? 'Bay 103 化學機械研磨與酸液清洗' : 'Chemical mechanical planarization'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/40">
                  <span className="text-amber-400 font-bold">05. FURNACE</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {isZh ? 'Bay 104 高溫退火熱擴散爐管' : '1000°C Quartz thermal annealing'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-amber-300">
                  ⚠️ {isZh ? '回堵 (Backlog) 與 斷料 (Starvation) 衝擊：' : 'Backlog & Starvation Impact:'}
                </div>
                <p>
                  {isZh
                    ? '若前製程機台發生工安事件停機，上游晶圓將迅速回堵，造成堆疊報廢；下游機台則會因缺料而空轉。值班組長必須及時啟用「繞道分流 (Bypass Active)」將晶圓引導至緩衝暫存架，保護整廠綜合良率！'
                    : 'If an incident halts a bay, upstream wafers rapidly back up, risking scrap, while downstream tools starve. The Shift Supervisor must trigger Wafer Bypass to re-route FOUPs to buffer stockers!'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ROLES */}
          {activeTab === 'ROLES' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-purple-300 font-display">
                {isZh ? '雙角色扮演模式 (Dual Role-Play Modes)' : 'Dual Role-Play Modes'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equipment Engineer */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Cpu className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">
                      {isZh ? '設備工程師 (Equipment Engineer)' : 'Equipment Engineer'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isZh
                      ? '專注於第一線機台深度診斷與工安處置。可攜帶手持診斷平板巡檢機台，微調真空配方與射頻匹配阻抗，並執行高純度氮氣 (N2) 吹掃、沖淋洗眼裝置自測與 10kV 驗電接地棒放電！'
                      : 'Hands-on tool diagnostics, vacuum recipe tuning, RF impedance matching, triggering physical N2 purge jets, eyewash deluge showers, and applying 10kV grounding sticks.'}
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 font-mono list-disc list-inside">
                    <li>{isZh ? '手持平板即時監控 Torr / PPM / kV' : 'Tablet Torr / PPM / kV monitoring'}</li>
                    <li>{isZh ? '第一時間拍下 EMO 急停按鈕' : 'Immediate mushroom EMO trigger'}</li>
                    <li>{isZh ? '排除機台洩漏與微粒超標' : 'Cleanroom chamber decontamination'}</li>
                  </ul>
                </div>

                {/* Shift Supervisor */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/40 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Share2 className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">
                      {isZh ? '值班組長 (Shift Supervisor)' : 'Shift Supervisor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isZh
                      ? '掌握巨觀全廠產線調度。調配 5 大製程站點晶圓吞吐量，啟用天車繞道分流 (Wafer Bypass) 避免產線回堵，並在遭遇重大毒氣或火災危機時發布全廠緊急疏散廣播！'
                      : 'Macro fab dispatching across all 5 bays, toggling wafer bypass to balance buffer stockers, and issuing plant-wide evacuation broadcasts during catastrophic gas leaks.'}
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 font-mono list-disc list-inside">
                    <li>{isZh ? '監控 5 站 CMOS 串聯流暢度' : '5-Bay CMOS flow state monitoring'}</li>
                    <li>{isZh ? '調度 OHT 天車晶圓繞道分流' : 'Wafer bypass routing'}</li>
                    <li>{isZh ? '發布全廠工安緊急疏散廣播' : 'Plant-wide evacuation broadcast'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HAZARDS */}
          {activeTab === 'HAZARDS' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-amber-300 font-display">
                {isZh ? '重大危害應變 SOP (SEMI S2 / OSHA 標準)' : 'Critical Safety Protocols (SEMI S2 / OSHA)'}
              </h3>

              <div className="space-y-3 text-xs">
                {/* Bay 105 Arsine */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/40">
                  <div className="flex items-center space-x-2 font-bold text-amber-400">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>
                      {isZh
                        ? 'Bay 105 離子植入機：高劇毒砷化氫 (AsH3) 氣體洩漏'
                        : 'Bay 105 Ion Implanter: Arsine (AsH3) Toxic Gas Leak'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    {isZh
                      ? 'TLV 極限僅 0.005 PPM！處置 SOP：1. 立即拍下 EMO 並切斷 SDS 亞大氣壓氣瓶氣動閥 2. 隔離渦輪分子泵防反灌 3. 轉向燃燒洗滌塔 (Toxic Scrubber) 4. 配戴正壓 SCBA 呼吸器撤離。'
                      : 'TLV is 0.005 PPM! SOP: 1. Slap EMO & isolate SDS sub-atmospheric cylinder 2. Isolate turbomolecular pump 3. Divert to thermal-wet toxic scrubber 4. Evacuate with positive-pressure SCBA.'}
                  </p>
                </div>

                {/* Bay 105 HV Arc Flash */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/40">
                  <div className="flex items-center space-x-2 font-bold text-cyan-400">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isZh
                        ? 'Bay 105 離子植入機：200kV 超高壓電弧放電與次級 X 射線輻射'
                        : 'Bay 105: 200kV Electrostatic Arc Flash & Secondary X-Ray'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    {isZh
                      ? '處置 SOP：1. 執行主斷路器上鎖掛牌 (LOTO) 2. 使用 10kV 絕緣放電接地棒直接碰觸高壓加速管電極確認殘存電荷歸零 3. 蓋上鉛屏蔽並以蓋格計數器測量小於 0.1 mR/hr 後始得開蓋。'
                      : 'SOP: 1. Main Breaker Lockout/Tagout (LOTO) 2. Verify zero potential with 10kV insulated grounding stick 3. Fasten lead shielding & verify <0.1 mR/hr via Geiger-Müller counter.'}
                  </p>
                </div>

                {/* HF Acid */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/40">
                  <div className="flex items-center space-x-2 font-bold text-emerald-400">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    <span>
                      {isZh
                        ? 'Bay 103 濕式清洗：氫氟酸 (HF) 噴濺危害'
                        : 'Bay 103 Wet Bench: Hydrofluoric Acid (HF) Splash'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    {isZh
                      ? '處置 SOP：1. 立即拉動緊急沖淋洗眼器連續沖洗 15 分鐘 2. 塗抹 2.5% 葡萄糖酸鈣軟膏 (Calcium Gluconate) 游離鈣離子防骨骼壞死 3. 專用酸性中和吸附棉圍堵。'
                      : 'SOP: 1. Pull emergency deluge shower for 15 minutes 2. Liberally apply 2.5% Calcium Gluconate gel to bind fluoride ions 3. Contain spill with HF neutralizing absorbent pillows.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SCORING */}
          {activeTab === 'SCORING' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-emerald-300 font-display">
                {isZh ? '動態評分機制與知識缺口診斷' : 'Dynamic Scoring & Manager Gap Diagnosis'}
              </h3>
              <p className="text-xs text-slate-300">
                {isZh
                  ? '系統精確記錄毫秒級反應速度 (Target: < 3.0s)。若超過時限或採取錯誤致命步驟 (如用水撲滅矽甲烷)，將遭致 OSHA 法規高額罰鍰並在考核報告中被列入重大缺失！'
                  : 'Tracks reaction times in milliseconds (<3.0s target). Fatal errors (e.g. water on silane) incur severe OSHA penalty fines and generate mandatory remedial training assignments.'}
              </p>
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
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold font-mono text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <span>{t.gotItStart}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
