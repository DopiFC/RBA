import React from 'react';
import type { IndicatorGroupScore, IndicatorGroupKey } from '../../types/survey';
import { getBandColorClasses, getBandLabel } from '../../lib/scoring';

interface IndicatorBarChartProps {
  groups: Record<IndicatorGroupKey, IndicatorGroupScore>;
}

export const IndicatorBarChart: React.FC<IndicatorBarChartProps> = ({ groups }) => {
  const groupList = Object.values(groups);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
      <div className="mb-4">
        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
          Biểu đồ Thanh: Điểm Mức độ Cần chú ý theo 5 Nhóm Chỉ báo
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Thang điểm 0–100 (Điểm càng cao nghĩa là nhóm hoạt động này xuất hiện nhiều tín hiệu cần rà soát & khắc phục).
        </p>
      </div>

      <div className="space-y-4">
        {groupList.map((grp) => {
          const val = grp.averageIndex;
          const bandClasses = getBandColorClasses(grp.band);
          const percent = val !== null ? Math.min(100, Math.max(0, val)) : 0;

          return (
            <div key={grp.key} className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{grp.name}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {grp.validCount}/{grp.totalCount} câu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {val !== null ? (
                    <>
                      <span className={`font-bold font-mono ${bandClasses.text}`}>
                        {val} / 100
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${bandClasses.badge}`}>
                        {getBandLabel(grp.band)}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Chưa đủ dữ liệu</span>
                  )}
                </div>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 relative">
                {/* 4 reference quadrant marks */}
                <div className="absolute left-[25%] top-0 bottom-0 w-px bg-slate-200" title="25" />
                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-slate-200" title="50" />
                <div className="absolute left-[75%] top-0 bottom-0 w-px bg-slate-200" title="75" />

                {val !== null && (
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: bandClasses.hex,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis legend */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>0 (Thấp)</span>
        <span>25 (TB thấp)</span>
        <span>50 (TB cao)</span>
        <span>75 (Cao)</span>
        <span>100 (Rất cao)</span>
      </div>
    </div>
  );
};
