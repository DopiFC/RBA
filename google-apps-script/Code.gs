/**
 * ==============================================================================
 * DỰ ÁN NGHIÊN CỨU RBA: GOOGLE APPS SCRIPT WEB APP
 * ==============================================================================
 * TÍNH NĂNG TỰ ĐỘNG:
 * 1. Tự động đồng bộ toàn bộ dữ liệu khảo sát và ý kiến phản hồi về Google Sheet.
 * 2. KIỂM SOÁT DUY NHẤT: 1 địa chỉ email chỉ được tham gia khảo sát 1 lần duy nhất.
 * 3. TỰ ĐỘNG GỬI EMAIL: Ngay khi nộp bài, kết quả chẩn đoán và báo cáo chi tiết
 *    sẽ được tự động gửi trực tiếp về email của người tham gia khảo sát.
 * ==============================================================================
 */

function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
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
      'Đồng ý liên hệ nghiên cứu (allow_contact)',
      'Thời điểm xác nhận (consented_at)',
      'Phiên bản đồng thuận (consent_version)'
    ],
    SurveyFeedback: [
      'Mã phản hồi (feedback_id)',
      'Mã khảo sát liên quan (response_id)',
      'Thời điểm gửi (submitted_at)',
      'Mức độ hữu ích (usefulness_rating)',
      'Mục dễ hiểu nhất (most_clear_section)',
      'Mục khó hiểu nhất (most_confusing_section)',
      'Ý kiến đóng góp (suggestions)',
      'Email liên hệ lại (contact_email)'
    ]
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, sheets[name].length)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
  }
}

function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return respondJson({ success: false, error: 'Không nhận được dữ liệu (No postData)' });
    }

    var ss = getSpreadsheet();
    setupSheets(ss);

    if (data.type === 'feedback') {
      return handleFeedback(ss, data);
    } else {
      return handleSurveySubmission(ss, data);
    }
  } catch (err) {
    return respondJson({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : '';
    var email = e && e.parameter ? e.parameter.email : '';

    if (action === 'checkEmail' && email) {
      var ss = getSpreadsheet();
      var exists = checkEmailExists(ss, email.trim().toLowerCase());
      return respondJson({ exists: exists });
    }

    return respondJson({ status: 'ok', message: 'RBA Apps Script Web App đang hoạt động.' });
  } catch (err) {
    return respondJson({ status: 'error', error: err.toString() });
  }
}

function checkEmailExists(ss, email) {
  var sheet = ss.getSheetByName('RespondentContacts');
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === email) {
      return true;
    }
  }
  return false;
}

function handleSurveySubmission(ss, data) {
  var email = String(data.email || '').trim().toLowerCase();

  // Kiểm tra 1 email chỉ được khảo sát 1 lần
  if (email && checkEmailExists(ss, email)) {
    return respondJson({
      success: false,
      isDuplicate: true,
      error: 'Email này đã tham gia khảo sát trước đó.'
    });
  }

  var responsesSheet = ss.getSheetByName('SurveyResponses');
  var contactsSheet = ss.getSheetByName('RespondentContacts');

  var answers = data.answers || {};
  var q10Val = Array.isArray(answers.q10_pricing_method)
    ? answers.q10_pricing_method.join(', ')
    : (answers.q10_pricing_method || '');

  var rowResponses = [
    data.responseId || '',
    data.clientTimestamp || new Date().toISOString(),
    email,
    'v1.0.0',
    data.consentVersion || 'v1.0.0',
    answers.q01_business_type || '',
    answers.q02_industry || '',
    answers.q03_business_age || '',
    answers.q04_employee_band || '',
    answers.q05_demand_trend || '',
    answers.q06_price_elasticity || '',
    answers.q07_supply_cost_change || '',
    answers.q08_cost_control_structure || '',
    answers.q09_resource_efficiency || '',
    q10Val,
    answers.q11_competitor_pressure || '',
    answers.q12_strategic_reaction || '',
    answers.q13_info_transparency || '',
    answers.q14_governance_control || '',
    answers.q15_sustainability_priority || '',
    JSON.stringify(data.scores_individual || {}),
    JSON.stringify(data.group_scores || {}),
    data.overallAttentionIndex !== undefined ? data.overallAttentionIndex : '',
    data.overallBand || '',
    data.validCount !== undefined ? data.validCount : '',
    'verified_submission',
    'pending'
  ];

  responsesSheet.appendRow(rowResponses);

  var rowContacts = [
    data.responseId || '',
    email,
    data.contactPermission ? 'YES' : 'NO',
    new Date().toISOString(),
    data.consentVersion || 'v1.0.0'
  ];
  contactsSheet.appendRow(rowContacts);

  // Tự động gửi email báo cáo chi tiết về hòm thư người tham gia
  var emailSent = false;
  if (email && email.indexOf('@') > 0) {
    try {
      sendDiagnosticEmail(email, data);
      emailSent = true;
      var lastRow = responsesSheet.getLastRow();
      responsesSheet.getRange(lastRow, 27).setValue('sent');
    } catch (mailErr) {
      // Bỏ qua lỗi gửi mail nếu vượt quota
    }
  }

  return respondJson({
    success: true,
    responseId: data.responseId,
    emailSent: emailSent,
    message: 'Đã lưu thành công vào Google Sheet.'
  });
}

function handleFeedback(ss, data) {
  var feedbackSheet = ss.getSheetByName('SurveyFeedback');
  var row = [
    data.feedbackId || '',
    data.responseId || '',
    data.submittedAt || new Date().toISOString(),
    data.usefulnessRating || '',
    data.mostClearSection || '',
    data.mostConfusingSection || '',
    data.suggestions || '',
    data.contactEmail || ''
  ];
  feedbackSheet.appendRow(row);
  return respondJson({ success: true, feedbackId: data.feedbackId });
}

function sendDiagnosticEmail(recipientEmail, data) {
  var subject = '[RBA] Báo cáo chẩn đoán kinh tế vi mô doanh nghiệp - Mã ' + (data.responseId || '');
  var groupScores = data.group_scores || {};
  var marketScore = groupScores.market !== undefined ? groupScores.market : '-';
  var opScore = groupScores.operations !== undefined ? groupScores.operations : '-';
  var pricingScore = groupScores.pricing !== undefined ? groupScores.pricing : '-';
  var govScore = groupScores.governance !== undefined ? groupScores.governance : '-';
  var susScore = groupScores.sustainability !== undefined ? groupScores.sustainability : '-';

  var htmlBody =
    '<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #334155; line-height: 1.6;">' +
      '<div style="background-color: #4f46e5; padding: 24px; border-radius: 12px 12px 0 0; color: #ffffff;">' +
        '<h2 style="margin: 0; font-size: 20px;">DỰ ÁN NGHIÊN CỨU KHOA HỌC RBA</h2>' +
        '<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Báo cáo chẩn đoán vi mô theo Kinh tế học cho nhà quản trị</p>' +
      '</div>' +

      '<div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">' +
        '<p>Kính gửi Quý bạn tham gia khảo sát,</p>' +
        '<p>Hệ thống RBA xin gửi tóm tắt kết quả phân tích theo hồ sơ: <strong>' + (data.responseId || '') + '</strong>.</p>' +

        '<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">' +
          '<div style="font-size: 13px; color: #64748b;">Chỉ số Chú ý Tổng thể (Attention Index):</div>' +
          '<div style="font-size: 28px; font-weight: bold; color: #1e1b4b; margin: 4px 0;">' +
            (data.overallAttentionIndex !== undefined ? data.overallAttentionIndex + '/100' : 'Đang xử lý') +
          '</div>' +
          '<div style="font-size: 12px; color: #64748b;">Thang điểm 0–100 (Điểm càng cao phản ánh xuất hiện nhiều tín hiệu cần chú ý rà soát).</div>' +
        '</div>' +

        '<h3 style="font-size: 15px; color: #0f172a; margin-top: 24px;">Điểm số theo 5 Trụ cột Chẩn đoán:</h3>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">' +
          '<tr style="background-color: #f1f5f9;"><th style="text-align: left; padding: 8px; border: 1px solid #e2e8f0;">Nhóm chỉ báo</th><th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">Điểm</th></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">1. Cầu thị trường & Độ nhạy giá khách hàng</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + marketScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">2. Kiểm soát chi phí & Năng suất nguồn lực</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + opScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">3. Phương pháp định giá theo cấu trúc thị trường</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + pricingScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">4. Cạnh tranh chiến lược & Giám sát nội bộ</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + govScore + '/100</td></tr>' +
          '<tr><td style="padding: 8px; border: 1px solid #e2e8f0;">5. Cân bằng 3 trụ cột phát triển bền vững</td><td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">' + susScore + '/100</td></tr>' +
        '</table>' +

        '<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 12px; color: #92400e;">' +
          '<strong>Lưu ý học thuật:</strong> Báo cáo được xây dựng từ thông tin tự đánh giá của người tham gia. Kết quả không thay thế báo cáo tài chính, kiểm toán hoặc tư vấn chuyên sâu.' +
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
