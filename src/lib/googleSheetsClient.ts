import type { SurveySubmissionPayload, SurveyFeedbackPayload } from '../types/survey';
import { calculateSurveyResults } from './scoring';

export const TARGET_SPREADSHEET_ID = '13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?usp=sharing`;

const SURVEY_HEADERS = [
  'Mã khảo sát (response_id)',
  'Thời điểm nộp (submitted_at)',
  'Email người tham gia (email)',
  'Phiên bản công cụ (instrument_version)',
  'Phiên bản đồng thuận (consent_version)',
  'Loại hình hoạt động (business_type)',
  'Ngành nghề (industry)',
  'Thời gian hoạt động (business_age)',
  'Quy mô nhân sự (employee_band)',
  'Câu 5: Xu hướng cầu (q05)',
  'Câu 6: Độ nhạy giá (q06)',
  'Câu 7: Nguồn cung & chi phí (q07)',
  'Câu 8: Kiểm soát chi phí (q08)',
  'Câu 9: Năng suất biên (q09)',
  'Câu 10: Phương pháp định giá (q10)',
  'Câu 11: Áp lực cạnh tranh (q11)',
  'Câu 12: Phản ứng chiến lược (q12)',
  'Câu 13: Minh bạch thông tin (q13)',
  'Câu 14: Giám sát & trách nhiệm (q14)',
  'Câu 15: Phát triển bền vững (q15)',
  'Điểm chuẩn hóa từng câu (JSON)',
  'Điểm 5 nhóm chỉ báo (JSON)',
  'Chỉ số chú ý tổng thể (overall_attention_index)',
  'Phân loại mức độ (result_band)',
  'Số câu hợp lệ (valid_count)',
  'Trạng thái dữ liệu (data_status)',
  'Kênh đồng bộ',
];

const CONTACT_HEADERS = [
  'Mã khảo sát (response_id)',
  'Email người tham gia (email)',
  'Thời điểm đồng thuận (consent_timestamp)',
  'Mục đích đồng thuận (consent_purpose)',
  'Đồng ý nhận tin tương lai (contact_permission)',
  'Ghi chú lưu trữ (retention_note)',
];

const FEEDBACK_HEADERS = [
  'Mã phản hồi (feedback_id)',
  'Mã khảo sát liên kết (response_id)',
  'Thời điểm gửi (submitted_at)',
  'Đánh giá hữu ích 1-5 (usefulness_rating)',
  'Mức độ phù hợp thực tế (realism_fit)',
  '3 Ưu tiên 12 tháng (priorities_12m)',
  'Ý kiến đóng góp bổ sung (additional_comments)',
  'Đồng ý khảo sát tiếp theo (future_research_opt_in)',
];

/**
 * Checks spreadsheet connection and permissions
 */
export async function testSpreadsheetConnection(accessToken: string): Promise<{
  ok: boolean;
  title?: string;
  sheets?: string[];
  error?: string;
}> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}?fields=properties.title,sheets.properties.title`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`;
      return { ok: false, error: msg };
    }

    const data = await res.json();
    const sheetTitles = (data.sheets || []).map((s: any) => s?.properties?.title || '');
    return {
      ok: true,
      title: data?.properties?.title || 'Bảng tính nghiên cứu RBA',
      sheets: sheetTitles,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Không thể kết nối đến Google Sheets API' };
  }
}

/**
 * Ensures tab exists; if not, creates it and appends headers
 */
async function ensureSheetTab(
  tabName: string,
  headers: string[],
  existingTabs: string[],
  accessToken: string
): Promise<void> {
  if (existingTabs.includes(tabName)) return;

  try {
    // Add sheet tab
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
              },
            },
          },
        ],
      }),
    });

    // Add header row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );
  } catch (err) {
    console.warn(`[GoogleSheetsClient] Could not auto-create tab "${tabName}":`, err);
  }
}

/**
 * Appends survey submission directly via Google Sheets v4 API
 */
export async function appendSurveyViaDirectApi(
  payload: SurveySubmissionPayload,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Check existing sheets
    const testRes = await testSpreadsheetConnection(accessToken);
    if (!testRes.ok) {
      return { success: false, error: testRes.error };
    }
    const existingSheets = testRes.sheets || [];

    // Ensure SurveyResponses & RespondentContacts tabs
    await ensureSheetTab('SurveyResponses', SURVEY_HEADERS, existingSheets, accessToken);
    await ensureSheetTab('RespondentContacts', CONTACT_HEADERS, existingSheets, accessToken);

    // Determine target survey tab: 'SurveyResponses' if exists or created, else fallback to first available sheet
    const targetSurveyTab = existingSheets.includes('SurveyResponses')
      ? 'SurveyResponses'
      : (existingSheets[0] || 'SurveyResponses');

    const targetContactTab = existingSheets.includes('RespondentContacts')
      ? 'RespondentContacts'
      : (existingSheets.length > 1 ? existingSheets[1] : 'RespondentContacts');

    // Calculate score values
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

    const ans = payload.answers || {};

    const surveyRow = [
      payload.responseId,
      payload.clientTimestamp || new Date().toISOString(),
      payload.email || '',
      payload.consentVersion || 'v1.0.0',
      'v1.0.0',
      ans.q01_business_type || '',
      ans.q02_industry === 'other' ? `Khác: ${ans.q02_industry_other || ''}` : ans.q02_industry || '',
      ans.q03_business_age || '',
      ans.q04_employee_band || '',
      ans.q05_demand_trend || '',
      ans.q06_price_sensitivity || '',
      ans.q07_supply_cost || '',
      ans.q08_cost_control || '',
      ans.q09_resource_efficiency || '',
      Array.isArray(ans.q10_pricing_methods) ? ans.q10_pricing_methods.join(';') : ans.q10_pricing_methods || '',
      ans.q11_competition_pressure || '',
      ans.q12_strategic_reaction || '',
      ans.q13_info_transparency || '',
      ans.q14_governance_control || '',
      ans.q15_sustainability || '',
      JSON.stringify(indScores),
      JSON.stringify(groupScores),
      scoring.overallAttentionIndex ?? '',
      scoring.overallBand || '',
      scoring.validCount ?? 11,
      'complete',
      'Google Workspace OAuth API (Direct)',
    ];

    const contactRow = [
      payload.responseId,
      payload.email || '',
      payload.clientTimestamp || new Date().toISOString(),
      'Nghiên cứu khoa học kinh tế doanh nghiệp',
      payload.contactPermission ? 'YES' : 'NO',
      'Lưu trữ cách ly an toàn phục vụ đối soát',
    ];

    // Append to SurveyResponses
    const surveyAppendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/${encodeURIComponent(
        targetSurveyTab
      )}!A:Z:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [surveyRow],
        }),
      }
    );

    if (!surveyAppendRes.ok) {
      const err = await surveyAppendRes.json().catch(() => ({}));
      return { success: false, error: err?.error?.message || 'Lỗi ghi dòng vào Google Sheet' };
    }

    // Append to RespondentContacts
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/${encodeURIComponent(
          targetContactTab
        )}!A:F:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [contactRow],
          }),
        }
      );
    } catch (contactErr) {
      console.warn('[GoogleSheetsClient] Error appending contact row (isolated):', contactErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[GoogleSheetsClient] appendSurveyViaDirectApi failed:', err);
    return { success: false, error: err?.message || 'Lỗi khi gửi dữ liệu lên Google Sheets' };
  }
}

/**
 * Appends feedback via direct API
 */
export async function appendFeedbackViaDirectApi(
  payload: SurveyFeedbackPayload,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const feedbackRow = [
      payload.feedbackId,
      payload.responseId,
      payload.submittedAt || new Date().toISOString(),
      payload.usefulnessRating || 5,
      payload.realismFit || 'fit',
      Array.isArray(payload.prioritiesNext12m) ? payload.prioritiesNext12m.join('; ') : '',
      payload.additionalComments || '',
      payload.futureResearchOptIn ? 'YES' : 'NO',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/SurveyFeedback!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [feedbackRow],
        }),
      }
    );

    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
