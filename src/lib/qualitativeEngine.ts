import type { SurveyAnswers, SurveyScoringResult, QualitativeAnalysisResult } from '../types/survey.ts';
import { SURVEY_QUESTIONS } from '../config/survey.ts';

/**
 * Extracts and cleans user text input from either direct or suffixed answer keys.
 */
function cleanText(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // Strip dangerous script injection tags or control characters
  return trimmed.replace(/<[^>]*>?/gm, '');
}

/**
 * Helper to get clean human labels for demographic / diagnostic choices
 */
function getSelectedLabel(questionId: string, answerValue?: string): string {
  if (!answerValue) return 'Chưa cung cấp';
  const q = SURVEY_QUESTIONS.find((item) => item.id === questionId);
  if (!q || !q.options) return answerValue;
  const opt = q.options.find((o) => o.id === answerValue);
  return opt ? opt.label : answerValue;
}

/**
 * Generates deterministic, grounded qualitative synthesis based purely on participant's actual inputs.
 * Strictly adheres to the 9 Managerial Economics analytical principles:
 * - Zero hallucinated revenue, margins, or competitor counts.
 * - Distinguishes between participant observations and analytical implications.
 * - Highlights missing data points when information is incomplete.
 */
export function generateRuleBasedQualitativeSynthesis(
  answers: SurveyAnswers,
  scoringResult?: any
): QualitativeAnalysisResult {
  const businessName = cleanText(answers.business_name) || 'Đơn vị kinh doanh (chưa nêu tên)';
  const location = cleanText(answers.business_location) || 'Địa bàn chưa cung cấp cụ thể';
  const role = cleanText(answers.respondent_role) || 'Người đại diện kinh doanh';
  const website = cleanText(answers.business_website);

  const businessDesc = cleanText(answers.q16_business_description || answers.q16);
  const challenges = cleanText(answers.q17_challenges || answers.q17);
  const compAdvantage = cleanText(answers.q18_competitors_advantage || answers.q18);
  const futurePlans = cleanText(answers.q19_future_plans || answers.q19);

  const industry = getSelectedLabel('q02', answers.q02_industry);
  const businessType = getSelectedLabel('q01', answers.q01_business_type);
  const businessAge = getSelectedLabel('q03', answers.q03_business_age);
  const employeeBand = getSelectedLabel('q04', answers.q04_employee_band);

  // 1. Tổng quan hoạt động kinh doanh
  let businessOverview = `${businessName} hoạt động tại khu vực ${location}, thuộc nhóm ${businessType}, ngành nghề ${industry}, thời gian hoạt động ${businessAge} với quy mô nhân sự ${employeeBand}. Người thực hiện khảo sát đảm nhiệm vai trò ${role}.`;
  if (businessDesc) {
    businessOverview += ` Về mô hình thực tế, đơn vị tự mô tả: "${businessDesc}".`;
  } else {
    businessOverview += ` Đơn vị chưa cung cấp mô tả tự luận chi tiết về sản phẩm chủ lực và kênh bán hàng (cần bổ sung thông tin này để làm rõ mô hình phân phối).`;
  }
  if (website) {
    businessOverview += ` Kênh thông tin trực tuyến ghi nhận: ${website}.`;
  }

  // 2. Những vấn đề nổi bật được người khảo sát phản ánh
  const keyIssuesObserved: string[] = [];
  if (challenges) {
    keyIssuesObserved.push(`Khó khăn tự nhận định từ thực tế: "${challenges}" (phản ánh trực tiếp từ người quản lý).`);
  } else {
    keyIssuesObserved.push('Người khảo sát không điền phần mô tả tự luận về các khó khăn cụ thể.');
  }

  // Correlate with structured indicators
  if (answers.q05_demand_trend === 'sharp_decrease' || answers.q05_demand_trend === 'slight_decrease') {
    keyIssuesObserved.push(`Xu hướng cầu sụt giảm: Khảo sát ghi nhận nhu cầu của khách hàng đang có chiều hướng "${getSelectedLabel('q05', answers.q05_demand_trend)}".`);
  } else if (answers.q05_demand_trend === 'unpredictable') {
    keyIssuesObserved.push('Cầu thị trường biến động khó dự đoán, gây khó khăn cho việc hoạch định kế hoạch nhập hàng và dự trữ hàng tồn kho.');
  }

  if (answers.q07_supply_cost === 'fluctuates_hurts_profit' || answers.q07_supply_cost === 'heavily_dependent') {
    keyIssuesObserved.push(`Áp lực nguồn cung và chi phí đầu vào: "${getSelectedLabel('q07', answers.q07_supply_cost)}", đe dọa trực tiếp biên lợi nhuận hoạt động.`);
  }

  if (answers.q08_cost_control === 'rarely_track' || answers.q08_cost_control === 'estimate_when_needed') {
    keyIssuesObserved.push(`Kiểm soát chi phí còn lỏng lẻo: Đơn vị "${getSelectedLabel('q08', answers.q08_cost_control)}", tiềm ẩn nguy cơ bán hàng nhưng không bù đắp được chi phí biên.`);
  }

  // 3. Phân tích nguyên nhân có thể có
  const rootCausesAnalysis: string[] = [];
  if (challenges) {
    rootCausesAnalysis.push(`Căn cứ vào khó khăn mô tả ("${challenges.slice(0, 120)}..."): Có thể thấy tác động đồng thời của biến động thị trường bên ngoài và các hạn chế trong cơ chế quản trị nội bộ.`);
  }

  if (answers.q06_price_sensitivity === 'revenue_sharp_drop' || answers.q06_price_sensitivity === 'many_switch_competitor') {
    rootCausesAnalysis.push('Căn cứ Câu 7 (Độ nhạy giá): Sản phẩm có độ co giãn của cầu theo giá cao do khách hàng dễ dàng chuyển sang đối thủ hoặc sản phẩm thay thế khi có biến động giá.');
  }

  if (answers.q10_pricing_methods && answers.q10_pricing_methods.length > 0) {
    if (answers.q10_pricing_methods.includes('opt_gut') || answers.q10_pricing_methods.includes('opt_none')) {
      rootCausesAnalysis.push('Căn cứ Câu 11 (Định giá): Phương pháp định giá còn cảm tính hoặc chưa có cơ chế rõ ràng, dẫn đến việc không tối ưu hóa được mức sẵn lòng chi trả (WTP) của khách hàng.');
    } else if (answers.q10_pricing_methods.includes('opt_cost') && answers.q10_pricing_methods.length === 1) {
      rootCausesAnalysis.push('Căn cứ Câu 11 (Định giá): Chỉ áp dụng phương pháp cộng chi phí đơn thuần (Cost-Plus), bỏ qua phản ứng cạnh tranh và giá trị cảm nhận từ phía người tiêu dùng.');
    }
  }

  if (answers.q09_resource_efficiency === 'diminishing_marginal_efficiency' || answers.q09_resource_efficiency === 'cost_rises_faster_than_output') {
    rootCausesAnalysis.push('Căn cứ Câu 10 (Năng suất biên): Hiệu quả nguồn lực bổ sung có dấu hiệu suy giảm, cho thấy tổ chức đang tiệm cận ngưỡng năng suất biên giảm dần hoặc quy trình phối hợp chưa đồng bộ.');
  }

  if (rootCausesAnalysis.length === 0) {
    rootCausesAnalysis.push('Dữ liệu cho thấy các chỉ báo nền tảng tương đối ổn định; nguyên nhân rủi ro chủ yếu tiềm ẩn từ sự thay đổi bất ngờ của môi trường vĩ mô.');
  }

  // 4. Đánh giá lợi thế và áp lực cạnh tranh
  let competitiveAssessment = '';
  if (compAdvantage) {
    competitiveAssessment = `Theo đánh giá từ người quản lý: "${compAdvantage}". `;
  } else {
    competitiveAssessment = 'Người khảo sát chưa ghi nhận tự luận về lợi thế cạnh tranh riêng biệt. ';
  }
  if (answers.q11_competition_pressure) {
    competitiveAssessment += `Về cấu trúc thị trường (Câu 12): Tình hình cạnh tranh ghi nhận ở mức "${getSelectedLabel('q11', answers.q11_competition_pressure)}". `;
  }
  if (answers.q12_strategic_reaction) {
    competitiveAssessment += `Cơ chế ứng phó chiến lược (Câu 13): Đơn vị hiện "${getSelectedLabel('q12', answers.q12_strategic_reaction)}".`;
  }

  // 5. Các rủi ro cần ưu tiên xác minh
  const risksToVerify: string[] = [];
  if (challenges.toLowerCase().includes('vốn') || challenges.toLowerCase().includes('dòng tiền') || challenges.toLowerCase().includes('nợ')) {
    risksToVerify.push('Rủi ro thanh khoản và vòng quay vốn lưu động: Cần đối soát dòng tiền vào - ra thực tế theo tuần và tuổi nợ khách hàng.');
  }
  if (challenges.toLowerCase().includes('giá') || answers.q11_competition_pressure === 'many_substitutes_price_war') {
    risksToVerify.push('Rủi ro chiến tranh giá và xói mòn biên lợi nhuận: Cần xác minh cơ cấu chi phí biến đổi tối thiểu (AVC) để tránh bán dưới giá thành.');
  }
  if (answers.q08_cost_control !== 'track_unit_and_margin') {
    risksToVerify.push('Rủi ro thất thoát hoặc tính sai điểm hòa vốn do chưa tách biệt chi phí cố định (FC) và chi phí biến đổi (VC) trên từng đơn vị sản phẩm.');
  }
  if (answers.q13_info_transparency === 'no_clear_system' || answers.q13_info_transparency === 'misunderstood_hard_to_verify') {
    risksToVerify.push('Rủi ro bất cân xứng thông tin: Khách hàng gặp khó khăn trong việc xác minh chất lượng, làm tăng chi phí giao dịch và giảm tỷ lệ chuyển đổi.');
  }
  if (risksToVerify.length === 0) {
    risksToVerify.push('Cần kiểm tra định kỳ mức độ biến động chi phí mặt bằng và biến động doanh số theo mùa vụ để duy trì mức đệm an toàn vốn.');
  }

  // 6. Đề xuất giải pháp cụ thể trong 30–90 ngày
  const roadmapThirtyToNinetyDays: string[] = [];
  roadmapThirtyToNinetyDays.push('Thiết lập bảng theo dõi chi phí đơn vị (Unit Cost) và doanh thu theo ngày cho các sản phẩm/dịch vụ đóng góp 80% doanh thu.');
  if (challenges) {
    roadmapThirtyToNinetyDays.push(`Tập trung xử lý trọng tâm khó khăn mô tả: Thực hiện rà soát ngay lập tức nguyên nhân phát sinh của vấn đề "${challenges.slice(0, 80)}...".`);
  }
  if (answers.q06_price_sensitivity === 'revenue_sharp_drop' || answers.q06_price_sensitivity === 'many_switch_competitor') {
    roadmapThirtyToNinetyDays.push('Tạm dừng việc tăng giá đơn lẻ trực tiếp; chuyển sang chiến lược đóng gói giá trị (bundling) hoặc tặng kèm dịch vụ hỗ trợ.');
  }
  if (answers.q07_supply_cost === 'fluctuates_hurts_profit' || answers.q07_supply_cost === 'heavily_dependent') {
    roadmapThirtyToNinetyDays.push('Khảo sát và liên hệ ít nhất 2 nhà cung ứng dự phòng để giảm thiểu rủi ro gián đoạn nguồn hàng.');
  }

  // 7. Định hướng cải thiện trong 12 tháng
  const roadmapTwelveMonths: string[] = [];
  if (futurePlans) {
    roadmapTwelveMonths.push(`Hiện thực hóa kế hoạch đã định hướng: "${futurePlans.slice(0, 150)}..." gắn với từng mốc kiểm tra định lượng hàng quý.`);
  } else {
    roadmapTwelveMonths.push('Xây dựng kế hoạch kinh doanh 12 tháng bằng văn bản với các mục tiêu cụ thể về sản lượng hòa vốn và ngân sách chi phí.');
  }
  roadmapTwelveMonths.push('Nâng cao năng lực khác biệt hóa sản phẩm/dịch vụ để thoát khỏi cái bẫy cạnh tranh thuần túy về giá trên thị trường.');
  roadmapTwelveMonths.push('Hoàn thiện quy trình phân công trách nhiệm, gắn thưởng phạt với chỉ số hiệu quả công việc (KPI) rõ ràng để giảm rủi ro đại diện.');

  return {
    businessOverview,
    keyIssuesObserved,
    rootCausesAnalysis,
    competitiveAssessment,
    risksToVerify,
    roadmapThirtyToNinetyDays,
    roadmapTwelveMonths,
    sourceBasis: 'Tổng hợp phân tích từ câu hỏi nhận diện, 15 chỉ báo kinh tế vi mô và 4 câu tự luận thực tế do người tham gia cung cấp.',
    generatedByAi: false,
    isFallback: false,
  };
}

/**
 * Invokes server-side Gemini API (/api/analyze-qualitative) for deep contextual analysis.
 * Gracefully falls back to rule-based synthesis if network fails, timeout occurs, or on static hosting.
 */
export async function fetchAiQualitativeAnalysis(
  answers: SurveyAnswers,
  scoringResult?: any
): Promise<QualitativeAnalysisResult> {
  const fallback = generateRuleBasedQualitativeSynthesis(answers, scoringResult);

  // If no text provided at all, return the rule-based synthesis directly
  const hasNarrativeText = !!(
    answers.business_name?.trim() ||
    answers.q16_business_description?.trim() ||
    answers.q16?.trim() ||
    answers.q17_challenges?.trim() ||
    answers.q17?.trim() ||
    answers.q18_competitors_advantage?.trim() ||
    answers.q18?.trim() ||
    answers.q19_future_plans?.trim() ||
    answers.q19?.trim()
  );

  if (!hasNarrativeText) {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout

    const res = await fetch('/api/analyze-qualitative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, scoringResult }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.analysis) {
        const a = data.analysis;
        return {
          businessOverview: cleanText(a.businessOverview) || fallback.businessOverview,
          keyIssuesObserved: Array.isArray(a.keyIssuesObserved) && a.keyIssuesObserved.length > 0 ? a.keyIssuesObserved.map(cleanText) : fallback.keyIssuesObserved,
          rootCausesAnalysis: Array.isArray(a.rootCausesAnalysis) && a.rootCausesAnalysis.length > 0 ? a.rootCausesAnalysis.map(cleanText) : fallback.rootCausesAnalysis,
          competitiveAssessment: cleanText(a.competitiveAssessment) || fallback.competitiveAssessment,
          risksToVerify: Array.isArray(a.risksToVerify) && a.risksToVerify.length > 0 ? a.risksToVerify.map(cleanText) : fallback.risksToVerify,
          roadmapThirtyToNinetyDays: Array.isArray(a.roadmapThirtyToNinetyDays) && a.roadmapThirtyToNinetyDays.length > 0 ? a.roadmapThirtyToNinetyDays.map(cleanText) : fallback.roadmapThirtyToNinetyDays,
          roadmapTwelveMonths: Array.isArray(a.roadmapTwelveMonths) && a.roadmapTwelveMonths.length > 0 ? a.roadmapTwelveMonths.map(cleanText) : fallback.roadmapTwelveMonths,
          sourceBasis: cleanText(a.sourceBasis) || 'Phân tích chuyên sâu từ mô hình Gemini 3.8 Flash kết hợp hệ thống 8 chuyên đề Kinh tế học quản trị.',
          generatedByAi: true,
          isFallback: false,
        };
      }
    }
  } catch (err) {
    console.warn('[QualitativeEngine] Note: Using offline/local rule-based synthesis:', err);
  }

  return {
    ...fallback,
    isFallback: true,
  };
}
