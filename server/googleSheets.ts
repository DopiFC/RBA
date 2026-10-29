import { google } from 'googleapis';
import type { StoredSurveyRecord, StoredContactRecord, SurveyFeedbackPayload } from '../src/types/survey.ts';
import { INSTRUMENT_VERSION, CONSENT_VERSION, ALGORITHM_VERSION } from '../src/config/survey.ts';

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export class GoogleSheetsService {
  private sheets: any = null;
  private spreadsheetId: string | null = null;
  private isConfigured: boolean = false;
  private processedResponseIds: Set<string> = new Set();
  private processedFeedbackIds: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0';
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKey) {
      console.log('[GoogleSheetsService] Missing Google Sheets credentials in environment. Operating in Local Staging Mode.');
      this.isConfigured = false;
      return;
    }

    // Safely handle literal "\n" escape sequences in private key strings
    privateKey = privateKey.replace(/\\n/g, '\n');

    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.spreadsheetId = spreadsheetId;
      this.isConfigured = true;
      console.log(`[GoogleSheetsService] Google Sheets integration configured successfully for Spreadsheet ID: ${spreadsheetId}`);
    } catch (err) {
      console.error('[GoogleSheetsService] Error initializing Google Auth JWT:', err);
      this.isConfigured = false;
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.sheets !== null && !!this.spreadsheetId;
  }

  public getSpreadsheetId(): string | null {
    return this.spreadsheetId;
  }

  /**
   * Appends a survey response to Sheet 1 (SurveyResponses) and contact info to Sheet 2 (RespondentContacts)
   */
  public async appendSurveyResponse(
    surveyRecord: StoredSurveyRecord,
    contactRecord: StoredContactRecord
  ): Promise<{ success: boolean; isDuplicate: boolean; error?: string }> {
    if (!this.isReady()) {
      return { success: false, isDuplicate: false, error: 'Google Sheets is not configured.' };
    }

    // Idempotency check: prevent duplicate rows for the same responseId
    if (this.processedResponseIds.has(surveyRecord.response_id)) {
      return { success: true, isDuplicate: true };
    }

    try {
      // 1. Prepare row for Sheet 1: SurveyResponses
      // Columns: response_id, submitted_at, instrument_version, consent_version, business_type, industry, business_age, employee_band, q05..q15, scores, group scores, overall index, band, valid_count, data_status, algo_version
      const surveyRow = [
        surveyRecord.response_id,
        surveyRecord.submitted_at,
        surveyRecord.instrument_version,
        surveyRecord.consent_version,
        surveyRecord.business_type,
        surveyRecord.industry,
        surveyRecord.business_age,
        surveyRecord.employee_band,
        surveyRecord.q05,
        surveyRecord.q06,
        surveyRecord.q07,
        surveyRecord.q08,
        surveyRecord.q09,
        surveyRecord.q10,
        surveyRecord.q11,
        surveyRecord.q12,
        surveyRecord.q13,
        surveyRecord.q14,
        surveyRecord.q15,
        JSON.stringify(surveyRecord.scores_individual),
        JSON.stringify(surveyRecord.group_scores),
        surveyRecord.overall_attention_index ?? 'N/A',
        surveyRecord.result_band,
        surveyRecord.valid_count,
        surveyRecord.data_status,
        surveyRecord.scoring_algorithm_version,
      ];

      // 2. Prepare row for Sheet 2: RespondentContacts (strictly isolated)
      const contactRow = [
        contactRecord.response_id,
        contactRecord.email,
        contactRecord.consent_timestamp,
        contactRecord.consent_purpose,
        contactRecord.contact_permission ? 'YES' : 'NO',
        contactRecord.retention_note,
      ];

      // Append to SurveyResponses
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'SurveyResponses!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [surveyRow],
        },
      });

      // Append to RespondentContacts
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'RespondentContacts!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [contactRow],
        },
      });

      this.processedResponseIds.add(surveyRecord.response_id);
      return { success: true, isDuplicate: false };
    } catch (err: any) {
      console.error('[GoogleSheetsService] appendSurveyResponse failed:', err?.message || err);
      return { success: false, isDuplicate: false, error: err?.message || 'Lỗi kết nối Google Sheets API' };
    }
  }

  /**
   * Appends feedback to Sheet 3 (SurveyFeedback)
   */
  public async appendFeedback(
    feedback: SurveyFeedbackPayload
  ): Promise<{ success: boolean; isDuplicate: boolean; error?: string }> {
    if (!this.isReady()) {
      return { success: false, isDuplicate: false, error: 'Google Sheets is not configured.' };
    }

    if (this.processedFeedbackIds.has(feedback.feedbackId)) {
      return { success: true, isDuplicate: true };
    }

    try {
      const feedbackRow = [
        feedback.feedbackId,
        feedback.responseId,
        feedback.submittedAt,
        feedback.usefulnessRating,
        feedback.realismFit,
        feedback.prioritiesNext12m.join('; '),
        feedback.additionalComments || '',
        feedback.futureResearchOptIn ? 'YES' : 'NO',
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'SurveyFeedback!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [feedbackRow],
        },
      });

      this.processedFeedbackIds.add(feedback.feedbackId);
      return { success: true, isDuplicate: false };
    } catch (err: any) {
      console.error('[GoogleSheetsService] appendFeedback failed:', err?.message || err);
      return { success: false, isDuplicate: false, error: err?.message || 'Lỗi ghi phản hồi vào Google Sheets' };
    }
  }

  /**
   * Ensures the 4 sheets exist with proper headers
   */
  public async ensureHeaders(): Promise<void> {
    if (!this.isReady()) return;

    try {
      // Check or add headers for StudyMetadata
      const metadataRows = [
        ['Variable', 'Label_VN', 'Theoretical_Reference', 'Scale_Range', 'Scoring_Rule'],
        ['instrument_version', 'Phiên bản bộ công cụ', 'N/A', INSTRUMENT_VERSION, 'Hằng số'],
        ['consent_version', 'Phiên bản thông báo đồng thuận', 'N/A', CONSENT_VERSION, 'Hằng số'],
        ['algorithm_version', 'Phiên bản thuật toán', 'N/A', ALGORITHM_VERSION, 'Quy tắc chuẩn hóa 0-100'],
        ['q05_demand_trend', 'Xu hướng nhu cầu', 'Tài liệu 2: Cung, cầu và giá thị trường', '1-4', '1: Tăng, 2: Ổn định, 3: Giảm nhẹ, 4: Giảm mạnh/Biến động/Chưa theo dõi'],
        ['q06_price_sensitivity', 'Độ nhạy giá khách hàng', 'Tài liệu 2: Độ co giãn của cầu', '1-5', '1: Tiếp tục mua, 3: Giảm mua, 4: Sang đối thủ/Chưa theo dõi, 5: Giảm mạnh'],
        ['q07_supply_cost', 'Chi phí đầu vào và nguồn cung', 'Tài liệu 3: Lý thuyết sản xuất & chi phí', '1-5', '1: Ổn định, 2: Xử lý được, 4: Biến động/Chưa theo dõi, 5: Phụ thuộc lớn'],
        ['q08_cost_control', 'Kiểm soát chi phí đơn vị', 'Tài liệu 3: Chi phí đơn vị & biên lợi nhuận', '1-5', '1: Theo dõi đơn vị & biên, 3: Tổng thể, 4: Ước tính/Chưa rõ, 5: Chưa theo dõi'],
        ['q09_resource_efficiency', 'Hiệu quả nguồn lực bổ sung', 'Tài liệu 3: Năng suất biên giảm dần', '1-5', '1: Tăng tốt, 2: Tương ứng, 4: Giảm dần/Chưa theo dõi, 5: Chi phí tăng nhanh hơn'],
        ['q10_pricing_methods', 'Phương pháp định giá', 'Tài liệu 4, 5, 6: Định giá thị trường', '1-5', '1: Chi phí + Thị trường, 2: >=2 Thị trường, 3: Chỉ chi phí, 4: 1 yếu tố đơn lẻ, 5: Cảm tính'],
        ['q11_competition_pressure', 'Mức độ cạnh tranh thị trường', 'Tài liệu 4, 6: Cấu trúc thị trường & khác biệt hóa', '1-5', '1: Khác biệt rõ, 2: Vừa phải, 3: Nhiều đối thủ có khác biệt, 4: Chưa rõ, 5: Chiến tranh giá'],
        ['q12_strategic_reaction', 'Phản ứng chiến lược với đối thủ', 'Tài liệu 7: Lý thuyết trò chơi & Nash', '1-5', '1: Kịch bản chủ động, 2: Theo dõi thường xuyên, 4: Phản ứng sau/Chưa rõ, 5: Sao chép'],
        ['q13_info_transparency', 'Minh bạch thông tin chất lượng', 'Tài liệu 7: Bất cân xứng thông tin & Tín hiệu', '1-5', '1: Minh bạch có phản hồi, 2: Phần lớn rõ, 4: Khó xác minh/Chưa rõ, 5: Thiếu hệ thống'],
        ['q14_governance_control', 'Kiểm soát trách nhiệm & sai sót', 'Tài liệu 7: Rủi ro đạo đức & Người đại diện', '1-5', '1: Phân định & đánh giá định kỳ, 3: Chưa nhất quán, 4: Phụ thuộc cá nhân/Chưa rõ, 5: Lặp lại'],
        ['q15_sustainability', 'Cân nhắc phát triển bền vững', 'Tài liệu 8: Mô hình 3 trụ cột (Kinh tế - Xã hội - Môi trường)', '1-5', '1: Cân bằng 3 trụ cột, 2: Tài chính & con người, 4: Ngắn hạn/Chưa rõ, 5: Bỏ qua'],
      ];

      // Update StudyMetadata sheet if available
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'StudyMetadata!A1:E15',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: metadataRows },
      });
      console.log('[GoogleSheetsService] StudyMetadata sheet synchronized.');
    } catch (err: any) {
      console.log('[GoogleSheetsService] Note: Could not auto-sync StudyMetadata headers (sheet might require manual creation):', err?.message);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
