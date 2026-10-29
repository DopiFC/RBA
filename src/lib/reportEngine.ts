import type {
  SurveyAnswers,
  SurveyScoringResult,
  DiagnosticIssue,
  QualitativeScenarios,
  ActionRoadmap,
  ResultBand,
} from '../types/survey';
import { calculateSurveyResults, getBandLabel } from './scoring';
import { ALGORITHM_VERSION, INSTRUMENT_VERSION, SURVEY_QUESTIONS } from '../config/survey';

/**
 * Generates the full diagnostic report grounded in the 8 managerial economics texts
 */
export function generateFullReport(
  answers: SurveyAnswers,
  responseId: string,
  submittedAt: string = new Date().toISOString()
): SurveyScoringResult {
  const scoring = calculateSurveyResults(answers, responseId);

  // Identify prioritized issues based on high normalized indices (>= 50) and specific answers
  const issues: DiagnosticIssue[] = [];
  const strengths: string[] = [];

  // Evaluate Q5 & Q6 (Demand & Price Sensitivity)
  const q05Index = scoring.indicatorScores.q05?.normalizedIndex ?? 0;
  const q06Index = scoring.indicatorScores.q06?.normalizedIndex ?? 0;
  if (answers.q05_demand_trend === 'sharp_decrease' || answers.q05_demand_trend === 'slight_decrease' || answers.q05_demand_trend === 'unpredictable') {
    issues.push({
      id: 'issue_demand_contraction',
      indicatorKey: 'q05',
      title: 'Xu hướng cầu sụt giảm hoặc biến động mạnh',
      observedAnswer: `Câu 5: Người tham gia ghi nhận nhu cầu khách hàng "${getOptionLabel('q05', answers.q05_demand_trend)}".`,
      theoreticalConcept: 'Tài liệu 2: Cung, cầu và giá thị trường - Dịch chuyển hàm cầu và các nhân tố quyết định sức mua thị trường.',
      managerialImplication: 'Doanh thu sụt giảm có thể bắt nguồn từ thu hẹp quy mô thị trường, áp lực từ hàng hóa thay thế hoặc thay đổi thị hiếu tiêu dùng.',
      potentialRisks: 'Tồn kho ứ đọng, suy giảm dòng tiền và áp lực hạ giá thiếu cân nhắc gây giảm biên lợi nhuận.',
      dataToCollect: 'Tần suất mua hàng theo nhóm khách, dữ liệu bán hàng theo tuần, biến động giá của hàng hóa thay thế.',
      recommendedAction: 'Phân tích lại phân khúc khách hàng cốt lõi; rà soát tính cạnh tranh của sản phẩm; tối ưu chi phí biến đổi để duy trì dòng tiền.',
      severity: q05Index >= 75 ? 'very_high' : 'high',
    });
  } else if (answers.q05_demand_trend === 'sharp_increase' || answers.q05_demand_trend === 'slight_increase') {
    strengths.push('Nhu cầu thị trường đang trong xu hướng tăng trưởng tích cực, mở ra cơ hội tối ưu hóa sản lượng và mở rộng quy mô hợp lý.');
  }

  if (answers.q06_price_sensitivity === 'revenue_sharp_drop' || answers.q06_price_sensitivity === 'many_switch_competitor') {
    issues.push({
      id: 'issue_high_elasticity',
      indicatorKey: 'q06',
      title: 'Độ nhạy cảm về giá của khách hàng ở mức cao (Cầu co giãn lớn)',
      observedAnswer: `Câu 6: Phản ứng khách hàng khi tăng giá: "${getOptionLabel('q06', answers.q06_price_sensitivity)}".`,
      theoreticalConcept: 'Tài liệu 2: Cung, cầu và giá thị trường - Hệ số co giãn của cầu theo giá và tác động ngược chiều tới tổng doanh thu (|Ed| > 1).',
      managerialImplication: 'Sản phẩm có mức độ thay thế cao hoặc thiếu rào cản chuyển đổi; việc tự ý tăng giá sẽ khiến khách hàng lập tức chuyển sang đối thủ.',
      potentialRisks: 'Mất thị phần nhanh chóng nếu tăng giá đơn lẻ mà không gia tăng giá trị nhận thức hoặc đóng gói kèm dịch vụ.',
      dataToCollect: 'Khảo sát mức giá sẵn lòng chi trả (WTP) của từng phân khúc; phân tích tính năng vượt trội so với đối thủ trực tiếp.',
      recommendedAction: 'Tránh tăng giá trực tiếp trên sản phẩm hiện hữu; áp dụng chiến lược định giá theo gói (bundling), nâng cao giá trị dịch vụ hậu mãi để giảm độ nhạy giá.',
      severity: q06Index >= 75 ? 'very_high' : 'high',
    });
  } else if (answers.q06_price_sensitivity === 'continue_buying') {
    strengths.push('Khách hàng ít nhạy cảm với việc điều chỉnh giá vừa phải, phản ánh sự trung thành hoặc sản phẩm có giá trị riêng biệt khó thay thế.');
  }

  // Evaluate Q7 & Q8 & Q9 (Supply, Costs, Diminishing Returns)
  const q07Index = scoring.indicatorScores.q07?.normalizedIndex ?? 0;
  if (answers.q07_supply_cost === 'heavily_dependent' || answers.q07_supply_cost === 'fluctuates_hurts_profit') {
    issues.push({
      id: 'issue_supply_vulnerability',
      indicatorKey: 'q07',
      title: 'Dễ bị tổn thương do biến động chi phí đầu vào hoặc phụ thuộc nhà cung cấp',
      observedAnswer: `Câu 7: Tác động nguồn cung: "${getOptionLabel('q07', answers.q07_supply_cost)}".`,
      theoreticalConcept: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Chi phí đầu vào biến đổi và rủi ro độc quyền của bên bán yếu tố sản xuất.',
      managerialImplication: 'Sự phụ thuộc vào số ít nhà cung ứng làm giảm quyền thương lượng và dễ chịu tổn thất khi giá nguyên liệu tăng đột biến.',
      potentialRisks: 'Biên lợi nhuận gộp bị bào mòn khi không thể chuyển phần chi phí tăng sang giá bán do áp lực cạnh tranh.',
      dataToCollect: 'Bảng theo dõi giá đầu vào theo tháng; danh sách 3 nhà cung cấp tiềm năng thay thế; tỷ trọng chi phí nguyên vật liệu trong giá thành.',
      recommendedAction: 'Đa dạng hóa danh mục nhà cung cấp; đàm phán hợp đồng khung dài hạn hoặc tìm giải pháp chuẩn hóa nguyên liệu thay thế.',
      severity: q07Index >= 75 ? 'very_high' : 'high',
    });
  } else if (answers.q07_supply_cost === 'stable_low_impact') {
    strengths.push('Nguồn cung ứng đầu vào tương đối ổn định, tạo điều kiện thuận lợi để dự toán chi phí sản xuất chuẩn xác.');
  }

  const q08Index = scoring.indicatorScores.q08?.normalizedIndex ?? 0;
  if (answers.q08_cost_control === 'rarely_track' || answers.q08_cost_control === 'estimate_when_needed' || answers.q08_cost_control === 'track_aggregate_only') {
    issues.push({
      id: 'issue_cost_tracking_gap',
      indicatorKey: 'q08',
      title: 'Thiếu hạch toán chi phí đơn vị và biên lợi nhuận theo sản phẩm',
      observedAnswer: `Câu 8: Mức độ kiểm soát chi phí: "${getOptionLabel('q08', answers.q08_cost_control)}".`,
      theoreticalConcept: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Phân biệt chi phí cố định (FC), chi phí biến đổi (VC), chi phí trung bình (AC) và chi phí biên (MC).',
      managerialImplication: 'Nếu chỉ theo dõi tổng chi phí, doanh nghiệp dễ gặp tình trạng "sản phẩm bán chạy nhưng thực tế bù lỗ" do không xác định được chi phí đơn vị thực tế.',
      potentialRisks: 'Định giá sai lầm, không nhận diện được điểm hòa vốn và phân bổ sai nguồn lực vào sản phẩm không hiệu quả.',
      dataToCollect: 'Bảng định mức chi phí nguyên vật liệu, nhân công trực tiếp và chi phí quản lý phân bổ cho từng dòng sản phẩm/dịch vụ.',
      recommendedAction: 'Xây dựng bảng tính chi phí đơn vị (Unit Cost Sheet); xác định rõ biên đóng góp (Contribution Margin) của từng sản phẩm chủ lực.',
      severity: q08Index >= 75 ? 'very_high' : 'high',
    });
  } else if (answers.q08_cost_control === 'track_unit_and_margin') {
    strengths.push('Hệ thống theo dõi chi phí chi tiết theo đơn vị và biên lợi nhuận được duy trì thường xuyên, là nền tảng quản trị tài chính vững vàng.');
  }

  const q09Index = scoring.indicatorScores.q09?.normalizedIndex ?? 0;
  if (answers.q09_resource_efficiency === 'cost_rises_faster_than_output' || answers.q09_resource_efficiency === 'diminishing_marginal_efficiency') {
    issues.push({
      id: 'issue_diminishing_returns',
      indicatorKey: 'q09',
      title: 'Dấu hiệu năng suất biên giảm dần hoặc phát sinh phi kinh tế vì quy mô',
      observedAnswer: `Câu 9: Hiệu quả khi bổ sung nguồn lực: "${getOptionLabel('q09', answers.q09_resource_efficiency)}".`,
      theoreticalConcept: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Quy luật năng suất biên giảm dần (Law of Diminishing Marginal Returns).',
      managerialImplication: 'Khi bổ sung thêm nhân sự hay vốn trong điều kiện hạ tầng/quy trình cố định, sản lượng gia tăng trên mỗi đơn vị chi phí có xu hướng giảm sút.',
      potentialRisks: 'Chi phí cố định và quản lý tăng vọt làm sụt giảm lợi nhuận ròng dù doanh số có thể tăng nhẹ.',
      dataToCollect: 'Chỉ số đo lường năng suất lao động trên mỗi nhân sự; tỷ lệ thời gian lãng phí trong quy trình; chi phí vận hành trên một đơn vị thành phẩm.',
      recommendedAction: 'Tạm dừng tuyển dụng/mở rộng nóng; chuẩn hóa quy trình làm việc và tự động hóa thao tác trước khi bổ sung thêm nhân lực hoặc vốn.',
      severity: q09Index >= 75 ? 'very_high' : 'high',
    });
  }

  // Evaluate Q10 (Pricing Method)
  const q10Score = scoring.indicatorScores.q10?.rawScore ?? 3;
  if (q10Score >= 4) {
    issues.push({
      id: 'issue_pricing_basis_inadequate',
      indicatorKey: 'q10',
      title: 'Phương pháp định giá thiếu căn cứ toàn diện',
      observedAnswer: `Câu 10: Phương pháp định giá lựa chọn: ${formatPricingMethods(answers.q10_pricing_methods)}.`,
      theoreticalConcept: 'Tài liệu 4, 5, 6: Các chiến lược định giá tối ưu dựa trên cấu trúc chi phí biên và độ co giãn cầu của thị trường.',
      managerialImplication: 'Định giá thuần cảm tính hoặc chỉ nhìn đối thủ khiến doanh nghiệp rơi vào bẫy cạnh tranh giá rẻ hoặc định giá thấp hơn điểm hòa vốn.',
      potentialRisks: 'Bào mòn biên lợi nhuận nếu chỉ chạy theo đối thủ, hoặc mất khách hàng nếu định giá cao mà không truyền thông được giá trị tương xứng.',
      dataToCollect: 'Bảng tổng hợp giá đối thủ cạnh tranh cùng phân khúc; chi phí biến đổi bình quân; phản hồi của khách hàng về tỷ lệ Giá trị/Giá bán.',
      recommendedAction: 'Thiết lập quy trình định giá 3 chiều: (1) Sàn giá dựa trên chi phí đơn vị, (2) Trần giá dựa trên mức độ sẵn lòng chi trả, (3) Biên độ cạnh tranh theo đối thủ.',
      severity: q10Score === 5 ? 'very_high' : 'high',
    });
  } else if (q10Score === 1) {
    strengths.push('Phương pháp định giá kết hợp chặt chẽ giữa chi phí thực tế và yếu tố thị trường, giúp cân bằng giữa lợi nhuận mục tiêu và sức cạnh tranh.');
  }

  // Evaluate Q11 & Q12 (Competition & Strategic Reactions)
  const q11Index = scoring.indicatorScores.q11?.normalizedIndex ?? 0;
  if (answers.q11_competition_pressure === 'many_substitutes_price_war') {
    issues.push({
      id: 'issue_price_war_commodity',
      indicatorKey: 'q11',
      title: 'Áp lực cạnh tranh gay gắt và nguy cơ rơi vào bẫy cạnh tranh giá',
      observedAnswer: `Câu 11: Môi trường cạnh tranh: "${getOptionLabel('q11', answers.q11_competition_pressure)}".`,
      theoreticalConcept: 'Tài liệu 4, 6: Cạnh tranh hoàn toàn & Cạnh tranh không hoàn toàn - Sản phẩm đồng nhất làm triệt tiêu quyền lực định giá.',
      managerialImplication: 'Khi sản phẩm thiếu sự khác biệt hóa, khách hàng sẽ so sánh thuần túy về giá, dẫn đến biên lợi nhuận tiến dần về 0.',
      potentialRisks: 'Cuộc chiến hạ giá kéo dài làm kiệt quệ tài chính của các đơn vị quy mô vừa và nhỏ.',
      dataToCollect: 'Bản đồ định vị đối thủ; các điểm chạm khách hàng chưa được phục vụ tốt trên thị trường; chi phí tạo sự khác biệt sản phẩm.',
      recommendedAction: 'Tìm kiếm ngách thị trường chuyên biệt; tái định vị sản phẩm bằng cách bổ sung dịch vụ hậu mãi, bảo hành hoặc cá nhân hóa trải nghiệm.',
      severity: 'very_high',
    });
  }

  const q12Index = scoring.indicatorScores.q12?.normalizedIndex ?? 0;
  if (answers.q12_strategic_reaction === 'copycat_without_eval' || answers.q12_strategic_reaction === 'reactive_after_rival') {
    issues.push({
      id: 'issue_reactive_strategy',
      indicatorKey: 'q12',
      title: 'Hành vi cạnh tranh bị động hoặc sao chép đối thủ thiếu phân tích',
      observedAnswer: `Câu 12: Phản ứng chiến lược: "${getOptionLabel('q12', answers.q12_strategic_reaction)}".`,
      theoreticalConcept: 'Tài liệu 7: Lý thuyết trò chơi - Tương tác chiến lược, cân bằng Nash và rủi ro tiến tới kết cục kém tối ưu (Prisoner\'s Dilemma).',
      managerialImplication: 'Sao chép mù quáng các đợt giảm giá hoặc khuyến mãi của đối thủ có thể dẫn cả hai bên vào trạng thái cùng chịu lỗ.',
      potentialRisks: 'Lãng phí ngân sách tiếp thị mà không tạo ra lợi thế bền vững; bị đối thủ dắt mũi chiến lược.',
      dataToCollect: 'Hiệu quả thực tế của các chương trình khuyến mãi trước đây; dự báo động thái tiếp theo của các đối thủ dẫn đầu.',
      recommendedAction: 'Xây dựng cây quyết định hoặc kịch bản phản ứng trước khi tung ra bất kỳ điều chỉnh giá hay chương trình khuyến mãi lớn nào.',
      severity: q12Index >= 75 ? 'very_high' : 'high',
    });
  }

  // Evaluate Q13 & Q14 (Information Transparency & Governance)
  const q13Index = scoring.indicatorScores.q13?.normalizedIndex ?? 0;
  if (answers.q13_info_transparency === 'no_clear_system' || answers.q13_info_transparency === 'misunderstood_hard_to_verify') {
    issues.push({
      id: 'issue_information_asymmetry',
      indicatorKey: 'q13',
      title: 'Bất cân xứng thông tin và rủi ro suy giảm niềm tin khách hàng',
      observedAnswer: `Câu 13: Minh bạch thông tin: "${getOptionLabel('q13', answers.q13_info_transparency)}".`,
      theoreticalConcept: 'Tài liệu 7: Thông tin bất cân xứng - Thị trường hàng xấu (Lemon Market) và tín hiệu chất lượng (Signaling).',
      managerialImplication: 'Khi khách hàng không thể tự thẩm định chất lượng, họ sẽ chỉ chấp nhận trả mức giá bình quân thấp hoặc nghi ngờ chất lượng.',
      potentialRisks: 'Tỷ lệ khiếu nại, hoàn hàng cao; chi phí thuyết phục bán hàng tăng vọt.',
      dataToCollect: 'Tỷ lệ khách hàng khiếu nại hoặc hủy đơn; các câu hỏi thường gặp nhất của khách hàng chưa được giải đáp trước khi mua.',
      recommendedAction: 'Chuẩn hóa tài liệu mô tả sản phẩm; công khai cam kết chất lượng, chính sách hoàn tiền và xây dựng hệ thống đánh giá khách quan.',
      severity: q13Index >= 75 ? 'very_high' : 'high',
    });
  }

  const q14Index = scoring.indicatorScores.q14?.normalizedIndex ?? 0;
  if (answers.q14_governance_control === 'repeated_errors_no_control' || answers.q14_governance_control === 'relies_on_individual_instinct') {
    issues.push({
      id: 'issue_internal_control_gap',
      indicatorKey: 'q14',
      title: 'Thiếu quy trình kiểm soát sai sót và cơ chế động viên/giám sát',
      observedAnswer: `Câu 14: Quy trình kiểm soát trách nhiệm: "${getOptionLabel('q14', answers.q14_governance_control)}".`,
      theoreticalConcept: 'Tài liệu 7: Bất cân xứng thông tin - Vấn đề người ủy nhiệm - người đại diện (Principal-Agent problem) và rủi ro đạo đức.',
      managerialImplication: 'Khi thiếu tiêu chí đánh giá minh bạch và quy trình kiểm tra định kỳ, sai sót dễ bị che giấu hoặc lặp lại thường xuyên.',
      potentialRisks: 'Thất thoát nguồn lực, suy giảm chất lượng dịch vụ đồng đều và phụ thuộc quá mức vào một vài cá nhân.',
      dataToCollect: 'Sổ nhật ký ghi nhận sai sót và nguyên nhân; danh mục phân công trách nhiệm cho các công đoạn trọng yếu.',
      recommendedAction: 'Thiết lập danh mục kiểm tra tiêu chuẩn (Checklist) cho từng công việc; quy định rõ tiêu chuẩn nghiệm thu và cơ chế thưởng phạt gắn với kết quả.',
      severity: q14Index >= 75 ? 'very_high' : 'high',
    });
  }

  // Evaluate Q15 (Sustainability)
  const q15Index = scoring.indicatorScores.q15?.normalizedIndex ?? 0;
  if (answers.q15_sustainability === 'neglect_sustainability' || answers.q15_sustainability === 'short_term_focus') {
    issues.push({
      id: 'issue_sustainability_risk',
      indicatorKey: 'q15',
      title: 'Ưu tiên kết quả ngắn hạn, thiếu cân nhắc rủi ro tài nguyên & bền vững',
      observedAnswer: `Câu 15: Định hướng dài hạn: "${getOptionLabel('q15', answers.q15_sustainability)}".`,
      theoreticalConcept: 'Tài liệu 8: Phát triển bền vững - Mô hình 3 trụ cột (Triple Bottom Line: Kinh tế - Con người - Môi trường).',
      managerialImplication: 'Tập trung duy nhất vào dòng tiền tức thời mà bỏ qua đời sống nhân sự hoặc rủi ro pháp lý về môi trường có thể gây đổ vỡ đột ngột khi chính sách thay đổi.',
      potentialRisks: 'Nhân sự nghỉ việc cao làm tăng chi phí đào tạo lại; nguy cơ chịu chế tài pháp lý hoặc bị người tiêu dùng tẩy chay.',
      dataToCollect: 'Tỷ lệ biến động nhân sự hàng năm; định mức lãng phí nguyên phụ liệu và điện/nước trong vận hành.',
      recommendedAction: 'Rà soát các nguồn lãng phí trong vận hành; xây dựng lộ trình chăm sóc người lao động và giảm thiểu tác động môi trường từng bước.',
      severity: q15Index >= 75 ? 'very_high' : 'high',
    });
  }

  // Pick top 3 priority issues sorted by severity
  const sortedIssues = [...issues].sort((a, b) => {
    const rank = { very_high: 3, high: 2, moderate: 1, low: 0 };
    return rank[b.severity] - rank[a.severity];
  });
  const topPriorities = sortedIssues.slice(0, 3);

  // If no issues found (ideal case), provide default health-check maintenance guidance
  if (topPriorities.length === 0) {
    topPriorities.push({
      id: 'issue_continuous_monitoring',
      indicatorKey: 'general',
      title: 'Duy trì kỷ luật vận hành và tiếp tục theo dõi biến động thị trường',
      observedAnswer: 'Các câu trả lời cho thấy doanh nghiệp hiện kiểm soát tương đối tốt các chỉ báo then chốt.',
      theoreticalConcept: 'Tài liệu 1: Đại cương kinh tế học cho nhà quản trị - Ra quyết định trong điều kiện biến động không chắc chắn.',
      managerialImplication: 'Doanh nghiệp đang vận hành ổn định nhưng môi trường kinh tế vi mô luôn có tính biến động cao.',
      potentialRisks: 'Chủ quan trước các tín hiệu thay đổi công nghệ hoặc động thái mới từ đối thủ tiềm ẩn.',
      dataToCollect: 'Dữ liệu chỉ số hài lòng khách hàng (CSAT/NPS); chỉ số tăng trưởng doanh thu theo tháng.',
      recommendedAction: 'Duy trì việc đo lường định kỳ và chủ động rà soát chiến lược kinh doanh mỗi quý một lần.',
      severity: 'low',
    });
  }

  // Roadmap actions based on identified issues
  const actionRoadmap: ActionRoadmap = {
    thirtyDays: [
      topPriorities[0]?.recommendedAction || 'Khảo sát và rà soát các nguồn số liệu quản trị chưa được theo dõi thường xuyên.',
      answers.q08_cost_control !== 'track_unit_and_margin'
        ? 'Thiết lập bảng tính chi phí đơn vị và phân tách chi phí cố định - chi phí biến đổi cho các sản phẩm/dịch vụ cốt lõi.'
        : 'Rà soát lại danh mục đơn hàng và biên lợi nhuận thực tế của từng nhóm khách hàng lớn.',
      'Tổ chức buổi họp nội bộ làm rõ quy trình phân công trách nhiệm và hạn chế các sai sót vận hành lặp lại.',
    ],
    ninetyDays: [
      'Xây dựng quy tắc định giá chuẩn mực: kết hợp chi phí thực tế, mức sẵn lòng chi trả của khách hàng và vị thế so với đối thủ.',
      answers.q07_supply_cost === 'heavily_dependent' || answers.q07_supply_cost === 'fluctuates_hurts_profit'
        ? 'Tìm kiếm và đàm phán hợp đồng nguyên tắc với ít nhất 2 nhà cung cấp dự phòng để giảm rủi ro gián đoạn.'
        : 'Chuẩn hóa quy trình giao dịch, thông tin cam kết chất lượng sản phẩm để loại bỏ bất cân xứng thông tin với người mua.',
      'Thiết lập hệ thống kịch bản phản ứng trước khi điều chỉnh giá hoặc đối thủ tung chiến dịch khuyến mãi lớn.',
    ],
    twelveMonths: [
      'Tập trung đầu tư xây dựng điểm khác biệt hóa đặc thù về chất lượng và dịch vụ để thoát khỏi bẫy cạnh tranh thuần giá.',
      'Nâng cấp quy trình nội bộ, áp dụng công cụ số hóa để nâng cao năng suất biên của lao động trước khi mở rộng quy mô.',
      'Tích hợp các nguyên tắc phát triển bền vững: tiết kiệm tài nguyên, giữ chân nhân sự cốt lõi và xây dựng thương hiệu uy tín dài hạn.',
    ],
  };

  // Qualitative scenarios
  const scenarios: QualitativeScenarios = {
    favorable: {
      title: 'Kịch bản Thuận lợi: Cầu ổn định, tối ưu hóa biên lợi nhuận',
      description:
        'Thị trường duy trì sức mua tốt; doanh nghiệp kiểm soát chặt chẽ giá thành đơn vị và gia tăng được sự khác biệt hóa của sản phẩm.',
      triggerConditions: [
        'Nhu cầu tiêu dùng phục hồi tích cực và thị hiếu ổn định.',
        'Chi phí đầu vào và nguồn cung không xảy ra cú sốc đứt gãy lớn.',
        'Doanh nghiệp kiên định với chính sách giá dựa trên giá trị và chi phí thực tế.',
      ],
      monitoringIndicators: [
        'Tỷ lệ khách hàng quay lại mua hàng (Retention Rate).',
        'Biên lợi nhuận gộp theo từng sản phẩm chủ lực (Gross Margin).',
        'Tỷ lệ hoàn thành công việc đúng tiến độ không có lỗi sai sót.',
      ],
    },
    baseline: {
      title: 'Kịch bản Cơ sở: Cạnh tranh tiếp diễn, cần quản trị chi phí chặt chẽ',
      description:
        'Sức mua thị trường đi ngang hoặc tăng nhẹ; áp lực cạnh tranh giá vẫn hiện hữu đòi hỏi doanh nghiệp phải liên tục tinh gọn vận hành.',
      triggerConditions: [
        'Đối thủ tiếp tục áp dụng các biện pháp khuyến mãi để giành thị phần.',
        'Chi phí nguyên vật liệu và nhân sự có xu hướng nhích nhẹ theo mặt bằng chung.',
      ],
      monitoringIndicators: [
        'Điểm hòa vốn (Break-even Point) theo tháng.',
        'Mức độ co giãn của khách hàng khi thị trường có biến động giá.',
        'Năng suất lao động bình quân trên mỗi nhân viên.',
      ],
    },
    adverse: {
      title: 'Kịch bản Bất lợi: Cú sốc chi phí đầu vào hoặc suy giảm sức mua',
      description:
        'Cầu thị trường thu hẹp trong khi giá nguyên vật liệu đầu vào tăng hoặc đối thủ kích hoạt cuộc chiến hạ giá gay gắt.',
      triggerConditions: [
        'Kinh tế vĩ mô suy giảm khiến người tiêu dùng cắt giảm chi tiêu không thiết yếu.',
        'Nhà cung ứng chủ lực tăng giá mạnh hoặc đứt nguồn cung.',
        'Xuất hiện thêm các sản phẩm thay thế giá rẻ với quy mô lớn.',
      ],
      monitoringIndicators: [
        'Dòng tiền hoạt động kinh doanh (Operating Cash Flow) và số ngày tồn trữ vốn lưu động.',
        'Tỷ lệ khách hàng chuyển dịch sang lựa chọn khác.',
        'Mức giảm biên lợi nhuận khi phải chịu áp lực hạ giá.',
      ],
    },
  };

  return {
    responseId,
    instrumentVersion: INSTRUMENT_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    submittedAt,
    validQuestionCount: scoring.validCount,
    hasEnoughDataForOverall: scoring.hasEnoughDataForOverall,
    overallAttentionIndex: scoring.overallAttentionIndex,
    overallBand: scoring.overallBand,
    overallBandLabel: getBandLabel(scoring.overallBand),
    groups: scoring.groups,
    indicatorScores: scoring.indicatorScores,
    topPriorities,
    keyStrengths: strengths.length > 0 ? strengths : ['Doanh nghiệp thể hiện tinh thần chủ động tự đánh giá và tiếp cận khoa học trong quản trị.'],
    scenarios,
    actionRoadmap,
  };
}

function getOptionLabel(questionId: string, optionId?: string): string {
  if (!optionId) return 'Không có thông tin';
  const qDef = SURVEY_QUESTIONS.find((q) => q.id === questionId);
  const opt = qDef?.options?.find((o) => o.id === optionId);
  return opt?.label || optionId;
}

function formatPricingMethods(methods?: string[]): string {
  if (!methods || methods.length === 0) return 'Chưa chọn phương pháp';
  const q10Def = SURVEY_QUESTIONS.find((q) => q.id === 'q10');
  const labels = methods.map((m) => {
    const opt = q10Def?.options?.find((o) => o.id === m);
    return opt?.label || m;
  });
  return labels.join('; ');
}
