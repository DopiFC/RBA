export interface SurveyAnswers {
  // Demographic / Group A (Q1 - Q4)
  q01_business_type?: string;
  q02_industry?: string;
  q02_industry_other?: string;
  q03_business_age?: string;
  q04_employee_band?: string;

  // Diagnostic Indicators (Q5 - Q15)
  q05_demand_trend?: string;
  q06_price_sensitivity?: string;
  q07_supply_cost?: string;
  q08_cost_control?: string;
  q09_resource_efficiency?: string;
  q10_pricing_methods?: string[];
  q11_competition_pressure?: string;
  q12_strategic_reaction?: string;
  q13_info_transparency?: string;
  q14_governance_control?: string;
  q15_sustainability?: string;
}

export type ResultBand = 'low' | 'moderate' | 'high' | 'very_high';

export interface IndicatorScore {
  questionId: string;
  questionLabel: string;
  groupKey: IndicatorGroupKey;
  rawScore: number | null; // 1 to 5, or null if invalid/missing
  normalizedIndex: number | null; // 0 to 100, or null
  rationale: string;
  theoreticalConcept: string;
}

export type IndicatorGroupKey = 'market' | 'operations' | 'pricing' | 'governance' | 'sustainability';

export interface IndicatorGroupScore {
  key: IndicatorGroupKey;
  name: string;
  description: string;
  validCount: number;
  totalCount: number;
  averageIndex: number | null; // 0 to 100, or null if 0 valid
  band: ResultBand | null;
}

export interface SurveyScoringResult {
  responseId: string;
  instrumentVersion: string;
  algorithmVersion: string;
  submittedAt: string;
  validQuestionCount: number; // out of 11
  hasEnoughDataForOverall: boolean; // >= 8 valid questions
  overallAttentionIndex: number | null; // 0 to 100
  overallBand: ResultBand | null;
  overallBandLabel: string;
  groups: Record<IndicatorGroupKey, IndicatorGroupScore>;
  indicatorScores: Record<string, IndicatorScore>;
  topPriorities: DiagnosticIssue[];
  keyStrengths: string[];
  scenarios: QualitativeScenarios;
  actionRoadmap: ActionRoadmap;
}

export interface DiagnosticIssue {
  id: string;
  indicatorKey: string;
  title: string;
  observedAnswer: string;
  theoreticalConcept: string;
  managerialImplication: string;
  potentialRisks: string;
  dataToCollect: string;
  recommendedAction: string;
  severity: ResultBand;
}

export interface QualitativeScenarios {
  favorable: {
    title: string;
    description: string;
    triggerConditions: string[];
    monitoringIndicators: string[];
  };
  baseline: {
    title: string;
    description: string;
    triggerConditions: string[];
    monitoringIndicators: string[];
  };
  adverse: {
    title: string;
    description: string;
    triggerConditions: string[];
    monitoringIndicators: string[];
  };
}

export interface ActionRoadmap {
  thirtyDays: string[];
  ninetyDays: string[];
  twelveMonths: string[];
}

export interface SurveySubmissionPayload {
  responseId: string;
  email: string;
  consentAccepted: boolean;
  consentVersion: string;
  contactPermission: boolean;
  answers: SurveyAnswers;
  clientTimestamp: string;
}

export interface SurveyFeedbackPayload {
  feedbackId: string;
  responseId: string;
  usefulnessRating: number; // 1 to 5
  realismFit: 'fit' | 'partial' | 'not_fit' | 'insufficient_info';
  prioritiesNext12m: string[]; // max 3
  additionalComments?: string;
  futureResearchOptIn: boolean;
  submittedAt: string;
}

export interface StoredSurveyRecord {
  response_id: string;
  submitted_at: string;
  instrument_version: string;
  consent_version: string;
  business_type: string;
  industry: string;
  business_age: string;
  employee_band: string;
  q05: string;
  q06: string;
  q07: string;
  q08: string;
  q09: string;
  q10: string; // JSON array or joined string
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  scores_individual: Record<string, number | null>;
  group_scores: Record<IndicatorGroupKey, number | null>;
  overall_attention_index: number | null;
  result_band: string;
  valid_count: number;
  data_status: 'complete' | 'partial';
  scoring_algorithm_version: string;
}

export interface StoredContactRecord {
  response_id: string;
  email: string;
  consent_timestamp: string;
  consent_purpose: string;
  contact_permission: boolean;
  retention_note: string;
}

export interface AdminStatsResponse {
  totalSurveys: number;
  validSurveys: number;
  partialSurveys: number;
  completionRate: number;
  businessTypeDistribution: Record<string, number>;
  industryDistribution: Record<string, number>;
  businessAgeDistribution: Record<string, number>;
  employeeBandDistribution: Record<string, number>;
  attentionBandDistribution: Record<string, number>;
  groupAverages: Record<IndicatorGroupKey, number | null>;
  questionAverages: Record<string, number | null>;
  timeTrends: { date: string; count: number }[];
  feedbackCount: number;
  feedbackAvgUsefulness: number | null;
  googleSheetsConnected: boolean;
  googleSheetsSpreadsheetId?: string;
}
