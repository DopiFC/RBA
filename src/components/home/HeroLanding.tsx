import React from 'react';
import {
  Clock,
  ShieldCheck,
  TrendingUp,
  BarChart,
  FileText,
  Building2,
  Store,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface HeroLandingProps {
  onStartSurvey: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onStartSurvey }) => {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đề tài Nghiên cứu Khoa học Kinh tế Quản trị Thực nghiệm
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Khảo sát &amp; Chẩn đoán <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-white">
              Kinh tế Vi mô Doanh nghiệp
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
            Nền tảng RBA giúp các doanh nghiệp, hộ kinh doanh và cá nhân tự doanh nhận diện các rủi ro vận hành, cấu trúc chi phí, sức mạnh định giá và mức độ bất cân xứng thông tin theo 8 nguyên lý cốt lõi của <strong>Kinh tế học cho nhà quản trị</strong>.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 mb-8 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Thời lượng: <strong>5–8 phút</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo mật: <strong>1 email chỉ khảo sát 1 lần</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Kết quả: <strong>Gửi email &amp; Tải PDF tức thì</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onStartSurvey}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>Bắt đầu khảo sát</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden lg:block">
          <svg className="h-full w-full" fill="none" viewBox="0 0 400 400">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />
          </svg>
        </div>
      </section>

      {/* Target Audiences */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
            Đối tượng tham gia
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            Thiết kế trực quan cho mọi quy mô hoạt động
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Bộ câu hỏi chuyển hóa các lý thuyết kinh tế trừu tượng thành tình huống kinh doanh đời thực, người kinh doanh không cần hiểu thuật ngữ kinh tế học vẫn có thể tham gia chính xác.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              1. Doanh nghiệp / Công ty
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Các doanh nghiệp vừa và nhỏ (SME), doanh nghiệp khởi nghiệp cần đánh giá năng suất biên của các nguồn lực, phân bổ chi phí cố định/biến đổi và giảm bớt rủi ro người ủy nhiệm - người đại diện.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              2. Hộ kinh doanh
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Các cơ sở thương mại, cửa hàng bán lẻ, quán ăn, xưởng gia công cần kiểm soát giá thành trên từng đơn vị hàng hóa, ứng phó với biến động giá nguyên liệu và xác định độ nhạy giá của khách hàng.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              3. Cá nhân kinh doanh / Tự kinh doanh
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Người bán hàng trực tuyến, freelancer, chủ kinh doanh độc lập chưa có bộ máy kế toán chuyên nghiệp vẫn có thể tự rà soát phương pháp định giá và quy trình tự kiểm soát rủi ro chất lượng.
            </p>
          </div>
        </div>
      </section>

      {/* What Participants Receive */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-10">
        <div className="max-w-3xl mb-8">
          <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
            Giá trị nhận được
          </h2>
          <p className="text-2xl font-bold text-slate-900">
            Nội dung báo cáo cung cấp cho bạn sau khi hoàn thành
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chỉ số Chú ý Tổng thể</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Điểm số chuẩn hóa 0–100 cho 5 nhóm chỉ báo, giúp nhận diện ngay lĩnh vực cần ưu tiên xác minh.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Trực quan hóa Đa chiều</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Biểu đồ thanh & biểu đồ Radar thể hiện thế mạnh và điểm nghẽn tương quan giữa 5 nhóm vận hành.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3 Vấn đề Ưu tiên & Căn cứ</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phân tích từng vấn đề theo cấu trúc 5 bước: Quan sát, Lý thuyết, Rủi ro, Dữ liệu cần thu thập và Hành động.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Lộ trình & Kịch bản Tương lai</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hành động cụ thể trong 30 ngày, 90 ngày, 12 tháng kèm 3 kịch bản định tính (Thuận lợi, Cơ sở, Bất lợi).
            </p>
          </div>
        </div>
      </section>

      {/* Research Ethics & Privacy Guarantee */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">
              Cam kết về Quyền riêng tư & Mục đích Nghiên cứu
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Toàn bộ dữ liệu thu thập được phục vụ cho công tác thống kê và nghiên cứu khoa học kinh tế doanh nghiệp. Chúng tôi <strong>không bao giờ yêu cầu</strong> bạn nhập tên doanh nghiệp, mã số thuế hoặc báo cáo tài chính bảo mật. Email của bạn chỉ dùng để quản lý quyền đối soát dữ liệu và được lưu trữ cách ly hoàn toàn với bảng câu trả lời.
            </p>
            <p className="text-xs text-slate-500 italic">
              Lưu ý quan trọng: Hệ thống không cam kết dự báo chính xác mức lợi nhuận trong tương lai hay xác định chắc chắn nguy cơ thất bại của doanh nghiệp. Kết quả khảo sát mang tính chẩn đoán định hướng ban đầu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
