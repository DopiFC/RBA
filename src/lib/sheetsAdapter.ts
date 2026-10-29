import type {
  SurveySubmissionPayload,
  SurveyFeedbackPayload,
} from '../types/survey';
import { calculateSurveyResults } from './scoring';
import { getAccessToken, isGoogleConnected } from './googleAuth';
import {
  appendSurveyViaDirectApi,
  appendFeedbackViaDirectApi,
  TARGET_SPREADSHEET_ID,
  TARGET_SPREADSHEET_URL,
} from './googleSheetsClient';

const LOCAL_STORAGE_APPS_SCRIPT_KEY = 'rba_google_apps_script_url';
const LOCAL_STORAGE_SUBMITTED_EMAILS_KEY = 'rba_submitted_emails';
const LOCAL_STORAGE_PENDING_QUEUE_KEY = 'rba_pending_sync_queue';

export { TARGET_SPREADSHEET_ID, TARGET_SPREADSHEET_URL };

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVN0LDgIB5PzS2ValE0TbZINZb2UponE4dZcWsQ-VZoROx1_82ldPY3zBaX3SPgHeM/exec';

export function getAppsScriptUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_APPS_SCRIPT_URL;
  return (
    localStorage.getItem(LOCAL_STORAGE_APPS_SCRIPT_KEY) ||
    (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL ||
    DEFAULT_APPS_SCRIPT_URL
  );
}

export async function saveAppsScriptUrl(url: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  if (!trimmed) {
    localStorage.removeItem(LOCAL_STORAGE_APPS_SCRIPT_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_APPS_SCRIPT_KEY, trimmed);
  }

  // Also persist to server so ALL survey participants benefit automatically
  try {
    await fetch('/api/config/sheets-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });
  } catch (err) {
    console.warn('[SheetsAdapter] Failed to sync webhook URL to server:', err);
  }
}

export async function syncWithServerConfig(): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const res = await fetch('/api/config/sheets-webhook');
    if (res.ok) {
      const data = await res.json();
      const serverUrl = data?.config?.appsScriptUrl;
      if (serverUrl && !localStorage.getItem(LOCAL_STORAGE_APPS_SCRIPT_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_APPS_SCRIPT_KEY, serverUrl);
        return serverUrl;
      }
    }
  } catch {
    // ignore
  }
  return getAppsScriptUrl();
}

export function getSubmittedEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMITTED_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordSubmittedEmail(email: string): void {
  if (typeof window === 'undefined' || !email) return;
  try {
    const emails = getSubmittedEmails();
    const clean = email.trim().toLowerCase();
    if (!emails.includes(clean)) {
      emails.push(clean);
      localStorage.setItem(LOCAL_STORAGE_SUBMITTED_EMAILS_KEY, JSON.stringify(emails));
    }
  } catch (err) {
    console.error('Error saving submitted email:', err);
  }
}

export async function checkEmailHasSubmitted(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Check local storage cache
  const localList = getSubmittedEmails();
  if (localList.includes(cleanEmail)) {
    return true;
  }

  // 2. Check Apps Script Webhook if configured
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const checkUrl = appsScriptUrl.includes('?')
        ? `${appsScriptUrl}&action=checkEmail&email=${encodeURIComponent(cleanEmail)}`
        : `${appsScriptUrl}?action=checkEmail&email=${encodeURIComponent(cleanEmail)}`;
      const res = await fetch(checkUrl);
      const data = await res.json();
      if (data && data.exists) {
        recordSubmittedEmail(cleanEmail);
        return true;
      }
    } catch {
      // ignore
    }
  }

  // 3. Check server endpoint if running with Express backend
  try {
    const res = await fetch(`/api/survey/check-email?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.exists) {
        recordSubmittedEmail(cleanEmail);
        return true;
      }
    }
  } catch {
    // ignore
  }

  return false;
}

export interface SubmissionResult {
  success: boolean;
  storedInGoogleSheets: boolean;
  syncMethod?: 'apps_script' | 'google_oauth' | 'server';
  emailSent?: boolean;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Save pending item to sync queue for deferred sync
 */
export function queuePendingSubmission(payload: SurveySubmissionPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_QUEUE_KEY);
    const queue: SurveySubmissionPayload[] = raw ? JSON.parse(raw) : [];
    if (!queue.some((item) => item.responseId === payload.responseId)) {
      queue.push(payload);
      localStorage.setItem(LOCAL_STORAGE_PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (err) {
    console.warn('Could not queue pending submission:', err);
  }
}

export function getPendingSubmissionsCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_QUEUE_KEY);
    const queue: SurveySubmissionPayload[] = raw ? JSON.parse(raw) : [];
    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * Flushes pending submissions to Google Sheet using current active connection
 */
export async function flushPendingSubmissions(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined') return { synced: 0, failed: 0 };
  let queue: SurveySubmissionPayload[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_QUEUE_KEY);
    queue = raw ? JSON.parse(raw) : [];
  } catch {
    return { synced: 0, failed: 0 };
  }

  if (queue.length === 0) return { synced: 0, failed: 0 };

  const remaining: SurveySubmissionPayload[] = [];
  let synced = 0;

  for (const item of queue) {
    const res = await submitSurveyData(item, false);
    if (res.storedInGoogleSheets) {
      synced++;
    } else {
      remaining.push(item);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_PENDING_QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed: remaining.length };
}

/**
 * Main survey submission function:
 * 1. Checks 1 email 1 survey restriction.
 * 2. Attempts Google Apps Script Web App (saves to sheet & sends email).
 * 3. Attempts Direct Google Sheets v4 API via OAuth Token (direct sheet append).
 * 4. Stashes to Server / Local queue if not yet authenticated.
 */
export async function submitSurveyData(
  payload: SurveySubmissionPayload,
  checkDuplicateEmail: boolean = true
): Promise<SubmissionResult> {
  // Pre-check: Enforce 1 email only 1 survey
  if (checkDuplicateEmail && payload.email) {
    const alreadySubmitted = await checkEmailHasSubmitted(payload.email);
    if (alreadySubmitted) {
      return {
        success: false,
        storedInGoogleSheets: false,
        error: `Địa chỉ email này (${payload.email}) đã hoàn thành khảo sát trước đó. Theo quy chuẩn nghiên cứu, mỗi người tham gia chỉ được khảo sát một lần duy nhất.`,
      };
    }
  }

  const appsScriptUrl = getAppsScriptUrl();
  const token = await getAccessToken();

  let storedInGoogleSheets = false;
  let syncMethod: 'apps_script' | 'google_oauth' | 'server' | undefined = undefined;
  let emailSent = false;

  // PRIORITY 1: Google Apps Script Web App (Direct to Sheet + Sends Email)
  if (appsScriptUrl) {
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

      await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(fullPayload),
        mode: 'no-cors',
      });

      storedInGoogleSheets = true;
      syncMethod = 'apps_script';
      emailSent = true;
    } catch (err: any) {
      console.warn('[AppsScript] Direct submission failed:', err);
    }
  }

  // PRIORITY 2: Direct Google Sheets v4 API via OAuth Token
  if (!storedInGoogleSheets && token) {
    try {
      const directRes = await appendSurveyViaDirectApi(payload, token);
      if (directRes.success) {
        storedInGoogleSheets = true;
        syncMethod = 'google_oauth';
      } else {
        console.warn('[DirectSheetsApi] Direct API append returned error:', directRes.error);
      }
    } catch (apiErr) {
      console.warn('[DirectSheetsApi] Failed to append via OAuth API:', apiErr);
    }
  }

  // ALWAYS backup to server database / local store
  try {
    const res = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (data.storedInGoogleSheets) {
      storedInGoogleSheets = true;
      syncMethod = 'server';
    }
  } catch (err) {
    console.warn('[ServerBackup] Server sync unavailable:', err);
  }

  // Record email locally to prevent repeat survey
  if (payload.email) {
    recordSubmittedEmail(payload.email);
  }

  // If not yet stored in Google Sheets, queue it so owner can sync upon sign-in/webhook connect
  if (!storedInGoogleSheets) {
    queuePendingSubmission(payload);
  }

  return {
    success: true,
    storedInGoogleSheets,
    syncMethod,
    emailSent,
  };
}

/**
 * Send feedback data
 */
export async function submitFeedbackData(
  payload: SurveyFeedbackPayload
): Promise<{ success: boolean; storedInGoogleSheets: boolean; error?: string }> {
  const appsScriptUrl = getAppsScriptUrl();
  const token = await getAccessToken();

  let storedInGoogleSheets = false;

  if (appsScriptUrl) {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'feedback', ...payload }),
        mode: 'no-cors',
      });
      storedInGoogleSheets = true;
    } catch (err) {
      console.warn('[AppsScript] Feedback submission error:', err);
    }
  }

  if (!storedInGoogleSheets && token) {
    try {
      const direct = await appendFeedbackViaDirectApi(payload, token);
      if (direct.success) storedInGoogleSheets = true;
    } catch (err) {
      console.warn('[DirectSheetsApi] Feedback error:', err);
    }
  }

  try {
    const res = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (data.storedInGoogleSheets) storedInGoogleSheets = true;
  } catch (err) {
    // ignore
  }

  return { success: true, storedInGoogleSheets };
}

/**
 * Test connectivity to Google Apps Script Web App URL
 */
export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const testUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const res = await fetch(testUrl);
    const data = await res.json();
    if (data && data.status === 'ok') {
      return {
        success: true,
        message: `Kết nối thành công tới bảng tính: "${data.spreadsheetName || 'Google Sheet'}"!`,
      };
    }
    return { success: false, message: 'Google Apps Script phản hồi nhưng dữ liệu không đúng.' };
  } catch (err: any) {
    return {
      success: false,
      message: 'Không thể kết nối đến Web App URL. Hãy chắc chắn bạn đã chọn "Ai có quyền truy cập: Bất kỳ ai" (Anyone).',
    };
  }
}
