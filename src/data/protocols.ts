import { EhsFourPillars, HazardLevel, HazardSeverity, SectorId, TroubleshootingOption } from '../types/game';

export interface ProtocolChoice {
  id: string;
  label: string;
  labelZh: string;
  description: string;
  descZh: string;
  isCorrect: boolean;
  explanation: string;
  explanationZh: string;
  isFatalError?: boolean;
}

export interface HazardDefinition {
  typeId: string;
  level: HazardLevel;
  title: string;
  titleZh: string;
  defaultSector: SectorId;
  severity: HazardSeverity;
  timeLimitSec: number;
  description: string;
  descZh: string;
  regulatoryStandard: string;
  ehsPillars: EhsFourPillars;
  preAlarmConfig: {
    title: string;
    titleZh: string;
    whatIsHappening: string;
    whatIsHappeningZh: string;
    howToPrevent: string;
    howToPreventZh: string;
    consequenceIfIgnored: string;
    consequenceIfIgnoredZh: string;
    maintenanceButtonLabel: string;
    maintenanceButtonLabelZh: string;
    symptoms: string[];
    symptomsZh: string[];
    waferDefectPattern: string;
    waferDefectPatternZh: string;
    troubleshootingOptions: TroubleshootingOption[];
  };
  steps: {
    prompt: string;
    promptZh: string;
    choices: ProtocolChoice[];
  }[];
}

/**
 * Fisher-Yates shuffle algorithm to completely randomize choices order
 * so the correct choice is never fixed at position 0, preventing memorization.
 */
export function shuffleChoices<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const HAZARD_DEFINITIONS: HazardDefinition[] = [
  // ==========================================
  // 1. BAY 101: LEVEL 1 MECHANICAL / OHT LOTO
  // ==========================================
  {
    typeId: 'ROBOTIC_FOUP_PINCH',
    level: 'LEVEL_1_MECHANICAL',
    title: 'Automated Overhead Hoist Transport (OHT) Mechanical Pinch Incident',
    titleZh: '微影曝光區 (Bay 101) 空中無人天車 (OHT) 機械臂人員夾傷危機',
    defaultSector: 'PHOTOLITHOGRAPHY',
    severity: 'HIGH',
    timeLimitSec: 60,
    description:
      "An automated ceiling OHT wafer carrier robot descending onto the Photolithography load port has trapped a technician's arm against the docking nest. Audio alarms are screaming and the drive motor is stalling.",
    descZh:
      '微影機台裝載口上方，空中搬運天車(OHT)抓取晶圓盒(FOUP)下降時發生機械定位干涉，伺服驅動機械臂強行咬夾技術員前臂！驅動馬達持續過載尖叫，受害者面臨粉碎性骨折危機。',
    regulatoryStandard: 'OSHA 1910.147 (LOTO) / SEMI S8-0712',
    ehsPillars: {
      whatMayHappen:
        'High-speed OHT ceiling hoist belt slip or optical alignment drift causes the 48V servo gripper to jam during FOUP handoff, pinning personnel against the load port.',
      whatMayHappenZh:
        '空中無人搬運天車 (OHT) 升降皮帶張力偏移或光學對位飄移，導致 48V 伺服夾爪於裝載口交接晶圓盒時發生機械干涉並咬夾人員肢體。',
      howToPrevent:
        'Keep Litho RF/Throughput within safe limits (<1600W), verify light-curtain interlocks before approaching load ports, and diagnose OHT Optical Alignment when vibration warnings appear.',
      howToPreventZh:
        '維持曝光機功率與進料節拍於安全區間 (<1600W)，接近裝載口前確認光柵聯鎖正常，並於出現天車震動預警時立即前往現場診斷「光學對位校準」。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [⚡ HV / LOTO Gloves] first! 1. Slam the Load Port / OHT Rail EMO mushroom switch to cut servo power and lock brakes. 2. Apply personal LOTO padlock and use manual counterbalance crank to safely release pinch pressure.',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：先穿戴 ⚡ 絕緣防護手套！】1. 立即拍擊裝載口軌道旁專屬 EMO 急停按鈕切斷伺服電源並鎖死煞車；2. 執行 LOTO 個人安全掛鎖，並使用手動釋放搖柄平穩鬆開夾持力。',
      consequence:
        'Pulling a trapped worker or jogging software while energized causes compound arm fractures, crush syndrome, or amputation, plus $2.8M in scanner load-port and wafer lot damage.',
      consequenceZh:
        '若在未斷電上鎖狀態下強行拉扯傷患或以軟體點動，數百牛頓伺服扭力將導致開放性粉碎骨折甚至截肢，並造成微影裝載口與整批晶圓損毀 (損失約 $2.8M USD)。',
      estimatedLossMillionsUSD: 2.8,
      recommendedPPE: 'HV_GLOVES',
      ppeInstruction:
        'CRUCIAL STEP: Equip [⚡ HV / LOTO Gloves] before touching energized 48V servo cabinets or manual brake cranks!',
      ppeInstructionZh:
        '關鍵防護步驟：接觸 48V 伺服電控箱或手動煞車搖柄前，必須先穿戴【⚡ 絕緣/防夾手套】！',
    },
    preAlarmConfig: {
      title: 'Bay 101 OHT Hoist Vibration & Load Port Alignment Drift',
      titleZh: 'Bay 101 天車升降震動與裝載口光學對位偏移診斷',
      whatIsHappening:
        'OHT hoist cable tension is oscillating and the load port laser curtain reports a +3.2mm docking offset.',
      whatIsHappeningZh:
        '空中天車 (OHT) 吊索張力出現異常抖動，且微影機裝載口雷射對位感測器偵測到 +3.2mm 交接偏移。',
      howToPrevent:
        'Walk to Bay 101 (<5.5m), inspect the 3 sensor clues below, and select the correct Root-Cause Engineering Fix.',
      howToPreventZh:
        '請前往 Bay 101 現場 (<5.5m)，根據下方 3 項機台感測器線索，選擇正確的「工程故障排除方案」。',
      consequenceIfIgnored:
        'Escalates into a severe OHT Mechanical Pinch Incident trapping a technician at the load port!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，將惡化為「OHT 機械臂夾傷人員危機」，造成現場技術員受困與產線停擺！',
      maintenanceButtonLabel: 'Calibrate OHT Alignment & Purge',
      maintenanceButtonLabelZh: '現場校準 OHT 光學對位與穩壓',
      symptoms: [
        'OHT Z-Axis Belt Encoder Slip: +3.2mm offset on Load Port B',
        'Safety Light Curtain Interlock Flicker (Dirty Optical Lens)',
        'Wafer Transfer Vibration > 0.8G during FOUP Handoff',
      ],
      symptomsZh: [
        '天車 Z 軸皮帶編碼器滑差：Load Port B 交接偏移 +3.2mm',
        '裝載口安全光柵訊號閃爍（光學感測鏡面微粒附著）',
        '晶圓盒 (FOUP) 交接瞬間震動值超標 (> 0.8G)',
      ],
      waferDefectPattern: 'Wafer Edge Notch Scratch & Chuck Overlay Misalignment (+14nm)',
      waferDefectPatternZh: '晶圓邊緣缺口刮傷 & 曝光疊對偏移 (+14nm Overlay Error)',
      troubleshootingOptions: [
        {
          id: 'oht_recalibrate_encoder_clean_curtain',
          label: 'Pause Handoff, Re-Zero Z-Axis Optical Encoder & Wipe Light Curtain',
          labelZh: '暫停交接、歸零 Z 軸光學編碼器並清潔安全光柵鏡面',
          outcomeType: 'SOLVE',
          explanation:
            'Root cause fixed! Re-zeroing the optical encoder eliminates the 3.2mm docking offset and restores safe light-curtain protection.',
          explanationZh:
            '精準排除根因！歸零光學編碼器消除 +3.2mm 交接偏差，並恢復安全光柵聯鎖保護，挽救整批微影晶圓！',
          consequenceSummary: 'Prevented OHT Pinch Crisis (+300 PTS, +$1.7M Saved)',
          consequenceSummaryZh: '成功預防天車夾傷危機 (+300 PTS，挽救 $1.7M 產值)',
        },
        {
          id: 'oht_slow_down_conveyor_only',
          label: 'Reduce Wafer Chuck Rotation Speed by 40% Without Re-Aligning Hoist',
          labelZh: '僅將曝光機吸盤轉速調降 40%，不校準天車吊索偏移',
          outcomeType: 'PARTIAL',
          explanation:
            'Partial band-aid! Lowering chuck speed reduces wafer scratches slightly (-5% Yield loss), but the OHT hoist alignment is still drifting.',
          explanationZh:
            '治標不治本！調降轉速雖減緩震動但損失產能 (-5% 良率)，且天車對位偏差仍未徹底解決。',
          consequenceSummary: 'Partial Fix: Throughput dropped & 6 wafers scrapped (-$0.3M)',
          consequenceSummaryZh: '部分緩解：產能下降且報廢 6 片晶圓 (-$0.3M)',
        },
        {
          id: 'oht_bypass_interlock_boost_torque',
          label: 'Bypass Load Port Light Curtain & Boost Servo Torque to 150% to Force Docking',
          labelZh: '強制旁路(Bypass)安全光柵，並將天車伺服扭力調升至 150% 硬壓入座',
          outcomeType: 'ESCALATE',
          explanation:
            'Catastrophic troubleshooting error! Bypassing the safety light curtain and boosting servo torque caused the misaligned OHT gripper to slam down and trap a technician!',
          explanationZh:
            '嚴重工程誤判！旁路安全光柵並提高馬達扭力，導致偏移的天車夾爪強行下壓，當場夾住現場技術員手臂！',
          consequenceSummary: 'Triggered OHT Mechanical Pinch Emergency!',
          consequenceSummaryZh: '誤判引發「OHT 機械臂人員夾傷緊急危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Mechanical Energy Isolation & Motor Brake (Stage 1):',
        promptZh: '第一階段：動力能源即時切斷與馬達煞車',
        choices: [
          {
            id: 'punch_track_emo',
            label: 'Punch OHT Rail EMO (Emergency Machine Off) Switch',
            labelZh: '拍擊裝載口軌道旁專屬 EMO 急停斷電開關',
            description: 'Immediately kill servo power and mechanical drive clutch on load port and overhead rail.',
            descZh: '瞬間切斷伺服馬達驅動迴路，鎖死機械常閉式安全剎車。',
            isCorrect: true,
            explanation:
              'Correct! Slams emergency mechanical brakes and de-energizes the 48V servo drive instantly.',
            explanationZh:
              '處置正確！迅速釋放高扭力過載，常閉機械剎車立即制動，避免伺服馬達持續下壓造成肢體截斷。',
          },
          {
            id: 'pull_operator_free',
            label: 'Yank Operator by Shoulders to Pull Out',
            labelZh: '徒手用力抓住受傷人員肩膀往外死命拉扯',
            description: 'Use physical force to pull worker free while robot motor is energized.',
            descZh: '在機械手臂通電咬死狀態下以人力強行拖曳傷患。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Severe crush injury! Pulling against high-torque stalled servomotors causes traumatic compound fractures.',
            explanationZh:
              '重大二度傷害！伺服驅動具數百牛頓夾持力，強行拉扯將當場造成皮膚撕脫與開放性骨折！',
          },
          {
            id: 'try_remote_software_jog',
            label: 'Jog Robot Axis from Maintenance Touchscreen',
            labelZh: '在電腦螢幕上點擊點動 (Jog) 軸向試圖反轉伺服',
            description: 'Attempt software jog movement while victim is pinned.',
            descZh: '嘗試以軟體手動點動反轉機械臂。',
            isCorrect: false,
            explanation:
              'Dangerous protocol violation! Software jogging can reverse into wrong direction or hit software limits.',
            explanationZh:
              '嚴重違規！受困情境下軟體點動方向判定易出錯，可能反向加壓造成二度重創！',
          },
        ],
      },
      {
        prompt: 'Secondary Energy Discharge & Lockout/Tagout (Stage 2):',
        promptZh: '第二階段：殘餘能量釋放與掛牌上鎖 (LOTO)',
        choices: [
          {
            id: 'engage_loto_manual_crank',
            label: 'Affix LOTO Lockout Clasp & Turn Manual Counterbalance Brake Release',
            labelZh: '執行 LOTO 安全掛鎖，使用手動釋放搖柄緩慢鬆弛夾持壓力',
            description:
              'Lock out main breaker with physical padlock; use mechanical release lever to ease clamping pressure.',
            descZh: '於控制箱掛上個人安全上鎖掛牌，使用手動機械釋放桿平穩洩壓。',
            isCorrect: true,
            explanation:
              'Correct! Adheres to OSHA 1910.147 zero energy state rule, safely relieving pinch pressure without sudden drops.',
            explanationZh:
              '符合 OSHA 1910.147 零能量準則！安全洩除機械重力位能，且杜絕他人誤送電的可能。',
          },
          {
            id: 'turn_power_back_on',
            label: 'Cycle Main Circuit Breaker to Reset Error',
            labelZh: '重新開啟主電源開關試圖復歸伺服警報',
            description: 'Re-energize electrical cabinet to reboot robotic controller.',
            descZh: '重送電源使手臂自動執行回原點 (Home) 循環。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Deadly error! Re-energizing with victim trapped re-engages maximum torque homing cycle.',
            explanationZh:
              '致命行為！在人員受困時重新通電，機器人將啟動全扭力原點復歸，造成二次毀滅性碾壓！',
          },
          {
            id: 'pry_with_crowbar',
            label: 'Insert Metal Crowbar into Energized Gripper Jaws',
            labelZh: '拿金屬撬棒直接插入未上鎖的機械夾爪縫隙硬撬',
            description: 'Use metal lever without applying LOTO padlock first.',
            descZh: '未執行 LOTO 掛鎖即以金屬工具硬撬夾爪。',
            isCorrect: false,
            explanation:
              'Unsafe violation! Without LOTO lockout, sudden brake slip or power restoration will launch the metal bar violently.',
            explanationZh:
              '嚴重違規！未掛鎖狀態下硬撬可能導致配重滑脫或誤復電，造成夾爪彈飛傷人與晶圓盒破裂！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 2. BAY 102: LEVEL 3 PYROPHORIC SILANE FIRE
  // ==========================================
  {
    typeId: 'SILANE_GAS_LEAK',
    level: 'LEVEL_3_FATAL_CRISIS',
    title: 'Pyrophoric Silane (SiH4) Spontaneous Fire & Explosion',
    titleZh: '薄膜沉積 (Bay 102) 矽甲烷 (SiH4) 自燃性火災與爆炸危機',
    defaultSector: 'ETCH_CVD',
    severity: 'CATASTROPHIC',
    timeLimitSec: 60,
    description:
      'TGMS sensor at Plasma CVD Chamber B detects Silane (SiH4) at 5 PPM (TLV is 0.5 PPM). Silane is pyrophoric and ignites spontaneously in air, triggering flashover fireballs and high-pressure detonation.',
    descZh:
      'CVD沉積腔體B側之毒氣監控系統 (TGMS) 偵測到矽甲烷(SiH4)濃度飆升至 5 PPM (法定容許值僅0.5 PPM)。矽甲烷為極危險自燃性氣體，接觸空氣瞬間即發生自燃並引爆衝擊波！',
    regulatoryStandard: 'SEMI S2-0712 §13 / NFPA 318',
    ehsPillars: {
      whatMayHappen:
        'Excessive Silane (SiH4) gas flow or chamber thermal stress degrades VMB flange seals. Because SiH4 is pyrophoric, any leak into air ignites spontaneously below 54°C.',
      whatMayHappenZh:
        '過高的矽甲烷 (SiH4) 氣體流量或腔體熱應力導致閥箱法蘭密封劣化。矽甲烷屬自燃性氣體 (Pyrophoric)，一旦接觸空氣無需火源即瞬間自燃甚至引發氣爆！',
      howToPrevent:
        'Keep Bay 102 Local Scrubber load below 85% and Chamber Temp below 90°C. When exhaust backpressure drifts up, diagnose the VMB manifold and run an On-Site N2 Line Purge.',
      howToPreventZh:
        '維持 Bay 102 洗滌塔負載低於 85% 且腔溫低於 90°C。當尾氣背壓出現琥珀色預警時，立即前往機台診斷並執行「N2 管路氮氣吹驅」。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [😷 SCBA Respirator] before entering smoke/gas zone! 1. Slam the EMO & Gas Abort button to spring-close pneumatic cylinder valves in <200ms (NEVER spray water on burning Silane!). 2. Flood manifold with Ultra-Pure N2 to sweep residual gas into the thermal burn-box scrubber.',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：進入毒煙區前必先穿戴 😷 SCBA 正壓呼吸器！】1. 立即拍擊 EMO 與 Gas Abort 氣體切斷閥，於 200ms 內鎖死氣源（絕對不可對矽甲烷火焰噴水！）；2. 啟動超高純度氮氣 (N2) 強制吹驅，將殘氣導向燃燒水洗塔熱解。',
      consequence:
        'Opening a chamber or spraying water on burning Silane produces explosive hydrogen gas and a supersonic shockwave capable of destroying the CVD bay ($6.5M loss) and causing fatal blast trauma.',
      consequenceZh:
        '若貿然開蓋或以水噴灑矽甲烷火焰，水與矽甲烷反應將釋放大量氫氣並引爆超音速蒸氣衝擊波，炸毀整座 CVD 機台 (損失逾 $6.5M USD) 並造成人員致命燒傷！',
      estimatedLossMillionsUSD: 6.5,
      recommendedPPE: 'SCBA',
      ppeInstruction:
        'CRUCIAL STEP: Equip [😷 SCBA Respirator] before approaching Bay 102! Burning Silane releases toxic silicon dioxide fumes & pyrophoric gas pockets!',
      ppeInstructionZh:
        '關鍵防護步驟：接近 Bay 102 前必須先穿戴【😷 SCBA 自給式呼吸器】！矽甲烷燃燒會釋放濃烈二氧化矽毒煙與閃燃氣團！',
    },
    preAlarmConfig: {
      title: 'Bay 102 CVD Exhaust Backpressure & SiH4 Flange Thermal Drift',
      titleZh: 'Bay 102 CVD 尾氣背壓升高與矽甲烷法蘭溫升故障診斷',
      whatIsHappening:
        'Local scrubber load is climbing past 86% and micro-pressure fluctuations are detected on the SiH4 VMB delivery manifold.',
      whatIsHappeningZh:
        '尾氣洗滌塔負載突破 86%，且矽甲烷 (SiH4) 氣體閥箱管路出現微壓波動與法蘭溫升。',
      howToPrevent:
        'Walk to Bay 102 (<5.5m), review the chamber diagnostic telemetry, and select the right engineering fix.',
      howToPreventZh:
        '請前往 Bay 102 現場 (<5.5m)，檢視下方腔體感測器數據，選擇正確的工程排除方案。',
      consequenceIfIgnored:
        'Pyrophoric Silane (SiH4) will breach the heated flange seal and ignite a spontaneous jet fire!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，高壓矽甲烷將衝破法蘭密封，接觸空氣瞬間引發自燃噴射大火！',
      maintenanceButtonLabel: 'N2 Manifold Purge & Abatement Check',
      maintenanceButtonLabelZh: '現場執行 N2 管路吹驅與洗滌塔降載',
      symptoms: [
        'Foreline Exhaust Backpressure: 14.8 Torr ↑ (SiO2 Powder Accumulation)',
        'VMB Silane Mass Flow Controller (MFC) Pressure Ripple ±8%',
        'Chamber O-Ring Flange Temperature: 94°C (Approaching Seal Limit)',
      ],
      symptomsZh: [
        '前級排氣管背壓飆升：14.8 Torr ↑（管壁二氧化矽粉塵沉積阻塞）',
        '閥箱 (VMB) 矽甲烷質量流量計 (MFC) 壓力波紋達 ±8%',
        '腔體法蘭密封圈溫度：94°C（逼近耐熱極限）',
      ],
      waferDefectPattern: 'Center-to-Edge Nitride Film Thickness Bullseye & Particle Flakes',
      waferDefectPatternZh: '晶圓同心圓膜厚不均 & 二氧化矽微粒剝落污染',
      troubleshootingOptions: [
        {
          id: 'cvd_n2_ballast_sweep_throttle_sih4',
          label: 'Inject Heated N2 Foreline Ballast Sweep & Throttle SiH4 MFC to 95 sccm',
          labelZh: '注入高純度 N2 前級管路吹掃氣流，並將 SiH4 流量節流至 95 sccm',
          outcomeType: 'SOLVE',
          explanation:
            'Root cause resolved! N2 ballast sweep clears SiO2 powder buildup in the exhaust line, dropping backpressure and flange temperature immediately.',
          explanationZh:
            '成功排除根因！N2 吹掃氣流清除排氣管內的二氧化矽粉塵堵塞，背壓與法蘭溫度立即恢復安全值！',
          consequenceSummary: 'Prevented Silane Fire (+300 PTS, +$3.9M Saved)',
          consequenceSummaryZh: '成功預防矽甲烷自燃大火 (+300 PTS，挽救 $3.9M 產值)',
        },
        {
          id: 'cvd_pause_rf_only',
          label: 'Pause RF Plasma Ignition for 10s Without Purging Silane Line',
          labelZh: '僅暫停 RF 電漿點火 10 秒，不吹掃殘留矽甲烷管路',
          outcomeType: 'PARTIAL',
          explanation:
            'Incomplete fix! Pausing RF cools the chamber slightly, but un-reacted Silane gas remains pressurized in the clogged foreline (-6% Yield).',
          explanationZh:
            '治標不治本！暫停電漿雖略微降溫，但未反應的矽甲烷仍滯留於阻塞排氣管內，造成膜厚異常 (-6% 良率)。',
          consequenceSummary: 'Partial Fix: Unstable film thickness (-$0.5M)',
          consequenceSummaryZh: '部分緩解：晶圓膜厚不均報廢 (-$0.5M)',
        },
        {
          id: 'cvd_open_foreline_clamp_under_pressure',
          label: 'Loosen KF-40 Foreline Vacuum Clamp to Bleed Off Excess Backpressure into Room',
          labelZh: '直接鬆開 KF-40 排氣管快拆夾具，將過高背壓排入無塵室洩壓',
          outcomeType: 'ESCALATE',
          explanation:
            'Disastrous mistake! Loosening a Silane foreline clamp exposes pyrophoric SiH4 gas directly to room air, causing an instant spontaneous jet fire!',
          explanationZh:
            '致命工程誤判！鬆開含有矽甲烷的排氣管夾具，使自燃性 SiH4 接觸空氣瞬間引爆噴射火球！',
          consequenceSummary: 'Triggered Pyrophoric Silane Fire & Explosion!',
          consequenceSummaryZh: '誤判引發「矽甲烷 (SiH4) 自燃大火與爆炸危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Immediate EMO Button Slam & Gas Abort (Stage 1):',
        promptZh: '第一階段：拍擊 EMO 緊急停機與特氣切斷 (Gas Abort)',
        choices: [
          {
            id: 'hit_emo_gas_abort',
            label: 'Strike Emergency Machine Off (EMO) & Gas Abort Button',
            labelZh: '拍擊機台旁 EMO 緊急停機按鈕與氣體切斷閥 (Gas Abort)',
            description:
              'Trip local EMO mushroom button to slam pneumatically closed the cylinder valve and gas manifold.',
            descZh: '擊發 EMO 紅色蘑菇頭急停開關，彈簧氣動氣閥於200毫秒內全數強力緊閉。',
            isCorrect: true,
            explanation:
              'Correct! EMO instantaneously cuts pneumatic supply pressure, spring-closing the hazardous production gas valve within 200 milliseconds.',
            explanationZh:
              '正確！EMO瞬間釋放氣動氣源，使特殊氣體閥箱(VMB)之安全彈簧閥於200ms內機械鎖死，阻斷供氣。',
          },
          {
            id: 'open_chamber_inspect',
            label: 'Open Chamber Lid to Inspect Fitting Leak',
            labelZh: '扳開真空腔體外蓋檢視管接頭洩漏點',
            description: 'Manually unclamp CVD reactor flange to tighten fitting.',
            descZh: '徒手解開 CVD 反應室法蘭管件試圖鎖緊。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Explosion! Introducing atmospheric oxygen into pure silane gas triggers immediate spontaneous detonation.',
            explanationZh:
              '劇烈爆炸！將大氣氧氣直接引入高濃度矽甲烷管路，將觸發超音速閃燃爆轟，當場炸毀機台！',
          },
          {
            id: 'use_water_extinguisher',
            label: 'Spray Water Extinguisher on Burning Gas Flange',
            labelZh: '使用無塵室消火栓高壓水龍帶直接噴射著火法蘭',
            description: 'Direct high-pressure water stream at silane flame.',
            descZh: '用水直接噴灑矽甲烷燃燒源。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Violent steam explosion! Water reacts violently with burning silane, generating hydrogen gas and secondary blast wave.',
            explanationZh:
              '致命毀滅！水與高溫矽甲烷反應將產生氫氣並引發劇烈蒸氣爆炸，造成人員當場傷亡！',
          },
        ],
      },
      {
        prompt: 'High-Pressure N2 Sweep & Scrubber Thermal Abatement (Stage 2):',
        promptZh: '第二階段：超高純氮氣高壓吹驅與尾氣燃燒洗滌',
        choices: [
          {
            id: 'initiate_nitrogen_purge',
            label: 'Initiate High-Pressure Ultra-Pure N2 Gas Purge to Scrubber',
            labelZh: '啟動超高純氮氣 (N2) 管路強制吹驅，將氣體導向燃燒水洗塔',
            description:
              'Flood gas line with inert Nitrogen purge gas to sweep residual silane directly into thermal wet abatement scrubber.',
            descZh: '以惰性氮氣稀釋並將殘餘矽甲烷推送至尾氣處理機(Local Scrubber)完全高溫裂解。',
            isCorrect: true,
            explanation:
              'Correct! Inert N2 displaces pyrophoric gas below Lower Explosive Limit (LEL) safely into burning water scrubber.',
            explanationZh:
              '完全合規！惰性氮氣吹驅使自燃性氣體濃度降至爆炸下限(LEL)以下，並完全裂解無害化。',
          },
          {
            id: 'vent_to_roof_exhaust',
            label: 'Bypass Scrubber to Standard Roof Vent',
            labelZh: '手動跳過尾氣處理機，直接將氣體排至廠房屋頂一般排氣口',
            description: 'Vent gas directly to outdoor atmosphere to clear bay faster.',
            descZh: '繞過洗滌設備直接排向戶外大氣。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Environmental disaster & roof explosion! Silane must pass through high-temperature decomposition scrubber first.',
            explanationZh:
              '嚴重違規！未經燃燒洗滌之矽甲烷排至大氣將在排氣管出口自燃引爆，觸犯重大環保法規！',
          },
          {
            id: 'fan_smoke_into_aisle',
            label: 'Prop Open Cleanroom Bay Doors to Disperse Smoke into Main Corridor',
            labelZh: '打開分區氣密門將濃煙扇向中央主走道稀釋',
            description: 'Ventilate smoke into adjacent lithography and furnace bays.',
            descZh: '將燃燒二氧化矽微粒與殘氣排入無塵室主通道。',
            isCorrect: false,
            explanation:
              'Severe contamination! Dispersing silica combustion smoke ruins Class 100 laminar airflow across all neighboring bays.',
            explanationZh:
              '嚴重錯誤！矽甲烷燃燒產生的二氧化矽粉塵與毒氣若擴散至主走道，將污染全廠無塵室並危害鄰近分區人員！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 3. BAY 103: LEVEL 2 HF ACID RUPTURE
  // ==========================================
  {
    typeId: 'HF_ACID_SPILL',
    level: 'LEVEL_2_CHEMICAL_LEAK',
    title: 'Hydrofluoric Acid (HF) Line Rupture & Skin Exposure',
    titleZh: '化學清洗機 (Bay 103) 氫氟酸 (HF) 輸送管破裂與人員皮膚接觸危害',
    defaultSector: 'CMP_WET_BENCH',
    severity: 'CATASTROPHIC',
    timeLimitSec: 60,
    description:
      'A pressurized Hydrofluoric Acid (49% HF) delivery manifold has ruptured during wafer etch bath circulation. An operator is contaminated on forearm and cleanroom bunny suit. HF penetrates deep into bone tissue without immediate burn sensation.',
    descZh:
      '晶圓酸洗蝕刻循環中，高壓49%氫氟酸(HF)管路接頭破裂噴濺！一名操作員前臂及無塵衣遭酸液浸潤。氫氟酸具強烈滲透性，無即時燒灼感卻會侵蝕深層骨骼神經，引發致命性低血鈣症。',
    regulatoryStandard: 'OSHA 1910.1200 / SEMI S2-0712 §15.2',
    ehsPillars: {
      whatMayHappen:
        'High acid recirculation pressure or PTFE manifold fatigue causes 49% Hydrofluoric Acid (HF) to spray out of the wet bench. Fluoride ions rapidly penetrate intact skin and bind blood calcium.',
      whatMayHappenZh:
        '酸洗槽循環幫浦壓力過高或鐵氟龍管路疲勞，導致 49% 氫氟酸 (HF) 噴濺。氟離子會無痛穿透皮膚直達骨骼並結合血液鈣離子（俗稱化骨水）。',
      howToPrevent:
        'Wear Acid Apron/Shield PPE when operating Bay 103, avoid excessive chemical flow/temperature, and relieve wet-bench pump pressure when clogged filter warnings appear.',
      howToPreventZh:
        '於 Bay 103 作業時穿戴防酸圍裙與面罩，避免酸液流量與溫度過載，並於濾心阻塞壓力預警時立即前往現場切換旁路洩壓。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [🧤 Acid Chemical Suit] before approaching the HF spill! 1. Pull the Emergency Deluge Shower immediately (flush >=5 min while stripping contaminated bunny suit). 2. Massage 2.5% Calcium Gluconate antidote gel onto skin. 3. Contain spill with HF neutralizing boom and full negative exhaust.',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：接近氫氟酸溢流區前必先穿戴 🧤 防酸化學防護服！】1. 立即拉下緊急沖淋拉桿大量沖水並脫除受污無塵衣；2. 塗抹並按摩 2.5% 葡萄糖酸鈣 (Calcium Gluconate) 解毒軟膏；3. 以抗酸吸液棉圍堵並開啟全負壓抽氣。',
      consequence:
        'Wiping with dry cloth, using regular burn cream, or flushing HF into the sub-fab floor causes fatal systemic hypocalcemia (cardiac arrest) and facility-wide acid vapor contamination ($3.6M loss).',
      consequenceZh:
        '若以乾布擦拭、塗抹一般燙傷膏或將酸液沖入高架地板孔洞，氟離子將引發致命性低血鈣心臟驟停，並污染整座下夾層空調系統 (損失約 $3.6M USD)。',
      estimatedLossMillionsUSD: 3.6,
      recommendedPPE: 'ACID_SUIT',
      ppeInstruction:
        'CRUCIAL STEP: Equip [🧤 Acid Chemical Suit] before entering Bay 103! 49% HF mist & liquid penetrates standard cleanroom suits and causes fatal bone/calcium necrosis!',
      ppeInstructionZh:
        '關鍵防護步驟：進入 Bay 103 處置前必須先穿戴【🧤 防酸化學防護服】！49% 氫氟酸會穿透一般無塵衣造成致命低血鈣症！',
    },
    preAlarmConfig: {
      title: 'Bay 103 Wet Bench PTFE Acid Manifold Pressure Spike',
      titleZh: 'Bay 103 酸洗槽氫氟酸 (HF) 輸送管路壓差異常故障診斷',
      whatIsHappening:
        'Recirculation pump pressure on the 49% HF etch bath is surging to 4.2 Bar and micro-droplets are forming at the PTFE union.',
      whatIsHappeningZh:
        '49% 氫氟酸蝕刻循環幫浦背壓飆升至 4.2 Bar，鐵氟龍閥門接頭處開始出現微細酸霧滲漏跡象。',
      howToPrevent:
        'Walk to Bay 103 (<5.5m), inspect the wet bench pressure & filter telemetry, and choose the right troubleshooting action.',
      howToPreventZh:
        '請前往 Bay 103 現場 (<5.5m)，根據酸洗槽壓差與濾心感測數據，選擇正確的工程排除方案。',
      consequenceIfIgnored:
        'The pressurized 49% HF manifold will rupture, spraying corrosive acid onto nearby personnel and the cleanroom floor!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，高壓氫氟酸管路將爆裂噴濺，造成現場人員嚴重化學灼傷與無塵室酸液溢流！',
      maintenanceButtonLabel: 'Relieve HF Manifold Pressure & Seal',
      maintenanceButtonLabelZh: '現場洩除 HF 酸槽管路壓力並切換濾心',
      symptoms: [
        'Inline 0.1µm PTFE Filter Differential Pressure: +2.8 Bar (Clogged by Silica Gel)',
        'Magnetic-Drive Acid Pump Discharge Pressure: 4.2 Bar (Redline: 4.5 Bar)',
        'Bath Conductivity & Etch Rate Drifting Low (-18% Oxide Removal)',
      ],
      symptomsZh: [
        '管路 0.1µm 鐵氟龍濾心前後壓差：+2.8 Bar（矽膠結晶阻塞）',
        '磁力驅動酸液幫浦出口壓力：4.2 Bar（逼近 4.5 Bar 爆管紅線）',
        '酸洗槽導電度與氧化層蝕刻率下降 (-18%)',
      ],
      waferDefectPattern: 'Post-CMP Oxide Residue Rings & HF Micro-Pitting on Wafer Edge',
      waferDefectPatternZh: '晶圓表面氧化層殘留環 & 邊緣微蝕刻坑洞 (Micro-Pitting)',
      troubleshootingOptions: [
        {
          id: 'hf_switch_duplex_filter_depressurize',
          label: 'Switch Manifold to Standby Duplex Filter B & Bleed Pump Pressure to Overflow Tank',
          labelZh: '將管路切換至備用雙聯濾心 B，並開啟安全溢流閥洩除幫浦背壓',
          outcomeType: 'SOLVE',
          explanation:
            'Textbook wet-bench troubleshooting! Switching to the clean duplex filter immediately drops manifold pressure from 4.2 Bar to 1.4 Bar and restores uniform etch rates.',
          explanationZh:
            '標準化學機台排障！切換至乾淨的備用濾心瞬間將管路壓力由 4.2 Bar 降至 1.4 Bar，徹底避免爆管危機！',
          consequenceSummary: 'Prevented HF Acid Rupture (+300 PTS, +$2.2M Saved)',
          consequenceSummaryZh: '成功預防氫氟酸爆管危機 (+300 PTS，挽救 $2.2M 產值)',
        },
        {
          id: 'hf_dilute_bath_with_di_water',
          label: 'Dump 20 Liters of DI Water into Etch Bath Without Relieving Filter Line Pressure',
          labelZh: '直接往酸洗槽注入 20 公升超純水稀釋，不處理濾心管路阻塞',
          outcomeType: 'PARTIAL',
          explanation:
            'Wrong root cause! Diluting the bath ruins the 49% HF recipe concentration (scrapping 8 wafers), while the clogged filter line remains dangerously pressurized.',
          explanationZh:
            '頭痛醫腳！注水稀釋破壞了酸液濃度配比（導致 8 片晶圓蝕刻不全報廢），且濾心管路高壓依然存在。',
          consequenceSummary: 'Partial Fix: Recipe concentration ruined (-$0.4M)',
          consequenceSummaryZh: '部分緩解：酸液濃度失準導致晶圓報廢 (-$0.4M)',
        },
        {
          id: 'hf_boost_pump_rpm_to_clear_clog',
          label: 'Increase Acid Pump RPM to 120% to Force Acid Through the Clogged Filter',
          labelZh: '將酸液幫浦轉速調高至 120%，試圖以高壓強行沖通阻塞濾心',
          outcomeType: 'ESCALATE',
          explanation:
            'Catastrophic mistake! Spiking pump pressure against a clogged PTFE filter ruptured the valve union, spraying 49% Hydrofluoric Acid across the bay!',
          explanationZh:
            '致命工程誤判！對阻塞管路強行加壓導致鐵氟龍接頭當場爆裂，高濃度 49% 氫氟酸噴濺而出！',
          consequenceSummary: 'Triggered 49% HF Acid Line Rupture & Exposure!',
          consequenceSummaryZh: '誤判引發「氫氟酸 (HF) 管路爆裂與人員噴濺危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Immediate Operator Rescue & Decontamination (Stage 1):',
        promptZh: '第一階段：人員緊急搶救與脫除污染衣物',
        choices: [
          {
            id: 'emergency_shower_strip',
            label: 'Activate Emergency Shower & Strip Bunny Suit',
            labelZh: '拉下緊急沖淋拉桿，並立即脫除受污染無塵衣',
            description:
              'Direct victim under deluge shower immediately; strip contaminated PPE under flowing water for 5 minutes minimum.',
            descZh:
              '迅速引導傷患至緊急沖淋洗眼器下方，持續沖水至少5分鐘，並在流水中褪去遭酸液浸透之防護衣物。',
            isCorrect: true,
            explanation:
              'Correct! Rapid dilution and physical removal of HF-saturated PPE prevents systemic calcium depletion and acute cardiac arrest.',
            explanationZh:
              '處置完全正確！大量清水即時稀釋並脫除衣物，能阻絕高濃度HF持續透過真皮吸收，防止心臟驟停。',
          },
          {
            id: 'wipe_with_cloth',
            label: 'Wipe Area with Cleanroom Dry Wipes',
            labelZh: '使用無塵專用擦拭紙先擦乾手臂表皮',
            description: 'Pat dry the contaminated suit before moving victim.',
            descZh: '試圖在移動人員前先以乾布吸乾表面酸液。',
            isCorrect: false,
            explanation:
              'Fatal delay! Dry wiping spreads concentrated HF across larger skin surfaces and delays urgent water dilution.',
            explanationZh:
              '嚴重錯誤！乾布擦拭會將高濃度氫氟酸擴散至更大皮表區域，並延誤最關鍵的大量清水沖洗時間！',
          },
          {
            id: 'walk_to_medical_office',
            label: 'Escort Victim Walking to Outer Medical Clinic',
            labelZh: '直接攙扶傷患徒步前往廠區外圍醫務室',
            description: 'Have operator walk through gowning airlock to main health office.',
            descZh: '穿過氣閘室前往主廠區健康中心尋求協助。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Catastrophic violation! HF causes rapid systemic hypocalcemia. Walking spreads contamination through airlocks and wastes critical seconds.',
            explanationZh:
              '致命違規！氫氟酸吸收迅速，長途走動會加快血液循環誘發心律不整，更會將強酸劇毒污染擴散至整座氣閘與走道！',
          },
        ],
      },
      {
        prompt: 'Chemical Neutralization & Medical Antidote (Stage 2):',
        promptZh: '第二階段：化學中和與醫療專用解毒劑塗抹',
        choices: [
          {
            id: 'apply_calcium_gluconate',
            label: 'Apply 2.5% Calcium Gluconate Gel Liberally',
            labelZh: '大量塗抹並按摩 2.5% 葡萄糖酸鈣解毒軟膏',
            description:
              'Massage calcium gluconate antidote gel continuously using nitrile gloves into affected skin until pain subsides.',
            descZh: '穿戴抗化手套，將專用葡萄糖酸鈣凝膠均勻且持續按摩塗抹於患部，直至劇痛緩解。',
            isCorrect: true,
            explanation:
              'Correct! Free calcium ions bind the deadly fluoride ions, precipitating insoluble CaF2 and halting bone/nerve necrosis.',
            explanationZh:
              '標準法規處置！解毒劑游離鈣離子與劇毒氟離子結合生成不溶性氟化鈣(CaF2)，即時終止深層骨骼與神經壞死。',
          },
          {
            id: 'apply_aloe_vera',
            label: 'Apply Standard Burn Ointment / Aloe Vera',
            labelZh: '塗抹一般消炎燙傷膏或蘆薈凝膠',
            description: 'Use first-aid cabinet antiseptic burn cream.',
            descZh: '使用普通急救箱內的殺菌燙傷藥膏。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Fatal mistake! Standard burn ointments do not neutralize fluoride ions. HF will continue dissolving deep bone structures.',
            explanationZh:
              '致命疏失！一般燙傷藥膏完全無法中和氟離子，氟離子將持續侵蝕骨髓，數小時內導致截肢或器官衰竭！',
          },
          {
            id: 'pour_sodium_hydroxide_on_skin',
            label: 'Pour Strong Alkaline NaOH Developer Directly onto Victim Arm',
            labelZh: '直接拿強鹼顯影液澆淋傷患手臂試圖酸鹼中和',
            description: 'Attempt direct chemical neutralization on skin using strong base.',
            descZh: '在人體皮膚上直接倒強鹼進行劇烈酸鹼中和反應。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Severe exothermic chemical burn! Pouring strong base onto acid-exposed skin generates intense heat and deep tissue destruction.',
            explanationZh:
              '致命錯誤！在皮膚上直接倒入強鹼會產生劇烈放熱反應，造成雙重化學灼傷與組織壞死！',
          },
        ],
      },
      {
        prompt: 'Cleanroom Environmental Containment (Stage 3):',
        promptZh: '第三階段：無塵室廠區環境危害抑制與氣流隔離',
        choices: [
          {
            id: 'deploy_hf_boom_evacuate',
            label: 'Deploy HF Neutralizing Boom & Trip Bay Exhaust Damper',
            labelZh: '佈放化學抗酸吸附棉條，切換機台抽氣風門為負壓全排',
            description:
              'Contain spill perimeter with polypropylene absorbent, verify scrubbed exhaust pulls 100% negative draft.',
            descZh: '於溢流外圍圍堵專用吸液棉，確認洗滌塔排氣風門全開以維持負壓，防止酸氣外溢。',
            isCorrect: true,
            explanation:
              'Correct! Isolates toxic acid fumes from cleanroom recirculating air handlers (AHUs) and contains floor runoff.',
            explanationZh:
              '卓越處置！徹底隔離酸性揮發氣體，防止有害氣體進入無塵室天花板循環空調箱(AHU)。',
          },
          {
            id: 'wash_down_drain',
            label: 'Hose Spill into Cleanroom Raised Floor Plenum',
            labelZh: '拿超純水高壓水管直接將酸液沖入高架地板孔洞',
            description: 'Flush chemical residue down perforated floor tiles with DI water.',
            descZh: '沖洗地板殘液直接流落下層氣體回風夾層。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Severe violation! Flushing into sub-fab plenum contaminates entire facility basement air and creates massive toxic vapor cloud.',
            explanationZh:
              '重大公安違規！沖入高架地板夾層會讓數十公升酸液蒸發至整座半導體廠下夾層，引發全廠緊急疏散與毀滅性污染！',
          },
          {
            id: 'leave_spill_for_next_shift',
            label: 'Place Yellow Caution Cone Only and Resume CMP Wafer Polishing',
            labelZh: '僅在酸液旁放一個小黃牌警告，繼續操作隔壁研磨機台',
            description: 'Leave uncontained HF pool evaporating on cleanroom floor.',
            descZh: '未圍堵高揮發性氫氟酸即繼續生產。',
            isCorrect: false,
            explanation:
              'Dangerous violation! Uncontained 49% HF releases lethal corrosive HF vapor into the breathing zone.',
            explanationZh:
              '嚴重違規！49% 氫氟酸會持續揮發劇毒氟化氫氣體，灼傷現場所有人員呼吸道並腐蝕精密光學鏡頭！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 4. BAY 104: LEVEL 3 1100°C FURNACE QUARTZ BREACH
  // ==========================================
  {
    typeId: 'FURNACE_QUARTZ_BREACH',
    level: 'LEVEL_3_FATAL_CRISIS',
    title: '1100°C Vertical Quartz Furnace Boat Jam & H2/O2 Pyrogenic Breach',
    titleZh: '高溫擴散爐 (Bay 104) 1100°C 石英晶圓舟卡死與氫氧焰外洩危機',
    defaultSector: 'DIFFUSION_FURNACE',
    severity: 'CATASTROPHIC',
    timeLimitSec: 60,
    description:
      'During an 1100°C wet oxidation cycle using pyrogenic H2/O2 gas, the vertical quartz wafer boat elevator jammed mid-stroke, cracking the lower quartz flange seal. Blinding white-hot 300mm wafers are exposed and hydrogen flame tongues are licking out of the scavenger hood!',
    descZh:
      '1100°C 氫氧燃燒濕式氧化製程中，垂直石英晶圓舟升降機於半途發生機械卡死，導致底部石英法蘭密封破裂！熾熱發白光的 300mm 晶圓裸露於空氣中，且高溫氫氣火舌正從排氣罩縫隙竄出！',
    regulatoryStandard: 'SEMI S2-0712 §14 (Thermal & Fire) / NFPA 86',
    ehsPillars: {
      whatMayHappen:
        'Over-driving furnace heating power (>2200W) or thermal shock cracks the vertical quartz tube seal during 1100°C pyrogenic H2/O2 annealing, exposing incandescent wafers and leaking explosive Hydrogen gas.',
      whatMayHappenZh:
        '過度推升爐管加熱功率 (>2200W) 或熱應力衝擊，導致 1100°C 垂直石英爐管底座密封破裂，裸露熾熱晶圓舟並外洩易爆高溫氫氣 (H2)。',
      howToPrevent:
        'Keep Bay 104 Furnace Temp below 1140°C and Scrubber Load below 88%. When quartz thermal expansion alerts appear, walk to Bay 104 and run Controlled N2 Thermal Ramp-Down.',
      howToPreventZh:
        '維持 Bay 104 爐溫低於 1140°C 且洗滌塔負載低於 88%。當出現石英熱膨脹預警時，立即前往機台診斷並執行「N2 保護氣降溫穩壓」。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [😷 SCBA Respirator] before approaching the 1100°C H2 breach! 1. Trip the Furnace EMO & H2 Pyrogenic Gas Cutoff Valve immediately. 2. Flood the quartz tube and scavenger plenum with inert N2 curtain and lock out the thermal bay perimeter.',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：接近高溫氫氣外洩區前必先穿戴 😷 SCBA 呼吸防護！】1. 立即拍擊爐管 EMO 並切斷氫氣 (H2) 供給閥門；2. 啟動高純度氮氣 (N2) 氣幕灌注石英管與排氣罩，並封鎖高溫輻射警戒區。',
      consequence:
        'Spraying cold water or forcing the jammed quartz boat causes an instantaneous 1100°C quartz shrapnel explosion and hydrogen detonation ($5.2M loss + fatal third-degree thermal burns).',
      consequenceZh:
        '若對 1100°C 石英管噴灑冷水或強行拉動卡死晶圓舟，將引發劇烈熱震石英爆裂與氫氣氣爆，炸毀整批 150 片晶圓與爐體 (損失約 $5.2M USD) 並造成致命燒傷！',
      estimatedLossMillionsUSD: 5.2,
      recommendedPPE: 'SCBA',
      ppeInstruction:
        'CRUCIAL STEP: Equip [😷 SCBA Respirator] before approaching Bay 104! Superheated H2/steam plumes cause instant airway burns!',
      ppeInstructionZh:
        '關鍵防護步驟：接近 Bay 104 爐體前必須先穿戴【😷 SCBA 自給式呼吸器】，防止吸入超高温氫氧蒸氣灼傷呼吸道！',
    },
    preAlarmConfig: {
      title: 'Bay 104 Quartz Tube Thermal Stress & Boat Elevator Torque Warning',
      titleZh: 'Bay 104 垂直石英爐管熱應力與晶圓舟升降扭力故障診斷',
      whatIsHappening:
        'Furnace temperature is approaching 1135°C and the quartz boat elevator servo detects thermal expansion friction.',
      whatIsHappeningZh:
        '擴散爐管溫度逼近 1135°C 臨界點，石英晶圓舟升降機偵測到熱膨脹摩擦阻力異常上升。',
      howToPrevent:
        'Walk to Bay 104 (<5.5m), inspect the 3-zone thermocouple & torque clues, and choose the right engineering fix.',
      howToPreventZh:
        '請前往 Bay 104 現場 (<5.5m)，檢視三溫區熱電偶與升降扭力數據，選擇正確的工程排除方案。',
      consequenceIfIgnored:
        'The 1100°C quartz flange will crack mid-stroke, exposing white-hot wafers and igniting a Hydrogen (H2) breach!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，1100°C 石英法蘭將破裂卡死，導致高溫氫氧焰外洩與晶圓舟爆裂危機！',
      maintenanceButtonLabel: 'Stabilize Furnace N2 Thermal Ramp',
      maintenanceButtonLabelZh: '現場啟動 N2 均溫保護與升降軸釋壓',
      symptoms: [
        'Bottom Heating Zone ΔT Gradient: +48°C Thermal Mismatch across Quartz Lip',
        'Quartz Boat Elevator Ball-Screw Torque: 168% of Nominal Limit',
        'Pyrogenic Torch H2:O2 Ratio Drifting Fuel-Rich (1.92 : 1)',
      ],
      symptomsZh: [
        '爐管底部溫區溫差過大：ΔT +48°C（石英管口熱膨脹不均）',
        '晶圓舟升降滾珠螺桿扭力負載：飆升至額定值 168%',
        '氫氧燃燒器 (Pyrogenic Torch) H2:O2 比例偏富氫 (1.92 : 1)',
      ],
      waferDefectPattern: 'Crystal Slip-Line Dislocations & Thermal Wafer Bowing (> 65µm)',
      waferDefectPatternZh: '晶圓晶格滑移線缺陷 (Slip Lines) & 高溫熱翹曲變形 (> 65µm)',
      troubleshootingOptions: [
        {
          id: 'furnace_hold_elevator_n2_ramp_down',
          label: 'Hold Boat Elevator in Place, Cut H2 Torch to Pure N2 Soak & Ramp Down -5°C/min',
          labelZh: '暫停晶圓舟升降、切換為純 N2 均溫保護並以 -5°C/min 受控緩降爐溫',
          outcomeType: 'SOLVE',
          explanation:
            'Perfect thermal engineering! Holding the boat while equalizing the ΔT gradient under pure N2 relieves quartz thermal expansion without cracking the tube.',
          explanationZh:
            '完美的熱製程處置！暫停升降並以純氮氣消除底部 +48°C 溫差，讓石英管平穩收縮恢復順暢，保住 150 片晶圓！',
          consequenceSummary: 'Prevented 1100°C Quartz Breach (+300 PTS, +$3.1M Saved)',
          consequenceSummaryZh: '成功預防石英爐管破裂危機 (+300 PTS，挽救 $3.1M 產值)',
        },
        {
          id: 'furnace_boost_cooling_air_blower',
          label: 'Blast Ambient Chilled Air into Lower Scavenger While Keeping H2 Torch Lit',
          labelZh: '保持氫氧焰燃燒，同時向爐底排氣罩灌入冷空氣強行降溫',
          outcomeType: 'PARTIAL',
          explanation:
            'Risky thermal gradient! Cold air against a hot furnace lip warps the bottom 12 wafers with severe crystal slip lines (-7% Yield).',
          explanationZh:
            '不當溫差衝擊！冷空氣直吹高溫爐口導致底部 12 片晶圓產生嚴重晶格滑移報廢 (-7% 良率)。',
          consequenceSummary: 'Partial Fix: 12 wafers warped by thermal shock (-$0.5M)',
          consequenceSummaryZh: '部分緩解：熱應力導致 12 片晶圓翹曲報廢 (-$0.5M)',
        },
        {
          id: 'furnace_force_elevator_override',
          label: 'Override Servo Torque Limit & Force Quartz Boat Extraction at 1135°C',
          labelZh: '強制解除升降機扭力保護，在 1135°C 高溫下硬拉抽出石英晶圓舟',
          outcomeType: 'ESCALATE',
          explanation:
            'Catastrophic mechanical shear! Forcing the thermally expanded quartz boat cracked the lower quartz flange seal, releasing 1100°C H2 flames!',
          explanationZh:
            '致命工程誤判！在熱膨脹卡緊狀態下強行拉動，當場扯裂底部石英法蘭密封，1100°C 氫氣火舌瞬間竄出！',
          consequenceSummary: 'Triggered 1100°C Quartz Furnace Breach & H2 Fire!',
          consequenceSummaryZh: '誤判引發「1100°C 石英爐管破裂與氫氧焰外洩危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Immediate H2 Gas Cutoff & Heater Power Isolation (Stage 1):',
        promptZh: '第一階段：氫氣 (H2) 緊急遮斷與高溫加熱器斷電',
        choices: [
          {
            id: 'furnace_emo_h2_cutoff',
            label: 'Slam Furnace EMO & Trip Pyrogenic Hydrogen (H2) Shutoff Solenoid',
            labelZh: '拍擊擴散爐 EMO 急停開關，瞬間切斷氫氧焰 (H2/O2) 氣體供應閥並停止升降機',
            description:
              'Cut 480V heater elements, halt boat elevator motor, and close H2 feed valve outside the cleanroom.',
            descZh: '切斷 480V 電熱絲電源、停止升降馬達，並關閉外部氫氣供應源。',
            isCorrect: true,
            explanation:
              'Correct! Stopping the H2 feed immediately starves the pyrogenic flame while halting mechanical stress on the cracked quartz.',
            explanationZh:
              '處置完全正確！立即阻斷氫氣來源以消除爆炸風險，並停止升降機避免石英舟進一步碎裂。',
          },
          {
            id: 'spray_cold_water_on_quartz',
            label: 'Spray Cold DI Water Hose onto 1100°C Glowing Quartz Tube',
            labelZh: '拿冷卻超純水水管直接朝 1100°C 發紅石英爐管噴水降溫',
            description: 'Attempt rapid cooling of white-hot quartz furnace with liquid water.',
            descZh: '試圖以冷水快速冷卻千度高溫石英管。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Catastrophic thermal shock explosion! Cold water on 1100°C quartz shatters the tube instantly like a bomb and triggers steam-hydrogen detonation.',
            explanationZh:
              '毀滅性熱震爆炸！冷水接觸 1100°C 石英管將引發瞬間爆裂，飛濺上千度石英碎片並誘發蒸氣與氫氣閃爆！',
          },
          {
            id: 'reach_in_with_gloves_to_push_boat',
            label: 'Open Lower Scavenger Door and Push Jammed Quartz Boat by Hand',
            labelZh: '打開爐管下護門，戴手套伸手推擠卡住的 1100°C 石英晶圓舟',
            description: 'Manually free the glowing wafer boat inside the furnace.',
            descZh: '試圖以人力推回發白光的高溫石英舟。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Lethal radiant heat burn! At 1100°C, radiative heat causes instant full-thickness burns and ignites cleanroom garments on contact.',
            explanationZh:
              '致命高溫灼傷！1100°C 強熱輻射與氫氣火舌將瞬間融化無塵衣並造成重度三度燒傷！',
          },
        ],
      },
      {
        prompt: 'Inert Nitrogen Blanket Purge & Thermal Perimeter Lockout (Stage 2):',
        promptZh: '第二階段：惰性氮氣 (N2) 氣幕灌注與高溫熱輻射區隔離',
        choices: [
          {
            id: 'furnace_n2_curtain_contain',
            label: 'Engage High-Flow N2 Inert Purge Curtain & Cordon 5m Thermal Safety Zone',
            labelZh: '啟動大流量氮氣 (N2) 保護氣幕置換殘餘氫氣，並封鎖 5 公尺高溫安全警戒線',
            description:
              'Blanket cracked quartz seal with inert N2 while letting furnace cool safely below 200°C before mechanical touch.',
            descZh: '以惰性氮氣覆蓋破裂口防止氫氣復燃，並待爐溫自然緩降至安全溫度後方可進行機械拆解。',
            isCorrect: true,
            explanation:
              'Exemplary NFPA 86 furnace protocol! Inert nitrogen prevents oxidation/ignition while controlled cooling avoids quartz shatter.',
            explanationZh:
              '完全符合 NFPA 86 與 SEMI S2 規範！氮氣氣幕杜絕氫氣復燃，受控降溫確保人員與機台安全。',
          },
          {
            id: 'force_elevator_down_full_speed',
            label: 'Override Torque Limit and Force Boat Elevator Down at 100% Speed',
            labelZh: '強制解除馬達扭力保護，以 100% 全速強行降下卡住的石英晶圓舟',
            description: 'Force mechanical elevator through the jammed quartz lip.',
            descZh: '強行以最大馬達扭力拉扯卡死的石英舟。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Catastrophic shower of 1100°C silicon shards! Shearing the quartz boat dumps 150 white-hot wafers onto the cleanroom floor.',
            explanationZh:
              '嚴重災難！強行拉扯將扯斷石英舟，導致 150 片 1100°C 熾熱晶圓瞬間傾瀉砸穿高架地板並引發大火！',
          },
          {
            id: 'shut_off_scavenger_exhaust',
            label: 'Turn Off Scavenger Hood Exhaust Fan to Save Energy',
            labelZh: '關閉爐管口排氣抽風罩 (Scavenger) 任由熱氣散入無塵室',
            description: 'Stop local exhaust ventilation while furnace is still at 1100°C.',
            descZh: '在千度高溫與殘留氣體狀態下關閉局部排氣。',
            isCorrect: false,
            explanation:
              'Dangerous violation! Turning off scavenger exhaust allows buoyant hydrogen gas and extreme heat to accumulate under the ceiling HEPA filters.',
            explanationZh:
              '嚴重違規！關閉抽氣罩將使上浮的殘餘氫氣與高溫熱氣積聚於無塵室天花板 FFU 濾網區，引發頂部氣爆危機！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 5. BAY 105: LEVEL 2 ARSINE TOXIC GAS LEAK
  // ==========================================
  {
    typeId: 'ARSINE_GAS_LEAK',
    level: 'LEVEL_2_CHEMICAL_LEAK',
    title: 'Arsine (AsH3) Ion Source Enclosure Toxic Gas Leak',
    titleZh: '離子植入機 (Bay 105) 砷化氫 (AsH3) 離子源箱劇毒氣體外洩',
    defaultSector: 'ION_IMPLANTATION',
    severity: 'CATASTROPHIC',
    timeLimitSec: 60,
    description:
      'TGMS sniffer at Ion Implanter Source Head detects Arsine (AsH3) at 1.8 PPM (TLV is 0.005 PPM). Arsine is a lethal hemolytic poison with a garlic-like odor, causing rapid organ failure upon inhalation.',
    descZh:
      '離子植入機離子源箱 (Source Head) 陰極放電密封老化失壓，高靈敏 TGMS 感測器測得劇毒砷化氫 (AsH3) 達 1.8 PPM (法定極限僅 0.005 PPM)！砷化氫具強烈溶血毒性與蒜臭味，吸入數口即可致死。',
    regulatoryStandard: 'SEMI S2-0712 §13.5 (Toxic Gas) / OSHA 1910.1000',
    ehsPillars: {
      whatMayHappen:
        'Excessive dopant gas flow or scrubber saturation causes lethal Arsine (AsH3) hydride gas (TLV 0.005 PPM) to leak from the Ion Source head enclosure.',
      whatMayHappenZh:
        '過高的摻雜氣體流量或洗滌塔飽和，導致劇毒砷化氫 (AsH3，法定允許濃度僅 0.005 PPM) 從離子源箱密封縫隙外洩。',
      howToPrevent:
        'Monitor Bay 105 Scrubber Load (<85%) and equip SCBA respirator when inspecting toxic gas boxes. Diagnose Source Head negative pressure during Amber gas warnings.',
      howToPreventZh:
        '監控 Bay 105 洗滌塔負載 (<85%)，巡檢毒氣箱時配戴 SCBA 自給式呼吸器，並於出現琥珀色預警時立即前往現場診斷「離子源箱 N2 負壓吹驅」。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [😷 SCBA Respirator] IMMEDIATELY before entering Bay 105! 1. Strike Ion Source EMO & trip the SDS sub-atmospheric cylinder valve. 2. Route roughing exhaust to the 850°C burn-box scrubber with N2 sweep. 3. Sound TGMS alarm and order upwind evacuation.',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：進入劇毒砷化氫洩漏區前，必須先穿戴 😷 SCBA 正壓呼吸器！】1. 拍擊離子源 EMO 並關閉 SDS 次常壓鋼瓶彈簧閥；2. 切換管線以 N2 吹驅至 850°C 燃燒洗滌塔裂解；3. 啟動 TGMS 警報全員逆風撤離。',
      consequence:
        'Approaching without SCBA, opening the source cabinet, or delaying evacuation exposes workers to 360x TLV Arsine, causing acute massive hemolysis, renal failure, and death ($5.8M shutdown).',
      consequenceZh:
        '若未穿戴 SCBA 即靠近、貿然打開源箱或延遲疏散，吸入高濃度砷化氫將引發急性溶血反應、腎衰竭與死亡，並導致全廠勒令停工 (損失逾 $5.8M USD)。',
      estimatedLossMillionsUSD: 5.8,
      recommendedPPE: 'SCBA',
      ppeInstruction:
        'CRUCIAL STEP: Equip [😷 SCBA Respirator] BEFORE acting in Bay 105! Arsine (AsH3) at 1.8 PPM is 360x above lethal TLV—unprotected inhalation causes fatal hemolysis!',
      ppeInstructionZh:
        '關鍵保命步驟：於 Bay 105 操作前必須先穿戴【😷 SCBA 自給式呼吸器】！現場砷化氫濃度超標 360 倍，未戴呼吸器吸入數口即會引發致命溶血！',
    },
    preAlarmConfig: {
      title: 'Bay 105 Ion Source Box Negative-Pressure Drop & Scrubber Saturation',
      titleZh: 'Bay 105 離子源箱負壓下降與砷化氫 (AsH3) 尾氣飽和故障診斷',
      whatIsHappening:
        'Source cabinet exhaust differential pressure is dropping while AsH3 scrubber bed saturation exceeds 86%.',
      whatIsHappeningZh:
        '離子源箱排氣負壓差正在下降，且砷化氫 (AsH3) 尾氣乾式吸附塔飽和度已超過 86% 警戒線。',
      howToPrevent:
        'Walk to Bay 105 (<5.5m), inspect the SDS gas box & scrubber telemetry clues, and choose the right fix.',
      howToPreventZh:
        '請前往 Bay 105 現場 (<5.5m)，根據 SDS 氣瓶櫃與洗滌塔數據，選擇正確的工程排除方案。',
      consequenceIfIgnored:
        'Lethal Arsine (AsH3) toxic gas will breach the source enclosure into the Bay 105 breathing zone!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，劇毒砷化氫 (AsH3) 將外洩至 Bay 105 作業區，引發致命毒氣危機！',
      maintenanceButtonLabel: 'Purge Ion Source Box & Reset Scrubber',
      maintenanceButtonLabelZh: '現場執行離子源箱 N2 吹驅與洗滌塔切換',
      symptoms: [
        'Dry-Bed Scrubber Column A Saturation: 91% (Exhaust Backpressure Rising)',
        'Ion Source Enclosure Negative Draft: Dropped from -0.25" WC to -0.04" WC',
        'SDS Sub-Atmospheric Regulator Vacuum Extraction Flow Unstable',
      ],
      symptomsZh: [
        '乾式吸附洗滌塔 A 柱飽和度：達 91%（排氣背壓持續上升）',
        '離子源箱負壓抽氣差：由 -0.25" WC 跌落至 -0.04" WC',
        'SDS 次常壓鋼瓶真空調節器流量不穩',
      ],
      waferDefectPattern: 'N-Well Dopant Dose Non-Uniformity (> 4.5%) & Ion Beam Dropouts',
      waferDefectPatternZh: '晶圓 N 井摻雜劑量不均 (> 4.5%) & 離子束流閃斷',
      troubleshootingOptions: [
        {
          id: 'ash3_switch_scrubber_column_b_n2_purge',
          label: 'Switch Abatement to Fresh Scrubber Column B & Run Automated N2 Manifold Purge',
          labelZh: '將尾氣切換至全新吸附塔 B 柱，並執行離子源管路自動化 N2 吹驅',
          outcomeType: 'SOLVE',
          explanation:
            'Spot-on diagnosis! Switching to fresh Scrubber Column B immediately restores -0.25" WC negative draft inside the Ion Source cabinet and safely abates residual AsH3.',
          explanationZh:
            '診斷完全正確！切換至全新吸附塔 B 柱瞬間恢復源箱 -0.25" WC 負壓抽氣，並安全吸附殘留砷化氫！',
          consequenceSummary: 'Prevented Arsine Toxic Gas Leak (+300 PTS, +$3.5M Saved)',
          consequenceSummaryZh: '成功預防劇毒砷化氫外洩 (+300 PTS，挽救 $3.5M 產值)',
        },
        {
          id: 'ash3_reduce_beam_current_only',
          label: 'Lower Ion Beam Current by 50% While Leaving Saturated Scrubber Column A Online',
          labelZh: '僅將離子束電流調降 50%，繼續使用已飽和的洗滌塔 A 柱',
          outcomeType: 'PARTIAL',
          explanation:
            'Incomplete fix! Lowering beam current causes under-dosed wafers (-8% Yield), while the saturated scrubber bed still struggles to maintain negative pressure.',
          explanationZh:
            '治標不治本！調降束流導致晶圓摻雜劑量不足報廢 (-8% 良率)，且飽和的吸附塔仍無法維持源箱負壓。',
          consequenceSummary: 'Partial Fix: Under-dosed wafer lot (-$0.5M)',
          consequenceSummaryZh: '部分緩解：晶圓摻雜不足報廢 (-$0.5M)',
        },
        {
          id: 'ash3_pressurize_sds_bottle_with_air',
          label: 'Inject Compressed Shop Air into SDS Gas Box to Boost Dopant Delivery Pressure',
          labelZh: '向次常壓氣瓶櫃注入一般壓縮空氣加壓，試圖推高氣體流量',
          outcomeType: 'ESCALATE',
          explanation:
            'Deadly engineering blunder! SDS cylinders rely on sub-atmospheric vacuum for safety—pressurizing the manifold ruptured the source head seal and released lethal Arsine (AsH3)!',
          explanationZh:
            '致命工程誤判！SDS 鋼瓶依賴負壓安全供氣，強行注入正壓空氣當場衝破離子源密封圈，劇毒砷化氫大量外洩！',
          consequenceSummary: 'Triggered Lethal Arsine (AsH3) Toxic Gas Leak!',
          consequenceSummaryZh: '誤判引發「劇毒砷化氫 (AsH3) 外洩危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Immediate Gas Abort & SDS Cylinder Spring Cutoff (Stage 1):',
        promptZh: '第一階段：緊急急停切斷 (EMO) 與 SDS 次常壓鋼瓶彈簧閥關閉',
        choices: [
          {
            id: 'ion_emo_sds_abort',
            label: 'Strike Ion Source EMO & Trip SDS Sub-Atmospheric Cylinder Solenoid',
            labelZh: '拍擊離子源專用 EMO 按鈕，觸發 SDS 次常壓鋼瓶安全閥門瞬間緊閉',
            description:
              'De-energize extraction power supply and close pneumatic cylinder valve within 200ms.',
            descZh: '切斷 40kV 萃取電源並釋放氣動訊號，彈簧閥於 200 毫秒內機械閉鎖阻斷劇毒氣體源。',
            isCorrect: true,
            explanation:
              'Correct! Instantly isolates toxic hydride gas at sub-atmospheric cylinder neck and kills ionizing extraction arc.',
            explanationZh:
              '處置完全正確！SDS 負壓鋼瓶閥門立即鎖死，徹底阻絕劇毒砷化物進入真空游離腔。',
          },
          {
            id: 'open_source_box_inspect',
            label: 'Unscrew Source Cabinet Panel to Locate O-Ring Leak',
            labelZh: '旋開離子源箱維修門板試圖尋找密封圈洩漏點',
            description: 'Look inside toxic cabinet with handheld flashlight.',
            descZh: '徒手解開源箱門扣拿手電筒照射檢查。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Lethal exposure! Opening toxic cabinet releases lethal Arsine concentration into the breathing zone.',
            explanationZh:
              '致命毒害！開啟源箱將使數十倍致死濃度的砷化氫直接衝入呼吸防線，當場引發急性溶血與呼吸衰竭！',
          },
          {
            id: 'lower_filament_current',
            label: 'Dial Down Filament Current from Remote Software Terminal',
            labelZh: '在操作電腦軟體上調低燈絲電流至待機設定',
            description: 'Attempt software adjustment without physical EMO trip.',
            descZh: '不想全面停機，嘗試以軟體指令微調功率。',
            isCorrect: false,
            explanation:
              'Dangerous violation! Chemical line breaches cannot be resolved via software. Physical EMO is mandatory under SEMI S2.',
            explanationZh:
              '嚴重違規！物理性密封破裂無法依賴軟體降載，必須立即物理斷電斷氣！',
          },
        ],
      },
      {
        prompt: 'Turbo Pump Isolation & Toxic Wet Scrubber Purge (Stage 2):',
        promptZh: '第二階段：渦輪分子泵隔離與廢氣燃燒水洗塔 (Scrubber) 抽空',
        choices: [
          {
            id: 'isolate_turbo_scrubber_purge',
            label: 'Isolate Roughing Line & Route Exhaust to Burn-Box Scrubber with N2 Sweep',
            labelZh: '切換低真空前級管線，啟動大流量氮氣吹驅將殘氣推送至燃燒洗滌塔',
            description:
              'Direct toxic line to point-of-use thermal decomposition scrubber to crack AsH3.',
            descZh: '以高純氮氣推送，進入 850°C 高溫水洗燃燒洗滌塔完全熱解為無害砷酸鹽。',
            isCorrect: true,
            explanation:
              'Correct! Thermal abatement destroys arsine gas safely without atmospheric emission or duct buildup.',
            explanationZh:
              '標準半導體環安流程！點火水洗塔高溫完全裂解有毒氣體，杜絕風管腐蝕與大氣污染。',
          },
          {
            id: 'vent_to_subfab_sump',
            label: 'Dump Exhaust into Sub-Fab Wet Chemical Sump',
            labelZh: '將真空泵廢氣直接排入廠房地下排水坑',
            description: 'Route exhaust down into basement wastewater trench.',
            descZh: '圖省事將排氣軟管拉至下夾層排水溝。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Severe violation! Draining toxic hydride into aqueous sump reacts to form explosive, lethal gas pockets.',
            explanationZh:
              '嚴重違規！劇毒氣體排入水溝將在上百米下夾層蓄積致命毒氣，危害整座晶圓廠地下維護人員！',
          },
          {
            id: 'open_roughing_pump_ballast',
            label: 'Open Foreline Vacuum Port Directly into Cleanroom Return Air Grille',
            labelZh: '拆開前級真空幫浦排氣口，直接對準無塵室地板回風孔排放',
            description: 'Vent foreline gas into floor return air.',
            descZh: '讓劇毒尾氣直接進入無塵室循環空調。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Catastrophic facility poisoning! Recirculating Arsine through the floor plenum poisons every bay in the fab.',
            explanationZh:
              '毀滅性全廠毒害！將砷化氫排入高架地板回風層，將透過空調系統毒害全廠所有作業人員！',
          },
        ],
      },
      {
        prompt: 'Cleanroom Airlock SCBA Protocol & Evacuation (Stage 3):',
        promptZh: '第三階段：無塵室氣閘逆風疏散與正壓呼吸器 (SCBA) 管制',
        choices: [
          {
            id: 'evacuate_upwind_scba',
            label: 'Sound TGMS Amber Alarm, Order Bay 105 Upwind Evacuation & SCBA Entry',
            labelZh: '啟動 TGMS 琥珀色警報閃燈，全員逆風撤離，僅限佩戴 SCBA 防護隊員進入',
            description: 'Direct technicians to staging vestibule; seal air shower interlocks.',
            descZh: '依緊急動線撤離至除污氣閘，阻斷回風循環，呼叫廠務專業防災隊。',
            isCorrect: true,
            explanation:
              'Complies fully with SEMI S2 Life Safety standard. Protects worker lives and cleanroom integrity.',
            explanationZh:
              '卓越處置！全員依逆風方向撤離至安全集結點，未穿戴 SCBA 自給式呼吸器者嚴禁折返。',
          },
          {
            id: 'tell_workers_hold_breath',
            label: 'Instruct Workers to Hold Breath and Finish Wafer Lot',
            labelZh: '廣播要求技術員屏住呼吸先將機台內最後 5 片晶圓打完',
            description: 'Prioritize production output over toxic gas alarm.',
            descZh: '為追趕交期要求現場人員暫緩疏散。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Criminal OSHA violation! Toxic hydride gas exposure causes fatal internal hemorrhage within minutes.',
            explanationZh:
              '重大刑事工安犯罪！任何危害生命的延遲疏散均屬不可赦之嚴重違法行為！',
          },
          {
            id: 'use_paper_dust_mask',
            label: 'Hand Out Standard Paper Dust Masks and Continue Maintenance',
            labelZh: '發放一般紙質防塵口罩給技術員並要求繼續檢修',
            description: 'Use particulate masks against molecular toxic hydride gas.',
            descZh: '誤以為無塵室一般口罩能過濾劇毒氣體分子。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Deadly misconception! Particulate masks offer zero protection against Arsine gas molecules; only positive-pressure SCBA protects life.',
            explanationZh:
              '致命誤解！一般防塵口罩對砷化氫氣體分子毫無阻擋能力，唯有正壓自給式呼吸器 (SCBA) 方可保命！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 6. BAY 105: LEVEL 3 200kV HV ARC & X-RAY
  // ==========================================
  {
    typeId: 'ION_HV_ARC_XRAY',
    level: 'LEVEL_3_FATAL_CRISIS',
    title: '200kV Acceleration Column Arc Flash & X-Ray Radiation Interlock Breach',
    titleZh: '離子植入機 (Bay 105) 200kV 靜電加速管跳火與次生 X 射線防護失效',
    defaultSector: 'ION_IMPLANTATION',
    severity: 'HIGH',
    timeLimitSec: 60,
    description:
      'Catastrophic dielectric breakdown inside the 200,000V high-voltage electrostatic accelerator tube has caused severe electrical arcing. High-energy ion impact produces secondary X-ray Bremsstrahlung radiation while interlock switches are jammed.',
    descZh:
      '離子植入機加速管施加高達 200kV 直流高壓，絕緣套管表面引發連續性電弧跳火！高能離子轟擊金屬引發次生 X 光制動輻射 (Bremsstrahlung)，且外門防護安全開關出現機械卡死訊號！',
    regulatoryStandard: 'NFPA 70E (Electrical) / SEMI S2-0712 §16 (Radiation Safety)',
    ehsPillars: {
      whatMayHappen:
        'High-voltage acceleration column vacuum degradation or RF overdrive triggers 200,000V dielectric arc flash and generates penetrating Bremsstrahlung X-ray radiation.',
      whatMayHappenZh:
        '200,000V 靜電加速管真空劣化或高頻功率過載，引發連續高壓電弧跳火，並於離子轟擊金屬時產生具穿透力之次生 X 光制動輻射 (Bremsstrahlung)。',
      howToPrevent:
        'Keep Bay 105 Vacuum tight (<0.005 Torr) and RF Power below 1700W. When corona discharge warnings appear, walk to Bay 105 and perform High-Vacuum Cryo Regeneration & HV Conditioning.',
      howToPreventZh:
        '維持 Bay 105 高真空度 (<0.005 Torr) 且 RF 功率低於 1700W。當出現電暈放電預警時，立即前往現場診斷「高真空冷阱再生與高壓絕緣調節」。',
      whatShouldDo:
        'CRUCIAL PPE STEP: Equip [⚡ Class-00 HV Insulating Gloves] BEFORE touching HV cabinets or grounding sticks! 1. Trip the Main High-Voltage Feeder Breaker and affix your personal LOTO padlock. 2. Apply the 10kV Grounding Stick to discharge capacitors. 3. Scan lead shielding with a Geiger-Müller survey meter (<0.2 µSv/h).',
      whatShouldDoZh:
        '【關鍵 PPE 步驟：操作高壓斷路器與放電棒前，必先穿戴 ⚡ 高壓絕緣手套！】1. 切斷主高壓饋電斷路器並掛上個人 LOTO 安全鎖；2. 持高壓接地放電棒 (Grounding Stick) 實體放電；3. 以蓋革計數器多點掃描鉛屏蔽外罩確認無 X 光洩漏。',
      consequence:
        'Operating without HV Insulating Gloves, trusting a 0.0V digital meter without physical grounding-stick discharge, or skipping radiation surveys leads to lethal 80kV capacitor electrocution or acute radiation injury ($4.9M loss).',
      consequenceZh:
        '若未戴高壓絕緣手套或未以接地棒實體放電即觸摸電容排，殘存數萬伏特電荷將瞬間致死；省略蓋革輻射檢測更會導致游離輻射傷害 (損失約 $4.9M USD)。',
      estimatedLossMillionsUSD: 4.9,
      recommendedPPE: 'HV_GLOVES',
      ppeInstruction:
        'CRUCIAL STEP: Equip [⚡ Class-00 HV Insulating Gloves] before operating on Bay 105! 200kV capacitor banks retain lethal 80,000V residual charge!',
      ppeInstructionZh:
        '關鍵保命步驟：於 Bay 105 處置高壓跳火前必須先穿戴【⚡ Class-00 高壓絕緣手套】！電容排殘留高達 80,000V 致命電荷！',
    },
    preAlarmConfig: {
      title: 'Bay 105 200kV Accelerator Column Corona Discharge & Vacuum Drift',
      titleZh: 'Bay 105 200kV 加速管電暈微放電與真空劣化故障診斷',
      whatIsHappening:
        'High-voltage bushing leakage current is rising and micro-arcs are flickering along the 200kV grading rings.',
      whatIsHappeningZh:
        '200kV 加速管絕緣套管漏電流上升，均壓環表面開始出現微弱藍紫色電暈放電閃爍。',
      howToPrevent:
        'Walk to Bay 105 (<5.5m), inspect the cryo-vacuum & SF6 dielectric telemetry, and pick the right fix.',
      howToPreventZh:
        '請前往 Bay 105 現場 (<5.5m)，根據高真空冷阱與絕緣壓差數據，選擇正確的工程排除方案。',
      consequenceIfIgnored:
        'Dielectric breakdown will trigger a full 200kV Arc Flash and secondary X-Ray Radiation breach!',
      consequenceIfIgnoredZh:
        '若未及時排除或選錯方案，絕緣層將遭擊穿並引爆「200kV 高壓電弧跳火與次生 X 射線外洩危機」！',
      maintenanceButtonLabel: 'Condition 200kV Column & Cryo Vacuum',
      maintenanceButtonLabelZh: '現場執行 200kV 絕緣調節與高真空排氣',
      symptoms: [
        'Accelerator Tube Cryo-Pump Vacuum Degraded: 1.2e-4 Torr (Outgassing Spike)',
        '200kV Grading Ring Corona Leakage Current: 4.8 mA ↑ (Arc Threshold: 6.0 mA)',
        'SF6 Insulating Gas Enclosure Pressure Low: 1.8 Bar (Nominal: 2.5 Bar)',
      ],
      symptomsZh: [
        '加速管超低溫冷阱真空度劣化：1.2e-4 Torr（殘氣釋放偏高）',
        '200kV 均壓環電暈漏電流飆升：4.8 mA ↑（跳火臨界值：6.0 mA）',
        'SF6 六氟化硫絕緣氣體腔壓力偏低：1.8 Bar（標準值 2.5 Bar）',
      ],
      waferDefectPattern: 'High-Energy Beam Glitch Streaks & Gate Oxide Breakdown on Wafer Center',
      waferDefectPatternZh: '晶圓中心閘極氧化層擊穿 & 高能離子束跳火條紋',
      troubleshootingOptions: [
        {
          id: 'hv_step_down_voltage_cryo_regen_sf6',
          label: 'Step Down Extraction Voltage to 120kV, Top Up SF6 Insulating Gas & Crossover Cryo-Pump',
          labelZh: '將加速電壓緩降至 120kV、補足 SF6 絕緣氣壓並切換備用高真空冷阱排氣',
          outcomeType: 'SOLVE',
          explanation:
            'Textbook high-voltage engineering! Restoring high vacuum and SF6 dielectric pressure eliminates corona ionization and prevents a 200kV arc flash.',
          explanationZh:
            '標準高壓設備排障！恢復高真空度並補足 SF6 絕緣氣壓，立即消除電暈游離現象，徹底阻止 200kV 電弧跳火！',
          consequenceSummary: 'Prevented 200kV Arc Flash & X-Ray Breach (+300 PTS, +$2.9M Saved)',
          consequenceSummaryZh: '成功預防 200kV 高壓跳火與輻射危機 (+300 PTS，挽救 $2.9M 產值)',
        },
        {
          id: 'hv_wipe_outer_cabinet_only',
          label: 'Wipe External Lead Glass Window with IPA Without Lowering 200kV Bias',
          labelZh: '僅以異丙醇擦拭外部鉛玻璃視窗，不調降 200kV 高壓與抽真空',
          outcomeType: 'PARTIAL',
          explanation:
            'Ineffective! The corona discharge is inside the vacuum acceleration column, so external wiping does nothing to stop beam glitches (-6% Yield).',
          explanationZh:
            '無效處置！電暈放電發生於內部加速管真空腔，擦拭外部視窗無法阻止離子束跳火 (-6% 良率)。',
          consequenceSummary: 'Partial Fix: Gate oxide breakdown on 5 wafers (-$0.4M)',
          consequenceSummaryZh: '部分緩解：5 片晶圓閘極氧化層擊穿報廢 (-$0.4M)',
        },
        {
          id: 'hv_overvolt_to_230kv_burn_contaminants',
          label: 'Surge Accelerator Voltage to 230kV Under Degraded Vacuum to Burn Off Outgassing',
          labelZh: '在真空劣化狀態下強行將高壓推升至 230kV，試圖以高壓擊穿燒除雜質',
          outcomeType: 'ESCALATE',
          explanation:
            'Catastrophic dielectric breakdown! Applying 230kV across degraded vacuum triggered a massive 200,000V Paschen arc flash and Bremsstrahlung X-ray burst!',
          explanationZh:
            '致命工程誤判！在低真空度下強推 230kV 高壓，瞬間引發帕申定律 (Paschen) 氣體擊穿大跳火與強烈次生 X 射線爆發！',
          consequenceSummary: 'Triggered 200kV Arc Flash & X-Ray Radiation Crisis!',
          consequenceSummaryZh: '誤判引發「200kV 高壓電弧跳火與 X 射線外洩危機」！',
        },
      ],
    },
    steps: [
      {
        prompt: 'Primary Electrical Disconnect & Lockout/Tagout (Stage 1):',
        promptZh: '第一階段：主高壓斷路器分斷與掛牌上鎖 (LOTO)',
        choices: [
          {
            id: 'trip_main_hv_breaker_loto',
            label: 'Trip Main High-Voltage Feeder Breaker & Affix Physical LOTO Padlock',
            labelZh: '拍擊主高壓饋電斷路器切斷 480V/200kV 電源，並於開關箱掛上個人 LOTO 安全鎖',
            description: 'Depress remote trip button to isolate high-voltage power rack.',
            descZh: '徹底阻斷供電能量來源，並掛牌上鎖防止他人誤送電。',
            isCorrect: true,
            explanation:
              'Correct! Eliminates incoming line power to the 200kV Cockcroft-Walton voltage multiplier stack.',
            explanationZh: '處置完全正確！依據 OSHA 1910.147 嚴格切斷高壓倍壓器能量輸入。',
          },
          {
            id: 'pull_open_interlock_door',
            label: 'Force Open the Jammed Interlock Enclosure Door Directly',
            labelZh: '徒手用力強行撬開卡死的加速管安全維修門',
            description: 'Attempt physical inspection while capacitor banks are fully charged.',
            descZh: '在電容器仍儲存數千焦耳殘餘電能時強行破門。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Lethal electrocution arc! Internal capacitor banks store fatal electrical charge capable of jumping air gaps.',
            explanationZh:
              '致命高壓電擊！高壓電容排儲存高達數千焦耳能量，接近時電弧將直接跳火貫穿人體！',
          },
          {
            id: 'reboot_hv_controller',
            label: 'Cycle Software High-Voltage Switch on Touchscreen',
            labelZh: '在機台觸控面板上點擊重開機按鈕以消除跳火警報',
            description: 'Attempt software power reboot.',
            descZh: '將硬體電弧視為軟體通訊異常而嘗試重新開機。',
            isCorrect: false,
            explanation:
              'Severe hazard! Software reboots will re-energize the stalled high-voltage breakdown, causing transformer explosion.',
            explanationZh:
              '嚴重危險！重新通電將向已擊穿的絕緣層再度注入高壓，引發變壓器油箱劇烈爆炸！',
          },
        ],
      },
      {
        prompt: 'Zero-Energy Discharge with 10kV Grounding Stick (Stage 2):',
        promptZh: '第二階段：穿戴絕緣手套，使用高壓接地放電棒 (Grounding Stick) 物理放電',
        choices: [
          {
            id: 'apply_grounding_discharge_stick',
            label: 'Wear Class 00 Insulating Gloves & Apply Grounding Stick to Discharge HV Terminals',
            labelZh: '穿戴高壓絕緣手套，持高壓接地放電棒確實搭接高壓端子與電容排洩除殘電',
            description: 'Touch terminal hook to earth ground bar until residual voltage reaches 0V.',
            descZh: '聽見清脆放電「啪」聲，將殘存靜電電荷完全導入大樓接地銅排。',
            isCorrect: true,
            explanation:
              'Exemplary semiconductor tool maintenance! Physically confirms zero electrical potential before technician entry.',
            explanationZh:
              '半導體最高規格標準作業！實體確認殘餘電位歸零，消除電容殘留電壓之隱形致命陷阱。',
          },
          {
            id: 'trust_voltmeter_display',
            label: 'Assume Zero Energy Because Digital Display Reads 0.0V',
            labelZh: '因為螢幕電壓錶顯示 0.0V，故跳過接地放電棒直接以徒手觸摸',
            description: 'Rely solely on digital instrument readings without physical verification.',
            descZh: '認為斷電後儀表歸零即可安全接觸。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Fatal mistake! Voltage dividers often blow during arc flash, falsely displaying 0V while 80kV remains trapped in capacitors.',
            explanationZh:
              '致命疏忽！高壓分壓電阻常在跳火中燒斷而顯示假 0V，電容內仍蓄積數萬伏特足以瞬間致命！',
          },
          {
            id: 'discharge_with_screwdriver',
            label: 'Short High-Voltage Terminal Using a Handheld Metal Screwdriver',
            labelZh: '拿隨身金屬螺絲起子直接跨接高壓電容端子放電',
            description: 'Use uninsulated hand tool to short 80kV capacitor bank.',
            descZh: '以無絕緣接地線之手工具直接短路高壓端子。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Lethal arc blast! An ungrounded screwdriver vaporizes into molten metal plasma and routes 80kV through your hand.',
            explanationZh:
              '致命電弧爆炸！未接地之螺絲起子將瞬間氣化為高溫金屬電漿，並將數萬伏特高壓直接導向人體！',
          },
        ],
      },
      {
        prompt: 'Geiger-Müller Radiation Survey Meter Verification (Stage 3):',
        promptZh: '第三階段：手持蓋革計數器 (Geiger Counter) 執行次生 X 光輻射劑量掃描',
        choices: [
          {
            id: 'geiger_survey_verification',
            label: 'Perform Multi-Point Radiation Survey Around Shielding Lead Enclosure',
            labelZh: '使用經校正之蓋革計數器，於鉛屏蔽外罩四周多點掃描確認輻射低於背景值',
            description:
              'Verify secondary Bremsstrahlung radiation is below 0.2 µSv/h before resuming wafer production.',
            descZh: '確認游離輻射數值完全落入安全背景區間，並填寫輻射防護檢驗工單。',
            isCorrect: true,
            explanation:
              'Fully compliant with SEMI S2 Section 16 Radiation Criteria. Secures cleanroom operator health.',
            explanationZh:
              '符合 SEMI S2 游離輻射防護標準！確認鉛屏蔽完好無射線洩漏，方可簽署復機。',
          },
          {
            id: 'ignore_radiation_test',
            label: 'Skip Radiation Survey to Save 15 Minutes and Resume Lot',
            labelZh: '為搶救晶圓批次進度，省略蓋革檢測直接呼叫 AGV 天車送入新晶圓',
            description: 'Bypass radiation verification to boost fab throughput.',
            descZh: '忽視無形輻射危害，急於復機上料。',
            isCorrect: false,
            explanation:
              'Regulatory violation! Breached shielding exposes subsequent shifts to cumulative ionizing radiation.',
            explanationZh:
              '嚴重法規違規！未經游離輻射檢驗復機將使無辜接班工程師遭受無形慢性輻射傷害！',
          },
          {
            id: 'remove_lead_curtain_for_cooling',
            label: 'Remove Lead Shielding Panels to Improve Airflow Cooling',
            labelZh: '拆下機台外側鉛屏蔽防護板以強化散熱通風',
            description: 'Operate 200kV ion implanter with X-ray lead shielding removed.',
            descZh: '在無鉛板屏蔽狀態下運轉高能離子植入機。',
            isCorrect: false,
            isFatalError: true,
            explanation:
              'Severe radiation hazard! Removing lead shielding exposes the entire bay to unattenuated Bremsstrahlung X-rays.',
            explanationZh:
              '重大輻射危害！拆除鉛屏蔽板將使次生 X 射線毫無阻擋地穿透整個作業區，造成嚴重游離輻射曝露！',
          },
        ],
      },
    ],
  },
];

export const INITIAL_SECTORS: Record<
  SectorId,
  {
    name: string;
    nameZh: string;
    code: string;
    description: string;
    descZh: string;
    nominalTemp: number;
    nominalPressure: number;
    nominalParticles: number;
    nominalHighVoltageKV?: number;
    nominalRfPowerWatts: number;
    nominalGasFlowSccm: number;
    nominalChamberVacuumTorr: number;
    nominalScrubberLoadPct: number;
  }
> = {
  PHOTOLITHOGRAPHY: {
    name: 'Lithography Bay 1 (ASML DUV Scanner)',
    nameZh: '第1區 · 黃光微影製程 (DUV 浸潤式微影曝光機)',
    code: 'BAY-101 / LITHO',
    description:
      '193nm Deep-UV Immersion Scanner with robotic wafer chuck, laser alignment optics, and yellow safe-light filter.',
    descZh:
      '193nm 深紫外光浸潤式微影曝光機，配備高精度晶圓真空吸盤、雷射對位鏡組與黃光防護罩。產線瓶頸第一站。',
    nominalTemp: 20.0,
    nominalPressure: 760,
    nominalParticles: 1,
    nominalRfPowerWatts: 800,
    nominalGasFlowSccm: 40,
    nominalChamberVacuumTorr: 760,
    nominalScrubberLoadPct: 35,
  },
  ETCH_CVD: {
    name: 'Plasma Etch & CVD Bay (Vacuum Chamber)',
    nameZh: '第2區 · 電漿乾蝕刻與化學氣相沉積 (CVD 真空腔體)',
    code: 'BAY-102 / PLASMA',
    description:
      'Inductively coupled plasma dry etcher with Silane (SiH4), Chlorine (Cl2), and Argon manifold feeds under deep vacuum.',
    descZh:
      '高密度感應耦合電漿乾蝕刻設備，配置矽甲烷(SiH4)、氯氣(Cl2)與氬氣(Ar)高壓真空管閥系統。',
    nominalTemp: 65.0,
    nominalPressure: 0.05,
    nominalParticles: 3,
    nominalRfPowerWatts: 1350,
    nominalGasFlowSccm: 105,
    nominalChamberVacuumTorr: 0.05,
    nominalScrubberLoadPct: 62,
  },
  CMP_WET_BENCH: {
    name: 'CMP & Acid Wet Bench (Chemical Wash)',
    nameZh: '第3區 · 化學機械研磨 (CMP) 與酸槽清洗機台',
    code: 'BAY-103 / CMP-CHEM',
    description:
      'Chemical Mechanical Planarization pad with silica abrasive slurry and Hydrofluoric / Sulfuric acid wet etching stations.',
    descZh:
      '奈米級化學機械平坦化研磨墊、二氧化矽研磨液，以及配置氫氟酸(HF)與硫酸(H2SO4)之酸洗機台，旁設緊急沖淋洗眼站。',
    nominalTemp: 22.5,
    nominalPressure: 760,
    nominalParticles: 2,
    nominalRfPowerWatts: 650,
    nominalGasFlowSccm: 45,
    nominalChamberVacuumTorr: 760,
    nominalScrubberLoadPct: 45,
  },
  DIFFUSION_FURNACE: {
    name: 'Thermal Diffusion & Anneal Furnace',
    nameZh: '第4區 · 高溫擴散退火垂直石英爐管 (1100°C)',
    code: 'BAY-104 / FURNACE',
    description:
      'High-temperature quartz furnace stack (1100°C) with automated wafer boat elevator for dopant activation and gate oxidation.',
    descZh:
      '1100°C 高溫石英擴散管垂直爐體，配備全自動石英晶圓舟昇降機，負責高溫退火活化原子與熱氧化生長。',
    nominalTemp: 1050.0,
    nominalPressure: 0.001,
    nominalParticles: 2,
    nominalRfPowerWatts: 1750,
    nominalGasFlowSccm: 90,
    nominalChamberVacuumTorr: 0.001,
    nominalScrubberLoadPct: 64,
  },
  ION_IMPLANTATION: {
    name: 'Ion Implantation Bay (200kV Implanter)',
    nameZh: '第5區 · 高能離子植入機 (200kV 靜電加速與磁分析器)',
    code: 'BAY-105 / IMPLANT',
    description:
      'High-energy electrostatic ion implanter (200kV) with Arsine/Phosphine SDS gas box, mass analyzing magnet, and cryogenic vacuum pumps.',
    descZh:
      '200,000V 超高壓靜電加速離子植入機，配置砷化氫 (AsH3) / 磷化氫 (PH3) 氣體源箱、離子分析磁鐵與超低溫冷阱。負責 P/N 井摻雜。',
    nominalTemp: 24.0,
    nominalPressure: 0.0001,
    nominalParticles: 1,
    nominalHighVoltageKV: 180,
    nominalRfPowerWatts: 1200,
    nominalGasFlowSccm: 80,
    nominalChamberVacuumTorr: 0.0001,
    nominalScrubberLoadPct: 58,
  },
};
