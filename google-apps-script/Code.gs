/**
 * ==============================================================================
 * DỰ ÁN NGHIÊN CỨU RBA: BỘ KẾT NỐI GOOGLE APPS SCRIPT
 * ==============================================================================
 * CÁC TÍNH NĂNG TỰ ĐỘNG ĐÃ TÍCH HỢP:
 * 1. Tự động đồng bộ toàn bộ dữ liệu khảo sát và ý kiến phản hồi về Google Sheet.
 * 2. KIỂM SOÁT DUY NHẤT: 1 địa chỉ email chỉ được tham gia khảo sát 1 lần duy nhất.
 * 3. TỰ ĐỘNG GỬI EMAIL: Ngay khi nộp bài, kết quả chẩn đoán và báo cáo chi tiết
 *    sẽ được tự động gửi trực tiếp về email cá nhân của người tham gia khảo sát.
 * ==============================================================================
 */

var TARGET_SPREADSHEET_ID = '13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0';

function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
}

function setupSheets(ss) {
  var sheets = {
    SurveyResponses: [
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
      'Email đã gửi kết quả (email_sent)'
    ],
    RespondentContacts: [
      'Mã khảo sát (response_id)',
      'Email người tham gia (email)',
      'Thời điểm đồng thuận (consent_timestamp)',
      'Mục đích đồng thuận (consent_purpose)',
      'Đồng ý nhận tin tương lai (contact_permission)',
      'Ghi chú lưu trữ (retention_note)'
    ],
    SurveyFeedback: [
      'Mã phản hồi (feedback_id)',
      'Mã khảo sát liên kết (response_id)',
      'Thời điểm gửi (submitted_at)',
      'Đánh giá hữu ích 1-5 (usefulness_rating)',
      'Mức độ phù hợp thực tế (realism_fit)',
      '3 Ưu tiên 12 tháng (priorities_12m)',
      'Ý kiến đóng góp bổ sung (additional_comments)',
      'Đồng ý khảo sát tiếp theo (future_research_opt_in)'
    ],
    StudyMetadata: [
      'Tên biến (Variable)',
      'Nhãn tiếng Việt (Label_VN)',
      'Chuyên đề Lý thuyết tham chiếu',
      'Thang đo',
      'Quy tắc tính điểm'
    ]
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight('bold').setBackground('#f1f5f9');
      sheet.setFrozenRows(1);
    }
  }

  // Khởi tạo StudyMetadata nếu trang còn trống
  var metaSheet = ss.getSheetByName('StudyMetadata');
  if (metaSheet && metaSheet.getLastRow() <= 1) {
    var metaRows = [
      ['q05_demand_trend', 'Xu hướng nhu cầu', 'Tài liệu 2: Cung, cầu và giá thị trường', '1-4', '(Score-1)/4*100'],
      ['q06_price_sensitivity', 'Độ nhạy giá khách hàng', 'Tài liệu 2: Độ co giãn của cầu', '1-5', '(Score-1)/4*100'],
      ['q07_supply_cost', 'Chi phí đầu vào và nguồn cung', 'Tài liệu 3: Lý thuyết sản xuất & chi phí', '1-5', '(Score-1)/4*100'],
      ['q08_cost_control', 'Kiểm soát chi phí đơn vị', 'Tài liệu 3: Chi phí đơn vị & biên lợi nhuận', '1-5', '(Score-1)/4*100'],
      ['q09_resource_efficiency', 'Năng suất biên của nguồn lực', 'Tài liệu 3: Năng suất biên giảm dần', '1-5', '(Score-1)/4*100'],
      ['q10_pricing_methods', 'Phương pháp định giá', 'Tài liệu 4, 5, 6: Định giá thị trường', '1-5', 'Tổ hợp chi phí & thị trường'],
      ['q11_competition_pressure', 'Mức độ cạnh tranh thị trường', 'Tài liệu 4, 6: Cấu trúc thị trường & khác biệt', '1-5', '(Score-1)/4*100'],
      ['q12_strategic_reaction', 'Phản ứng chiến lược với đối thủ', 'Tài liệu 7: Lý thuyết trò chơi & Nash', '1-5', '(Score-1)/4*100'],
      ['q13_info_transparency', 'Minh bạch thông tin chất lượng', 'Tài liệu 7: Bất cân xứng thông tin & Signaling', '1-5', '(Score-1)/4*100'],
      ['q14_governance_control', 'Trách nhiệm & kiểm soát nội bộ', 'Tài liệu 7: Rủi ro đạo đức & Principal-Agent', '1-5', '(Score-1)/4*100'],
      ['q15_sustainability', 'Phát triển bền vững 3 trụ cột', 'Tài liệu 8: Mô hình Kinh tế - Con người - Môi trường', '1-5', '(Score-1)/4*100']
    ];
    for (var i = 0; i < metaRows.length; i++) {
      metaSheet.appendRow(metaRows[i]);
    }
  }
}

/**
 * Xử lý dữ liệu POST (Ghi khảo sát / Ý kiến phản hồi & Gửi email tự động)
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return respondJson({ success: false, error: 'Không nhận được dữ liệu tải lên.' });
    }

    var payload = JSON.parse(rawData);
    var ss = getSpreadsheet();
    setupSheets(ss);

    // PHẦN 1: LƯU BẢN KHẢO SÁT CHÍNH
    if (payload.responseId && payload.answers) {
      var surveySheet = ss.getSheetByName('SurveyResponses');
      var contactSheet = ss.getSheetByName('RespondentContacts');

      // 1. Kiểm tra 1 email chỉ được khảo sát 1 lần
      var userEmail = (payload.email || '').toLowerCase().trim();
      if (userEmail) {
        var contactData = contactSheet.getDataRange().getValues();
        for (var c = 1; c < contactData.length; c++) {
          var rowEmail = (contactData[c][1] || '').toString().toLowerCase().trim();
          if (rowEmail === userEmail && contactData[c][0] !== payload.responseId) {
            return respondJson({
              success: false,
              isDuplicate: true,
              error: 'Email này (' + payload.email + ') đã hoàn thành khảo sát trước đó. Theo quy chuẩn nghiên cứu, mỗi người tham gia chỉ được khảo sát 1 lần duy nhất.'
            });
          }
        }
      }

      // 2. Kiểm tra trùng lặp theo ResponseId (Idempotency)
      var surveyData = surveySheet.getDataRange().getValues();
      for (var r = 1; r < surveyData.length; r++) {
        if (surveyData[r][0] === payload.responseId) {
          return respondJson({ success: true, isDuplicate: true, responseId: payload.responseId });
        }
      }

      var ans = payload.answers || {};
      var indScore = payload.scores_individual || {};
      var grpScore = payload.group_scores || {};

      var surveyRow = [
        payload.responseId,
        payload.clientTimestamp || new Date().toISOString(),
        payload.email || '',
        payload.consentVersion || 'v1.0.0',
        'v1.0.0',
        ans.q01_business_type || '',
        ans.q02_industry === 'other' ? ('Khác: ' + (ans.q02_industry_other || '')) : (ans.q02_industry || ''),
        ans.q03_business_age || '',
        ans.q04_employee_band || '',
        ans.q05_demand_trend || '',
        ans.q06_price_sensitivity || '',
        ans.q07_supply_cost || '',
        ans.q08_cost_control || '',
        ans.q09_resource_efficiency || '',
        Array.isArray(ans.q10_pricing_methods) ? ans.q10_pricing_methods.join(';') : (ans.q10_pricing_methods || ''),
        ans.q11_competition_pressure || '',
        ans.q12_strategic_reaction || '',
        ans.q13_info_transparency || '',
        ans.q14_governance_control || '',
        ans.q15_sustainability || '',
        JSON.stringify(indScore),
        JSON.stringify(grpScore),
        payload.overallAttentionIndex !== undefined ? payload.overallAttentionIndex : '',
        payload.overallBand || '',
        payload.validCount !== undefined ? payload.validCount : 11,
        'complete',
        'YES'
      ];
      surveySheet.appendRow(surveyRow);

      // Lưu bảng email cách ly
      var contactRow = [
        payload.responseId,
        payload.email || '',
        payload.clientTimestamp || new Date().toISOString(),
        'Nghiên cứu khoa học kinh tế doanh nghiệp',
        payload.contactPermission ? 'YES' : 'NO',
        'Lưu trữ cách ly an toàn phục vụ đối soát'
      ];
      contactSheet.appendRow(contactRow);

      // 3. TỰ ĐỘNG GỬI KẾT QUẢ VỀ EMAIL CÁ NHÂN CỦA NGƯỜI KHẢO SÁT
      if (userEmail) {
        try {
          sendDiagnosticReportEmail(payload.email, payload);
        } catch (mailErr) {
          Logger.log('Lỗi gửi email báo cáo: ' + mailErr.toString());
        }
      }

      return respondJson({
        success: true,
        responseId: payload.responseId,
        storedInGoogleSheets: true,
        emailSent: true,
        message: 'Đã lưu trữ thành công vào Google Sheet và gửi báo cáo về email của bạn.'
      });
    }

    // PHẦN 2: LƯU PHẢN HỒI SAU BÁO CÁO
    if (payload.feedbackId && payload.responseId) {
      var fbSheet = ss.getSheetByName('SurveyFeedback');
      var fbRow = [
        payload.feedbackId,
        payload.responseId,
        payload.submittedAt || new Date().toISOString(),
        payload.usefulnessRating || 5,
        payload.realismFit || 'fit',
        Array.isArray(payload.prioritiesNext12m) ? payload.prioritiesNext12m.join('; ') : '',
        payload.additionalComments || '',
        payload.futureResearchOptIn ? 'YES' : 'NO'
      ];
      fbSheet.appendRow(fbRow);

      return respondJson({
        success: true,
        feedbackId: payload.feedbackId,
        storedInGoogleSheets: true
      });
    }

    return respondJson({ success: false, error: 'Cấu trúc dữ liệu không được hỗ trợ.' });
  } catch (err) {
    return respondJson({ success: false, error: err.toString() });
  }
}

/**
 * Xử lý yêu cầu kiểm tra GET (Ping, Kiểm tra email đã tham gia chưa)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'info';
  var ss = getSpreadsheet();

  // Kiểm tra email đã làm khảo sát chưa (1 email chỉ 1 lần)
  if (action === 'checkEmail') {
    var checkEmail = (e && e.parameter && e.parameter.email) ? e.parameter.email.toLowerCase().trim() : '';
    if (!checkEmail) {
      return respondJson({ status: 'ok', exists: false });
    }
    setupSheets(ss);
    var contactSheet = ss.getSheetByName('RespondentContacts');
    var data = contactSheet.getDataRange().getValues();
    var exists = false;
    for (var r = 1; r < data.length; r++) {
      if (data[r][1] && data[r][1].toString().toLowerCase().trim() === checkEmail) {
        exists = true;
        break;
      }
    }
    return respondJson({ status: 'ok', exists: exists });
  }

  if (action === 'ping') {
    return respondJson({
      status: 'ok',
      service: 'RBA Google Apps Script Realtime Adapter',
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      timestamp: new Date().toISOString()
    });
  }

  var html = '<h2>RBA Google Apps Script Adapter Đang Hoạt Động</h2>' +
             '<p>Bảng tính được kết nối: <strong>' + ss.getName() + '</strong></p>' +
             '<p>Mã bảng tính: <code>' + ss.getId() + '</code></p>' +
             '<p>Trạng thái: Tự động ghi nhận câu trả lời và gửi kết quả về email người khảo sát.</p>';
  return HtmlService.createHtmlOutput(html);
}

/**
 * Gửi email báo cáo chẩn đoán vi mô đến email người tham gia
 */
function sendDiagnosticReportEmail(recipientEmail, payload) {
  var score = payload.overallAttentionIndex !== undefined ? payload.overallAttentionIndex : 'N/A';
  var band = payload.overallBand || 'moderate';
  var bandLabels = {
    low: 'Mức thấp (Ổn định, ít rủi ro vi mô)',
    moderate: 'Mức trung bình (Cần lưu ý một số rủi ro)',
    high: 'Mức cao (Cần chú ý & điều chỉnh sớm)',
    very_high: 'Mức rất cao (Rủi ro trọng yếu, cần can thiệp)'
  };
  var bandText = bandLabels[band] || 'Mức trung bình';

  var grp = payload.group_scores || {};
  var marketScore = grp.market !== undefined ? grp.market : 'N/A';
  var opScore = grp.operations !== undefined ? grp.operations : 'N/A';
  var pricingScore = grp.pricing !== undefined ? grp.pricing : 'N/A';
  var govScore = grp.governance !== undefined ? grp.governance : 'N/A';
  var susScore = grp.sustainability !== undefined ? grp.sustainability : 'N/A';

  var subject = '[RBA] Kết quả Khảo sát & Báo cáo Chẩn đoán Kinh tế Vi mô - Mã ' + payload.responseId;

  var htmlBody = '' +
    '<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">' +
      '<div style="background-color: #4338ca; padding: 24px; color: #ffffff;">' +
        '<h2 style="margin: 0; font-size: 20px;">DỰ ÁN NGHIÊN CỨU KHOA HỌC KINH TẾ QUẢN TRỊ (RBA)</h2>' +
        '<p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Báo cáo Chẩn đoán Vi mô & Đề xuất Vận hành Doanh nghiệp</p>' +
      '</div>' +
      '<div style="padding: 24px;">' +
        '<p style="font-size: 14px; margin-top: 0;">Kính gửi <strong>Quý Nhà quản trị / Doanh nghiệp</strong>,</p>' +
        '<p style="font-size: 13px; color: #475569;">Trân trọng cảm ơn bạn đã tham gia khảo sát vi mô. Dưới đây là tóm tắt kết quả chẩn đoán tự động được tính toán dựa trên các nguyên lý của Kinh tế học cho nhà quản trị:</p>' +
        
        '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">' +
          '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">' +
            '<tr><td style="padding: 4px 0; color: #64748b;">Mã hồ sơ khảo sát:</td><td style="font-weight: bold; font-family: monospace;">' + payload.responseId + '</td></tr>' +
            '<tr><td style="padding: 4px 0; color: #64748b;">Thời gian hoàn thành:</td><td>' + new Date().toLocaleString('vi-VN') + '</td></tr>' +
            '<tr><td style="padding: 4px 0; color: #64748b;">Chỉ số Chú ý Tổng thể:</td><td style="font-weight: bold; font-size: 16px; color: #4338ca;">' + score + '/100</td></tr>' +
            '<tr><td style="padding: 4px 0; color: #64748b;">Mức độ rủi ro vi mô:</td><td style="font-weight: bold; color: #0f172a;">' + bandText + '</td></tr>' +
          '</table>' +
        '</div>' +

        '<h4 style="font-size: 14px; color: #0f172a; margin-bottom: 8px;">ĐIỂM 5 NHÓM CHỈ BÁO VẬN HÀNH (0 - 100):</h4>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">' +
          '<tr style="background-color: #f1f5f9;"><th style="text-align: left; padding: 8px; border: 1px solid #e2e8f0;">Nhóm chỉ báo</th><th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">Điểm</th></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">1. Cầu thị trường & Độ nhạy giá khách hàng</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + marketScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">2. Kiểm soát chi phí & Năng suất nguồn lực</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + opScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">3. Phương pháp định giá theo cấu trúc thị trường</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + pricingScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">4. Cạnh tranh chiến lược & Giám sát nội bộ</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + govScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">5. Cân bằng 3 trụ cột phát triển bền vững</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + susScore + '/100</td></tr>' +
        '</table>' +

        '<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 12px; color: #92400e;">' +
          '<strong>Lưu ý học thuật:</strong> Báo cáo được xây dựng từ thông tin tự đánh giá của người tham gia. Kết quả không thay thế báo cáo tài chính, kiểm toán hoặc tư vấn chuyên sâu. Những vấn đề được nêu là các tín hiệu vi mô cần xem xét.' +
        '</div>' +

        '<p style="font-size: 13px; color: #64748b; margin-top: 24px;">' +
          'Trân trọng,<br>' +
          '<strong>Ban Nghiên cứu Kinh tế Vi mô Doanh nghiệp (RBA)</strong><br>' +
          'Email đầu mối nghiên cứu: <em>lienhe@kinhtedoanhnghiep.vn</em>' +
        '</p>' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
