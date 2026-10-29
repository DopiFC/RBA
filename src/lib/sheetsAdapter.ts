import type {
  SurveySubmissionPayload,
  SurveyFeedbackPayload,
} from '../types/survey';

export interface SubmissionResult {
  success: boolean;
  storedInGoogleSheets?: boolean;
  emailSent?: boolean;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Checks if an email address has already been submitted for the survey.
 * Strictly queries the secure backend proxy; no client-side email lists are stored.
 */
export async function checkEmailHasSubmitted(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  try {
    const res = await fetch(`/api/survey/check-email?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      return !!data.exists;
    }
  } catch (err) {
    console.warn('[Adapter] Unable to verify email submission status:', err);
  }

  return false;
}

/**
 * Submits the completed survey to the secure server backend.
 * The server processes the payload, enforces the single-survey rule,
 * and securely updates the research database / spreadsheet on the server side.
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

  try {
    const res = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Máy chủ không thể ghi nhận kết quả khảo sát lúc này. Vui lòng thử lại.',
      };
    }

    return {
      success: true,
      storedInGoogleSheets: !!data.storedInGoogleSheets,
      emailSent: !!data.emailSent,
    };
  } catch (err: any) {
    console.error('[Adapter] Network error during survey submission:', err);
    return {
      success: false,
      error: 'Không thể kết nối tới máy chủ lưu trữ. Vui lòng kiểm tra lại kết nối mạng của bạn.',
    };
  }
}

/**
 * Submits optional post-report feedback to the secure server backend.
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

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Lỗi gửi ý kiến phản hồi.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Adapter] Network error during feedback submission:', err);
    return {
      success: false,
      error: 'Không thể kết nối tới máy chủ để gửi phản hồi.',
    };
  }
}

/**
 * Legacy compatibility stub: Configuration is securely managed entirely on the backend.
 */
export async function syncWithServerConfig(): Promise<string> {
  return '';
}
