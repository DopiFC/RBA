import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreQuestion10,
  scoreSingleQuestion,
  normalizeAttentionIndex,
  classifyResultBand,
  calculateSurveyResults,
} from './scoring';
import type { SurveyAnswers } from '../types/survey';

test('normalizeAttentionIndex maps 1..5 accurately to 0..100 scale', () => {
  assert.equal(normalizeAttentionIndex(1), 0);
  assert.equal(normalizeAttentionIndex(2), 25);
  assert.equal(normalizeAttentionIndex(3), 50);
  assert.equal(normalizeAttentionIndex(4), 75);
  assert.equal(normalizeAttentionIndex(5), 100);
  assert.equal(normalizeAttentionIndex(null), null);
});

test('classifyResultBand correctly categorizes attention index thresholds', () => {
  assert.equal(classifyResultBand(0), 'low');
  assert.equal(classifyResultBand(24), 'low');
  assert.equal(classifyResultBand(25), 'moderate');
  assert.equal(classifyResultBand(49), 'moderate');
  assert.equal(classifyResultBand(50), 'high');
  assert.equal(classifyResultBand(74), 'high');
  assert.equal(classifyResultBand(75), 'very_high');
  assert.equal(classifyResultBand(100), 'very_high');
  assert.equal(classifyResultBand(null), null);
});

test('scoreQuestion10 combinatorial logic satisfies Section V.3 rules', () => {
  // 1. Cost + market factor -> Score 1
  assert.equal(scoreQuestion10(['opt_cost', 'opt_demand']).rawScore, 1);
  assert.equal(scoreQuestion10(['opt_cost', 'opt_competitor']).rawScore, 1);
  assert.equal(scoreQuestion10(['opt_cost', 'opt_value', 'opt_demand']).rawScore, 1);

  // 2. >= 2 market factors without cost -> Score 2
  assert.equal(scoreQuestion10(['opt_demand', 'opt_competitor']).rawScore, 2);
  assert.equal(scoreQuestion10(['opt_demand', 'opt_value']).rawScore, 2);

  // 3. Only cost -> Score 3
  assert.equal(scoreQuestion10(['opt_cost']).rawScore, 3);

  // 4. Single market factor without cost -> Score 4
  assert.equal(scoreQuestion10(['opt_competitor']).rawScore, 4);
  assert.equal(scoreQuestion10(['opt_demand']).rawScore, 4);
  assert.equal(scoreQuestion10(['opt_value']).rawScore, 4);

  // 5. Gut feeling or no method -> Score 5
  assert.equal(scoreQuestion10(['opt_gut']).rawScore, 5);
  assert.equal(scoreQuestion10(['opt_none']).rawScore, 5);
  assert.equal(scoreQuestion10(['opt_cost', 'opt_gut']).rawScore, 5);

  // 6. Empty / undefined -> null
  assert.equal(scoreQuestion10([]).rawScore, null);
  assert.equal(scoreQuestion10(undefined).rawScore, null);
});

test('scoreSingleQuestion accurately maps specific options from specification', () => {
  // Q5: Demand trend
  assert.equal(scoreSingleQuestion('q05', 'sharp_increase').rawScore, 1);
  assert.equal(scoreSingleQuestion('q05', 'slight_increase').rawScore, 1);
  assert.equal(scoreSingleQuestion('q05', 'stable').rawScore, 2);
  assert.equal(scoreSingleQuestion('q05', 'slight_decrease').rawScore, 3);
  assert.equal(scoreSingleQuestion('q05', 'sharp_decrease').rawScore, 4);
  assert.equal(scoreSingleQuestion('q05', 'unpredictable').rawScore, 4);
  assert.equal(scoreSingleQuestion('q05', 'untracked').rawScore, 4);

  // Q6: Price sensitivity
  assert.equal(scoreSingleQuestion('q06', 'continue_buying').rawScore, 1);
  assert.equal(scoreSingleQuestion('q06', 'slight_drop_switch').rawScore, 3);
  assert.equal(scoreSingleQuestion('q06', 'many_switch_competitor').rawScore, 4);
  assert.equal(scoreSingleQuestion('q06', 'revenue_sharp_drop').rawScore, 5);
  assert.equal(scoreSingleQuestion('q06', 'untracked').rawScore, 4);

  // Q7: Input supply
  assert.equal(scoreSingleQuestion('q07', 'stable_low_impact').rawScore, 1);
  assert.equal(scoreSingleQuestion('q07', 'fluctuates_manageable').rawScore, 2);
  assert.equal(scoreSingleQuestion('q07', 'fluctuates_hurts_profit').rawScore, 4);
  assert.equal(scoreSingleQuestion('q07', 'heavily_dependent').rawScore, 5);

  // Missing values
  assert.equal(scoreSingleQuestion('q07', '').rawScore, null);
  assert.equal(scoreSingleQuestion('q07', undefined).rawScore, null);
});

test('calculateSurveyResults enforces threshold of minimum 8 valid questions for overall index', () => {
  // Scenario A: Full 11 questions answered
  const fullAnswers: SurveyAnswers = {
    q01_business_type: 'enterprise',
    q02_industry: 'manufacturing',
    q03_business_age: '3_to_7y',
    q04_employee_band: '21_to_100',
    q05_demand_trend: 'stable', // score 2 -> norm 25
    q06_price_sensitivity: 'continue_buying', // score 1 -> norm 0
    q07_supply_cost: 'fluctuates_manageable', // score 2 -> norm 25
    q08_cost_control: 'track_unit_and_margin', // score 1 -> norm 0
    q09_resource_efficiency: 'output_rises_proportionally', // score 2 -> norm 25
    q10_pricing_methods: ['opt_cost', 'opt_demand'], // score 1 -> norm 0
    q11_competition_pressure: 'clear_diff_loyal', // score 1 -> norm 0
    q12_strategic_reaction: 'proactive_scenarios', // score 1 -> norm 0
    q13_info_transparency: 'clear_consistent_feedback', // score 1 -> norm 0
    q14_governance_control: 'clear_roles_review_incentives', // score 1 -> norm 0
    q15_sustainability: 'balanced_3_pillars', // score 1 -> norm 0
  };

  const fullResult = calculateSurveyResults(fullAnswers);
  assert.equal(fullResult.validCount, 11);
  assert.equal(fullResult.hasEnoughDataForOverall, true);
  assert.ok(fullResult.overallAttentionIndex !== null);
  assert.equal(fullResult.overallAttentionIndex, 6.82); // (25 + 0 + 25 + 0 + 25 + 0 + 0 + 0 + 0 + 0 + 0)/11 = 75/11 = 6.82
  assert.equal(fullResult.overallBand, 'low');

  // Scenario B: Only 6 questions answered (less than 8 threshold)
  const partialAnswers: SurveyAnswers = {
    q05_demand_trend: 'stable',
    q06_price_sensitivity: 'continue_buying',
    q07_supply_cost: 'fluctuates_manageable',
    q08_cost_control: 'track_unit_and_margin',
    q09_resource_efficiency: 'output_rises_proportionally',
    q10_pricing_methods: ['opt_cost', 'opt_demand'],
  };

  const partialResult = calculateSurveyResults(partialAnswers);
  assert.equal(partialResult.validCount, 6);
  assert.equal(partialResult.hasEnoughDataForOverall, false);
  assert.equal(partialResult.overallAttentionIndex, null);
  assert.equal(partialResult.overallBand, null);
  // Groups should still display their respective valid count
  assert.equal(partialResult.groups.market.validCount, 2);
  assert.equal(partialResult.groups.operations.validCount, 3);
  assert.equal(partialResult.groups.pricing.validCount, 1);
  assert.equal(partialResult.groups.governance.validCount, 0);
  assert.equal(partialResult.groups.sustainability.validCount, 0);
});
