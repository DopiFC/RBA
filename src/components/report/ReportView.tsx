import React, { useState, useRef } from 'react';
import {
  Printer,
  Copy,
  Check,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Compass,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  Calendar,
  Hash,
  Download,
  Mail,
  Loader2,
  Home,
} from 'lucide-react';
import type { SurveyScoringResult, SurveyAnswers } from '../../types/survey';
import { getBandColorClasses, getBandLabel } from '../../lib/scoring';
import { IndicatorBarChart } from '../dashboard/IndicatorBarChart';
import { IndicatorRadarChart } from '../dashboard/IndicatorRadarChart';

interface ReportViewProps {
  report: SurveyScoringResult;
  answers: SurveyAnswers;
  email?: string;
  onOpenFeedback: () => void;
  onBackHome?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  answers,
  email,
  onOpenFeedback,
  onBackHome,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const overallBandClasses = getBandColorClasses(report.overallBand);

  // Business background labels
  const businessTypeLabels: Record<string, string> = {
    enterprise: 'Doanh nghiệp / Công ty',
    household: 'Hộ kinh doanh',
    individual: 'Cá nhân kinh doanh / Tự kinh doanh',
    other: 'Khác',
  };

  const industryLabels: Record<string, string> = {
    retail_wholesale: 'Bán lẻ / bán buôn',
    manufacturing: 'Sản xuất / chế biến',
    hospitality: 'Nhà hàng / ăn uống / lưu trú',
    professional_services: 'Dịch vụ chuyên môn',
    tech_ecommerce: 'Công nghệ / thương mại điện tử',
    construction_realestate: 'Xây dựng / bất động sản',
    logistics_transport: 'Vận tải / logistics',
    agriculture: 'Nông nghiệp',
    education_healthcare: 'Giáo dục / y tế',
    other: answers.q02_industry_other ? `Ngành khác (${answers.q02_industry_other})` : 'Ngành khác',
  };

  const ageLabels: Record<string, string> = {
    under_1y: 'Dưới 1 năm',
    '1_to_3y': 'Từ 1 đến dưới 3 năm',
    '3_to_7y': 'Từ 3 đến dưới 7 năm',
    above_7y: 'Từ 7 năm trở lên',
  };

  const handleCopySummary = () => {
    const summaryText = `[BÁO CÁO CHẨN ĐOÁN KINH TẾ DOANH NGHIỆP RBA]
Mã khảo sát: ${report.responseId}
Ngày thực hiện: ${new Date(report.submittedAt).toLocaleDateString('vi-VN')}
Loại hình: ${businessTypeLabels[answers.q01_business_type || ''] || 'N/A'}
Ngành: ${industryLabels[answers.q02_industry || ''] || 'N/A'}
Chỉ số Chú ý Tổng thể: ${report.overallAttentionIndex !== null ? `${report.overallAttentionIndex}/100 (${report.overallBandLabel})` : 'Chưa đủ dữ liệu tối thiểu 8 câu'}
Số câu trả lời hợp lệ: ${report.validQuestionCount}/11 câu

3 VẤN ĐỀ ƯU TIÊN:
${report.topPriorities.map((p, i) => `${i + 1}. ${p.title} (${p.theoreticalConcept.split(' - ')[0]})\n   -> Hành động: ${p.recommendedAction}`).join('\n')}

Hệ thống RBA - Nghiên cứu Kinh tế học cho nhà quản trị.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const element = reportContainerRef.current;
      const imgData = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`RBA-Bao-Cao-Chan-Doan-${report.responseId}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Lỗi xuất file PDF, chuyển sang in:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 print:py-2 print:px-0 print:space-y-6">
      {/* Thank you & Confirmation Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 text-slate-800 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  Khảo sát hoàn tất thành công &amp; Kết quả đã gửi về Email
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="w-3 h-3 text-emerald-700" />
                  Đã ghi nhận dữ liệu
                </span>
              </div>

              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                <p>
                  Cảm ơn bạn đã tham gia nghiên cứu khoa học kinh tế vi mô. Báo cáo chẩn đoán chi tiết và đề xuất giải pháp đã được hệ thống ghi nhận và gửi tự động tới hòm thư:{' '}
                  <strong className="font-mono text-indigo-900 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200">
                    {email || 'cá nhân của bạn'}
                  </strong>
                  . Bạn cũng có thể tải về tệp PDF để lưu trữ trực tiếp trên thiết bị của mình.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo tệp PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã tải PDF!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải tệp PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              Mã hồ sơ: <code className="font-mono font-semibold text-slate-800">{report.responseId}</code>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(report.submittedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-xs transition-all"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xuất PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Tải xuống tệp PDF (.pdf)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / AirPrint</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Góp ý</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Container (Target for PDF Canvas Capture) */}
      <div ref={reportContainerRef} className="space-y-10 bg-white sm:p-4 rounded-2xl">

      {/* ========================================================================= */}
      {/* PHẦN 1: TÓM TẮT ĐIỀU HÀNH */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Phần 1 — Tóm tắt Điều hành
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Thuật toán: {report.algorithmVersion}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Báo cáo Chẩn đoán Kinh tế Vi mô Doanh nghiệp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hệ thống phân tích các tín hiệu kinh tế học quản trị dựa trên 11 chỉ báo tự đánh giá.
          </p>
        </div>

        {/* Demographic & Assessment Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Business Profile */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1 text-slate-500">
              Hồ sơ Phân nhóm Khảo sát
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">Loại hình kinh doanh:</span>
              <span className="font-medium text-slate-900">
                {businessTypeLabels[answers.q01_business_type || ''] || 'Chưa cung cấp'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">Ngành nghề hoạt động:</span>
              <span className="font-medium text-slate-900">
                {industryLabels[answers.q02_industry || ''] || 'Chưa cung cấp'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">Thời gian hoạt động:</span>
              <span className="font-medium text-slate-900">
                {ageLabels[answers.q03_business_age || ''] || 'Chưa cung cấp'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Số câu trả lời hợp lệ tính điểm:</span>
              <span className="font-bold text-indigo-700">
                {report.validQuestionCount} / 11 câu chẩn đoán
              </span>
            </div>
          </div>

          {/* Attention Index Score Box */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Chỉ số Mức độ Cần chú ý Tổng thể
            </span>

            {report.hasEnoughDataForOverall && report.overallAttentionIndex !== null ? (
              <>
                <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight my-2 ${overallBandClasses.text}`}>
                  {report.overallAttentionIndex}
                  <span className="text-xl font-normal text-slate-400">/100</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${overallBandClasses.badge}`}>
                  {report.overallBandLabel}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 max-w-xs">
                  (Điểm số chuẩn hóa phản ánh mức độ ưu tiên cần rà soát quy trình quản trị; không phải xác suất thất bại).
                </p>
              </>
            ) : (
              <div className="py-4 text-xs text-amber-700 bg-amber-50 rounded-lg p-3 max-w-sm">
                <AlertTriangle className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <span className="font-semibold block">Dữ liệu chưa đủ theo quy tắc</span>
                <span>
                  Hệ thống yêu cầu tối thiểu 8/11 câu chẩn đoán hợp lệ để kết luận chỉ số tổng thể (hiện có {report.validQuestionCount} câu). Vui lòng xem điểm chi tiết theo từng nhóm bên dưới.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Top Priorities Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>3 Vấn đề Ưu tiên Cần Xác minh & Khắc phục</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.topPriorities.map((issue, idx) => {
              const bandClasses = getBandColorClasses(issue.severity);
              return (
                <div
                  key={issue.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bandClasses.badge}`}>
                        {getBandLabel(issue.severity)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {issue.title}
                    </h4>
                    <p className="text-[11px] text-indigo-700 mt-1 font-medium">
                      {issue.theoreticalConcept.split(' - ')[0]}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                    <strong>Đề xuất:</strong> {issue.recommendedAction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Favorable Indicators */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
          <span className="font-bold block mb-1 flex items-center gap-1.5 text-emerald-900">
            <Lightbulb className="w-4 h-4 text-emerald-700" />
            Điểm mạnh & Yếu tố Thuận lợi Ghi nhận từ Câu trả lời:
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {report.keyStrengths.map((str, i) => (
              <li key={i} className="leading-relaxed">{str}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 2: DASHBOARD CHI TIẾT */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Phần 2 — Dashboard Chi tiết
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Phân tích Trực quan 5 Trụ cột Chẩn đoán
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <IndicatorBarChart groups={report.groups} />
          <IndicatorRadarChart groups={report.groups} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 3: PHÂN TÍCH VẤN ĐỀ CHUYÊN SÂU */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Phần 3 — Phân tích Vấn đề Chuyên sâu
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Căn cứ Kinh tế học & Đề xuất Can thiệp
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Phân định rõ: Dữ kiện trực tiếp từ câu trả lời • Diễn giải lý thuyết • Giả thuyết nguyên nhân • Khuyến nghị kiểm chứng.
          </p>
        </div>

        <div className="space-y-6">
          {report.topPriorities.map((issue, idx) => (
            <div
              key={`detail-${issue.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    #{idx + 1}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {issue.title}
                  </h3>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${getBandColorClasses(issue.severity).badge}`}>
                  {getBandLabel(issue.severity)}
                </span>
              </div>

              {/* 5-part structured breakdown */}
              <div className="space-y-3 text-xs sm:text-sm">
                {/* 1. Observed answer */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">
                    1. Nội dung quan sát được từ câu trả lời
                  </span>
                  <p className="text-slate-800">{issue.observedAnswer}</p>
                </div>

                {/* 2. Economic theory & managerial significance */}
                <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="font-semibold text-indigo-900 block text-xs uppercase tracking-wider mb-1">
                    2. Căn cứ lý thuyết Kinh tế học & Ý nghĩa quản trị
                  </span>
                  <p className="text-slate-800 font-medium mb-1">{issue.theoreticalConcept}</p>
                  <p className="text-slate-700 leading-relaxed">{issue.managerialImplication}</p>
                </div>

                {/* 3. Potential risks */}
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                  <span className="font-semibold text-amber-900 block text-xs uppercase tracking-wider mb-1">
                    3. Rủi ro tiềm tàng / Vấn đề cần kiểm chứng
                  </span>
                  <p className="text-slate-800 leading-relaxed">{issue.potentialRisks}</p>
                </div>

                {/* 4. Additional data to collect */}
                <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-100">
                  <span className="font-semibold text-sky-900 block text-xs uppercase tracking-wider mb-1">
                    4. Dữ liệu bổ sung nên thu thập để xác minh
                  </span>
                  <p className="text-slate-800 leading-relaxed">{issue.dataToCollect}</p>
                </div>

                {/* 5. Recommended action */}
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <span className="font-semibold text-emerald-900 block text-xs uppercase tracking-wider mb-1">
                    5. Hành động đề xuất cho người quản lý
                  </span>
                  <p className="text-slate-900 font-medium leading-relaxed">{issue.recommendedAction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 4: ĐỊNH HƯỚNG TƯƠNG LAI & KỊCH BẢN */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Phần 4 — Định hướng Tương lai
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Lộ trình Thực thi & Kịch bản Định tính
          </h2>
        </div>

        {/* 3-Milestone Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-xs">
                Trong 30 ngày
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Xử lý lỗ hổng thông tin & kiểm soát ngay
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              {report.actionRoadmap.thirtyDays.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold text-xs">
                Trong 90 ngày
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Cải tiến quy trình, hạch toán & định giá
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              {report.actionRoadmap.ninetyDays.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                Trong 12 tháng
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Gia tăng khác biệt hóa & phát triển bền vững
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              {report.actionRoadmap.twelveMonths.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3 Qualitative Scenarios */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>Kịch bản Định tính (Không phải Dự báo Thống kê)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Favorable */}
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 space-y-2.5 text-xs">
              <div className="font-bold text-emerald-800 text-sm">
                {report.scenarios.favorable.title}
              </div>
              <p className="text-slate-700 leading-relaxed">
                {report.scenarios.favorable.description}
              </p>
              <div className="pt-2 border-t border-emerald-100 space-y-1">
                <span className="font-semibold text-emerald-900 block">Điều kiện dẫn tới:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.favorable.triggerConditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-emerald-100 space-y-1">
                <span className="font-semibold text-emerald-900 block">Chỉ báo cần theo dõi:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.favorable.monitoringIndicators.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Baseline */}
            <div className="bg-sky-50/40 border border-sky-200 rounded-xl p-5 space-y-2.5 text-xs">
              <div className="font-bold text-sky-800 text-sm">
                {report.scenarios.baseline.title}
              </div>
              <p className="text-slate-700 leading-relaxed">
                {report.scenarios.baseline.description}
              </p>
              <div className="pt-2 border-t border-sky-100 space-y-1">
                <span className="font-semibold text-sky-900 block">Điều kiện dẫn tới:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.baseline.triggerConditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-sky-100 space-y-1">
                <span className="font-semibold text-sky-900 block">Chỉ báo cần theo dõi:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.baseline.monitoringIndicators.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Adverse */}
            <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-5 space-y-2.5 text-xs">
              <div className="font-bold text-rose-800 text-sm">
                {report.scenarios.adverse.title}
              </div>
              <p className="text-slate-700 leading-relaxed">
                {report.scenarios.adverse.description}
              </p>
              <div className="pt-2 border-t border-rose-100 space-y-1">
                <span className="font-semibold text-rose-900 block">Điều kiện dẫn tới:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.adverse.triggerConditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-rose-100 space-y-1">
                <span className="font-semibold text-rose-900 block">Chỉ báo cần theo dõi:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {report.scenarios.adverse.monitoringIndicators.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 5: HẠN CHẾ CỦA BÁO CÁO (MANDATORY EXACT DISCLAIMER) */}
      {/* ========================================================================= */}
      <section className="bg-amber-50/80 rounded-xl border border-amber-300 p-5 sm:p-6 text-amber-950 text-xs sm:text-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <span className="font-bold text-amber-900 block uppercase tracking-wider text-xs">
              Phần 5 — Hạn chế của Báo cáo
            </span>
            <p className="italic">
              “Báo cáo được xây dựng từ thông tin tự đánh giá của người tham gia và một bộ chỉ báo chẩn đoán ban đầu. Kết quả không thay thế báo cáo tài chính, kiểm toán, nghiên cứu thị trường chuyên sâu hoặc tư vấn chuyên ngành. Những vấn đề được nêu là các tín hiệu cần xem xét, không phải kết luận chắc chắn về tình trạng hay tương lai của hoạt động kinh doanh.”
            </p>
          </div>
        </div>
      </section>
      </div>

      {/* ========================================================================= */}
      {/* PHẦN 6: ĐIỀU HƯỚNG VÀ PHẢN HỒI */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            Bạn thấy báo cáo này thế nào?
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Phản hồi của bạn giúp nhóm nghiên cứu hiệu chỉnh bộ câu hỏi và mô hình chẩn đoán sát hơn với thực tế.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về trang chủ</span>
            </button>
          )}
          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <span>Đóng góp ý kiến sau báo cáo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
