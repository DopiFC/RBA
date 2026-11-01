import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Check,
  RefreshCw,
  Building,
  Building2,
  TrendingUp,
  Boxes,
  Tag,
  Scale,
  Leaf,
  FileCheck,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { SURVEY_QUESTIONS, QuestionDefinition, RESPONDENT_ROLES } from '../../config/survey';
import type { SurveyAnswers } from '../../types/survey';

interface SurveyWizardProps {
  email: string;
  responseId: string;
  answers: SurveyAnswers;
  onUpdateAnswers: (newAnswers: SurveyAnswers) => void;
  onSubmitSurvey: () => Promise<{ success: boolean; error?: string }>;
  onBackToConsent: () => void;
}

// 8 thematic steps + 1 confirmation review step = 9 steps total
const WIZARD_STEPS = [
  { id: 'profile', title: 'Nhận diện kinh doanh', subtitle: 'Câu 1: Thông tin cơ bản về hoạt động kinh doanh', icon: Building2, questions: [] },
  { id: 'group_a', title: 'Thông tin chung', subtitle: 'Câu 2–5: Phân loại mẫu nghiên cứu', icon: Building, questions: ['q01', 'q02', 'q03', 'q04'] },
  { id: 'group_b', title: 'Nhu cầu & Thị trường', subtitle: 'Câu 6–7: Xu hướng cầu & độ nhạy giá', icon: TrendingUp, questions: ['q05', 'q06'] },
  { id: 'group_c', title: 'Nguồn cung & Chi phí', subtitle: 'Câu 8–10: Đầu vào, biên chi phí & năng suất', icon: Boxes, questions: ['q07', 'q08', 'q09'] },
  { id: 'group_d', title: 'Định giá & Cạnh tranh', subtitle: 'Câu 11–12: Cơ sở định giá & áp lực giá', icon: Tag, questions: ['q10', 'q11'] },
  { id: 'group_e', title: 'Chiến lược & Quản trị', subtitle: 'Câu 13–15: Phản ứng đối thủ & giám sát', icon: Scale, questions: ['q12', 'q13', 'q14'] },
  { id: 'group_f', title: 'Phát triển bền vững', subtitle: 'Câu 16: Cân bằng tài nguyên & dài hạn', icon: Leaf, questions: ['q15'] },
  { id: 'qualitative', title: 'Khảo sát thực tế', subtitle: 'Câu 17–20: Khó khăn, đối thủ & kế hoạch tương lai', icon: Sparkles, questions: ['q16', 'q17', 'q18', 'q19'] },
  { id: 'confirm', title: 'Kiểm tra & Xác nhận', subtitle: 'Rà soát 20 câu trước khi gửi', icon: FileCheck, questions: [] },
];

export const SurveyWizard: React.FC<SurveyWizardProps> = ({
  email,
  responseId,
  answers,
  onUpdateAnswers,
  onSubmitSurvey,
  onBackToConsent,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const progressPercent = Math.round((currentStepIndex / (WIZARD_STEPS.length - 1)) * 100);

  // Helper to get question object
  const getQ = (qId: string): QuestionDefinition => SURVEY_QUESTIONS.find((q) => q.id === qId)!;

  // Single-select option handler
  const handleSelectOption = (qId: string, code: string, optionId: string) => {
    const key = `${qId}_${code}` as keyof SurveyAnswers;
    onUpdateAnswers({
      ...answers,
      [key]: optionId,
    });
    setStepError(null);
  };

  // Multi-select option handler (Q10)
  const handleToggleMultiOption = (optionId: string) => {
    const currentList = answers.q10_pricing_methods || [];
    let updated: string[];

    if (currentList.includes(optionId)) {
      updated = currentList.filter((item) => item !== optionId);
    } else {
      if (currentList.length >= 3) {
        setStepError('Câu 11 cho phép chọn tối đa 3 phương án định giá.');
        return;
      }
      updated = [...currentList, optionId];
    }

    onUpdateAnswers({
      ...answers,
      q10_pricing_methods: updated,
    });
    setStepError(null);
  };

  // Textarea change handler for open-ended questions
  const handleTextChange = (qId: string, text: string) => {
    if (text.length > 1500) return; // Enforce 1,500 character ceiling
    const code = getQ(qId).code;
    const suffixedKey = `${qId}_${code}` as keyof SurveyAnswers;
    const directKey = qId as keyof SurveyAnswers;

    onUpdateAnswers({
      ...answers,
      [suffixedKey]: text,
      [directKey]: text,
    });
  };

  // Get dynamic display title matching the 20-question sequential sequence
  const getQuestionDisplayTitle = (qDef: QuestionDefinition): string => {
    switch (qDef.id) {
      case 'q01': return 'Câu 2. Loại hình hoạt động của bạn là gì?';
      case 'q02': return 'Câu 3. Hoạt động kinh doanh của bạn thuộc ngành nào?';
      case 'q03': return 'Câu 4. Hoạt động kinh doanh đã diễn ra trong bao lâu?';
      case 'q04': return 'Câu 5. Quy mô nhân sự hiện tại của hoạt động kinh doanh là bao nhiêu?';
      case 'q05': return 'Câu 6. Trong 6–12 tháng gần nhất, tình hình nhu cầu của khách hàng đối với sản phẩm hoặc dịch vụ thay đổi như thế nào?';
      case 'q06': return 'Câu 7. Khi bạn tăng giá bán ở mức vừa phải, khách hàng thường phản ứng như thế nào?';
      case 'q07': return 'Câu 8. Chi phí đầu vào, nguồn hàng hoặc việc cung ứng nguyên liệu ảnh hưởng như thế nào?';
      case 'q08': return 'Câu 9. Bạn kiểm soát chi phí và lợi nhuận của sản phẩm/dịch vụ ở mức độ nào?';
      case 'q09': return 'Câu 10. Khi tăng thêm nhân sự, vốn, thiết bị, hiệu quả hoạt động thay đổi như thế nào?';
      case 'q10': return 'Câu 11. Bạn thường căn cứ vào đâu khi quyết định giá bán sản phẩm hoặc dịch vụ?';
      case 'q11': return 'Câu 12. Mức độ cạnh tranh trong thị trường của bạn hiện nay như thế nào?';
      case 'q12': return 'Câu 13. Khi đưa ra quyết định quan trọng (giá, khuyến mãi, mở rộng), bạn xử lý phản ứng của đối thủ như thế nào?';
      case 'q13': return 'Câu 14. Khách hàng có được cung cấp đủ thông tin đáng tin cậy để hiểu và đánh giá sản phẩm/dịch vụ hay không?';
      case 'q14': return 'Câu 15. Hoạt động kinh doanh có quy trình theo dõi trách nhiệm, đánh giá kết quả và kiểm soát sai sót như thế nào?';
      case 'q15': return 'Câu 16. Khi ra quyết định kinh doanh trong dài hạn, bạn cân nhắc các yếu tố kinh tế, con người và môi trường ở mức độ nào?';
      case 'q16': return 'Câu 17. Mô tả hoạt động kinh doanh';
      case 'q17': return 'Câu 18. Khó khăn thực tế trong hoạt động kinh doanh';
      case 'q18': return 'Câu 19. Đối thủ và lợi thế cạnh tranh';
      case 'q19': return 'Câu 20. Kế hoạch phát triển trong tương lai';
      default: return qDef.title;
    }
  };

  // Validate step before moving forward
  const validateStep = (stepIdx: number): boolean => {
    const step = WIZARD_STEPS[stepIdx];
    if (step.id === 'confirm') return true;

    // Step 0: Business Profile validation
    if (step.id === 'profile') {
      if (!answers.business_name?.trim()) {
        setStepError('Vui lòng nhập tên doanh nghiệp, hộ kinh doanh hoặc tên gọi hoạt động kinh doanh.');
        return false;
      }
      if (!answers.business_location?.trim()) {
        setStepError('Vui lòng nhập địa bàn hoạt động (tỉnh/thành phố).');
        return false;
      }
      if (!answers.respondent_role?.trim()) {
        setStepError('Vui lòng chọn vai trò của bạn trong hoạt động kinh doanh.');
        return false;
      }
      setStepError(null);
      return true;
    }

    // Step 7: Qualitative questions are optional to avoid survey dropouts
    if (step.id === 'qualitative') {
      setStepError(null);
      return true;
    }

    // Steps 1 to 6 (Q1 to Q15)
    for (const qId of step.questions) {
      const qDef = getQ(qId);
      if (qId === 'q10') {
        const selected = answers.q10_pricing_methods;
        if (!selected || selected.length === 0) {
          setStepError(`Vui lòng chọn ít nhất 1 phương án định giá ở Câu 11 (tối đa 3 phương án).`);
          return false;
        }
      } else {
        const key = `${qId}_${qDef.code}` as keyof SurveyAnswers;
        const val = answers[key];
        if (!val) {
          setStepError(`Vui lòng trả lời câu hỏi: "${getQuestionDisplayTitle(qDef).split('.')[0]}." trước khi tiếp tục.`);
          return false;
        }
        if (qId === 'q02' && val === 'other' && !answers.q02_industry_other?.trim()) {
          setStepError('Bạn đã chọn "Ngành khác", vui lòng điền tên ngành cụ thể.');
          return false;
        }
      }
    }

    setStepError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStepIndex)) {
      if (currentStepIndex < WIZARD_STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToConsent();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const res = await onSubmitSurvey();
    setIsSubmitting(false);

    if (!res.success) {
      setSubmitError(res.error || 'Lỗi khi lưu dữ liệu vào hệ thống. Vui lòng bấm thử lại.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header & Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <span>Bước {currentStepIndex + 1} / {WIZARD_STEPS.length}: {currentStep.title}</span>
          <span>{progressPercent}% hoàn thành</span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Tabs indicator (responsive) */}
        <div className="hidden sm:flex items-center justify-between mt-4 border-b border-slate-200 pb-3 overflow-x-auto gap-2">
          {WIZARD_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (idx <= currentStepIndex || validateStep(currentStepIndex)) {
                    setCurrentStepIndex(idx);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-medium shrink-0 transition-colors ${
                  isCurrent
                    ? 'text-indigo-600 font-bold'
                    : isDone
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isCurrent
                      ? 'bg-indigo-600 text-white font-bold'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="hidden lg:inline">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert if step validation fails */}
      {stepError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Main Step Body */}
      {currentStep.id === 'profile' ? (
        /* STEP 0: CÂU 1 MỚI - THÔNG TIN NHẬN DIỆN HOẠT ĐỘNG KINH DOANH */
        <div className="space-y-6">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Câu 1. Thông tin nhận diện hoạt động kinh doanh</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Anh/Chị vui lòng cung cấp một số thông tin cơ bản về hoạt động kinh doanh của mình.
            </p>
            <div className="mt-3 flex items-start gap-2 text-xs text-indigo-800 bg-indigo-100/70 p-2.5 rounded-lg">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý bảo mật & khoa học:</strong> Đối với cá nhân kinh doanh chưa có tên thương hiệu, cho phép nhập tên gọi hoạt động kinh doanh phù hợp. Không yêu cầu mã số thuế, CCCD hay số tài khoản ngân hàng. Câu này chỉ dùng để nhận diện và phân loại dữ liệu, <strong>không tính điểm rủi ro</strong>.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            {/* 1. Tên doanh nghiệp/hộ kinh doanh/thương hiệu */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Tên doanh nghiệp / hộ kinh doanh / cửa hàng / thương hiệu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={answers.business_name || ''}
                onChange={(e) => {
                  onUpdateAnswers({ ...answers, business_name: e.target.value });
                  setStepError(null);
                }}
                placeholder="Ví dụ: Công ty Cổ phần An Nam, Tiệm bánh Mẹ Làm, Shop Thời trang Linh..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                (Bắt buộc: Cá nhân kinh doanh tự do có thể nhập tên sản phẩm hoặc tên hoạt động kinh doanh đang dùng).
              </p>
            </div>

            {/* 2. Địa điểm hoạt động: Tỉnh / Thành phố */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Địa điểm hoạt động (Tỉnh / Thành phố) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={answers.business_location || ''}
                onChange={(e) => {
                  onUpdateAnswers({ ...answers, business_location: e.target.value });
                  setStepError(null);
                }}
                placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ, Bình Dương..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                (Bắt buộc: Chỉ yêu cầu tỉnh/thành phố, không yêu cầu địa chỉ nhà riêng hoặc địa chỉ chi tiết).
              </p>
            </div>

            {/* 3. Vai trò người trả lời */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Vai trò của Bạn trong hoạt động kinh doanh <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {RESPONDENT_ROLES.map((role) => {
                  const isSelected = answers.respondent_role === role.label;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        onUpdateAnswers({ ...answers, respondent_role: role.label });
                        setStepError(null);
                      }}
                      className={`text-left p-3 rounded-lg border text-sm transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-slate-900 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Website, Fanpage hoặc Kênh bán hàng (không bắt buộc) */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Website, Fanpage hoặc đường dẫn kênh bán hàng <span className="text-slate-400 font-normal">(không bắt buộc)</span>
              </label>
              <input
                type="text"
                value={answers.business_website || ''}
                onChange={(e) => onUpdateAnswers({ ...answers, business_website: e.target.value })}
                placeholder="Ví dụ: https://facebook.com/tiembanh..., https://shopee.vn/..., hoặc an-nam.vn"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                (Tùy chọn: Giúp đội ngũ nghiên cứu có thêm ngữ cảnh khi hỗ trợ phân tích chuyên sâu).
              </p>
            </div>
          </div>
        </div>
      ) : currentStep.id === 'qualitative' ? (
        /* STEP 7: 4 CÂU HỎI TỰ LUẬN CHUYÊN SÂU MỚI (CÂU 17 - 20) */
        <div className="space-y-6">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Khảo sát thực tế chuyên sâu (Câu 17 – 20)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Các câu hỏi văn bản tự do giúp phản ánh chân thực mô hình vận hành, khó khăn thực tế và kế hoạch 12 tháng tới của bạn.
            </p>
          </div>

          {/* Safety Warning Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Lưu ý bảo mật thông tin:</span> Vui lòng không nhập mật khẩu, thông tin cá nhân khách hàng, thông tin tài khoản ngân hàng hoặc bí mật kinh doanh nhạy cảm.
              <span className="block mt-0.5 text-amber-800 text-[11px]">
                (Các câu hỏi tự luận không bắt buộc để tránh làm gián đoạn khảo sát, nhưng câu trả lời của Bạn sẽ giúp hệ thống và AI đưa ra bản phân tích sâu sát thực tế nhất).
              </span>
            </div>
          </div>

          {/* Render 4 Qualitative Textarea Questions */}
          {currentStep.questions.map((qId) => {
            const qDef = getQ(qId);
            const ansKey = `${qId}_${qDef.code}` as keyof SurveyAnswers;
            const currentText = (answers[ansKey] as string) || (answers[qId as keyof SurveyAnswers] as string) || '';
            const charCount = currentText.length;

            return (
              <div
                key={qDef.id}
                className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors space-y-3"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {getQuestionDisplayTitle(qDef)}
                  </h3>
                  {qDef.description && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {qDef.description}
                    </p>
                  )}
                </div>

                {/* Hints bullet list */}
                {qDef.hints && qDef.hints.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block mb-1">Gợi ý nội dung:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[12px] text-slate-600">
                      {qDef.hints.map((hint, hIdx) => (
                        <li key={hIdx}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    rows={4}
                    value={currentText}
                    maxLength={1500}
                    onChange={(e) => handleTextChange(qDef.id, e.target.value)}
                    placeholder={qDef.placeholder || 'Nhập câu trả lời của Anh/Chị tại đây...'}
                    className="w-full text-sm p-3.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed transition-all resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                    <span>(Không bắt buộc viết quá dài)</span>
                    <span className={charCount >= 1400 ? 'text-amber-600 font-semibold' : ''}>
                      {charCount} / 1.500 ký tự
                    </span>
                  </div>
                </div>

                {/* Example Snippet */}
                {qDef.exampleSnippet && (
                  <div className="text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-md italic border-l-2 border-indigo-400">
                    {qDef.exampleSnippet}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : currentStep.id !== 'confirm' ? (
        /* STEPS 1 TO 6: CÂU 2 ĐẾN CÂU 16 */
        <div className="space-y-8">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <currentStep.icon className="w-5 h-5 text-indigo-600" />
              <span>{currentStep.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{currentStep.subtitle}</p>
          </div>

          {/* Render Questions for Current Step */}
          {currentStep.questions.map((qId) => {
            const qDef = getQ(qId);
            const ansKey = `${qId}_${qDef.code}` as keyof SurveyAnswers;

            return (
              <div
                key={qDef.id}
                className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {getQuestionDisplayTitle(qDef)}
                  </h3>
                  {qDef.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {qDef.description}
                    </p>
                  )}
                  {qDef.theoreticalReference && (
                    <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-md inline-block">
                      {qDef.theoreticalReference}
                    </div>
                  )}
                </div>

                {/* Multiple choice: Q10 special handling */}
                {qDef.type === 'multiple' ? (
                  <div className="space-y-2.5">
                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-between">
                      <span>Chọn tối đa 3 phương án:</span>
                      <span className="font-semibold text-indigo-600">
                        Đã chọn {(answers.q10_pricing_methods || []).length}/3
                      </span>
                    </div>
                    {qDef.options?.map((opt) => {
                      const isChecked = (answers.q10_pricing_methods || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggleMultiOption(opt.id)}
                          className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-start gap-3 ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-400 text-slate-900 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="leading-snug">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Single choice options */
                  <div className="space-y-2.5">
                    {qDef.options?.map((opt) => {
                      const isSelected = answers[ansKey] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(qDef.id, qDef.code, opt.id)}
                          className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="leading-snug">{opt.label}</span>
                        </button>
                      );
                    })}

                    {/* Q2: "Ngành khác" text field */}
                    {qDef.id === 'q02' && answers.q02_industry === 'other' && (
                      <div className="mt-3 pl-7">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Vui lòng nêu rõ ngành hoạt động của bạn:
                        </label>
                        <input
                          type="text"
                          value={answers.q02_industry_other || ''}
                          onChange={(e) =>
                            onUpdateAnswers({
                              ...answers,
                              q02_industry_other: e.target.value,
                            })
                          }
                          placeholder="Ví dụ: Dược phẩm, Mỹ nghệ, Năng lượng tái tạo..."
                          className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* STEP 8: REVIEW & CONFIRMATION SCREEN (TẤT CẢ 20 CÂU HỎI) */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Kiểm tra lại toàn bộ 20 câu trả lời trước khi gửi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mã tham chiếu khảo sát: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">{responseId}</code>
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Account & Profile Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <span className="font-semibold text-slate-900">Email người khảo sát:</span>
                <span className="text-slate-700">{email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <span className="font-semibold text-slate-900">Đơn vị kinh doanh:</span>
                <span className="text-slate-700 font-medium">{answers.business_name || 'Chưa cung cấp'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <span className="font-semibold text-slate-900">Địa bàn / Vai trò:</span>
                <span className="text-slate-700">{answers.business_location || 'N/A'} — {answers.respondent_role || 'N/A'}</span>
              </div>
              {answers.business_website && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className="font-semibold text-slate-900">Kênh bán hàng:</span>
                  <span className="text-slate-700">{answers.business_website}</span>
                </div>
              )}
            </div>

            {/* List 15 structured questions */}
            <div className="divide-y divide-slate-100">
              <div className="py-2 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                Các chỉ báo định lượng (Câu 2 đến Câu 16)
              </div>
              {SURVEY_QUESTIONS.filter((q) => q.groupKey !== 'qualitative').map((q) => {
                const ansKey = `${q.id}_${q.code}` as keyof SurveyAnswers;
                let displayVal = 'Chưa chọn';

                if (q.id === 'q10') {
                  const arr = answers.q10_pricing_methods || [];
                  if (arr.length > 0) {
                    displayVal = arr
                      .map((id) => q.options?.find((o) => o.id === id)?.label || id)
                      .join('; ');
                  }
                } else {
                  const id = answers[ansKey] as string;
                  if (id) {
                    const opt = q.options?.find((o) => o.id === id);
                    displayVal = opt?.label || id;
                    if (q.id === 'q02' && id === 'other' && answers.q02_industry_other) {
                      displayVal += ` (${answers.q02_industry_other})`;
                    }
                  }
                }

                return (
                  <div key={q.id} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="font-medium text-slate-800 sm:w-1/2">
                      {getQuestionDisplayTitle(q).split('.')[0]}: {getQuestionDisplayTitle(q).split('. ')[1]}
                    </span>
                    <span className="text-slate-600 sm:w-1/2 sm:text-right text-xs">
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* List 4 qualitative questions */}
            <div className="divide-y divide-slate-100 pt-3 border-t border-slate-200">
              <div className="py-2 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                Khảo sát thực tế chuyên sâu (Câu 17 đến Câu 20)
              </div>
              {SURVEY_QUESTIONS.filter((q) => q.groupKey === 'qualitative').map((q) => {
                const ansKey = `${q.id}_${q.code}` as keyof SurveyAnswers;
                const textVal = (answers[ansKey] as string) || (answers[q.id as keyof SurveyAnswers] as string);

                return (
                  <div key={q.id} className="py-2.5 flex flex-col gap-1">
                    <span className="font-semibold text-slate-800">
                      {getQuestionDisplayTitle(q)}:
                    </span>
                    <span className="text-slate-600 text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {textVal?.trim() ? textVal : '(Người tham gia để trống)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Lưu khảo sát chưa thành công</p>
                <p className="mt-0.5">{submitError}</p>
                <p className="mt-1 text-slate-600 text-xs">
                  (Dữ liệu của bạn vẫn được lưu giữ an toàn, bạn có thể bấm nút "Thử gửi lại" bên dưới mà không lo bị trùng lặp).
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong>Nguyên tắc ghi nhận dữ liệu:</strong> Trạng thái "Đã ghi nhận khảo sát" chỉ xuất hiện sau khi máy chủ xác nhận lưu dữ liệu thành công. Không tự động chuyển trang nếu việc ghi nhận bị gián đoạn.
          </div>
        </div>
      )}

      {/* Navigation & Submission Controls */}
      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {currentStep.id !== 'confirm' ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span>Tiếp tục</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang ghi nhận vào máy chủ...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{submitError ? 'Thử gửi lại khảo sát' : 'Gửi khảo sát & Xem báo cáo'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
