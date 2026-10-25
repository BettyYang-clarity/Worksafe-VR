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
  // Set via VITE_GOOGLE_FORM_ACTION_URL env var or paste your `/formResponse` URL here:
  formActionUrl:
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_FORM_ACTION_URL ||
    '',

  // Entry IDs corresponding to each Google Form question:
  entries: {
    overallRating: 'entry.1000001',
    ehsClarity: 'entry.1000002',
    memorableHazard: 'entry.1000003',
    gameplayFunRating: 'entry.1000004',
    playerBackground: 'entry.1000005',
    commentsAndTelemetry: 'entry.1000006',
  },
};

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
