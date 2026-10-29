import React from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Platform Identity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                RBA
              </div>
              <span className="text-white font-semibold text-base">
                Kinh tế Doanh nghiệp (RBA)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống khảo sát và phân tích thực nghiệm kinh tế vi mô dành cho doanh nghiệp, hộ kinh doanh và cá nhân tự doanh. Phục vụ mục đích nghiên cứu khoa học và nâng cao năng lực quản trị.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Phiên bản công cụ: v1.0.0 | Thuật toán: RBA-ALGO-2026.1
            </p>
          </div>

          {/* 8 Foundational Economics Documents */}
          <div>
            <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Nền tảng lý thuyết (8 chuyên đề)
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>1. Đại cương Kinh tế học cho nhà quản trị</li>
              <li>2. Cung, cầu và giá thị trường</li>
              <li>3. Lý thuyết sản xuất và lý thuyết chi phí</li>
              <li>4. Định giá và sản lượng trong thị trường cạnh tranh</li>
              <li>5. Định giá trong thị trường độc quyền</li>
              <li>6. Định giá trong thị trường cạnh tranh không hoàn toàn</li>
              <li>7. Lý thuyết trò chơi và thông tin bất cân xứng</li>
              <li>8. Phát triển bền vững: những tư tưởng và mô hình mới</li>
            </ul>
          </div>

          {/* Scientific Disclaimer & Ethics */}
          <div>
            <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Tuyên bố giới hạn & Đạo đức nghiên cứu
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Báo cáo được xây dựng từ thông tin tự đánh giá của người tham gia và một bộ chỉ báo chẩn đoán ban đầu. Kết quả không thay thế báo cáo tài chính, kiểm toán hoặc tư vấn pháp lý chuyên ngành.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống không thu thập mã số thuế, doanh thu bí mật; email người tham gia được lưu trữ cách ly bảo mật theo quy định bảo vệ dữ liệu cá nhân.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Dự án Nghiên cứu Kinh tế Quản trị RBA. Dành cho mục đích học thuật và quản trị thực tiễn.</p>
          <div className="flex items-center gap-4">
            <span>Tiêu chuẩn dữ liệu học thuật</span>
            <span>Không chia sẻ dữ liệu cho bên thứ ba</span>
            <span>Bảo mật nghiên cứu</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
