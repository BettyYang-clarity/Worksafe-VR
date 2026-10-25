import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { ActionEffectType } from '../3d/ParticleEffects';
import { soundManager } from '../audio/soundManager';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { SectorId, SectorState } from '../types/game';

interface InspectionTabletModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorState[];
  selectedSectorId: SectorId;
  onSelectSector: (id: SectorId) => void;
  onCalibrateSector: (id: SectorId) => void;
  onHitEmo: (id: SectorId) => void;
  onTriggerActionEffect: (type: ActionEffectType, sectorId: SectorId) => void;
  onUpdateParams?: (sectorId: SectorId, params: Partial<SectorState>) => void;
  onToggleBypass?: (sectorId: SectorId) => void;
  language: Language;
}

export const InspectionTabletModal: React.FC<InspectionTabletModalProps> = ({
  isOpen,
  onClose,
  sectors,
  selectedSectorId,
  onSelectSector,
  onCalibrateSector,
  onHitEmo,
  onTriggerActionEffect,
  onUpdateParams,
  onToggleBypass,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<SectorId>(selectedSectorId);
  const [tuningStatus, setTuningStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isZh = language === 'zh-TW';
  const t = TRANSLATIONS[language];
  const sector = sectors.find((s) => s.id === activeTab) || sectors[0];

  const handleTune = () => {
    soundManager.playSuccessChime();
    onCalibrateSector(sector.id);
    setTuningStatus(
      isZh
        ? `機台 ${sector.nameZh} 參數校準完成！真空度與射頻阻抗已重新匹配。`
        : `Tool ${sector.name} recipe calibrated! Vacuum and RF matching tuned.`
    );
    setTimeout(() => setTuningStatus(null), 3000);
  };

  const handleN2Purge = () => {
    soundManager.playGasPurge();
    onTriggerActionEffect('N2_PURGE', sector.id);
    setTuningStatus(
      isZh
        ? '已啟動高純度氮氣 (N2) 吹掃防護程序！'
        : 'High-purity N2 purge jet sequence active!'
    );
    setTimeout(() => setTuningStatus(null), 3000);
  };

  const handleDelugeShower = () => {
    soundManager.playShowerSpray();
    onTriggerActionEffect('DELUGE_SHOWER', sector.id);
    setTuningStatus(
      isZh
        ? '緊急沖淋洗眼裝置已啟動噴射 (SEMI S2 自測)！'
        : 'Emergency deluge shower activated (SEMI S2 self-test)!'
    );
    setTimeout(() => setTuningStatus(null), 3000);
  };

  const handleArcGrounding = () => {
    soundManager.playErrorBuzzer();
    onTriggerActionEffect('ARC_SPARKS', sector.id);
    setTuningStatus(
      isZh
        ? '高壓電弧放電測試已觸發，10kV 放電接地棒驗電完畢！'
        : 'High-voltage arc discharge test fired. Grounding stick verified!'
    );
    setTimeout(() => setTuningStatus(null), 3000);
  };

  // Double-edged parameter adjustments
  const handleRfPowerChange = (val: number) => {
    if (!onUpdateParams) return;
    // Temperature rises with RF power
    const newTemp = Math.min(420, 180 + (val / 2400) * 200);
    const newScrubber = Math.min(120, (sector.gasFlowSccm / 100) * 75 + (newTemp / 350) * 25);
    onUpdateParams(sector.id, {
      rfPowerWatts: val,
      temperatureC: newTemp,
      scrubberLoadPct: newScrubber,
    });
  };

  const handleGasFlowChange = (val: number) => {
    if (!onUpdateParams) return;
    const newScrubber = Math.min(120, (val / 100) * 75 + (sector.temperatureC / 350) * 25);
    onUpdateParams(sector.id, {
      gasFlowSccm: val,
      scrubberLoadPct: newScrubber,
    });
  };

  const handleVacuumChange = (val: number) => {
    if (!onUpdateParams) return;
    // Lower vacuum torr cuts particles
    const newParticles = Math.max(0.5, val * 350);
    onUpdateParams(sector.id, {
      chamberVacuumTorr: val,
      particleCountPPM: newParticles,
    });
  };

  const scrubberOverload = sector.scrubberLoadPct > 90;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in font-mono">
      <div className="flex h-[94vh] max-h-[860px] w-full max-w-4xl flex-col rounded-2xl border-2 border-cyan-500/50 bg-slate-950/95 shadow-2xl shadow-cyan-950/80 overflow-hidden">
        {/* Rugged Tablet Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-900/90 px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {isZh ? '設備工程師診斷與製程微調平板' : 'EQUIPMENT ENGINEER DIAGNOSTIC & PROCESS PAD'}
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/40">
                  SECS/GEM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isZh
                  ? '雙面刃製程參數調控 · 產能 vs 工安風險動態平衡'
                  : 'Double-Edged Recipe Balancing · Throughput vs EHS Hazard Trade-offs'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bay Selection Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 pt-2 gap-2 overflow-x-auto">
          {sectors.map((s) => {
            const isSelected = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveTab(s.id);
                  onSelectSector(s.id);
                  soundManager.playUiClick();
                }}
                className={`flex items-center space-x-2 rounded-t-lg px-4 py-2.5 text-xs font-bold transition border-t-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-950 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    s.status === 'OPTIMAL'
                      ? 'bg-emerald-400'
                      : s.status === 'WARNING'
                      ? 'bg-amber-400'
                      : s.status === 'CRITICAL'
                      ? 'bg-rose-500 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                <span>{s.code}</span>
                <span className="hidden sm:inline font-sans">{isZh ? s.nameZh : s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tablet Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status banner */}
          {tuningStatus && (
            <div className="flex items-center space-x-3 rounded-lg border border-cyan-500/50 bg-cyan-950/60 p-3 text-xs text-cyan-200 animate-pulse">
              <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
              <span>{tuningStatus}</span>
            </div>
          )}

          {/* Machine Info & Rapid Dispatch Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-100">
                  {isZh ? sector.nameZh : sector.name}
                </span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-400">
                  {sector.code}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    sector.status === 'OPTIMAL'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : sector.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : sector.status === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {sector.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 font-sans">{sector.description}</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Wafer Bypass Toggle (merged from supervisor dispatch) */}
              <button
                onClick={() => {
                  soundManager.playUiClick();
                  onToggleBypass?.(sector.id);
                }}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-xs font-bold transition border ${
                  sector.bypassActive
                    ? 'bg-amber-600/30 border-amber-400 text-amber-300 shadow-md shadow-amber-600/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={isZh ? '繞過此機台以避免塞片' : 'Bypass this station to relieve upstream backlog'}
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>{sector.bypassActive ? (isZh ? '繞道中 (BYPASS ON)' : 'BYPASS ACTIVE') : (isZh ? '晶圓繞道' : 'Route Bypass')}</span>
              </button>

              <button
                onClick={handleTune}
                className="flex items-center space-x-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 active:scale-95 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{isZh ? '校準配方' : 'Calibrate'}</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playEmoHit();
                  onHitEmo(sector.id);
                }}
                className="flex items-center space-x-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 transition"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{isZh ? '拍下機台 EMO' : 'Hit EMO Button'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Process Parameter Tuning Section (Double-Edged Trade-offs) */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {isZh ? '即時製程參數動態調控 (雙面刃權衡機制)' : 'DYNAMIC PROCESS TUNING (DOUBLE-EDGED TRADEOFFS)'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {isZh ? '調高提升產出，過載將引發即時工安事故' : 'Push limits to maximize yield, overstressing triggers alarms'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Parameter 1: RF Power */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">RF Power (射頻功率)</span>
                  <span className="font-bold text-cyan-400">{sector.rfPowerWatts} W</span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="2400"
                  step="50"
                  value={sector.rfPowerWatts}
                  onChange={(e) => handleRfPowerChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="text-[10px] space-y-1">
                  <p className="text-emerald-400">
                    ▲ {isZh ? '正效益：蝕刻/沉積加速，產出 (Wafer/hr) 提升' : 'Gain: Faster rate, boosts wafer/hr'}
                  </p>
                  <p className="text-amber-400/90">
                    ▼ {isZh ? '工安代價：腔體過熱，>1800W 電弧/高壓擊穿' : 'Risk: Overheating, arcing & arc-flash >1800W'}
                  </p>
                </div>
              </div>

              {/* Parameter 2: Gas Flow */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">Gas Flow (特氣流量 SiH4/AsH3)</span>
                  <span className="font-bold text-amber-400">{sector.gasFlowSccm} sccm</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  step="5"
                  value={sector.gasFlowSccm}
                  onChange={(e) => handleGasFlowChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="text-[10px] space-y-1">
                  <p className="text-emerald-400">
                    ▲ {isZh ? '正效益：薄膜均勻度提高，良率 (Yield %) 上升' : 'Gain: Film uniformity, boosts Yield %'}
                  </p>
                  <p className="text-rose-400/90">
                    ▼ {isZh ? '工安代價：尾氣背壓飆升，Scrubber 負載過載' : 'Risk: Scrubber overload, toxic gas backflow'}
                  </p>
                </div>
              </div>

              {/* Parameter 3: Chamber Vacuum */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">Chamber Vacuum (腔體真空)</span>
                  <span className="font-bold text-indigo-400">
                    {sector.chamberVacuumTorr.toFixed(3)} Torr
                  </span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.08"
                  step="0.005"
                  value={sector.chamberVacuumTorr}
                  onChange={(e) => handleVacuumChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
                <div className="text-[10px] space-y-1">
                  <p className="text-emerald-400">
                    ▲ {isZh ? '正效益：超高真空減少 Defect Particle 微塵' : 'Gain: Drastically cuts defect particles'}
                  </p>
                  <p className="text-amber-400/90">
                    ▼ {isZh ? '工安代價：密封 O-ring 受損，失真空逆流灌入' : 'Risk: Seal stress, loss of vacuum back-diffusion'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Scrubber Load Indicator */}
            <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              scrubberOverload
                ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-4 w-4 ${scrubberOverload ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="font-bold">
                  {isZh ? '尾氣洗滌塔 Scrubber 負載率' : 'Exhaust Scrubber Load Rate'}: {Math.round(sector.scrubberLoadPct)}%
                </span>
                <span className="text-[11px] text-slate-400">
                  {scrubberOverload
                    ? (isZh ? '【警告】負載超標！可能觸發 Level 2 特氣回溢洩漏' : '[WARNING] Load critical! High risk of Level 2 toxic backflow')
                    : (isZh ? '(維持 <90% 確保排氣順暢)' : '(Maintain <90% for safe exhaust flow)')}
                </span>
              </div>
              <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    scrubberOverload ? 'bg-rose-500' : sector.scrubberLoadPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, sector.scrubberLoadPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase">{isZh ? '健康指數' : 'Health'}</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-100">{Math.round(sector.health)}%</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${sector.health}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase">{isZh ? '腔體溫度' : 'Chamber Temp'}</span>
                <Flame className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-100">
                {sector.temperatureC.toFixed(1)}°C
              </div>
              <div className="mt-2 text-[10px] text-slate-500">Nominal: 22.0°C - 350.0°C</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase">{isZh ? '真空壓力' : 'Chamber Press'}</span>
                <Gauge className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-100">
                {sector.pressureTorr < 0.01
                  ? sector.pressureTorr.toExponential(2)
                  : sector.pressureTorr.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">Torr</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">High-Vacuum Cryo Pump</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase">{isZh ? '微塵粒子' : 'Particles'}</span>
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-100">
                {sector.particleCountPPM.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">PPM</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">ISO Class 1 Max 10.0</div>
            </div>
          </div>

          {/* Sector Specific Advanced Physical Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isZh ? '機台第一線安全處置測試 (SEMI S2)' : 'FIRST-LINE PHYSICAL EHS ACTIONS (SEMI S2)'}
            </h4>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* N2 Purge */}
              <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Wind className="h-4 w-4" />
                    <span className="text-xs font-bold">{t.triggerN2Purge}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 font-sans">
                    {isZh
                      ? '向反應腔體吹入 500 sccm 高壓純氮氣，吹散殘存微粒與有毒蒸氣。'
                      : 'Purge chamber with 500 sccm ultra-pure N2 to sweep away volatile residue.'}
                  </p>
                </div>
                <button
                  onClick={handleN2Purge}
                  className="mt-3 w-full rounded bg-emerald-600/30 border border-emerald-500/50 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/50 transition"
                >
                  {isZh ? '執行氮氣吹掃' : 'Execute N2 Jet'}
                </button>
              </div>

              {/* Deluge Shower */}
              <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div>
                  <div className="flex items-center space-x-2 text-sky-400">
                    <Radio className="h-4 w-4" />
                    <span className="text-xs font-bold">{t.triggerShower}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 font-sans">
                    {isZh
                      ? '啟動緊急安全沖淋洗眼站測試 (每分鐘 75.7 公升大流量)。'
                      : 'Test emergency deluge shower & eyewash stanchion (75.7 L/min water delivery).'}
                  </p>
                </div>
                <button
                  onClick={handleDelugeShower}
                  className="mt-3 w-full rounded bg-sky-600/30 border border-sky-500/50 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-600/50 transition"
                >
                  {isZh ? '測試沖淋水幕' : 'Trigger Water Deluge'}
                </button>
              </div>

              {/* Arc Grounding Stick */}
              <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div>
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-bold">{t.triggerArcGrounding}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 font-sans">
                    {isZh
                      ? '使用 10kV 絕緣放電接地棒接觸高壓電極，確認殘存靜電荷歸零。'
                      : 'Apply 10kV insulated grounding stick to verify residual capacitance discharge.'}
                  </p>
                </div>
                <button
                  onClick={handleArcGrounding}
                  className="mt-3 w-full rounded bg-amber-600/30 border border-amber-500/50 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-600/50 transition"
                >
                  {isZh ? '驗電放電測試' : 'Verify Arc Grounding'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3 text-xs text-slate-400">
          <span>{isZh ? '按 ESC 或點擊右上角關閉' : 'Press ESC or Click Close to Exit'}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {isZh ? '收起平板' : 'Stow Tablet'}
          </button>
        </div>
      </div>
    </div>
  );
};
