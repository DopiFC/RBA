import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Check,
  RefreshCw,
  Building,
  TrendingUp,
  Boxes,
  Tag,
  Scale,
  Leaf,
  FileCheck,
} from 'lucide-react';
import { SURVEY_QUESTIONS, QuestionDefinition } from '../../config/survey';
import type { SurveyAnswers } from '../../types/survey';

interface SurveyWizardProps {
  email: string;
  responseId: string;
  answers: SurveyAnswers;
  onUpdateAnswers: (newAnswers: SurveyAnswers) => void;
  onSubmitSurvey: () => Promise<{ success: boolean; error?: string }>;
  onBackToConsent: () => void;
}

// Group definitions for the 6 step wizard + 1 confirmation step
const WIZARD_STEPS = [
  { id: 'group_a', title: 'Thông tin chung', subtitle: 'Phân loại mẫu nghiên cứu', icon: Building, questions: ['q01', 'q02', 'q03', 'q04'] },
  { id: 'group_b', title: 'Nhu cầu & Thị trường', subtitle: 'Xu hướng cầu & độ nhạy giá', icon: TrendingUp, questions: ['q05', 'q06'] },
  { id: 'group_c', title: 'Nguồn cung & Chi phí', subtitle: 'Đầu vào, biên chi phí & năng suất', icon: Boxes, questions: ['q07', 'q08', 'q09'] },
  { id: 'group_d', title: 'Định giá & Cạnh tranh', subtitle: 'Cơ sở định giá & áp lực giá', icon: Tag, questions: ['q10', 'q11'] },
  { id: 'group_e', title: 'Chiến lược & Quản trị', subtitle: 'Phản ứng đối thủ & giám sát', icon: Scale, questions: ['q12', 'q13', 'q14'] },
  { id: 'group_f', title: 'Phát triển bền vững', subtitle: 'Cân bằng tài nguyên & dài hạn', icon: Leaf, questions: ['q15'] },
  { id: 'confirm', title: 'Kiểm tra & Xác nhận', subtitle: 'Rà soát trước khi gửi hệ thống', icon: FileCheck, questions: [] },
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
  const progressPercent = Math.round(((currentStepIndex) / (WIZARD_STEPS.length - 1)) * 100);

  // Helper to get question object
  const getQ = (qId: string): QuestionDefinition => SURVEY_QUESTIONS.find((q) => q.id === qId)!;

  // Answer handler for single-select
  const handleSelectOption = (qId: string, code: string, optionId: string) => {
    const key = `${qId}_${code}` as keyof SurveyAnswers;
    onUpdateAnswers({
      ...answers,
      [key]: optionId,
    });
    setStepError(null);
  };

  // Answer handler for multi-select (Q10)
  const handleToggleMultiOption = (optionId: string) => {
    const currentList = answers.q10_pricing_methods || [];
    let updated: string[];

    if (currentList.includes(optionId)) {
      updated = currentList.filter((item) => item !== optionId);
    } else {
      if (currentList.length >= 3) {
        setStepError('Câu 10 cho phép chọn tối đa 3 phương án.');
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

  // Validate current step before advancing
  const validateStep = (stepIdx: number): boolean => {
    const step = WIZARD_STEPS[stepIdx];
    if (step.id === 'confirm') return true;

    for (const qId of step.questions) {
      const qDef = getQ(qId);
      if (qId === 'q10') {
        const selected = answers.q10_pricing_methods;
        if (!selected || selected.length === 0) {
          setStepError(`Vui lòng chọn ít nhất 1 phương án định giá ở Câu 10 (tối đa 3 phương án).`);
          return false;
        }
      } else {
        const key = `${qId}_${qDef.code}` as keyof SurveyAnswers;
        const val = answers[key];
        if (!val) {
          setStepError(`Vui lòng trả lời: "${qDef.title.split('.')[0]}." trước khi tiếp tục.`);
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
        <div className="hidden sm:flex items-center justify-between mt-4 border-b border-slate-200 pb-3">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  // Allow jumping to completed steps or review
                  if (idx <= currentStepIndex || validateStep(currentStepIndex)) {
                    setCurrentStepIndex(idx);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
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
                      ? 'bg-indigo-600 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="hidden md:inline">{step.title}</span>
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
      {currentStep.id !== 'confirm' ? (
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
                    {qDef.title}
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
        /* STEP 7: REVIEW & CONFIRMATION SCREEN */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Kiểm tra lại câu trả lời trước khi gửi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mã tham chiếu khảo sát: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">{responseId}</code>
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-900 block mb-1">Tài khoản nghiên cứu xác thực:</span>
              <span className="text-slate-700">{email}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {SURVEY_QUESTIONS.map((q) => {
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
                      {q.title.split('.')[0]}: {q.title.split('. ')[1]}
                    </span>
                    <span className="text-slate-600 sm:w-1/2 sm:text-right text-xs">
                      {displayVal}
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
