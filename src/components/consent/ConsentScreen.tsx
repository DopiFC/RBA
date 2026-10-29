import React, { useState } from 'react';
import { Mail, Shield, CheckSquare, Square, AlertCircle, ArrowLeft, ArrowRight, Info, Loader2 } from 'lucide-react';
import { CONSENT_VERSION } from '../../config/survey';
import { checkEmailHasSubmitted } from '../../lib/sheetsAdapter';

interface ConsentScreenProps {
  initialEmail?: string;
  onConsentSuccess: (email: string, contactPermission: boolean) => void;
  onBack: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  initialEmail = '',
  onConsentSuccess,
  onBack,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [hasConsented, setHasConsented] = useState(false);
  const [contactPermission, setContactPermission] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email để tiếp tục.');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      setEmailError('Địa chỉ email không đúng định dạng (Ví dụ: ten@doanhnghiep.vn).');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    if (!hasConsented) {
      setConsentError('Bạn cần đồng ý với Điều khoản xử lý dữ liệu phục vụ nghiên cứu khoa học để tham gia.');
    } else {
      setConsentError(null);
    }

    if (!isEmailValid || !hasConsented) return;

    setIsCheckingEmail(true);
    try {
      const alreadySubmitted = await checkEmailHasSubmitted(email.trim());
      if (alreadySubmitted) {
        setEmailError('Email này đã hoàn thành khảo sát trước đó. Để bảo đảm tính khách quan nghiên cứu, mỗi người tham gia chỉ được khảo sát 1 lần duy nhất.');
        setIsCheckingEmail(false);
        return;
      }
    } catch (err) {
      console.error('Error checking email submission status:', err);
    } finally {
      setIsCheckingEmail(false);
    }

    onConsentSuccess(email.trim(), contactPermission);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại trang giới thiệu</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Xác thực Email & Đồng thuận Nghiên cứu
            </h1>
            <p className="text-xs text-slate-500">
              Quy chuẩn bảo vệ dữ liệu học thuật — Phiên bản: {CONSENT_VERSION}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-1">
              Địa chỉ Email của bạn <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="vidu@doanhnghiep.vn"
                className={`block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border ${
                  emailError
                    ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                } transition-colors placeholder:text-slate-400`}
                aria-required="true"
                aria-invalid={!!emailError}
              />
            </div>
            {emailError ? (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {emailError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-indigo-700 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                💡 <strong>Quy định nghiên cứu:</strong> Mỗi email chỉ được khảo sát 1 lần duy nhất. Toàn bộ kết quả chẩn đoán chi tiết sẽ được tự động gửi về hòm thư này ngay sau khi hoàn tất.
              </p>
            )}
          </div>

          {/* Research Data Notice Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5 text-xs text-slate-700 space-y-3">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Thông báo về việc thu thập và sử dụng dữ liệu</span>
            </div>

            <div className="space-y-2 leading-relaxed text-slate-600">
              <p>
                <strong>1. Mục đích nghiên cứu:</strong> Thu thập dữ liệu thực tế phục vụ đề tài nghiên cứu khoa học về năng lực ứng dụng Kinh tế học cho nhà quản trị trong cộng đồng kinh doanh tại Việt Nam.
              </p>
              <p>
                <strong>2. Loại dữ liệu:</strong> Thông tin phân loại chung (loại hình, ngành nghề, thâm niên, quy mô lao động) và 11 câu hỏi tự đánh giá tình hình kinh doanh vi mô. Không yêu cầu doanh thu tuyệt đối hay thông tin mật.
              </p>
              <p>
                <strong>3. Lưu trữ & Quản lý:</strong> Dữ liệu câu trả lời được lưu trữ an toàn trong Google Spreadsheet do người nghiên cứu quản lý. Bảng email được lưu trữ cách ly với bảng câu trả lời nhằm bảo vệ tính riêng tư.
              </p>
              <p>
                <strong>4. Thời hạn lưu trữ & Liên hệ:</strong> Dữ liệu dự kiến lưu trữ trong vòng 5 năm phục vụ công bố khoa học. Đầu mối tiếp nhận thắc mắc và xử lý dữ liệu: <em>lienhe@kinhtedoanhnghiep.vn</em>.
              </p>
              <p>
                <strong>5. Quyền của bạn:</strong> Bạn có quyền yêu cầu truy cập, đính chính, rút lại sự đồng thuận hoặc yêu cầu xóa dữ liệu bất kỳ lúc nào bằng cách gửi yêu cầu về email đầu mối nêu trên.
              </p>
            </div>
          </div>

          {/* Mandatory Consent Checkbox (NOT pre-checked) */}
          <div className="pt-2">
            <label htmlFor="research-consent-checkbox" className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => {
                  setHasConsented(e.target.checked);
                  if (e.target.checked) setConsentError(null);
                }}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                id="research-consent-checkbox"
              />
              <span className="text-xs sm:text-sm text-slate-800 leading-snug">
                Tôi xác nhận đã đọc, hiểu rõ thông báo trên và <strong>đồng ý</strong> cho phép thu thập, xử lý dữ liệu của tôi phục vụ cho mục đích nghiên cứu khoa học.{' '}
                <span className="text-rose-600 font-semibold">*</span>
              </span>
            </label>
            {consentError && (
              <p className="mt-1.5 ml-8 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {consentError}
              </p>
            )}
          </div>

          {/* Optional Separate Contact Opt-in (NOT pre-checked) */}
          <div className="pt-1">
            <label htmlFor="optional-contact-checkbox" className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={contactPermission}
                onChange={(e) => setContactPermission(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                id="optional-contact-checkbox"
              />
              <span className="text-xs text-slate-600 leading-snug">
                (Tùy chọn) Tôi đồng ý để nhóm nghiên cứu có thể gửi thông tin cập nhật về các báo cáo nghiên cứu tổng hợp hoặc mời tham gia các giai đoạn khảo sát mở rộng trong tương lai.
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy / Quay lại
            </button>
            <button
              type="submit"
              disabled={isCheckingEmail}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra email...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục đến Khảo sát</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
