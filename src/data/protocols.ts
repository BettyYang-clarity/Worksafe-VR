import { HazardLevel, HazardSeverity, SectorId } from '../types/game';

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
  // LEVEL 1: MECHANICAL / ROBOT ARM / LOTO
  // ==========================================
  {
    typeId: 'ROBOTIC_FOUP_PINCH',
    level: 'LEVEL_1_MECHANICAL',
    title: 'Automated Overhead Hoist Transport (OHT) Mechanical Pinch Incident',
    titleZh: '微影曝光區 (Bay 101) 空中無人天車 (OHT) 機械臂人員夾傷危機',
    defaultSector: 'PHOTOLITHOGRAPHY',
    severity: 'HIGH',
    timeLimitSec: 35,
    description: "An automated ceiling OHT wafer carrier robot descending onto the Photolithography load port has trapped a technician's arm against the docking nest. Audio alarms are screaming and drive motor is stalling.",
    descZh: '微影機台裝載口上方，空中搬運天車(OHT)抓取晶圓盒(FOUP)下降時發生機械定位干涉，伺服驅動機械臂強行咬夾技術員前臂！驅動馬達持續過載尖叫，受害者面臨粉碎性骨折危機。',
    regulatoryStandard: 'OSHA 1910.147 (LOTO) / SEMI S8-0712',
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
            explanation: 'Correct! Slams emergency mechanical brakes and de-energizes the 48V servo drive instantly.',
            explanationZh: '處置正確！迅速釋放高扭力過載，常閉機械剎車立即制動，避免伺服馬達持續下壓造成肢體截斷。',
          },
          {
            id: 'pull_operator_free',
            label: 'Yank Operator by Shoulders to Pull Out',
            labelZh: '徒手用力抓住受傷人員肩膀往外死命拉扯',
            description: 'Use physical force to pull worker free while robot motor is energized.',
            descZh: '在機械手臂通電咬死狀態下以人力強行拖曳傷患。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Severe crush injury! Pulling against high-torque stalled servomotors causes traumatic compound fractures.',
            explanationZh: '重大二度傷害！伺服驅動具數百牛頓夾持力，強行拉扯將當場造成皮膚撕脫與開放性骨折！',
          },
          {
            id: 'try_remote_software_jog',
            label: 'Jog Robot Axis from Maintenance Touchscreen',
            labelZh: '在電腦螢幕上點擊點動 (Jog) 軸向試圖反轉伺服',
            description: 'Attempt software jog movement while victim is pinned.',
            descZh: '嘗試以軟體手動點動反轉機械臂。',
            isCorrect: false,
            explanation: 'Dangerous protocol violation! Software jogging can reverse into wrong direction or hit software limits.',
            explanationZh: '嚴重違規！受困情境下軟體點動方向判定易出錯，可能反向加壓造成二度重創！',
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
            description: 'Lock out main breaker with physical padlock; use mechanical release lever to ease clamping pressure.',
            descZh: '於控制箱掛上個人安全上鎖掛牌，使用手動機械釋放桿平穩洩壓。',
            isCorrect: true,
            explanation: 'Correct! Adheres to OSHA 1910.147 zero energy state rule, safely relieving pinch pressure without sudden drops.',
            explanationZh: '符合 OSHA 1910.147 零能量準則！安全洩除機械重力位能，且杜絕他人誤送電的可能。',
          },
          {
            id: 'turn_power_back_on',
            label: 'Cycle Main Circuit Breaker to Reset Error',
            labelZh: '重新開啟主電源開關試圖復歸伺服警報',
            description: 'Re-energize electrical cabinet to reboot robotic controller.',
            descZh: '重送電源使手臂自動執行回原點 (Home) 循環。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Deadly error! Re-energizing with victim trapped re-engages maximum torque homing cycle.',
            explanationZh: '致命行為！在人員受困時重新通電，機器人將啟動全扭力原點復歸，造成二次毀滅性碾壓！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // LEVEL 2: CHEMICAL & TOXIC GAS LEAKS
  // ==========================================
  {
    typeId: 'ARSINE_GAS_LEAK',
    level: 'LEVEL_2_CHEMICAL_LEAK',
    title: 'Arsine (AsH3) Ion Source Enclosure Toxic Gas Leak',
    titleZh: '離子植入機 (Bay 105) 砷化氫 (AsH3) 離子源箱劇毒氣體外洩',
    defaultSector: 'ION_IMPLANTATION',
    severity: 'CATASTROPHIC',
    timeLimitSec: 35,
    description: 'TGMS sniffer at Ion Implanter Source Head detects Arsine (AsH3) at 1.8 PPM (TLV is 0.005 PPM). Arsine is a lethal hemolytic poison with a garlic-like odor, causing rapid organ failure upon inhalation.',
    descZh: '離子植入機離子源箱 (Source Head) 陰極放電密封老化失壓，高靈敏 TGMS 感測器測得劇毒砷化氫 (AsH3) 達 1.8 PPM (法定極限僅 0.005 PPM)！砷化氫具強烈溶血毒性與蒜臭味，吸入數口即可致死。',
    regulatoryStandard: 'SEMI S2-0712 §13.5 (Toxic Gas) / OSHA 1910.1000',
    steps: [
      {
        prompt: 'Immediate Gas Abort & SDS Cylinder Spring Cutoff (Stage 1):',
        promptZh: '第一階段：緊急急停切斷 (EMO) 與 SDS 次常壓鋼瓶彈簧閥關閉',
        choices: [
          {
            id: 'ion_emo_sds_abort',
            label: 'Strike Ion Source EMO & Trip SDS Sub-Atmospheric Cylinder Solenoid',
            labelZh: '拍擊離子源專用 EMO 按鈕，觸發 SDS 次常壓鋼瓶安全閥門瞬間緊閉',
            description: 'De-energize extraction power supply and close pneumatic cylinder valve within 200ms.',
            descZh: '切斷 40kV 萃取電源並釋放氣動訊號，彈簧閥於 200 毫秒內機械閉鎖阻斷劇毒氣體源。',
            isCorrect: true,
            explanation: 'Correct! Instantly isolates toxic hydride gas at sub-atmospheric cylinder neck and kills ionizing extraction arc.',
            explanationZh: '處置完全正確！SDS 負壓鋼瓶閥門立即鎖死，徹底阻絕劇毒砷化物進入真空游離腔。',
          },
          {
            id: 'open_source_box_inspect',
            label: 'Unscrew Source Cabinet Panel to Locate O-Ring Leak',
            labelZh: '旋開離子源箱維修門板試圖尋找密封圈洩漏點',
            description: 'Look inside toxic cabinet with handheld flashlight.',
            descZh: '徒手解開源箱門扣拿手電筒照射檢查。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Lethal exposure! Opening toxic cabinet releases lethal Arsine concentration into the breathing zone.',
            explanationZh: '致命毒害！開啟源箱將使數十倍致死濃度的砷化氫直接衝入呼吸防線，當場引發急性溶血與呼吸衰竭！',
          },
          {
            id: 'lower_filament_current',
            label: 'Dial Down Filament Current from Remote Software Terminal',
            labelZh: '在操作電腦軟體上調低燈絲電流至待機設定',
            description: 'Attempt software adjustment without physical EMO trip.',
            descZh: '不想全面停機，嘗試以軟體指令微調功率。',
            isCorrect: false,
            explanation: 'Dangerous violation! Chemical line breaches cannot be resolved via software. Physical EMO is mandatory under SEMI S2.',
            explanationZh: '嚴重違規！物理性密封破裂無法依賴軟體降載，必須立即物理斷電斷氣！',
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
            description: 'Direct toxic line to point-of-use thermal decomposition scrubber to crack AsH3.',
            descZh: '以高純氮氣推送，進入 850°C 高溫水洗燃燒洗滌塔完全熱解為無害砷酸鹽。',
            isCorrect: true,
            explanation: 'Correct! Thermal abatement destroys arsine gas safely without atmospheric emission or duct buildup.',
            explanationZh: '標準半導體環安流程！點火水洗塔高溫完全裂解有毒氣體，杜絕風管腐蝕與大氣污染。',
          },
          {
            id: 'vent_to_subfab_sump',
            label: 'Dump Exhaust into Sub-Fab Wet Chemical Sump',
            labelZh: '將真空泵廢氣直接排入廠房地下排水坑',
            description: 'Route exhaust down into basement wastewater trench.',
            descZh: '圖省事將排氣軟管拉至下夾層排水溝。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Severe violation! Draining toxic hydride into aqueous sump reacts to form explosive, lethal gas pockets.',
            explanationZh: '嚴重違規！劇毒氣體排入水溝將在上百米下夾層蓄積致命毒氣，危害整座晶圓廠地下維護人員！',
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
            explanation: 'Complies fully with SEMI S2 Life Safety standard. Protects worker lives and cleanroom integrity.',
            explanationZh: '卓越處置！全員依逆風方向撤離至安全集結點，未穿戴 SCBA 自給式呼吸器者嚴禁折返。',
          },
          {
            id: 'tell_workers_hold_breath',
            label: 'Instruct Workers to Hold Breath and Finish Wafer Lot',
            labelZh: '廣播要求技術員屏住呼吸先將機台內最後 5 片晶圓打完',
            description: 'Prioritize production output over toxic gas alarm.',
            descZh: '為追趕交期要求現場人員暫緩疏散。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Criminal OSHA violation! Toxic hydride gas exposure causes fatal internal hemorrhage within minutes.',
            explanationZh: '重大刑事工安犯罪！任何危害生命的延遲疏散均屬不可赦之嚴重違法行為！',
          },
        ],
      },
    ],
  },
  {
    typeId: 'HF_ACID_SPILL',
    level: 'LEVEL_2_CHEMICAL_LEAK',
    title: 'Hydrofluoric Acid (HF) Line Rupture & Skin Exposure',
    titleZh: '化學清洗機 (Bay 103) 氫氟酸 (HF) 輸送管破裂與人員皮膚接觸危害',
    defaultSector: 'CMP_WET_BENCH',
    severity: 'CATASTROPHIC',
    timeLimitSec: 35,
    description: 'A pressurized Hydrofluoric Acid (49% HF) delivery manifold has ruptured during wafer etch bath circulation. An operator is contaminated on forearm and cleanroom bunny suit. HF penetrates deep into bone tissue without immediate burn sensation.',
    descZh: '晶圓酸洗蝕刻循環中，高壓49%氫氟酸(HF)管路接頭破裂噴濺！一名操作員前臂及無塵衣遭酸液浸潤。氫氟酸具強烈滲透性，無即時燒灼感卻會侵蝕深層骨骼神經，引發致命性低血鈣症。',
    regulatoryStandard: 'OSHA 1910.1200 / SEMI S2-0712 §15.2',
    steps: [
      {
        prompt: 'Immediate Operator Rescue & Decontamination (Stage 1):',
        promptZh: '第一階段：人員緊急搶救與脫除污染衣物',
        choices: [
          {
            id: 'emergency_shower_strip',
            label: 'Activate Emergency Shower & Strip Bunny Suit',
            labelZh: '拉下緊急沖淋拉桿，並立即脫除受污染無塵衣',
            description: 'Direct victim under deluge shower immediately; strip contaminated PPE under flowing water for 5 minutes minimum.',
            descZh: '迅速引導傷患至緊急沖淋洗眼器下方，持續沖水至少5分鐘，並在流水中褪去遭酸液浸透之防護衣物。',
            isCorrect: true,
            explanation: 'Correct! Rapid dilution and physical removal of HF-saturated PPE prevents systemic calcium depletion and acute cardiac arrest.',
            explanationZh: '處置完全正確！大量清水即時稀釋並脫除衣物，能阻絕高濃度HF持續透過真皮吸收，防止心臟驟停。',
          },
          {
            id: 'wipe_with_cloth',
            label: 'Wipe Area with Cleanroom Dry Wipes',
            labelZh: '使用無塵專用擦拭紙先擦乾手臂表皮',
            description: 'Pat dry the contaminated suit before moving victim.',
            descZh: '試圖在移動人員前先以乾布吸乾表面酸液。',
            isCorrect: false,
            explanation: 'Fatal delay! Dry wiping spreads concentrated HF across larger skin surfaces and delays urgent water dilution.',
            explanationZh: '嚴重錯誤！乾布擦拭會將高濃度氫氟酸擴散至更大皮表區域，並延誤最關鍵的大量清水沖洗時間！',
          },
          {
            id: 'walk_to_medical_office',
            label: 'Escort Victim Walking to Outer Medical Clinic',
            labelZh: '直接攙扶傷患徒步前往廠區外圍醫務室',
            description: 'Have operator walk through gowning airlock to main health office.',
            descZh: '穿過氣閘室前往主廠區健康中心尋求協助。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Catastrophic violation! HF causes rapid systemic hypocalcemia. Walking spreads contamination through airlocks and wastes critical seconds.',
            explanationZh: '致命違規！氫氟酸吸收迅速，長途走動會加快血液循環誘發心律不整，更會將強酸劇毒污染擴散至整座氣閘與走道！',
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
            description: 'Massage calcium gluconate antidote gel continuously using nitrile gloves into affected skin until pain subsides.',
            descZh: '穿戴抗化手套，將專用葡萄糖酸鈣凝膠均勻且持續按摩塗抹於患部，直至劇痛緩解。',
            isCorrect: true,
            explanation: 'Correct! Free calcium ions bind the deadly fluoride ions, precipitating insoluble CaF2 and halting bone/nerve necrosis.',
            explanationZh: '標準法規處置！解毒劑游離鈣離子與劇毒氟離子結合生成不溶性氟化鈣(CaF2)，即時終止深層骨骼與神經壞死。',
          },
          {
            id: 'apply_aloe_vera',
            label: 'Apply Standard Burn Ointment / Aloe Vera',
            labelZh: '塗抹一般消炎燙傷膏或蘆薈凝膠',
            description: 'Use first-aid cabinet antiseptic burn cream.',
            descZh: '使用普通急救箱內的殺菌燙傷藥膏。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Fatal mistake! Standard burn ointments do not neutralize fluoride ions. HF will continue dissolving deep bone structures.',
            explanationZh: '致命疏失！一般燙傷藥膏完全無法中和氟離子，氟離子將持續侵蝕骨髓，數小時內導致截肢或器官衰竭！',
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
            description: 'Contain spill perimeter with polypropylene absorbent, verify scrubbed exhaust pulls 100% negative draft.',
            descZh: '於溢流外圍圍堵專用吸液棉，確認洗滌塔排氣風門全開以維持負壓，防止酸氣外溢。',
            isCorrect: true,
            explanation: 'Correct! Isolates toxic acid fumes from cleanroom recirculating air handlers (AHUs) and contains floor runoff.',
            explanationZh: '卓越處置！徹底隔離酸性揮發氣體，防止有害氣體進入無塵室天花板循環空調箱(AHU)。',
          },
          {
            id: 'wash_down_drain',
            label: 'Hose Spill into Cleanroom Raised Floor Plenum',
            labelZh: '拿超純水高壓水管直接將酸液沖入高架地板孔洞',
            description: 'Flush chemical residue down perforated floor tiles with DI water.',
            descZh: '沖洗地板殘液直接流落下層氣體回風夾層。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Severe violation! Flushing into sub-fab plenum contaminates entire facility basement air and creates massive toxic vapor cloud.',
            explanationZh: '重大公安違規！沖入高架地板夾層會讓數十公升酸液蒸發至整座半導體廠下夾層，引發全廠緊急疏散與毀滅性污染！',
          },
        ],
      },
    ],
  },

  // ==========================================
  // LEVEL 3: FATAL CRISES (EMO <3s / RETREAT)
  // ==========================================
  {
    typeId: 'SILANE_GAS_LEAK',
    level: 'LEVEL_3_FATAL_CRISIS',
    title: 'Pyrophoric Silane (SiH4) Spontaneous Fire & Explosion',
    titleZh: '薄膜沉積 (Bay 102) 矽甲烷 (SiH4) 自燃性火災與爆炸危機',
    defaultSector: 'ETCH_CVD',
    severity: 'CATASTROPHIC',
    timeLimitSec: 25,
    description: 'TGMS sensor at Plasma CVD Chamber B detects Silane (SiH4) at 5 PPM (TLV is 0.5 PPM). Silane is pyrophoric and ignites spontaneously in air, triggering flashover fireballs and high-pressure detonation.',
    descZh: 'CVD沉積腔體B側之毒氣監控系統 (TGMS) 偵測到矽甲烷(SiH4)濃度飆升至 5 PPM (法定容許值僅0.5 PPM)。矽甲烷為極危險自燃性氣體，接觸空氣瞬間即發生自燃並引爆衝擊波！',
    regulatoryStandard: 'SEMI S2-0712 §13 / NFPA 318',
    steps: [
      {
        prompt: 'Immediate EMO Button Slam & Gas Abort (Stage 1 - <3 Seconds):',
        promptZh: '第一階段：3秒內自保拍擊 EMO 緊急停機與特氣切斷 (Gas Abort)',
        choices: [
          {
            id: 'hit_emo_gas_abort',
            label: 'Strike Emergency Machine Off (EMO) & Gas Abort Button',
            labelZh: '拍擊機台旁 EMO 緊急停機按鈕與氣體切斷閥 (Gas Abort)',
            description: 'Trip local EMO mushroom button to slam pneumatically closed the cylinder valve and gas manifold.',
            descZh: '擊發 EMO 紅色蘑菇頭急停開關，彈簧氣動氣閥於200毫秒內全數強力緊閉。',
            isCorrect: true,
            explanation: 'Correct! EMO instantaneously cuts pneumatic supply pressure, spring-closing the hazardous production gas valve within 200 milliseconds.',
            explanationZh: '正確！EMO瞬間釋放氣動氣源，使特殊氣體閥箱(VMB)之安全彈簧閥於200ms內機械鎖死，阻斷供氣。',
          },
          {
            id: 'open_chamber_inspect',
            label: 'Open Chamber Lid to Inspect Fitting Leak',
            labelZh: '扳開真空腔體外蓋檢視管接頭洩漏點',
            description: 'Manually unclamp CVD reactor flange to tighten fitting.',
            descZh: '徒手解開 CVD 反應室法蘭管件試圖鎖緊。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Explosion! Introducing atmospheric oxygen into pure silane gas triggers immediate spontaneous detonation.',
            explanationZh: '劇烈爆炸！將大氣氧氣直接引入高濃度矽甲烷管路，將觸發超音速閃燃爆轟，當場炸毀機台！',
          },
          {
            id: 'use_water_extinguisher',
            label: 'Spray Water Extinguisher on Burning Gas Flange',
            labelZh: '使用無塵室消火栓高壓水龍帶直接噴射著火法蘭',
            description: 'Direct high-pressure water stream at silane flame.',
            descZh: '用水直接噴灑矽甲烷燃燒源。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Violent steam explosion! Water reacts violently with burning silane, generating hydrogen gas and secondary blast wave.',
            explanationZh: '致命毀滅！水與高溫矽甲烷反應將產生氫氣並引發劇烈蒸氣爆炸，造成人員當場傷亡！',
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
            description: 'Flood gas line with inert Nitrogen purge gas to sweep residual silane directly into thermal wet abatement scrubber.',
            descZh: '以惰性氮氣稀釋並將殘餘矽甲烷推送至尾氣處理機(Local Scrubber)完全高溫裂解。',
            isCorrect: true,
            explanation: 'Correct! Inert N2 displaces pyrophoric gas below Lower Explosive Limit (LEL) safely into burning water scrubber.',
            explanationZh: '完全合規！惰性氮氣吹驅使自燃性氣體濃度降至爆炸下限(LEL)以下，並完全裂解無害化。',
          },
          {
            id: 'vent_to_roof_exhaust',
            label: 'Bypass Scrubber to Standard Roof Vent',
            labelZh: '手動跳過尾氣處理機，直接將氣體排至廠房屋頂一般排氣口',
            description: 'Vent gas directly to outdoor atmosphere to clear bay faster.',
            descZh: '繞過洗滌設備直接排向戶外大氣。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Environmental disaster & roof explosion! Silane must pass through high-temperature decomposition scrubber first.',
            explanationZh: '嚴重違規！未經燃燒洗滌之矽甲烷排至大氣將在排氣管出口自燃引爆，觸犯重大環保法規！',
          },
        ],
      },
    ],
  },
  {
    typeId: 'ION_HV_ARC_XRAY',
    level: 'LEVEL_3_FATAL_CRISIS',
    title: '200kV Acceleration Column Arc Flash & X-Ray Radiation Interlock Breach',
    titleZh: '離子植入機 (Bay 105) 200kV 靜電加速管跳火與次生 X 射線防護失效',
    defaultSector: 'ION_IMPLANTATION',
    severity: 'HIGH',
    timeLimitSec: 35,
    description: 'Catastrophic dielectric breakdown inside the 200,000V high-voltage electrostatic accelerator tube has caused severe electrical arcing. High-energy ion impact produces secondary X-ray Bremsstrahlung radiation while interlock switches are jammed.',
    descZh: '離子植入機加速管施加高達 200kV 直流高壓，絕緣套管表面引發連續性電弧跳火！高能離子轟擊金屬引發次生 X 光制動輻射 (Bremsstrahlung)，且外門防護安全開關出現機械卡死訊號！',
    regulatoryStandard: 'NFPA 70E (Electrical) / SEMI S2-0712 §16 (Radiation Safety)',
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
            explanation: 'Correct! Eliminates incoming line power to the 200kV Cockcroft-Walton voltage multiplier stack.',
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
            explanation: 'Lethal electrocution arc! Internal capacitor banks store fatal electrical charge capable of jumping air gaps.',
            explanationZh: '致命高壓電擊！高壓電容排儲存高達數千焦耳能量，接近時電弧將直接跳火貫穿人體！',
          },
          {
            id: 'reboot_hv_controller',
            label: 'Cycle Software High-Voltage Switch on Touchscreen',
            labelZh: '在機台觸控面板上點擊重開機按鈕以消除跳火警報',
            description: 'Attempt software power reboot.',
            descZh: '將硬體電弧視為軟體通訊異常而嘗試重新開機。',
            isCorrect: false,
            explanation: 'Severe hazard! Software reboots will re-energize the stalled high-voltage breakdown, causing transformer explosion.',
            explanationZh: '嚴重危險！重新通電將向已擊穿的絕緣層再度注入高壓，引發變壓器油箱劇烈爆炸！',
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
            explanation: 'Exemplary semiconductor tool maintenance! Physically confirms zero electrical potential before technician entry.',
            explanationZh: '半導體最高規格標準作業！實體確認殘餘電位歸零，消除電容殘留電壓之隱形致命陷阱。',
          },
          {
            id: 'trust_voltmeter_display',
            label: 'Assume Zero Energy Because Digital Display Reads 0.0V',
            labelZh: '因為螢幕電壓錶顯示 0.0V，故跳過接地放電棒直接以徒手觸摸',
            description: 'Rely solely on digital instrument readings without physical verification.',
            descZh: '認為斷電後儀表歸零即可安全接觸。',
            isCorrect: false,
            isFatalError: true,
            explanation: 'Fatal mistake! Voltage dividers often blow during arc flash, falsely displaying 0V while 80kV remains trapped in capacitors.',
            explanationZh: '致命疏忽！高壓分壓電阻常在跳火中燒斷而顯示假 0V，電容內仍蓄積數萬伏特足以瞬間致命！',
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
            description: 'Verify secondary Bremsstrahlung radiation is below 0.2 µSv/h before resuming wafer production.',
            descZh: '確認游離輻射數值完全落入安全背景區間，並填寫輻射防護檢驗工單。',
            isCorrect: true,
            explanation: 'Fully compliant with SEMI S2 Section 16 Radiation Criteria. Secures cleanroom operator health.',
            explanationZh: '符合 SEMI S2 游離輻射防護標準！確認鉛屏蔽完好無射線洩漏，方可簽署復機。',
          },
          {
            id: 'ignore_radiation_test',
            label: 'Skip Radiation Survey to Save 15 Minutes and Resume Lot',
            labelZh: '為搶救晶圓批次進度，省略蓋革檢測直接呼叫 AGV 天車送入新晶圓',
            description: 'Bypass radiation verification to boost fab throughput.',
            descZh: '忽視無形輻射危害，急於復機上料。',
            isCorrect: false,
            explanation: 'Regulatory violation! Breached shielding exposes subsequent shifts to cumulative ionizing radiation.',
            explanationZh: '嚴重法規違規！未經游離輻射檢驗復機將使無辜接班工程師遭受無形慢性輻射傷害！',
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
    description: '193nm Deep-UV Immersion Scanner with robotic wafer chuck, laser alignment optics, and yellow safe-light filter.',
    descZh: '193nm 深紫外光浸潤式微影曝光機，配備高精度晶圓真空吸盤、雷射對位鏡組與黃光防護罩。產線瓶頸第一站。',
    nominalTemp: 20.0,
    nominalPressure: 760,
    nominalParticles: 1,
    nominalRfPowerWatts: 800,
    nominalGasFlowSccm: 40,
    nominalChamberVacuumTorr: 760,
    nominalScrubberLoadPct: 35,
  },
  ION_IMPLANTATION: {
    name: 'Ion Implantation Bay (200kV Implanter)',
    nameZh: '第5區 · 高能離子植入機 (200kV 靜電加速與磁分析器)',
    code: 'BAY-105 / IMPLANT',
    description: 'High-energy electrostatic ion implanter (200kV) with Arsine/Phosphine SDS gas box, mass analyzing magnet, and cryogenic vacuum pumps.',
    descZh: '200,000V 超高壓靜電加速離子植入機，配置砷化氫 (AsH3) / 磷化氫 (PH3) 氣體源箱、離子分析磁鐵與超低溫冷阱。負責 P/N 井摻雜。',
    nominalTemp: 24.0,
    nominalPressure: 0.0001,
    nominalParticles: 1,
    nominalHighVoltageKV: 180,
    nominalRfPowerWatts: 1200,
    nominalGasFlowSccm: 85,
    nominalChamberVacuumTorr: 0.0001,
    nominalScrubberLoadPct: 60,
  },
  ETCH_CVD: {
    name: 'Plasma Etch & CVD Bay (Vacuum Chamber)',
    nameZh: '第2區 · 電漿乾蝕刻與化學氣相沉積 (CVD 真空腔體)',
    code: 'BAY-102 / PLASMA',
    description: 'Inductively coupled plasma dry etcher with Silane (SiH4), Chlorine (Cl2), and Argon manifold feeds under deep vacuum.',
    descZh: '高密度感應耦合電漿乾蝕刻設備，配置矽甲烷(SiH4)、氯氣(Cl2)與氬氣(Ar)高壓真空管閥系統。',
    nominalTemp: 65.0,
    nominalPressure: 0.05,
    nominalParticles: 3,
    nominalRfPowerWatts: 1500,
    nominalGasFlowSccm: 120,
    nominalChamberVacuumTorr: 0.05,
    nominalScrubberLoadPct: 75,
  },
  CMP_WET_BENCH: {
    name: 'CMP & Acid Wet Bench (Chemical Wash)',
    nameZh: '第3區 · 化學機械研磨 (CMP) 與酸槽清洗機台',
    code: 'BAY-103 / CMP-CHEM',
    description: 'Chemical Mechanical Planarization pad with silica abrasive slurry and Hydrofluoric / Sulfuric acid wet etching stations.',
    descZh: '奈米級化學機械平坦化研磨墊、二氧化矽研磨液，以及配置氫氟酸(HF)與硫酸(H2SO4)之酸洗機台，旁設緊急沖淋洗眼站。',
    nominalTemp: 22.5,
    nominalPressure: 760,
    nominalParticles: 2,
    nominalRfPowerWatts: 600,
    nominalGasFlowSccm: 30,
    nominalChamberVacuumTorr: 760,
    nominalScrubberLoadPct: 45,
  },
  DIFFUSION_FURNACE: {
    name: 'Thermal Diffusion & Anneal Furnace',
    nameZh: '第4區 · 高溫擴散退火垂直石英爐管 (1100°C)',
    code: 'BAY-104 / FURNACE',
    description: 'High-temperature quartz furnace stack (1100°C) with automated wafer boat elevator for dopant activation and gate oxidation.',
    descZh: '1100°C 高溫石英擴散管垂直爐體，配備全自動石英晶圓舟昇降機，負責高溫退火活化原子與熱氧化生長。',
    nominalTemp: 1050.0,
    nominalPressure: 0.001,
    nominalParticles: 2,
    nominalRfPowerWatts: 2000,
    nominalGasFlowSccm: 95,
    nominalChamberVacuumTorr: 0.001,
    nominalScrubberLoadPct: 70,
  },
};
