export const INSTRUMENT_VERSION = 'v1.0.0';
export const CONSENT_VERSION = 'v1.0.0';
export const ALGORITHM_VERSION = 'RBA-ALGO-2026.1';

export interface QuestionOption {
  id: string;
  label: string;
  score?: number; // 1 to 5 for diagnostic questions
  isUncertainty?: boolean; // true for "Chưa theo dõi/Chưa biết"
}

export interface QuestionDefinition {
  id: string;
  code: string;
  title: string;
  description?: string;
  groupKey: 'demographic' | 'market' | 'operations' | 'pricing' | 'governance' | 'sustainability';
  groupTitle: string;
  type: 'single' | 'multiple' | 'text';
  maxSelect?: number;
  options?: QuestionOption[];
  allowOther?: boolean;
  isDiagnostic: boolean;
  theoreticalReference?: string;
  diagnosticObjective?: string;
}

export const INDICATOR_GROUPS: Record<
  'market' | 'operations' | 'pricing' | 'governance' | 'sustainability',
  { name: string; description: string; questions: string[] }
> = {
  market: {
    name: 'Nhu cầu & Thị trường',
    description: 'Đánh giá xu hướng cầu, độ nhạy cảm về giá của khách hàng, áp lực cạnh tranh và phản ứng chiến lược (Q5, Q6, Q11, Q12).',
    questions: ['q05', 'q06', 'q11', 'q12'],
  },
  operations: {
    name: 'Nguồn cung & Vận hành',
    description: 'Đánh giá tính ổn định chi phí đầu vào, mức độ kiểm soát biên lợi nhuận đơn vị và hiệu quả gia tăng nguồn lực/năng suất biên (Q7, Q8, Q9).',
    questions: ['q07', 'q08', 'q09'],
  },
  pricing: {
    name: 'Phương pháp định giá',
    description: 'Đánh giá tính toàn diện và căn cứ thực tế của quy trình định giá bán sản phẩm/dịch vụ (Q10).',
    questions: ['q10'],
  },
  governance: {
    name: 'Thông tin & Quản trị',
    description: 'Đánh giá mức độ minh bạch thông tin sản phẩm và quy trình phân định trách nhiệm, kiểm soát sai sót, xử lý bất đối xứng thông tin (Q13, Q14).',
    questions: ['q13', 'q14'],
  },
  sustainability: {
    name: 'Phát triển bền vững',
    description: 'Đánh giá mức độ cân bằng giữa mục tiêu tài chính ngắn hạn và trách nhiệm với con người, môi trường, tài nguyên dài hạn (Q15).',
    questions: ['q15'],
  },
};

export const SURVEY_QUESTIONS: QuestionDefinition[] = [
  // --- NHÓM A: THÔNG TIN NỀN VỀ HOẠT ĐỘNG KINH DOANH (Q1 - Q4) ---
  {
    id: 'q01',
    code: 'business_type',
    title: 'Câu 1. Loại hình hoạt động của bạn là gì?',
    description: 'Dùng để phân loại mẫu nghiên cứu khoa học, không tính điểm rủi ro.',
    groupKey: 'demographic',
    groupTitle: 'Nhóm A — Thông tin nền về hoạt động kinh doanh',
    type: 'single',
    isDiagnostic: false,
    options: [
      { id: 'enterprise', label: 'Doanh nghiệp / công ty' },
      { id: 'household', label: 'Hộ kinh doanh' },
      { id: 'individual', label: 'Cá nhân kinh doanh / tự kinh doanh' },
      { id: 'other', label: 'Khác' },
    ],
  },
  {
    id: 'q02',
    code: 'industry',
    title: 'Câu 2. Hoạt động kinh doanh của bạn thuộc ngành nào?',
    description: 'Dùng để phân tích theo đặc thù ngành, cho phép nhập chi tiết nếu chọn ngành khác.',
    groupKey: 'demographic',
    groupTitle: 'Nhóm A — Thông tin nền về hoạt động kinh doanh',
    type: 'single',
    allowOther: true,
    isDiagnostic: false,
    options: [
      { id: 'retail_wholesale', label: 'Bán lẻ / bán buôn' },
      { id: 'manufacturing', label: 'Sản xuất / chế biến' },
      { id: 'hospitality', label: 'Nhà hàng / ăn uống / lưu trú' },
      { id: 'professional_services', label: 'Dịch vụ chuyên môn' },
      { id: 'tech_ecommerce', label: 'Công nghệ / thương mại điện tử' },
      { id: 'construction_realestate', label: 'Xây dựng / bất động sản' },
      { id: 'logistics_transport', label: 'Vận tải / logistics' },
      { id: 'agriculture', label: 'Nông nghiệp' },
      { id: 'education_healthcare', label: 'Giáo dục / y tế' },
      { id: 'other', label: 'Ngành khác' },
    ],
  },
  {
    id: 'q03',
    code: 'business_age',
    title: 'Câu 3. Hoạt động kinh doanh đã diễn ra trong bao lâu?',
    description: 'Dùng để phân nhóm giai đoạn vòng đời hoạt động, không tính điểm rủi ro.',
    groupKey: 'demographic',
    groupTitle: 'Nhóm A — Thông tin nền về hoạt động kinh doanh',
    type: 'single',
    isDiagnostic: false,
    options: [
      { id: 'under_1y', label: 'Dưới 1 năm' },
      { id: '1_to_3y', label: 'Từ 1 đến dưới 3 năm' },
      { id: '3_to_7y', label: 'Từ 3 đến dưới 7 năm' },
      { id: 'above_7y', label: 'Từ 7 năm trở lên' },
    ],
  },
  {
    id: 'q04',
    code: 'employee_band',
    title: 'Câu 4. Quy mô nhân sự hiện tại của hoạt động kinh doanh là bao nhiêu?',
    description: 'Không bắt buộc cung cấp doanh thu tài chính bí mật; giúp đánh giá theo quy mô lao động.',
    groupKey: 'demographic',
    groupTitle: 'Nhóm A — Thông tin nền về hoạt động kinh doanh',
    type: 'single',
    isDiagnostic: false,
    options: [
      { id: 'solo', label: 'Chỉ có cá nhân chủ kinh doanh' },
      { id: '2_to_5', label: 'Từ 2–5 người' },
      { id: '6_to_20', label: 'Từ 6–20 người' },
      { id: '21_to_100', label: 'Từ 21–100 người' },
      { id: 'above_100', label: 'Trên 100 người' },
      { id: 'decline_to_state', label: 'Không muốn cung cấp thông tin' },
    ],
  },

  // --- NHÓM B: NHU CẦU, THỊ TRƯỜNG VÀ KHÁCH HÀNG (Q5, Q6) ---
  {
    id: 'q05',
    code: 'demand_trend',
    title: 'Câu 5. Trong 6–12 tháng gần nhất, tình hình nhu cầu của khách hàng đối với sản phẩm hoặc dịch vụ của bạn thay đổi như thế nào?',
    description: 'Mục đích: phản ánh xu hướng cầu và khả năng nhận biết thay đổi của thị trường.',
    groupKey: 'market',
    groupTitle: 'Nhóm B — Nhu cầu, thị trường và khách hàng',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 2: Cung, cầu và giá thị trường - Hàm cầu và sự dịch chuyển đường cầu.',
    diagnosticObjective: 'Nhận diện xu hướng mở rộng hoặc thu hẹp của cầu thị trường và độ nhạy tín hiệu kinh doanh.',
    options: [
      { id: 'sharp_increase', label: 'Tăng rõ rệt', score: 1 },
      { id: 'slight_increase', label: 'Tăng nhẹ', score: 1 },
      { id: 'stable', label: 'Tương đối ổn định', score: 2 },
      { id: 'slight_decrease', label: 'Giảm nhẹ', score: 3 },
      { id: 'sharp_decrease', label: 'Giảm rõ rệt', score: 4 },
      { id: 'unpredictable', label: 'Biến động khó dự đoán', score: 4 },
      { id: 'untracked', label: 'Chưa theo dõi được', score: 4, isUncertainty: true },
    ],
  },
  {
    id: 'q06',
    code: 'price_sensitivity',
    title: 'Câu 6. Khi bạn tăng giá bán ở mức vừa phải, khách hàng thường phản ứng như thế nào?',
    description: 'Mục đích: nhận diện mức độ nhạy cảm của khách hàng với giá bán và nguy cơ mất khách khi điều chỉnh giá (không tuyên bố là phép đo độ co giãn chính xác).',
    groupKey: 'market',
    groupTitle: 'Nhóm B — Nhu cầu, thị trường và khách hàng',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 2: Cung, cầu và giá thị trường - Độ co giãn của cầu theo giá và tác động tới tổng doanh thu.',
    diagnosticObjective: 'Nhận diện độ co giãn cảm nhận và rủi ro chuyển dịch hành vi tiêu dùng sang sản phẩm thay thế.',
    options: [
      { id: 'continue_buying', label: 'Phần lớn vẫn tiếp tục mua', score: 1 },
      { id: 'slight_drop_switch', label: 'Một số khách hàng giảm mua hoặc chuyển sang lựa chọn khác', score: 3 },
      { id: 'many_switch_competitor', label: 'Nhiều khách hàng chuyển sang đối thủ cạnh tranh', score: 4 },
      { id: 'revenue_sharp_drop', label: 'Doanh số có xu hướng giảm mạnh khi tăng giá', score: 5 },
      { id: 'untracked', label: 'Chưa từng theo dõi hoặc chưa có đủ dữ liệu', score: 4, isUncertainty: true },
    ],
  },

  // --- NHÓM C: NGUỒN CUNG, CHI PHÍ VÀ HIỆU QUẢ VẬN HÀNH (Q7, Q8, Q9) ---
  {
    id: 'q07',
    code: 'supply_cost',
    title: 'Câu 7. Chi phí đầu vào, nguồn hàng hoặc việc cung ứng nguyên liệu ảnh hưởng đến hoạt động kinh doanh của bạn như thế nào?',
    description: 'Mục đích: nhận diện nguy cơ từ nguồn cung, chi phí và sự phụ thuộc vào đối tác.',
    groupKey: 'operations',
    groupTitle: 'Nhóm C — Nguồn cung, chi phí và hiệu quả vận hành',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Cung ứng đầu vào, chi phí biến đổi và rủi ro chuỗi cung ứng.',
    diagnosticObjective: 'Đo lường mức độ dễ bị tổn thương trước cú sốc giá yếu tố sản xuất đầu vào.',
    options: [
      { id: 'stable_low_impact', label: 'Nguồn cung tương đối ổn định, tác động đến hoạt động không đáng kể', score: 1 },
      { id: 'fluctuates_manageable', label: 'Có biến động nhưng có thể xử lý bằng nguồn cung hoặc phương án thay thế', score: 2 },
      { id: 'fluctuates_hurts_profit', label: 'Giá đầu vào hoặc nguồn hàng biến động thường xuyên, ảnh hưởng đến lợi nhuận', score: 4 },
      { id: 'heavily_dependent', label: 'Phụ thuộc lớn vào một số nhà cung cấp hoặc nguồn đầu vào khó thay thế', score: 5 },
      { id: 'untracked', label: 'Chưa theo dõi được mức độ ảnh hưởng', score: 4, isUncertainty: true },
    ],
  },
  {
    id: 'q08',
    code: 'cost_control',
    title: 'Câu 8. Bạn kiểm soát chi phí và lợi nhuận của sản phẩm/dịch vụ ở mức độ nào?',
    description: 'Mục đích: phản ánh mức độ kiểm soát chi phí và thông tin phục vụ quyết định quản trị.',
    groupKey: 'operations',
    groupTitle: 'Nhóm C — Nguồn cung, chi phí và hiệu quả vận hành',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Chi phí cố định, chi phí biến đổi, chi phí đơn vị và chi phí biên.',
    diagnosticObjective: 'Xác định khả năng hạch toán chi phí đơn vị và kiểm soát điểm hòa vốn.',
    options: [
      { id: 'track_unit_and_margin', label: 'Theo dõi được các nhóm chi phí và thường xuyên tính chi phí trên một đơn vị sản phẩm/dịch vụ, kèm biên lợi nhuận', score: 1 },
      { id: 'track_aggregate_only', label: 'Theo dõi tổng doanh thu và tổng chi phí nhưng chưa phân tích thường xuyên theo từng sản phẩm/dịch vụ', score: 3 },
      { id: 'estimate_when_needed', label: 'Chỉ ước tính chi phí và lợi nhuận khi cần', score: 4 },
      { id: 'rarely_track', label: 'Hầu như chưa theo dõi được chi phí thực tế và lợi nhuận', score: 5 },
      { id: 'insufficient_info', label: 'Chưa có đủ thông tin để đánh giá', score: 4, isUncertainty: true },
    ],
  },
  {
    id: 'q09',
    code: 'resource_efficiency',
    title: 'Câu 9. Khi tăng thêm nhân sự, vốn, thiết bị hoặc các nguồn lực khác, hiệu quả hoạt động của bạn thường thay đổi như thế nào?',
    description: 'Mục đích: phát hiện dấu hiệu sử dụng nguồn lực chưa hiệu quả và nhu cầu xem xét năng suất biên, quy mô hoạt động (chỉ báo tự đánh giá).',
    groupKey: 'operations',
    groupTitle: 'Nhóm C — Nguồn cung, chi phí và hiệu quả vận hành',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 3: Lý thuyết sản xuất và chi phí - Quy luật năng suất biên giảm dần và hiệu suất theo quy mô.',
    diagnosticObjective: 'Nhận diện tình trạng năng suất biên giảm dần hoặc phát sinh phi kinh tế vì quy mô.',
    options: [
      { id: 'efficiency_rises_well', label: 'Hiệu quả hoặc sản lượng tăng tốt so với nguồn lực bổ sung', score: 1 },
      { id: 'output_rises_proportionally', label: 'Sản lượng tăng tương đối tương ứng với mức tăng nguồn lực', score: 2 },
      { id: 'diminishing_marginal_efficiency', label: 'Sản lượng vẫn tăng nhưng hiệu quả tăng thêm giảm dần', score: 4 },
      { id: 'cost_rises_faster_than_output', label: 'Chi phí tăng nhanh hơn kết quả thu được', score: 5 },
      { id: 'untracked', label: 'Chưa theo dõi hoặc chưa đủ dữ liệu', score: 4, isUncertainty: true },
    ],
  },

  // --- NHÓM D: ĐỊNH GIÁ VÀ CẠNH TRANH (Q10, Q11) ---
  {
    id: 'q10',
    code: 'pricing_methods',
    title: 'Câu 10. Bạn thường căn cứ vào đâu khi quyết định giá bán sản phẩm hoặc dịch vụ?',
    description: 'Cho phép chọn tối đa 3 phương án: Đánh giá cơ sở ra quyết định giá (không giả định mọi ngành đều có cùng cách định giá tối ưu).',
    groupKey: 'pricing',
    groupTitle: 'Nhóm D — Định giá và cạnh tranh',
    type: 'multiple',
    maxSelect: 3,
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 4, 5, 6: Định giá trong thị trường cạnh tranh hoàn toàn, độc quyền và cạnh tranh không hoàn toàn.',
    diagnosticObjective: 'Xác định sự kết hợp giữa phân tích chi phí nội bộ và sức mạnh định giá thị trường.',
    options: [
      { id: 'opt_cost', label: 'Chi phí thực tế và mức lợi nhuận mục tiêu' },
      { id: 'opt_demand', label: 'Mức sẵn lòng chi trả và nhu cầu của khách hàng' },
      { id: 'opt_competitor', label: 'Giá của đối thủ cạnh tranh' },
      { id: 'opt_value', label: 'Chất lượng, thương hiệu và giá trị khác biệt của sản phẩm/dịch vụ' },
      { id: 'opt_season', label: 'Tính mùa vụ và biến động thị trường' },
      { id: 'opt_gut', label: 'Chủ yếu dựa vào kinh nghiệm hoặc cảm tính' },
      { id: 'opt_none', label: 'Chưa có phương pháp định giá tương đối rõ ràng' },
    ],
  },
  {
    id: 'q11',
    code: 'competition_pressure',
    title: 'Câu 11. Mức độ cạnh tranh trong thị trường của bạn hiện nay như thế nào?',
    description: 'Mục đích: nhận diện áp lực cạnh tranh và khả năng khác biệt hóa (không tự động xếp vào mô hình lý thuyết hoàn hảo).',
    groupKey: 'market',
    groupTitle: 'Nhóm D — Định giá và cạnh tranh',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 4, 6: Cấu trúc thị trường, hàng rào gia nhập, mức độ phân biệt hóa sản phẩm và áp lực giá.',
    diagnosticObjective: 'Đánh giá khả năng tự vệ về giá thông qua khác biệt hóa sản phẩm hoặc rào cản chuyển đổi.',
    options: [
      { id: 'clear_diff_loyal', label: 'Có sự khác biệt rõ về sản phẩm/dịch vụ và nhóm khách hàng tương đối trung thành', score: 1 },
      { id: 'moderate_comp_differentiated', label: 'Cạnh tranh ở mức vừa phải, vẫn có điểm khác biệt để thu hút khách hàng', score: 2 },
      { id: 'many_rivals_some_diff', label: 'Có nhiều đối thủ nhưng vẫn tạo được một số khác biệt', score: 3 },
      { id: 'many_substitutes_price_war', label: 'Có nhiều sản phẩm/dịch vụ thay thế gần giống nhau, khách hàng chủ yếu so sánh giá', score: 5 },
      { id: 'untracked', label: 'Chưa nắm rõ tình hình đối thủ', score: 4, isUncertainty: true },
    ],
  },

  // --- NHÓM E: CHIẾN LƯỢC, THÔNG TIN VÀ KIỂM SOÁT (Q12, Q13, Q14) ---
  {
    id: 'q12',
    code: 'strategic_reaction',
    title: 'Câu 12. Khi đưa ra quyết định quan trọng như thay đổi giá, khuyến mãi hoặc mở rộng kinh doanh, bạn xử lý phản ứng của đối thủ như thế nào?',
    description: 'Mục đích: đánh giá mức độ ra quyết định chiến lược và khả năng xem xét sự phụ thuộc lẫn nhau giữa các bên.',
    groupKey: 'market',
    groupTitle: 'Nhóm E — Chiến lược, thông tin và kiểm soát',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 7: Lý thuyết trò chơi - Tương tác chiến lược, thế cân bằng Nash và sự phụ thuộc lẫn nhau trong độc quyền nhóm.',
    diagnosticObjective: 'Đánh giá tư duy dự báo phản ứng đối thủ trước khi thay đổi giá bán hoặc tung khuyến mãi.',
    options: [
      { id: 'proactive_scenarios', label: 'Chủ động xem xét nhiều kịch bản, phản ứng có thể xảy ra và tác động đến chi phí/lợi nhuận', score: 1 },
      { id: 'monitor_regularly', label: 'Theo dõi đối thủ thường xuyên và đánh giá kết quả các quyết định', score: 2 },
      { id: 'reactive_after_rival', label: 'Chủ yếu điều chỉnh sau khi đối thủ đã hành động', score: 4 },
      { id: 'copycat_without_eval', label: 'Thường làm theo giá hoặc chương trình khuyến mãi của đối thủ mà chưa đánh giá đầy đủ hiệu quả', score: 5 },
      { id: 'untracked', label: 'Chưa có cách theo dõi hoặc đánh giá rõ ràng', score: 4, isUncertainty: true },
    ],
  },
  {
    id: 'q13',
    code: 'info_transparency',
    title: 'Câu 13. Khách hàng có được cung cấp đủ thông tin đáng tin cậy để hiểu và đánh giá sản phẩm/dịch vụ của bạn hay không?',
    description: 'Mục đích: nhận diện vấn đề về minh bạch thông tin, tín hiệu chất lượng và niềm tin thị trường.',
    groupKey: 'governance',
    groupTitle: 'Nhóm E — Chiến lược, thông tin và kiểm soát',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 7: Bất cân xứng thông tin - Lựa chọn đối nghịch (Adverse Selection) và phát tín hiệu chất lượng (Signaling).',
    diagnosticObjective: 'Nhận diện rủi ro suy giảm niềm tin và chi phí xác minh chất lượng của người mua.',
    options: [
      { id: 'clear_consistent_feedback', label: 'Thông tin về chất lượng, đặc điểm, giá, điều kiện giao dịch được công bố rõ; có cơ chế tiếp nhận và xử lý phản hồi', score: 1 },
      { id: 'mostly_clear_some_inconsistent', label: 'Phần lớn thông tin rõ ràng nhưng một số nội dung chưa nhất quán', score: 2 },
      { id: 'misunderstood_hard_to_verify', label: 'Khách hàng đôi khi hiểu nhầm hoặc khó xác minh chất lượng thực tế', score: 4 },
      { id: 'no_clear_system', label: 'Chưa có cách cung cấp và kiểm soát thông tin sản phẩm/dịch vụ tương đối rõ ràng', score: 5 },
      { id: 'untracked', label: 'Chưa đánh giá được', score: 4, isUncertainty: true },
    ],
  },
  {
    id: 'q14',
    code: 'governance_control',
    title: 'Câu 14. Hoạt động kinh doanh của bạn có quy trình theo dõi trách nhiệm, đánh giá kết quả và kiểm soát sai sót như thế nào?',
    description: 'Thiết kế cho cả cá nhân/chủ kinh doanh tự kiểm soát và doanh nghiệp có nhân sự: nhận diện điểm yếu giám sát và rủi ro đạo đức.',
    groupKey: 'governance',
    groupTitle: 'Nhóm E — Chiến lược, thông tin và kiểm soát',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 7: Bất cân xứng thông tin - Vấn đề người ủy nhiệm - người đại diện (Principal-Agent) và rủi ro đạo đức (Moral Hazard).',
    diagnosticObjective: 'Đo lường cơ chế giám sát quy trình, chế tài sai sót và gắn kết lợi ích người thực hiện với mục tiêu chung.',
    options: [
      { id: 'clear_roles_review_incentives', label: 'Trách nhiệm được phân định, có tiêu chí đánh giá và kiểm tra định kỳ; các khuyến khích được xem xét để hạn chế hành vi gây hại cho hoạt động chung', score: 1 },
      { id: 'assigned_but_inconsistent', label: 'Có phân công và theo dõi nhưng chưa nhất quán hoặc chưa thường xuyên', score: 3 },
      { id: 'relies_on_individual_instinct', label: 'Nhiều hoạt động phụ thuộc vào kinh nghiệm cá nhân; quy trình kiểm tra và đánh giá còn hạn chế', score: 4 },
      { id: 'repeated_errors_no_control', label: 'Sai sót lặp lại, thiếu theo dõi hoặc chưa có cơ chế kiểm soát phù hợp', score: 5 },
      { id: 'untracked', label: 'Chưa đánh giá được', score: 4, isUncertainty: true },
    ],
  },

  // --- NHÓM F: PHÁT TRIỂN BỀN VỮNG (Q15) ---
  {
    id: 'q15',
    code: 'sustainability',
    title: 'Câu 15. Khi ra quyết định kinh doanh trong dài hạn, bạn cân nhắc các yếu tố kinh tế, con người và môi trường ở mức độ nào?',
    description: 'Mục đích: phản ánh mức độ cân nhắc giữa kết quả kinh tế trước mắt và khả năng phát triển bền vững.',
    groupKey: 'sustainability',
    groupTitle: 'Nhóm F — Phát triển bền vững',
    type: 'single',
    isDiagnostic: true,
    theoreticalReference: 'Tài liệu 8: Phát triển bền vững: những tư tưởng và mô hình phát triển mới - Mô hình cân bằng 3 trụ cột (Kinh tế - Xã hội - Môi trường).',
    diagnosticObjective: 'Nhận diện rủi ro khai thác cạn kiệt nguồn lực hoặc đánh đổi uy tín dài hạn vì lợi ích trước mắt.',
    options: [
      { id: 'balanced_3_pillars', label: 'Thường xem xét đồng thời khả năng sinh lời, lợi ích khách hàng/người lao động và việc sử dụng nguồn lực, tác động môi trường dài hạn', score: 1 },
      { id: 'finance_people_partial', label: 'Có quan tâm đến hiệu quả tài chính và con người nhưng chưa đánh giá đầy đủ các tác động khác', score: 2 },
      { id: 'short_term_focus', label: 'Chủ yếu ưu tiên kết quả ngắn hạn; chưa có cách đánh giá tác động dài hạn rõ ràng', score: 4 },
      { id: 'neglect_sustainability', label: 'Ít quan tâm hoặc chưa có biện pháp xử lý các vấn đề về lãng phí nguồn lực và tác động dài hạn', score: 5 },
      { id: 'untracked', label: 'Chưa theo dõi hoặc chưa đánh giá được', score: 4, isUncertainty: true },
    ],
  },
];
