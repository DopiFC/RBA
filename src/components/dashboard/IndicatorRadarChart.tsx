import React from 'react';
import type { IndicatorGroupScore, IndicatorGroupKey } from '../../types/survey';

interface IndicatorRadarChartProps {
  groups: Record<IndicatorGroupKey, IndicatorGroupScore>;
}

export const IndicatorRadarChart: React.FC<IndicatorRadarChartProps> = ({ groups }) => {
  const groupList = Object.values(groups);
  const validGroups = groupList.filter((g) => g.averageIndex !== null);

  // Per specification: Only render radar chart if at least 3 valid groups exist
  if (validGroups.length < 3) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
        Cần ít nhất 3 nhóm chỉ báo hợp lệ để hiển thị biểu đồ Radar tương quan (hiện có {validGroups.length} nhóm).
      </div>
    );
  }

  const size = 320;
  const center = size / 2;
  const radius = 100;
  const totalAxes = groupList.length;

  // Compute (x, y) coordinates for a given axis and normalized value (0 - 100)
  const getCoordinates = (index: number, value: number) => {
    const angle = (2 * Math.PI * index) / totalAxes - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for the data
  const polygonPoints = groupList
    .map((grp, idx) => {
      const val = grp.averageIndex ?? 0;
      const { x, y } = getCoordinates(idx, val);
      return `${x},${y}`;
    })
    .join(' ');

  // Web grid concentric rings (25, 50, 75, 100)
  const rings = [25, 50, 75, 100];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col items-center">
      <div className="w-full text-left mb-2">
        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
          Biểu đồ Radar: Tương quan 5 Trụ cột Chẩn đoán
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Vùng đa giác mở rộng về hướng nào phản ánh trụ cột đó đòi hỏi sự chú ý và can thiệp quản trị nhiều hơn.
        </p>
      </div>

      <div className="relative w-full max-w-[320px] aspect-square my-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible"
        >
          {/* Concentric grid rings */}
          {rings.map((ringVal) => {
            const points = groupList
              .map((_, idx) => {
                const { x, y } = getCoordinates(idx, ringVal);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <polygon
                key={ringVal}
                points={points}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={ringVal === 100 ? 1.5 : 1}
                strokeDasharray={ringVal < 100 ? '2,2' : undefined}
              />
            );
          })}

          {/* Radial Axis lines */}
          {groupList.map((grp, idx) => {
            const { x, y } = getCoordinates(idx, 100);
            return (
              <line
                key={grp.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            );
          })}

          {/* Data Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(99, 102, 241, 0.25)"
            stroke="#4f46e5"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Data vertex dots */}
          {groupList.map((grp, idx) => {
            const val = grp.averageIndex ?? 0;
            const { x, y } = getCoordinates(idx, val);
            return (
              <circle
                key={`dot-${grp.key}`}
                cx={x}
                cy={y}
                r={4}
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth={2}
              />
            );
          })}

          {/* Axis Labels */}
          {groupList.map((grp, idx) => {
            const angle = (2 * Math.PI * idx) / totalAxes - Math.PI / 2;
            const labelR = radius + 24;
            const lx = center + labelR * Math.cos(angle);
            const ly = center + labelR * Math.sin(angle);

            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (Math.abs(Math.cos(angle)) > 0.3) {
              anchor = Math.cos(angle) > 0 ? 'start' : 'end';
            }

            return (
              <text
                key={`lbl-${grp.key}`}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                className="text-[11px] font-medium fill-slate-700"
              >
                {grp.name} ({grp.averageIndex ?? '-'})
              </text>
            );
          })}
        </svg>
      </div>

      {/* Mandatory Legend & Annotation */}
      <div className="w-full mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">Chú thích nguyên tắc biểu đồ:</p>
        <p>• <strong>Điểm thấp:</strong> Mức độ cần chú ý thấp theo câu trả lời (vận hành tương đối an toàn).</p>
        <p>• <strong>Điểm cao:</strong> Mức độ cần chú ý cao (xuất hiện tín hiệu lệch chuẩn hoặc rủi ro).</p>
        <p className="text-slate-500 italic">• <strong>Lưu ý:</strong> Điểm số biểu đồ không phải là xác suất thất bại hay tỷ lệ phá sản.</p>
      </div>
    </div>
  );
};
