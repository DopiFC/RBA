import {
  ALGORITHM_VERSION,
  INSTRUMENT_VERSION,
  INDICATOR_GROUPS,
  SURVEY_QUESTIONS,
} from '../config/survey.ts';
import type {
  SurveyAnswers,
  SurveyScoringResult,
  IndicatorScore,
  IndicatorGroupKey,
  IndicatorGroupScore,
  ResultBand,
} from '../types/survey.ts';

/**
 * Score Question 10 (Pricing Method) based on explicit combinatorial rules.
 * Rules from Section V.3:
 * - opt_cost + at least 1 market factor (opt_demand, opt_competitor, opt_value, opt_season): Score 1
 * - at least 2 market factors without cost: Score 2
 * - only cost: Score 3
 * - only 1 single market factor: Score 4
 * - gut feeling (opt_gut), no clear method (opt_none), or invalid/empty: Score 5
 */
export function scoreQuestion10(selectedOptions: string[] | undefined): {
  rawScore: number | null;
  rationale: string;
} {
  if (!selectedOptions || selectedOptions.length === 0) {
    return {
      rawScore: null,
      rationale: 'Chưa có dữ liệu lựa chọn phương pháp định giá.',
    };
  }

  // Check for gut feeling or no method
  if (selectedOptions.includes('opt_gut') || selectedOptions.includes('opt_none')) {
    return {
      rawScore: 5,
      rationale:
        'Chủ yếu dựa vào cảm tính hoặc chưa có phương pháp định giá tương đối rõ ràng. Mức độ cần chú ý rất cao do nguy cơ định giá dưới giá thành hoặc làm mất khách hàng mục tiêu.',
    };
  }

  const hasCost = selectedOptions.includes('opt_cost');
  const marketFactors = ['opt_demand', 'opt_competitor', 'opt_value', 'opt_season'];
  const matchedMarketFactors = selectedOptions.filter((opt) => marketFactors.includes(opt));
  const marketCount = matchedMarketFactors.length;

  if (hasCost && marketCount >= 1) {
    return {
      rawScore: 1,
      rationale:
        'Kết hợp cả chi phí thực tế và yếu tố thị trường (nhu cầu, đối thủ hoặc giá trị khác biệt). Căn cứ định giá tương đối toàn diện.',
    };
  }

  if (!hasCost && marketCount >= 2) {
    return {
      rawScore: 2,
      rationale:
        'Kết hợp ít nhất hai yếu tố thị trường nhưng chưa có chi phí làm căn cứ hạch toán bảo vệ biên lợi nhuận.',
    };
  }

  if (hasCost && marketCount === 0) {
    return {
      rawScore: 3,
      rationale:
        'Chỉ dựa trên chi phí nội bộ (Cost-Plus), thiếu tính đến mức sẵn lòng chi trả của khách hàng và phản ứng cạnh tranh.',
    };
  }

  if (!hasCost && marketCount === 1) {
    return {
      rawScore: 4,
      rationale:
        'Chỉ dựa trên một yếu tố thị trường đơn lẻ (ví dụ chỉ nhìn đối thủ hoặc chỉ nhìn nhu cầu) mà thiếu hạch toán chi phí bảo vệ biên an toàn.',
    };
  }

  // Fallback for any other valid selection combinations
  return {
    rawScore: 4,
    rationale: 'Tổ hợp phương pháp định giá cần được rà soát và bổ sung căn cứ chi phí/thị trường.',
  };
}

/**
 * Score individual diagnostic questions (Q5-Q15)
 */
export function scoreSingleQuestion(
  questionId: string,
  answer: string | undefined
): { rawScore: number | null; rationale: string } {
  if (!answer || answer.trim() === '') {
    return {
      rawScore: null,
      rationale: 'Câu hỏi chưa được trả lời (dữ liệu thiếu).',
    };
  }

  const questionDef = SURVEY_QUESTIONS.find((q) => q.id === questionId);
  if (!questionDef || !questionDef.options) {
    return {
      rawScore: null,
      rationale: 'Không tìm thấy định nghĩa câu hỏi.',
    };
  }

  const selectedOpt = questionDef.options.find((opt) => opt.id === answer);
  if (!selectedOpt) {
    return {
      rawScore: null,
      rationale: `Giá trị trả lời không hợp lệ: ${answer}.`,
    };
  }

  const rawScore = selectedOpt.score ?? null;
  const rationale = selectedOpt.isUncertainty
    ? `Lựa chọn "${selectedOpt.label}": phản ánh tình trạng thiếu dữ liệu theo dõi quản trị.`
    : `Lựa chọn "${selectedOpt.label}": Điểm mức độ cần chú ý = ${rawScore}/5.`;

  return { rawScore, rationale };
}

/**
 * Convert raw score (1-5) to normalized attention index (0-100)
 * Formula: (score - 1) / 4 * 100
 */
export function normalizeAttentionIndex(rawScore: number | null): number | null {
  if (rawScore === null || rawScore < 1 || rawScore > 5) {
    return null;
  }
  return Math.round(((rawScore - 1) / 4) * 100 * 100) / 100; // 2 decimal precision
}

/**
 * Classify normalized attention index into result bands
 */
export function classifyResultBand(index: number | null): ResultBand | null {
  if (index === null || isNaN(index)) return null;
  if (index < 25) return 'low';
  if (index < 50) return 'moderate';
  if (index < 75) return 'high';
  return 'very_high';
}

export function getBandLabel(band: ResultBand | null): string {
  switch (band) {
    case 'low':
      return 'Mức độ cần chú ý thấp';
    case 'moderate':
      return 'Mức độ cần chú ý trung bình';
    case 'high':
      return 'Mức độ cần chú ý cao';
    case 'very_high':
      return 'Mức độ cần chú ý rất cao';
    default:
      return 'Chưa đủ dữ liệu phân loại';
  }
}

export function getBandColorClasses(band: ResultBand | null): {
  badge: string;
  text: string;
  bg: string;
  border: string;
  hex: string;
} {
  switch (band) {
    case 'low':
      return {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-500',
        hex: '#059669',
      };
    case 'moderate':
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        text: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        hex: '#2563eb',
      };
    case 'high':
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-500',
        hex: '#d97706',
      };
    case 'very_high':
      return {
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        text: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-500',
        hex: '#dc2626',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        text: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        hex: '#64748b',
      };
  }
}

/**
 * Main evaluation function for the 15-question survey
 */
export function calculateSurveyResults(
  answers: SurveyAnswers,
  responseId: string = `RBA-${Date.now()}`
): {
  validCount: number;
  hasEnoughDataForOverall: boolean;
  overallAttentionIndex: number | null;
  overallBand: ResultBand | null;
  groups: Record<IndicatorGroupKey, IndicatorGroupScore>;
  indicatorScores: Record<string, IndicatorScore>;
} {
  const diagnosticQuestionIds = ['q05', 'q06', 'q07', 'q08', 'q09', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'];
  const indicatorScores: Record<string, IndicatorScore> = {};

  // Score Q5 - Q9 and Q11 - Q15
  for (const qId of diagnosticQuestionIds) {
    const qDef = SURVEY_QUESTIONS.find((q) => q.id === qId)!;
    const groupKey = (qDef.groupKey === 'demographic' ? 'market' : qDef.groupKey) as IndicatorGroupKey;

    if (qId === 'q10') {
      const q10Res = scoreQuestion10(answers.q10_pricing_methods);
      const normIndex = normalizeAttentionIndex(q10Res.rawScore);
      indicatorScores[qId] = {
        questionId: qId,
        questionLabel: qDef.title,
        groupKey: 'pricing',
        rawScore: q10Res.rawScore,
        normalizedIndex: normIndex,
        rationale: q10Res.rationale,
        theoreticalConcept: qDef.theoreticalReference ?? '',
      };
    } else {
      const ansKey = `${qId}_${qDef.code}` as keyof SurveyAnswers;
      const answerVal = answers[ansKey] as string | undefined;
      const res = scoreSingleQuestion(qId, answerVal);
      const normIndex = normalizeAttentionIndex(res.rawScore);

      indicatorScores[qId] = {
        questionId: qId,
        questionLabel: qDef.title,
        groupKey,
        rawScore: res.rawScore,
        normalizedIndex: normIndex,
        rationale: res.rationale,
        theoreticalConcept: qDef.theoreticalReference ?? '',
      };
    }
  }

  // Count valid questions
  let validCount = 0;
  let sumIndices = 0;

  for (const qId of diagnosticQuestionIds) {
    const item = indicatorScores[qId];
    if (item.normalizedIndex !== null) {
      validCount++;
      sumIndices += item.normalizedIndex;
    }
  }

  // Overall Attention Index requirement: >= 8 valid questions required
  const hasEnoughDataForOverall = validCount >= 8;
  const overallAttentionIndex = hasEnoughDataForOverall && validCount > 0
    ? Math.round((sumIndices / validCount) * 100) / 100
    : null;
  const overallBand = classifyResultBand(overallAttentionIndex);

  // Group scores
  const groups: Record<IndicatorGroupKey, IndicatorGroupScore> = {
    market: {
      key: 'market',
      name: INDICATOR_GROUPS.market.name,
      description: INDICATOR_GROUPS.market.description,
      validCount: 0,
      totalCount: INDICATOR_GROUPS.market.questions.length,
      averageIndex: null,
      band: null,
    },
    operations: {
      key: 'operations',
      name: INDICATOR_GROUPS.operations.name,
      description: INDICATOR_GROUPS.operations.description,
      validCount: 0,
      totalCount: INDICATOR_GROUPS.operations.questions.length,
      averageIndex: null,
      band: null,
    },
    pricing: {
      key: 'pricing',
      name: INDICATOR_GROUPS.pricing.name,
      description: INDICATOR_GROUPS.pricing.description,
      validCount: 0,
      totalCount: INDICATOR_GROUPS.pricing.questions.length,
      averageIndex: null,
      band: null,
    },
    governance: {
      key: 'governance',
      name: INDICATOR_GROUPS.governance.name,
      description: INDICATOR_GROUPS.governance.description,
      validCount: 0,
      totalCount: INDICATOR_GROUPS.governance.questions.length,
      averageIndex: null,
      band: null,
    },
    sustainability: {
      key: 'sustainability',
      name: INDICATOR_GROUPS.sustainability.name,
      description: INDICATOR_GROUPS.sustainability.description,
      validCount: 0,
      totalCount: INDICATOR_GROUPS.sustainability.questions.length,
      averageIndex: null,
      band: null,
    },
  };

  for (const groupKey of Object.keys(groups) as IndicatorGroupKey[]) {
    const qList = INDICATOR_GROUPS[groupKey].questions;
    let groupSum = 0;
    let groupValid = 0;

    for (const qId of qList) {
      const item = indicatorScores[qId];
      if (item && item.normalizedIndex !== null) {
        groupValid++;
        groupSum += item.normalizedIndex;
      }
    }

    groups[groupKey].validCount = groupValid;
    if (groupValid > 0) {
      const avg = Math.round((groupSum / groupValid) * 100) / 100;
      groups[groupKey].averageIndex = avg;
      groups[groupKey].band = classifyResultBand(avg);
    }
  }

  return {
    validCount,
    hasEnoughDataForOverall,
    overallAttentionIndex,
    overallBand,
    groups,
    indicatorScores,
  };
}
