import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle,
  CornerDownRight,
  Gauge,
  Radio,
  Share2,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { SectorId, SectorState } from '../types/game';

interface SupervisorDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorState[];
  onToggleBypass: (sectorId: SectorId) => void;
  flowStateSeconds: number;
  language: Language;
}

export const SupervisorDispatchModal: React.FC<SupervisorDispatchModalProps> = ({
  isOpen,
  onClose,
  sectors,
  onToggleBypass,
  flowStateSeconds,
  language,
}) => {
  const [isEvacuationBroadcastActive, setIsEvacuationBroadcastActive] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  // Pipeline order: Litho -> Ion Implant -> Etch/CVD -> CMP -> Furnace
  const pipelineOrder: SectorId[] = [
    'PHOTOLITHOGRAPHY',
    'ION_IMPLANTATION',
    'ETCH_CVD',
    'CMP_WET_BENCH',
    'DIFFUSION_FURNACE',
  ];

  const orderedSectors = pipelineOrder.map(
    (id) => sectors.find((s) => s.id === id) || sectors[0]
  );

  const handleEvacuate = () => {
    soundManager.startEmergencyAlarm();
    setIsEvacuationBroadcastActive(true);
    setBroadcastMessage(
      language === 'zh-TW'
        ? '已啟動全廠工安緊急疏散廣播！無塵室人員全面撤離至集結點 A / B。'
        : 'Plant-wide emergency evacuation broadcast issued! All personnel routing to Assembly Points A & B.'
    );
    setTimeout(() => {
      soundManager.stopEmergencyAlarm();
      setBroadcastMessage(null);
      setIsEvacuationBroadcastActive(false);
    }, 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-[92vh] max-h-[840px] w-full max-w-5xl flex-col rounded-2xl border-2 border-amber-500/50 bg-slate-950/95 shadow-2xl shadow-amber-950/70 overflow-hidden font-mono">
        {/* Supervisor Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-slate-900/90 px-6 py-3.5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {language === 'zh-TW' ? '值班組長產線調度中樞' : 'SHIFT SUPERVISOR DISPATCH & BUFFER BALANCING'}
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/40">
                  CMOS PIPELINE INTERLOCK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                {language === 'zh-TW'
                  ? '監控 5 大製程站點晶圓吞吐量、前製程回堵 (Backlog) 與後製程斷料 (Starvation)'
                  : 'Monitor 5-station wafer throughput, upstream backlog, downstream starvation, and bypass diversions'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-amber-300">
              <TrendingUp className="h-4 w-4" />
              <span>
                {language === 'zh-TW' ? '流暢共振時長：' : 'Flow State Streak: '}{' '}
                <strong className="text-emerald-400">{flowStateSeconds}s</strong>
              </span>
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

        {/* Evacuation Alert Banner */}
        {broadcastMessage && (
          <div className="flex items-center space-x-3 border-b border-rose-500/40 bg-rose-950/80 px-6 py-3 text-xs text-rose-200 animate-pulse">
            <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="font-bold">{broadcastMessage}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CMOS 5-Station Sequential Flow Visualizer */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  {language === 'zh-TW' ? '300mm 晶圓先進製程序列 (CMOS Process Flow)' : '300MM WAFER CMOS PROCESS SEQUENCE'}
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {language === 'zh-TW'
                    ? '微影曝光 → 離子植入 → 電漿蝕刻/沉積 → 化學機械研磨 → 高溫熱擴散'
                    : 'Photolithography → Ion Implantation → Plasma Etch/CVD → CMP Wet Bench → Thermal Diffusion'}
                </p>
              </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-5">
              {orderedSectors.map((s, idx) => {
                const isDown = s.status === 'CRITICAL' || s.status === 'SHUTDOWN';
                const hasBacklog = s.inputQueue > 40;
                const isStarved = s.inputQueue === 0 && idx > 0;

                return (
                  <div
                    key={s.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                      s.bypassActive
                        ? 'border-indigo-500/60 bg-indigo-950/30'
                        : isDown
                        ? 'border-rose-500/60 bg-rose-950/40 animate-pulse'
                        : hasBacklog
                        ? 'border-amber-500/60 bg-amber-950/30'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      {/* Bay Number & Code */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                          STAGE 0{idx + 1}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            s.bypassActive
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : isDown
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {s.bypassActive ? t.bypassActive : s.status}
                        </span>
                      </div>

                      <div className="mt-2 text-sm font-bold text-slate-100">
                        {language === 'zh-TW' ? s.nameZh : s.name}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-bold">{s.code}</div>

                      {/* Queue Metrics */}
                      <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-2 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>{language === 'zh-TW' ? '待入槽晶圓' : 'In-Queue'}:</span>
                          <span
                            className={`font-bold ${
                              hasBacklog ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          >
                            {s.inputQueue} pcs
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{language === 'zh-TW' ? '加工中' : 'Active'}:</span>
                          <span className="font-bold text-slate-200">{s.wafersInProcess} pcs</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{language === 'zh-TW' ? '出站緩衝' : 'Out-Buffer'}:</span>
                          <span className="font-bold text-slate-200">{s.outputQueue} pcs</span>
                        </div>
                      </div>

                      {/* Warnings */}
                      {hasBacklog && !s.bypassActive && (
                        <div className="mt-2 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300 border border-amber-500/30">
                          ⚠️ {language === 'zh-TW' ? '前製程堆積回堵！' : 'Upstream Backlog!'}
                        </div>
                      )}
                      {isStarved && (
                        <div className="mt-2 rounded bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300 border border-cyan-500/30">
                          ℹ️ {language === 'zh-TW' ? '前線缺料等待中' : 'Awaiting input'}
                        </div>
                      )}
                    </div>

                    {/* Bypass Switch Button */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => {
                          soundManager.playUiClick();
                          onToggleBypass(s.id);
                        }}
                        className={`w-full rounded py-1.5 text-center text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                          s.bypassActive
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <CornerDownRight className="h-3.5 w-3.5" />
                        <span>{s.bypassActive ? t.bypassActive : t.toggleBypass}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supervisor Incident & Line Control Commands */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Evacuation Command */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertOctagon className="h-5 w-5" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  {language === 'zh-TW' ? '全廠緊急疏散廣播控制' : 'PLANT-WIDE EMERGENCY EVACUATION BROADCAST'}
                </h4>
              </div>
              <p className="mt-2 text-xs text-slate-300 font-sans leading-relaxed">
                {language === 'zh-TW'
                  ? '當遭遇重大毒氣外洩 (如 Bay 105 砷化氫外洩或 Bay 102 矽甲烷自燃) 且無法在一線由設備工程師遏止時，值班組長有權發布全廠緊急疏散廣播，迫使無塵室全員撤出並同步關閉市政特氣主閥。'
                  : 'When catastrophic gas leaks (such as Bay 105 Arsine or Bay 102 Silane) cannot be contained at the tool level, the Shift Supervisor has sole authority to issue a plant-wide evacuation broadcast and isolate bulk city gas feeds.'}
              </p>

              <button
                onClick={handleEvacuate}
                disabled={isEvacuationBroadcastActive}
                className={`mt-4 flex w-full items-center justify-center space-x-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  isEvacuationBroadcastActive
                    ? 'bg-rose-900 text-rose-300 cursor-not-allowed'
                    : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95'
                }`}
              >
                <Radio className="h-4 w-4" />
                <span>
                  {isEvacuationBroadcastActive
                    ? t.evacuationActive
                    : language === 'zh-TW'
                    ? '廣播全廠即刻疏散 (SEMI S2)'
                    : 'Issue Emergency Evacuation Broadcast'}
                </span>
              </button>
            </div>

            {/* Line Balance Theory */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex items-center space-x-3 text-amber-400">
                <Boxes className="h-5 w-5" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  {language === 'zh-TW' ? '晶圓繞道與產能保護機制' : 'WAFER BYPASS ROUTING MECHANICS'}
                </h4>
              </div>
              <p className="mt-2 text-xs text-slate-300 font-sans leading-relaxed">
                {language === 'zh-TW'
                  ? '當某機台因工安事故或維修停擺時，開啟該機台的「繞道分流 (Bypass Active)」會讓 OHT 天車將晶圓暫存於天花板暫存架 (Stocker)，避免前製程堆積回堵至曝光機，也能維持後製程持續運轉，保護綜合良率。'
                  : 'Activating Wafer Bypass diverts OHT FOUP carriers to ceiling stocker buffers, preventing upstream Lithography freeze-up and feeding downstream Furnace lines while maintenance and hazard containment take place.'}
              </p>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                <span>{language === 'zh-TW' ? '當前回堵警戒站點：' : 'Active Bottlenecks:'}</span>
                <span className="font-bold text-amber-400">
                  {sectors.filter((s) => s.inputQueue > 40).length > 0
                    ? `${sectors.filter((s) => s.inputQueue > 40).length} Stations Alerted`
                    : 'None (Flow Balanced)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3 text-xs text-slate-400">
          <span>{language === 'zh-TW' ? '按 ESC 或點擊右上角關閉' : 'Press ESC or Click Close to Exit'}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {language === 'zh-TW' ? '關閉調度面板' : 'Close Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
};
