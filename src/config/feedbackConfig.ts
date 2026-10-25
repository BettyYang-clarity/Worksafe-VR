/**
 * Google Forms Zero-Redirect Integration Configuration
 *
 * HOW TO LINK YOUR GOOGLE FORM (Takes ~2 minutes):
 * 1. Create a Google Form at https://forms.google.com with these 6 recommended fields:
 *    - Q1: Overall Rating (1 to 5 scale or Short Answer)
 *    - Q2: 4-Pillar EHS Clarity (Multiple Choice or Short Answer: "Yes, very clear" / "Somewhat" / "Needs more detail")
 *    - Q3: Most Memorable Hazard Scenario (Short Answer: e.g., "Bay 103 HF Acid" / "Bay 102 Silane Fire")
 *    - Q4: Cleanroom Walkthrough & Recipe Tuning Fun (1 to 5 scale or Short Answer)
 *    - Q5: Player Background / Role (Short Answer: "Fab Engineer" / "EHS Specialist" / "Student" / "General Player")
 *    - Q6: Open Suggestions & Auto-Attached Telemetry (Paragraph)
 * 2. In your Google Form, click the 3-dots menu (top right) -> "Get pre-filled link" (取得預先填入的連結).
 * 3. Fill in dummy values for each question, click "Get link", and copy it.
 * 4. Look at the URL:
 *    `https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?usp=pp_url&entry.111111=5&entry.222222=...`
 * 5. Replace `formActionUrl` below with:
 *    `https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse`
 *    (or set `VITE_GOOGLE_FORM_ACTION_URL` in your `.env` file)
 * 6. Replace the `entry.xxxxxx` IDs in `entries` below with your form's entry IDs.
 */

export interface GoogleFormFeedbackPayload {
  overallRating: number;
  ehsClarity: string;
  memorableHazard: string;
  gameplayFunRating: number;
  playerBackground: string;
  comments: string;
  telemetrySummary: string;
}

export const GOOGLE_FORM_CONFIG = {
  // Set via VITE_GOOGLE_FORM_ACTION_URL env var or defaults to the live form:
  formActionUrl:
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_FORM_ACTION_URL ||
    'https://docs.google.com/forms/d/e/1FAIpQLScdPIjstlQ9fEMGh6L48t5FGba3w4pIQbKw6YO-F7v3XM3ZoA/formResponse',

  // Entry IDs corresponding to each Google Form question:
  entries: {
    overallRating: 'entry.2091963568',
    ehsClarity: 'entry.180923086',
    memorableHazard: 'entry.1149424777',
    gameplayFunRating: 'entry.17447175',
    playerBackground: 'entry.2137945983',
    commentsAndTelemetry: 'entry.655589120',
  },
};

/**
 * Dedicated Google Form used ONLY for silent visit / play counting (PAGE_VIEW, GAME_START, GAME_COMPLETE).
 * It is intentionally separate from the player feedback form above, so automatic pings never
 * pollute the ratings collected from real players.
 *   - 事件類型 (Event Type)  -> entry.1012958305
 *   - 詳細資料 (Details)     -> entry.560609663
 */
export const TELEMETRY_FORM_CONFIG = {
  formActionUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSeJErQsBvKZsNVu6b0RIPl2MzW_0OXbax7VltA_1q6X4ecFAQ/formResponse',
  entries: {
    eventType: 'entry.1012958305',
    details: 'entry.560609663',
  },
};

// Bump when gameplay / scoring rules change so old and new records are not mixed in analysis.
export const GAME_VERSION = 'v5.0-two-phase';

/**
 * Submits feedback directly from the in-game modal to Google Forms using `mode: 'no-cors'`
 * so the player never experiences a page redirect or pop-up blocker.
 * Also stores a local backup in `localStorage` (`worksafe_vr_feedback_submissions_v4`).
 */
export async function submitFeedbackToGoogleForm(
  payload: GoogleFormFeedbackPayload
): Promise<{ sentToGoogleForm: boolean; savedLocally: boolean }> {
  const combinedComments = [
    payload.comments.trim() || '(No additional comments)',
    '---',
    payload.telemetrySummary,
  ].join('\n');

  // Always save a structured copy locally for offline/analytics review
  let savedLocally = false;
  try {
    const existingRaw = localStorage.getItem('worksafe_vr_feedback_submissions_v4');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift({
      ...payload,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('worksafe_vr_feedback_submissions_v4', JSON.stringify(existing.slice(0, 50)));
    savedLocally = true;
  } catch {
    // Ignore localStorage quota errors
  }

  if (!GOOGLE_FORM_CONFIG.formActionUrl) {
    // Simulate smooth network request when no live Google Form endpoint is configured yet
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { sentToGoogleForm: false, savedLocally };
  }

  try {
    const formData = new URLSearchParams();
    formData.append(GOOGLE_FORM_CONFIG.entries.overallRating, String(payload.overallRating));
    formData.append(GOOGLE_FORM_CONFIG.entries.ehsClarity, payload.ehsClarity);
    formData.append(GOOGLE_FORM_CONFIG.entries.memorableHazard, payload.memorableHazard);
    formData.append(GOOGLE_FORM_CONFIG.entries.gameplayFunRating, String(payload.gameplayFunRating));
    formData.append(GOOGLE_FORM_CONFIG.entries.playerBackground, payload.playerBackground);
    formData.append(GOOGLE_FORM_CONFIG.entries.commentsAndTelemetry, combinedComments);

    await fetch(GOOGLE_FORM_CONFIG.formActionUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    return { sentToGoogleForm: true, savedLocally };
  } catch {
    return { sentToGoogleForm: false, savedLocally };
  }
}

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('worksafe_vr_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('worksafe_vr_session_id', sid);
    }
    return sid;
  } catch {
    return 'sess_anonymous';
  }
}

export interface TelemetryPingData {
  eventType: 'PAGE_VIEW' | 'GAME_START' | 'GAME_COMPLETE';
  playerName?: string;
  shiftMode?: string;
  yieldPct?: number;
  safetyScore?: number;
  wafersProduced?: number;
  preAlarmsPrevented?: number;
  incidentsResolved?: number;
  incidentsEncountered?: number;
  fabValueSavedM?: number;
}

/**
 * Automatically sends silent telemetry pings (Page View, Game Start, Game Complete)
 * to Google Forms so the admin can monitor total visits, plays, and completions in Google Sheets.
 */
export async function sendTelemetryPing(data: TelemetryPingData): Promise<void> {
  if (!TELEMETRY_FORM_CONFIG.formActionUrl) return;

  const sessionId = getOrCreateSessionId();
  const screenInfo = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A';
  const language = typeof navigator !== 'undefined' ? navigator.language : 'N/A';
  const referrer = typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct / Bookmark';

  // Shift ID pairs GAME_START with its GAME_COMPLETE; completion is only counted once per shift.
  let shiftId = 'N/A';
  try {
    if (data.eventType === 'GAME_START') {
      shiftId = 'shift_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem('worksafe_vr_current_shift_id', shiftId);
    } else if (data.eventType === 'GAME_COMPLETE') {
      shiftId = sessionStorage.getItem('worksafe_vr_current_shift_id') || 'shift_unknown';
      const doneKey = 'worksafe_vr_shift_completed_' + shiftId;
      if (sessionStorage.getItem(doneKey)) return;
      sessionStorage.setItem(doneKey, 'true');
    }
  } catch {
    // Ignore sessionStorage restriction errors
  }

  let details = '';

  const nowStr = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  if (data.eventType === 'PAGE_VIEW') {
    details = [
      '【WorkSafe VR 自動遙測 - 網頁瀏覽】',
      `事件類別: PAGE_VIEW (訪客開啟遊戲首頁)`,
      `遊戲版本: ${GAME_VERSION}`,
      `連線代號: ${sessionId}`,
      `記錄時間: ${nowStr} (Taipei)`,
      `裝置解析度: ${screenInfo} | 語系: ${language}`,
      `來源網址: ${referrer}`,
    ].join('\n');
  } else if (data.eventType === 'GAME_START') {
    const modeSec = data.shiftMode === 'HAZARD_DRILL' ? 240 : 360;
    details = [
      '【WorkSafe VR 自動遙測 - 開始當班】',
      `事件類別: GAME_START (玩家開始值班)`,
      `遊戲版本: ${GAME_VERSION}`,
      `班次代號: ${shiftId}`,
      `連線代號: ${sessionId}`,
      `操作員代號: ${data.playerName || 'Anonymous'}`,
      `班別模式: ${data.shiftMode || 'FULL_SHIFT'} (${modeSec / 60}-min / ${modeSec}s SIM)`,
      `記錄時間: ${nowStr} (Taipei)`,
    ].join('\n');
  } else if (data.eventType === 'GAME_COMPLETE') {
    details = [
      '【WorkSafe VR 自動遙測 - 班次通關結算】',
      `事件類別: GAME_COMPLETE (值班完成進入結算)`,
      `遊戲版本: ${GAME_VERSION}`,
      `班次代號: ${shiftId}`,
      `連線代號: ${sessionId}`,
      `操作員代號: ${data.playerName || 'Anonymous'}`,
      `班別模式: ${data.shiftMode || 'FULL_SHIFT'}`,
      `晶圓良率: ${data.yieldPct !== undefined ? data.yieldPct.toFixed(1) + '%' : 'N/A'}`,
      `工安合規分: ${data.safetyScore !== undefined ? data.safetyScore + '/100' : 'N/A'}`,
      `合格產出: ${data.wafersProduced ?? 0} 片`,
      `第一階段排障成功: ${data.preAlarmsPrevented ?? 0} 起`,
      `第二階段處置成功: ${data.incidentsResolved ?? 0} / ${data.incidentsEncountered ?? 0}`,
      `保全廠區價值: $${data.fabValueSavedM !== undefined ? data.fabValueSavedM.toFixed(1) + 'M USD' : 'N/A'}`,
      `記錄時間: ${nowStr} (Taipei)`,
    ].join('\n');
  }

  try {
    // Sent to the dedicated telemetry form only (no rating fields), so real feedback ratings stay clean.
    const formData = new URLSearchParams();
    formData.append(TELEMETRY_FORM_CONFIG.entries.eventType, data.eventType);
    formData.append(TELEMETRY_FORM_CONFIG.entries.details, details);

    await fetch(TELEMETRY_FORM_CONFIG.formActionUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  } catch {
    // Ignore any network failures for background telemetry
  }
}
