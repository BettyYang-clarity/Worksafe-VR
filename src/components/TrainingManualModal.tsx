import React, { useState } from 'react';
import { BookOpen, X, Shield, AlertTriangle, Zap, Droplets, Wind, Lock } from 'lucide-react';
import { Language } from '../i18n/translations';

interface TrainingManualModalProps {
  language: Language;
  onClose: () => void;
}

export const TrainingManualModal: React.FC<TrainingManualModalProps> = ({ language, onClose }) => {
  const [activeTab, setActiveTab] = useState<'HF_ACID' | 'SILANE_GAS' | 'PLASMA_FIRE' | 'LOTO_ROBOT' | 'PPE_CLEANROOM'>('HF_ACID');
  const isZh = language === 'zh-TW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 overflow-y-auto">
      <div className="hud-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-slate-100">
                {isZh ? '半導體無塵室標準作業程序 (SOP) 手冊' : 'CLEANROOM STANDARD OPERATING PROCEDURES (SOP)'}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                SEMI S2-0712 / NFPA 318 / OSHA 1910 REGULATORY MANUAL
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

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('HF_ACID')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'HF_ACID'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{isZh ? '氫氟酸 (HF) 接觸防護' : 'Hydrofluoric Acid (HF)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('SILANE_GAS')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'SILANE_GAS'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{isZh ? '矽甲烷 (SiH4) 自燃氣體' : 'Silane (SiH4) & Gas'}</span>
          </button>

          <button
            onClick={() => setActiveTab('PLASMA_FIRE')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'PLASMA_FIRE'
                ? 'bg-rose-500/20 border border-rose-400 text-rose-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isZh ? '射頻電漿與電氣火災' : 'RF Plasma & Arc Fires'}</span>
          </button>

          <button
            onClick={() => setActiveTab('LOTO_ROBOT')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'LOTO_ROBOT'
                ? 'bg-purple-500/20 border border-purple-400 text-purple-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isZh ? '機械天車 LOTO 上鎖' : 'Robotic LOTO Safeguards'}</span>
          </button>

          <button
            onClick={() => setActiveTab('PPE_CLEANROOM')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'PPE_CLEANROOM'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isZh ? '無塵衣與疏散原則' : 'Cleanroom PPE & Evacuation'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-xs font-mono leading-relaxed text-slate-300">
          {activeTab === 'HF_ACID' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-3 text-emerald-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{isZh ? '致命毒物警示：' : 'CRITICAL HAZARD WARNING:'}</strong>{' '}
                  {isZh
                    ? '氫氟酸可無痛滲透完整皮表，與人體骨骼神經之鈣鎂離子結合，造成嚴重低血鈣與致死性心室震顫！'
                    : 'Hydrofluoric Acid penetrates intact skin painlessly, destroys deep tissues, and causes sudden fatal cardiac arrest via systemic hypocalcemia.'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 1：立即大量清水沖洗與脫除衣物（0 - 5 分鐘）' : 'Step 1: Immediate Deluge Shower Decontamination (0 - 5 Minutes)'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '立即拉下緊急沖淋洗眼器拉桿，在流水下持續沖洗至少 5 分鐘，並立即脫除受污染之無塵衣及手套。切忌以乾布擦拭，以免擴大灼傷面積。'
                    : 'Direct victim directly under safety shower. Pull triangle lever immediately. Strip all contaminated cleanroom bunny suits and clothing under continuous running water. Flush for 5 minutes minimum. Never wipe dry with towels!'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 2：厚敷並按摩 2.5% 葡萄糖酸鈣 (Calcium Gluconate) 凝膠' : 'Step 2: Liberal Application of 2.5% Calcium Gluconate Gel'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '配戴抗酸手套，取專用葡萄糖酸鈣軟膏大量塗抹於患部並持續按摩，游離鈣離子將與氟離子結合生成不溶性氟化鈣 (CaF2)，防止深層骨骼溶解。'
                    : 'Apply Calcium Gluconate gel continuously using clean nitrile gloves. The free calcium ions (Ca²⁺) bind aggressive fluoride ions (F⁻) to form insoluble CaF2, halting bone and neural destruction.'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 3：化學吸液棉條圍堵與排氣切換' : 'Step 3: Containment with Neutralizing Absorbent Boom'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '以專用抗酸吸附棉圍堵酸液，嚴禁將強酸沖入高架地板下夾層排水溝。'
                    : 'Contain chemical runoff with certified HF neutralizing booms. Never wash acid into floor perforated tiles or sub-fab plenum drains.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SILANE_GAS' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center space-x-3 text-amber-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{isZh ? '自燃爆炸風險：' : 'PYROPHORIC RISK:'}</strong>{' '}
                  {isZh
                    ? '矽甲烷 (SiH4) 與空氣中氧氣接觸瞬間即會劇烈自燃爆轟，爆炸下限僅 1.4%！'
                    : 'Silane (SiH4) ignites spontaneously in air without an ignition spark. Flash detonations occur above 1.4% concentration in air.'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 1：擊發 EMO 氣體斷路 (Gas Abort)' : 'Step 1: Emergency Machine Off (EMO) & Gas Abort Trip'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '拍下 EMO 蘑菇按鈕，氣動安全彈簧閥將於 200ms 內機械斷氣。嚴禁開蓋檢視！'
                    : 'Depress the red mushroom EMO button immediately. This de-energizes the pneumatic solenoid valves, snapping spring-loaded shutoff valves closed within 200ms at the gas delivery cabinet.'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 2：高純氮氣 (N2) 吹驅至尾氣燃燒水洗塔' : 'Step 2: Nitrogen (N2) High-Pressure Purge to Abatement Scrubber'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '以惰性氮氣稀釋殘存氣體並推入高溫燃燒洗滌塔分解，嚴禁直排大氣。'
                    : 'Direct the line purge manifold to wet/thermal burn scrubbers using dry inert N2. Never vent raw silane or toxic dopant gases directly to atmospheric exhaust stacks.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'PLASMA_FIRE' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center space-x-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{isZh ? '半導體電氣火災鐵律：' : 'ELECTRICAL & CLEANROOM INTEGRITY:'}</strong>{' '}
                  {isZh
                    ? '嚴禁朝半導體真空機台噴灑水柱或乾粉滅火器！水引發致命觸電，乾粉將造成無塵室報廢！'
                    : 'Never spray water or ABC dry powder extinguishers on plasma cleanroom tools.'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 1：切斷 13.56MHz 射頻電源 (RF Generator)' : 'Step 1: Isolate 13.56 MHz RF Generator & Match Network'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '拍擊斷路器開關，切斷高頻電力能量來源使電弧熄滅。'
                    : 'RF plasma fires feed on continuous electromagnetic kilowatt energy. Hit the breaker disconnect immediately to starve the electrical ionization arc.'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 2：釋放潔淨氣體 (Inergen / Novec 1230) 滅火' : 'Step 2: Clean-Agent Total Flooding (Inergen / Novec 1230)'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '潔淨氣體可在不留下任何顆粒雜質的情況下窒息火源，保全極致昂貴的晶圓與曝光設備。'
                    : 'Clean-agent gas starves the combustion zone without leaving particulate residue. Standard yellow ABC dry chemical will contaminate the entire Class 1 cleanroom, destroying hundreds of millions of dollars in silicon wafers.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'LOTO_ROBOT' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center space-x-3 text-purple-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{isZh ? 'OSHA 1910.147 零能量準則：' : 'ZERO ENERGY STATE (OSHA 1910.147):'}</strong>{' '}
                  {isZh
                    ? '無人天車機械臂夾持力道極大，嚴禁在通電狀態下死命拉扯受困人員！'
                    : 'Automated Overhead Hoist Transport (OHT) carriers exert over 800 Nm of clamping force.'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 1：拍下軌道急停 EMO 斷電' : 'Step 1: Immediate OHT Rail EMO Depress'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '鎖死常閉機械剎車，避免伺服馬達持續過載下壓。'
                    : 'Never pull an employee free while servomotors are energized. Slap the EMO switch on the load port rail to engage spring mechanical dead-man brakes.'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                  {isZh ? '步驟 2：執行 LOTO 上鎖並手動釋放機構洩壓' : 'Step 2: Lockout / Tagout (LOTO) & Counterbalance Mechanical Release'}
                </h4>
                <p className="text-slate-400">
                  {isZh
                    ? '掛上安全鎖具，使用手動機械釋放柄緩慢洩除夾持位能。'
                    : 'Install physical padlock on the electrical enclosure. Use manual hand crank or screw release to gently relieve entrapment pressure without sudden drops.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'PPE_CLEANROOM' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center space-x-3 text-cyan-300">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{isZh ? '無塵室逃生黃金法則：' : 'CLEANROOM LIFE-SAFETY STANDARD:'}</strong>{' '}
                  {isZh
                    ? '毒氣警報響起時，人員應依逆風方向直接穿過安全逃生門，不可停留在更衣區脫除無塵衣！'
                    : 'During toxic chemical or gas alerts, do NOT pause to de-gown bunny suits inside cleanroom gowning rooms. Proceed straight through the crash doors to the decontamination vestibule.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs tracking-wider transition-colors cursor-pointer"
          >
            {isZh ? '已完成複習 · 關閉手冊' : 'ACKNOWLEDGE & CLOSE SOP'}
          </button>
        </div>
      </div>
    </div>
  );
};
