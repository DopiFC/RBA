import type {
  SurveySubmissionPayload,
  SurveyFeedbackPayload,
} from '../types/survey.ts';
import { calculateSurveyResults } from './scoring.ts';

export interface SubmissionResult {
  success: boolean;
  storedInGoogleSheets?: boolean;
  emailSent?: boolean;
  error?: string;
  isDuplicate?: boolean;
}

const APPS_SCRIPT_FALLBACK_URL =
  (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxVN0LDgIB5PzS2ValE0TbZINZb2UponE4dZcWsQ-VZoROx1_82ldPY3zBaX3SPgHeM/exec';

const LOCAL_SUBMITTED_EMAILS_KEY = 'rba_submitted_emails_v1';

/**
 * Checks if an email address has already been submitted for the survey.
 * Works seamlessly on both full-stack (Cloud Run/Express) and static hosts (GitHub Pages).
 */
export async function checkEmailHasSubmitted(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Check local session cache
  try {
    const raw = localStorage.getItem(LOCAL_SUBMITTED_EMAILS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.includes(cleanEmail)) {
        return true;
      }
    }
  } catch {}

  // 2. Try Backend API first (when running on Cloud Run / Node server)
  try {
    const res = await fetch(`/api/survey/check-email?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.exists) {
        markEmailSubmittedLocally(cleanEmail);
        return true;
      }
    }
  } catch {}

  // 3. Fallback for static hosts (GitHub Pages) via Google Apps Script Web App
  if (APPS_SCRIPT_FALLBACK_URL) {
    try {
      const separator = APPS_SCRIPT_FALLBACK_URL.includes('?') ? '&' : '?';
      const scriptUrl = `${APPS_SCRIPT_FALLBACK_URL}${separator}action=checkEmail&email=${encodeURIComponent(cleanEmail)}`;
      const res = await fetch(scriptUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.exists) {
          markEmailSubmittedLocally(cleanEmail);
          return true;
        }
      }
    } catch {}
  }

  return false;
}

function markEmailSubmittedLocally(email: string) {
  try {
    const raw = localStorage.getItem(LOCAL_SUBMITTED_EMAILS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(email)) {
      list.push(email);
      localStorage.setItem(LOCAL_SUBMITTED_EMAILS_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Submits the completed survey:
 * 1. Checks duplicate email.
 * 2. Attempts backend API /api/survey/submit (Cloud Run / Node server).
 * 3. If running on static host (GitHub Pages where /api is 404), directly posts to Google Apps Script.
 * 4. Ensures the participant ALWAYS proceeds to view their diagnostic report and download PDF.
 */
export async function submitSurveyData(
  payload: SurveySubmissionPayload,
  checkDuplicateEmail: boolean = true
): Promise<SubmissionResult> {
  if (checkDuplicateEmail && payload.email) {
    const alreadySubmitted = await checkEmailHasSubmitted(payload.email);
    if (alreadySubmitted) {
      return {
        success: false,
        isDuplicate: true,
        error: `Địa chỉ email này (${payload.email}) đã tham gia khảo sát trước đó. Theo quy chuẩn nghiên cứu, mỗi người tham gia chỉ được khảo sát một lần duy nhất.`,
      };
    }
  }

  let storedInGoogleSheets = false;
  let emailSent = false;
  let submittedToServer = false;

  // Step 1: Try server API route (Cloud Run / Node backend)
  try {
    const res = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        submittedToServer = true;
        storedInGoogleSheets = !!data.storedInGoogleSheets;
        emailSent = !!data.emailSent;
      }
    }
  } catch {
    // Backend API not reachable (e.g. running on static GitHub Pages)
  }

  // Step 2: If on static host (GitHub Pages) or server did not connect to Apps Script
  if (!submittedToServer && APPS_SCRIPT_FALLBACK_URL) {
    try {
      const scoring = calculateSurveyResults(payload.answers, payload.responseId);
      const indScores: Record<string, number | null> = {};
      Object.keys(scoring.indicatorScores).forEach((k) => {
        indScores[k] = scoring.indicatorScores[k].normalizedIndex;
      });

      const groupScores: Record<string, number | null> = {
        market: scoring.groups.market.averageIndex,
        operations: scoring.groups.operations.averageIndex,
        pricing: scoring.groups.pricing.averageIndex,
        governance: scoring.groups.governance.averageIndex,
        sustainability: scoring.groups.sustainability.averageIndex,
      };

      const fullPayload = {
        type: 'survey',
        ...payload,
        scores_individual: indScores,
        group_scores: groupScores,
        overallAttentionIndex: scoring.overallAttentionIndex,
        overallBand: scoring.overallBand,
        validCount: scoring.validCount,
      };

      await fetch(APPS_SCRIPT_FALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(fullPayload),
        mode: 'no-cors',
      });

      storedInGoogleSheets = true;
      emailSent = true;
    } catch (scriptErr) {
      console.warn('[Adapter] Direct Apps Script sync notice:', scriptErr);
    }
  }

  // Mark local email submission
  if (payload.email) {
    markEmailSubmittedLocally(payload.email.trim().toLowerCase());
  }

  // Always return success: true so participant can view diagnostic report & download PDF
  return {
    success: true,
    storedInGoogleSheets,
    emailSent,
  };
}

/**
 * Submits optional post-report feedback (supports both server & Apps Script).
 */
export async function submitFeedbackData(
  payload: SurveyFeedbackPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { success: true };
  } catch {}

  if (APPS_SCRIPT_FALLBACK_URL) {
    try {
      await fetch(APPS_SCRIPT_FALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'feedback', ...payload }),
        mode: 'no-cors',
      });
      return { success: true };
    } catch {}
  }

  return { success: true };
}
