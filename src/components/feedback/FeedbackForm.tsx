import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';
import type { SurveyFeedbackPayload } from '../../types/survey';

interface FeedbackFormProps {
  responseId: string;
  onBackToReport: () => void;
  onSubmitFeedback: (payload: SurveyFeedbackPayload) => Promise<{ success: boolean; error?: string }>;
}

const PRIORITY_CHOICES = [
  'Nhu cầu và doanh số',
  'Cạnh tranh và khách hàng',
  'Giá bán và lợi nhuận',
  'Chi phí đầu vào và nguồn cung',
  'Hiệu quả vận hành và năng suất',
  'Quản trị tài chính và thông tin chi phí',
  'Nhân sự, phân công và kiểm soát',
  'Thông tin sản phẩm/dịch vụ và niềm tin khách hàng',
  'Công nghệ và chuyển đổi phương thức kinh doanh',
  'Nguồn lực và phát triển bền vững',
  'Khác',
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  responseId,
  onBackToReport,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<number>(4);
  const [realismFit, setRealismFit] = useState<'fit' | 'partial' | 'not_fit' | 'insufficient_info'>('fit');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [futureOptIn, setFutureOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTogglePriority = (item: string) => {
    if (selectedPriorities.includes(item)) {
      setSelectedPriorities(selectedPriorities.filter((p) => p !== item));
    } else {
      if (selectedPriorities.length >= 3) {
        return;
      }
      setSelectedPriorities([...selectedPriorities, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const payload: SurveyFeedbackPayload = {
      feedbackId: `FB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      responseId,
      usefulnessRating: rating,
      realismFit,
      prioritiesNext12m: selectedPriorities,
      additionalComments: comments.trim(),
      futureResearchOptIn: futureOptIn,
      submittedAt: new Date().toISOString(),
    };

    const res = await onSubmitFeedback(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.error || 'Đã xảy ra lỗi khi lưu ý kiến phản hồi. Vui lòng thử lại.');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Cảm ơn bạn đã đóng góp ý kiến!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ý kiến phản hồi của bạn đã được ghi nhận riêng biệt và liên kết với mã khảo sát{' '}
            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700">{responseId}</code>.
            Những đóng góp thực tế này là cơ sở quan trọng để nhóm nghiên cứu hoàn thiện bộ chỉ báo kinh tế vi mô.
          </p>
          <div className="pt-4">
            <button
              onClick={onBackToReport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại xem báo cáo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <button
        onClick={onBackToReport}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại xem báo cáo</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Biểu mẫu Góp ý Sau Báo cáo
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Đánh giá Tính Thực tiễn & Hữu ích của Báo cáo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mã khảo sát liên kết: <code className="font-mono text-slate-700">{responseId}</code> (Phần phản hồi không làm thay đổi điểm số đã tính ban đầu).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Mức độ hữu ích */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              1. Mức độ hữu ích của báo cáo đối với bạn:
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="flex flex-col items-center gap-1 group focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 group-hover:text-amber-200'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-500">
                    {star === 1 ? 'Kém' : star === 3 ? 'Bình thường' : star === 5 ? 'Rất hữu ích' : star}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mức độ phù hợp với tình hình thực tế */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              2. Mức độ phù hợp của kết quả với tình hình thực tế đơn vị bạn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'fit', label: 'Phù hợp' },
                { id: 'partial', label: 'Phù hợp một phần' },
                { id: 'not_fit', label: 'Chưa phù hợp' },
                { id: 'insufficient_info', label: 'Tôi chưa đủ thông tin để đánh giá' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRealismFit(item.id as any)}
                  className={`text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center gap-2.5 ${
                    realismFit === item.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      realismFit === item.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {realismFit === item.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ba vấn đề cần ưu tiên nhất trong 12 tháng tới */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-900">
                3. Ba vấn đề bạn cần ưu tiên nhất trong 12 tháng tới:
              </label>
              <span className="text-xs font-semibold text-indigo-600">
                Đã chọn {selectedPriorities.length}/3
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIORITY_CHOICES.map((choice) => {
                const isSelected = selectedPriorities.includes(choice);
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleTogglePriority(choice)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-slate-900 font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ý kiến bổ sung */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              4. Ý kiến đóng góp bổ sung (tùy chọn):
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Chia sẻ thêm về thực trạng kinh doanh của bạn, các vấn đề chưa được bộ câu hỏi đề cập, hoặc đề xuất nâng cấp báo cáo:
            </p>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Nhập ý kiến đóng góp của bạn tại đây..."
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* 5. Đồng ý tham gia nghiên cứu tiếp theo (NOT pre-checked) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={futureOptIn}
                onChange={(e) => setFutureOptIn(e.target.checked)}
                className="sr-only"
                id="future-optin-checkbox"
              />
              <div
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  futureOptIn
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                {futureOptIn && <CheckSquare className="w-4 h-4" />}
              </div>
              <span className="text-xs text-slate-700 leading-snug">
                (Tùy chọn) Tôi đồng ý để nhóm nghiên cứu liên hệ qua email mời tham gia các giai đoạn khảo sát sâu hoặc phỏng vấn tình huống kinh tế quản trị tiếp theo.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBackToReport}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Bỏ qua
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi phản hồi...' : 'Gửi ý kiến đóng góp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
