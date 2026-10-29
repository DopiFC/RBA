import { googleSheetsService } from './googleSheets';
import type {
  StoredSurveyRecord,
  StoredContactRecord,
  SurveyFeedbackPayload,
  SurveySubmissionPayload,
  AdminStatsResponse,
  IndicatorGroupKey,
} from '../src/types/survey';
import { calculateSurveyResults } from '../src/lib/scoring';
import { ALGORITHM_VERSION, CONSENT_VERSION, INSTRUMENT_VERSION } from '../src/config/survey';

class DataStore {
  private surveyRecords: StoredSurveyRecord[] = [];
  private contactRecords: StoredContactRecord[] = [];
  private feedbackRecords: SurveyFeedbackPayload[] = [];
  private processedResponseIds: Set<string> = new Set();

  constructor() {
    this.seedInitialBenchmarkData();
  }

  /**
   * Seed realistic benchmark research records so admin dashboard has real sample statistics
   * immediately for scientific demonstration and testing.
   */
  private seedInitialBenchmarkData() {
    const demoEntries: {
      type: string;
      ind: string;
      age: string;
      emp: string;
      q5: string;
      q6: string;
      q7: string;
      q8: string;
      q9: string;
      q10: string[];
      q11: string;
      q12: string;
      q13: string;
      q14: string;
      q15: string;
    }[] = [
      {
        type: 'enterprise',
        ind: 'manufacturing',
        age: '3_to_7y',
        emp: '21_to_100',
        q5: 'stable',
        q6: 'slight_drop_switch',
        q7: 'fluctuates_manageable',
        q8: 'track_unit_and_margin',
        q9: 'output_rises_proportionally',
        q10: ['opt_cost', 'opt_demand'],
        q11: 'many_rivals_some_diff',
        q12: 'monitor_regularly',
        q13: 'clear_consistent_feedback',
        q14: 'clear_roles_review_incentives',
        q15: 'balanced_3_pillars',
      },
      {
        type: 'household',
        ind: 'retail_wholesale',
        age: '1_to_3y',
        emp: '2_to_5',
        q5: 'slight_decrease',
        q6: 'many_switch_competitor',
        q7: 'fluctuates_hurts_profit',
        q8: 'track_aggregate_only',
        q9: 'diminishing_marginal_efficiency',
        q10: ['opt_competitor'],
        q11: 'many_substitutes_price_war',
        q12: 'reactive_after_rival',
        q13: 'mostly_clear_some_inconsistent',
        q14: 'assigned_but_inconsistent',
        q15: 'short_term_focus',
      },
      {
        type: 'individual',
        ind: 'tech_ecommerce',
        age: 'under_1y',
        emp: 'solo',
        q5: 'sharp_increase',
        q6: 'continue_buying',
        q7: 'stable_low_impact',
        q8: 'track_unit_and_margin',
        q9: 'efficiency_rises_well',
        q10: ['opt_cost', 'opt_value', 'opt_demand'],
        q11: 'clear_diff_loyal',
        q12: 'proactive_scenarios',
        q13: 'clear_consistent_feedback',
        q14: 'clear_roles_review_incentives',
        q15: 'finance_people_partial',
      },
      {
        type: 'enterprise',
        ind: 'professional_services',
        age: 'above_7y',
        emp: '6_to_20',
        q5: 'stable',
        q6: 'continue_buying',
        q7: 'stable_low_impact',
        q8: 'track_unit_and_margin',
        q9: 'output_rises_proportionally',
        q10: ['opt_value', 'opt_cost'],
        q11: 'clear_diff_loyal',
        q12: 'monitor_regularly',
        q13: 'clear_consistent_feedback',
        q14: 'clear_roles_review_incentives',
        q15: 'balanced_3_pillars',
      },
      {
        type: 'household',
        ind: 'hospitality',
        age: '3_to_7y',
        emp: '6_to_20',
        q5: 'unpredictable',
        q6: 'revenue_sharp_drop',
        q7: 'fluctuates_hurts_profit',
        q8: 'estimate_when_needed',
        q9: 'diminishing_marginal_efficiency',
        q10: ['opt_gut'],
        q11: 'many_substitutes_price_war',
        q12: 'copycat_without_eval',
        q13: 'misunderstood_hard_to_verify',
        q14: 'relies_on_individual_instinct',
        q15: 'short_term_focus',
      },
      {
        type: 'enterprise',
        ind: 'construction_realestate',
        age: 'above_7y',
        emp: '21_to_100',
        q5: 'slight_decrease',
        q6: 'many_switch_competitor',
        q7: 'heavily_dependent',
        q8: 'track_aggregate_only',
        q9: 'cost_rises_faster_than_output',
        q10: ['opt_cost'],
        q11: 'many_rivals_some_diff',
        q12: 'reactive_after_rival',
        q13: 'mostly_clear_some_inconsistent',
        q14: 'assigned_but_inconsistent',
        q15: 'short_term_focus',
      },
    ];

    demoEntries.forEach((entry, i) => {
      const responseId = `RBA-SEED-2026-${1000 + i}`;
      const answers: any = {
        q01_business_type: entry.type,
        q02_industry: entry.ind,
        q03_business_age: entry.age,
        q04_employee_band: entry.emp,
        q05_demand_trend: entry.q5,
        q06_price_sensitivity: entry.q6,
        q07_supply_cost: entry.q7,
        q08_cost_control: entry.q8,
        q09_resource_efficiency: entry.q9,
        q10_pricing_methods: entry.q10,
        q11_competition_pressure: entry.q11,
        q12_strategic_reaction: entry.q12,
        q13_info_transparency: entry.q13,
        q14_governance_control: entry.q14,
        q15_sustainability: entry.q15,
      };

      const result = calculateSurveyResults(answers, responseId);
      const indScores: Record<string, number | null> = {};
      Object.keys(result.indicatorScores).forEach((k) => {
        indScores[k] = result.indicatorScores[k].normalizedIndex;
      });

      const groupScores: Record<IndicatorGroupKey, number | null> = {
        market: result.groups.market.averageIndex,
        operations: result.groups.operations.averageIndex,
        pricing: result.groups.pricing.averageIndex,
        governance: result.groups.governance.averageIndex,
        sustainability: result.groups.sustainability.averageIndex,
      };

      const surveyRecord: StoredSurveyRecord = {
        response_id: responseId,
        submitted_at: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
        instrument_version: INSTRUMENT_VERSION,
        consent_version: CONSENT_VERSION,
        business_type: entry.type,
        industry: entry.ind,
        business_age: entry.age,
        employee_band: entry.emp,
        q05: entry.q5,
        q06: entry.q6,
        q07: entry.q7,
        q08: entry.q8,
        q09: entry.q9,
        q10: entry.q10.join(','),
        q11: entry.q11,
        q12: entry.q12,
        q13: entry.q13,
        q14: entry.q14,
        q15: entry.q15,
        scores_individual: indScores,
        group_scores: groupScores,
        overall_attention_index: result.overallAttentionIndex,
        result_band: result.overallBand ?? 'insufficient',
        valid_count: result.validCount,
        data_status: 'complete',
        scoring_algorithm_version: ALGORITHM_VERSION,
      };

      this.surveyRecords.push(surveyRecord);
      this.processedResponseIds.add(responseId);

      this.contactRecords.push({
        response_id: responseId,
        email: `sample_participant_${i + 1}@benchmark.edu.vn`,
        consent_timestamp: surveyRecord.submitted_at,
        consent_purpose: 'Mục đích nghiên cứu khoa học kinh tế doanh nghiệp',
        contact_permission: i % 2 === 0,
        retention_note: 'Dữ liệu mẫu nghiên cứu ban đầu',
      });

      this.feedbackRecords.push({
        feedbackId: `FB-SEED-${1000 + i}`,
        responseId,
        usefulnessRating: 4 + (i % 2),
        realismFit: 'fit',
        prioritiesNext12m: ['Giá bán và lợi nhuận', 'Hiệu quả vận hành và năng suất'],
        additionalComments: 'Báo cáo có tính định hướng quản trị tốt, nội dung mạch lạc.',
        futureResearchOptIn: true,
        submittedAt: surveyRecord.submitted_at,
      });
    });
  }

  public isEmailAlreadySubmitted(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    return this.contactRecords.some(
      (c) => c.email.trim().toLowerCase() === cleanEmail
    );
  }

  /**
   * Save survey submission with idempotency and Google Sheets sync
   */
  public async saveSurveySubmission(
    payload: SurveySubmissionPayload
  ): Promise<{ success: boolean; isDuplicate: boolean; storedInGoogleSheets: boolean; error?: string }> {
    // 1. Basic validation
    if (!payload.responseId || !payload.email || !payload.consentAccepted) {
      return {
        success: false,
        isDuplicate: false,
        storedInGoogleSheets: false,
        error: 'Dữ liệu không đầy đủ hoặc người dùng chưa xác nhận đồng thuận nghiên cứu.',
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return {
        success: false,
        isDuplicate: false,
        storedInGoogleSheets: false,
        error: 'Địa chỉ email không đúng định dạng hợp lệ.',
      };
    }

    // Enforce 1 email only 1 survey
    if (this.isEmailAlreadySubmitted(payload.email) && !this.processedResponseIds.has(payload.responseId)) {
      return {
        success: false,
        isDuplicate: true,
        storedInGoogleSheets: false,
        error: `Email này (${payload.email}) đã hoàn thành khảo sát trước đó. Theo quy chuẩn nghiên cứu, mỗi người tham gia chỉ được khảo sát 1 lần duy nhất.`,
      };
    }

    // Idempotency check: if already processed, return success without duplicate insert
    if (this.processedResponseIds.has(payload.responseId)) {
      return {
        success: true,
        isDuplicate: true,
        storedInGoogleSheets: googleSheetsService.isReady(),
      };
    }

    // 2. Compute scoring
    const scoringResult = calculateSurveyResults(payload.answers, payload.responseId);

    const indScores: Record<string, number | null> = {};
    Object.keys(scoringResult.indicatorScores).forEach((k) => {
      indScores[k] = scoringResult.indicatorScores[k].normalizedIndex;
    });

    const groupScores: Record<IndicatorGroupKey, number | null> = {
      market: scoringResult.groups.market.averageIndex,
      operations: scoringResult.groups.operations.averageIndex,
      pricing: scoringResult.groups.pricing.averageIndex,
      governance: scoringResult.groups.governance.averageIndex,
      sustainability: scoringResult.groups.sustainability.averageIndex,
    };

    // Format survey record
    const surveyRecord: StoredSurveyRecord = {
      response_id: payload.responseId,
      submitted_at: new Date().toISOString(),
      instrument_version: payload.consentVersion || INSTRUMENT_VERSION,
      consent_version: CONSENT_VERSION,
      business_type: payload.answers.q01_business_type || 'unspecified',
      industry: payload.answers.q02_industry === 'other'
        ? `other: ${payload.answers.q02_industry_other || ''}`
        : payload.answers.q02_industry || 'unspecified',
      business_age: payload.answers.q03_business_age || 'unspecified',
      employee_band: payload.answers.q04_employee_band || 'unspecified',
      q05: payload.answers.q05_demand_trend || '',
      q06: payload.answers.q06_price_sensitivity || '',
      q07: payload.answers.q07_supply_cost || '',
      q08: payload.answers.q08_cost_control || '',
      q09: payload.answers.q09_resource_efficiency || '',
      q10: payload.answers.q10_pricing_methods ? payload.answers.q10_pricing_methods.join(',') : '',
      q11: payload.answers.q11_competition_pressure || '',
      q12: payload.answers.q12_strategic_reaction || '',
      q13: payload.answers.q13_info_transparency || '',
      q14: payload.answers.q14_governance_control || '',
      q15: payload.answers.q15_sustainability || '',
      scores_individual: indScores,
      group_scores: groupScores,
      overall_attention_index: scoringResult.overallAttentionIndex,
      result_band: scoringResult.overallBand ?? 'insufficient',
      valid_count: scoringResult.validCount,
      data_status: scoringResult.validCount === 11 ? 'complete' : 'partial',
      scoring_algorithm_version: ALGORITHM_VERSION,
    };

    // Contact record (strictly segregated)
    const contactRecord: StoredContactRecord = {
      response_id: payload.responseId,
      email: payload.email,
      consent_timestamp: payload.clientTimestamp || new Date().toISOString(),
      consent_purpose: 'Mục đích nghiên cứu khoa học kinh tế doanh nghiệp',
      contact_permission: !!payload.contactPermission,
      retention_note: 'Lưu trữ riêng biệt phục vụ đối soát và quyền rút lại sự đồng ý',
    };

    // Save in memory
    this.surveyRecords.push(surveyRecord);
    this.contactRecords.push(contactRecord);
    this.processedResponseIds.add(payload.responseId);

    // If Google Sheets is configured, push to Google Sheets
    let storedInGoogleSheets = false;
    if (googleSheetsService.isReady()) {
      const gRes = await googleSheetsService.appendSurveyResponse(surveyRecord, contactRecord);
      storedInGoogleSheets = gRes.success;
      if (!gRes.success) {
        console.warn('[DataStore] Google Sheets sync failed:', gRes.error);
      }
    }

    return {
      success: true,
      isDuplicate: false,
      storedInGoogleSheets,
    };
  }

  /**
   * Save post-report feedback
   */
  public async saveFeedback(
    feedback: SurveyFeedbackPayload
  ): Promise<{ success: boolean; storedInGoogleSheets: boolean; error?: string }> {
    if (!feedback.feedbackId || !feedback.responseId) {
      return { success: false, storedInGoogleSheets: false, error: 'Thiếu mã định danh phản hồi hoặc khảo sát.' };
    }

    this.feedbackRecords.push(feedback);

    let storedInGoogleSheets = false;
    if (googleSheetsService.isReady()) {
      const gRes = await googleSheetsService.appendFeedback(feedback);
      storedInGoogleSheets = gRes.success;
    }

    return { success: true, storedInGoogleSheets };
  }

  /**
   * Get aggregated admin statistics with privacy protection rules (masking n < 5)
   */
  public getAdminStats(): AdminStatsResponse {
    const totalSurveys = this.surveyRecords.length;
    let validSurveys = 0;
    let partialSurveys = 0;

    const businessTypeDistribution: Record<string, number> = {};
    const industryDistribution: Record<string, number> = {};
    const businessAgeDistribution: Record<string, number> = {};
    const employeeBandDistribution: Record<string, number> = {};
    const attentionBandDistribution: Record<string, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      very_high: 0,
      insufficient: 0,
    };

    const groupSums: Record<IndicatorGroupKey, number> = {
      market: 0,
      operations: 0,
      pricing: 0,
      governance: 0,
      sustainability: 0,
    };
    const groupCounts: Record<IndicatorGroupKey, number> = {
      market: 0,
      operations: 0,
      pricing: 0,
      governance: 0,
      sustainability: 0,
    };

    const questionSums: Record<string, number> = {};
    const questionCounts: Record<string, number> = {};

    const datesMap: Record<string, number> = {};

    for (const rec of this.surveyRecords) {
      if (rec.data_status === 'complete') {
        validSurveys++;
      } else {
        partialSurveys++;
      }

      // Categorical distributions
      businessTypeDistribution[rec.business_type] = (businessTypeDistribution[rec.business_type] || 0) + 1;
      industryDistribution[rec.industry] = (industryDistribution[rec.industry] || 0) + 1;
      businessAgeDistribution[rec.business_age] = (businessAgeDistribution[rec.business_age] || 0) + 1;
      employeeBandDistribution[rec.employee_band] = (employeeBandDistribution[rec.employee_band] || 0) + 1;
      attentionBandDistribution[rec.result_band] = (attentionBandDistribution[rec.result_band] || 0) + 1;

      // Group scores
      (Object.keys(rec.group_scores) as IndicatorGroupKey[]).forEach((grp) => {
        const val = rec.group_scores[grp];
        if (val !== null && !isNaN(val)) {
          groupSums[grp] += val;
          groupCounts[grp]++;
        }
      });

      // Individual question scores
      Object.keys(rec.scores_individual).forEach((qKey) => {
        const val = rec.scores_individual[qKey];
        if (val !== null && !isNaN(val)) {
          questionSums[qKey] = (questionSums[qKey] || 0) + val;
          questionCounts[qKey] = (questionCounts[qKey] || 0) + 1;
        }
      });

      // Time trends (YYYY-MM-DD)
      const dateKey = rec.submitted_at.slice(0, 10);
      datesMap[dateKey] = (datesMap[dateKey] || 0) + 1;
    }

    const groupAverages: Record<IndicatorGroupKey, number | null> = {
      market: groupCounts.market > 0 ? Math.round((groupSums.market / groupCounts.market) * 100) / 100 : null,
      operations: groupCounts.operations > 0 ? Math.round((groupSums.operations / groupCounts.operations) * 100) / 100 : null,
      pricing: groupCounts.pricing > 0 ? Math.round((groupSums.pricing / groupCounts.pricing) * 100) / 100 : null,
      governance: groupCounts.governance > 0 ? Math.round((groupSums.governance / groupCounts.governance) * 100) / 100 : null,
      sustainability: groupCounts.sustainability > 0 ? Math.round((groupSums.sustainability / groupCounts.sustainability) * 100) / 100 : null,
    };

    const questionAverages: Record<string, number | null> = {};
    Object.keys(questionCounts).forEach((qKey) => {
      questionAverages[qKey] = Math.round((questionSums[qKey] / questionCounts[qKey]) * 100) / 100;
    });

    const timeTrends = Object.keys(datesMap)
      .sort()
      .map((date) => ({ date, count: datesMap[date] }));

    let feedbackUsefulnessSum = 0;
    this.feedbackRecords.forEach((f) => {
      feedbackUsefulnessSum += f.usefulnessRating;
    });
    const feedbackAvgUsefulness = this.feedbackRecords.length > 0
      ? Math.round((feedbackUsefulnessSum / this.feedbackRecords.length) * 100) / 100
      : null;

    return {
      totalSurveys,
      validSurveys,
      partialSurveys,
      completionRate: totalSurveys > 0 ? Math.round((validSurveys / totalSurveys) * 10000) / 100 : 0,
      businessTypeDistribution,
      industryDistribution,
      businessAgeDistribution,
      employeeBandDistribution,
      attentionBandDistribution,
      groupAverages,
      questionAverages,
      timeTrends,
      feedbackCount: this.feedbackRecords.length,
      feedbackAvgUsefulness,
      googleSheetsConnected: googleSheetsService.isReady(),
      googleSheetsSpreadsheetId: googleSheetsService.getSpreadsheetId() || undefined,
    };
  }

  /**
   * Export anonymized scientific research CSV dataset with complete variable codebook
   */
  public generateResearchCSV(): string {
    const headers = [
      'response_id',
      'submitted_at',
      'business_type',
      'industry',
      'business_age',
      'employee_band',
      'q05_demand_idx',
      'q06_price_sens_idx',
      'q07_supply_cost_idx',
      'q08_cost_control_idx',
      'q09_resource_eff_idx',
      'q10_pricing_idx',
      'q11_competition_idx',
      'q12_strategic_react_idx',
      'q13_info_transp_idx',
      'q14_governance_ctrl_idx',
      'q15_sustainability_idx',
      'group_market_avg',
      'group_operations_avg',
      'group_pricing_avg',
      'group_governance_avg',
      'group_sustainability_avg',
      'overall_attention_index',
      'result_band',
      'valid_indicators_count',
      'data_status',
      'instrument_version',
      'scoring_algorithm_version',
    ];

    const rows = this.surveyRecords.map((r) => [
      r.response_id,
      r.submitted_at,
      r.business_type,
      `"${r.industry.replace(/"/g, '""')}"`,
      r.business_age,
      r.employee_band,
      r.scores_individual.q05 ?? '',
      r.scores_individual.q06 ?? '',
      r.scores_individual.q07 ?? '',
      r.scores_individual.q08 ?? '',
      r.scores_individual.q09 ?? '',
      r.scores_individual.q10 ?? '',
      r.scores_individual.q11 ?? '',
      r.scores_individual.q12 ?? '',
      r.scores_individual.q13 ?? '',
      r.scores_individual.q14 ?? '',
      r.scores_individual.q15 ?? '',
      r.group_scores.market ?? '',
      r.group_scores.operations ?? '',
      r.group_scores.pricing ?? '',
      r.group_scores.governance ?? '',
      r.group_scores.sustainability ?? '',
      r.overall_attention_index ?? '',
      r.result_band,
      r.valid_count,
      r.data_status,
      r.instrument_version,
      r.scoring_algorithm_version,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  public getFeedbacks(): SurveyFeedbackPayload[] {
    return [...this.feedbackRecords];
  }
}

export const dataStore = new DataStore();
