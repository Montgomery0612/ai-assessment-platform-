import assert from "node:assert/strict";
import test from "node:test";

import bfiConfig from "../config/items.bfi10.v1.json" with { type: "json" };
import aiConfig from "../config/items.ai_attitude.v1.json" with { type: "json" };
import {
  AI_SCORE_METADATA,
  ScoringValidationError,
  scoreAssessment
} from "../src/lib/scoring.js";

const configs = { bfiConfig, aiConfig };
const allQuestionIds = [...bfiConfig.items, ...aiConfig.items].map(({ id }) => id);

function answersWith(value) {
  return Object.fromEntries(allQuestionIds.map((id) => [id, value]));
}

function score(answers) {
  return scoreAssessment(answers, configs);
}

test("all answers set to 1 produces expected floor scores", () => {
  const result = score(answersWith(1));

  assert.deepEqual(result.bfi, {
    extraversion: 50,
    agreeableness: 50,
    conscientiousness: 50,
    neuroticism: 50,
    openness: 50
  });
  assert.equal(result.ai.trust, 0);
  assert.equal(result.ai.cautious_use, 0);
  assert.equal(result.ai.concern, 100);
  assert.equal(result.ai.use_intent, 0);
  assert.equal(result.ai.social_impact, 0);
  assert.equal(result.ai.overall_positive_attitude, 25);
});

test("all 3 answers score 50 across every displayed metric", () => {
  const result = score(answersWith(3));

  assert.deepEqual(result.bfi, {
    extraversion: 50,
    agreeableness: 50,
    conscientiousness: 50,
    neuroticism: 50,
    openness: 50
  });
  assert.deepEqual(result.ai, {
    trust: 50,
    cautious_use: 50,
    concern: 50,
    use_intent: 50,
    social_impact: 50,
    overall_positive_attitude: 50
  });
});

test("all 5 answers preserve BFI midpoints and calculate AI directions correctly", () => {
  const result = score(answersWith(5));

  assert.deepEqual(result.bfi, {
    extraversion: 50,
    agreeableness: 50,
    conscientiousness: 50,
    neuroticism: 50,
    openness: 50
  });
  assert.deepEqual(result.ai, {
    trust: 100,
    cautious_use: 100,
    concern: 0,
    use_intent: 100,
    social_impact: 100,
    overall_positive_attitude: 75
  });
});

test("each BFI reverse-scored item is individually reversed", () => {
  const reverseCases = [
    ["bfi_01", "extraversion"],
    ["bfi_03", "conscientiousness"],
    ["bfi_04", "neuroticism"],
    ["bfi_05", "openness"],
    ["bfi_07", "agreeableness"]
  ];

  for (const [questionId, dimension] of reverseCases) {
    const answers = answersWith(3);
    answers[questionId] = 1;

    assert.equal(
      score(answers).bfi[dimension],
      75,
      `${questionId} should map raw 1 to reversed 5`
    );
  }
});

test("concern is averaged without item reversal, then reversed for positive alignment", () => {
  const answers = answersWith(3);
  answers.ai_03 = 5;
  answers.ai_04 = 3;

  const result = score(answers);

  // Raw concern mean is (5 + 3) / 2 = 4; positive-aligned mean is 6 - 4 = 2.
  assert.equal(result.ai.concern, 25);
  assert.equal(result.ai.overall_positive_attitude, 43.75);
});

test("missing required question throws a validation error", () => {
  const answers = answersWith(3);
  delete answers.ai_10;

  assert.throws(
    () => score(answers),
    (error) =>
      error instanceof ScoringValidationError &&
      error.message === "Missing required answer: ai_10"
  );
});

test("out-of-range and non-integer answers throw validation errors with their question id", () => {
  const invalidAnswerCases = [
    ["bfi_01", 0],
    ["bfi_01", 6],
    ["ai_05", 0],
    ["ai_05", 6],
    ["bfi_02", 3.5],
    ["ai_06", 3.5],
    ["bfi_03", "4"],
    ["ai_07", "4"],
    ["bfi_04", null],
    ["ai_08", undefined]
  ];

  for (const [questionId, invalidValue] of invalidAnswerCases) {
    const answers = answersWith(3);
    answers[questionId] = invalidValue;

    assert.throws(
      () => score(answers),
      (error) =>
        error instanceof ScoringValidationError &&
        error.message === `Invalid answer for ${questionId}: must be an integer from 1 to 5`
    );
  }
});

test("hand-calculated 20-item example matches every score", () => {
  const answers = {
    bfi_01: 1,
    bfi_02: 4,
    bfi_03: 2,
    bfi_04: 4,
    bfi_05: 1,
    bfi_06: 2,
    bfi_07: 2,
    bfi_08: 5,
    bfi_09: 3,
    bfi_10: 3,
    ai_01: 4,
    ai_02: 5,
    ai_03: 5,
    ai_04: 3,
    ai_05: 5,
    ai_06: 4,
    ai_07: 2,
    ai_08: 2,
    ai_09: 5,
    ai_10: 4
  };

  const result = score(answers);

  assert.deepEqual(result.bfi, {
    extraversion: 62.5,
    agreeableness: 75,
    conscientiousness: 87.5,
    neuroticism: 37.5,
    openness: 75
  });
  assert.deepEqual(result.ai, {
    trust: 75,
    cautious_use: 100,
    concern: 25,
    use_intent: 66.6666666667,
    social_impact: 62.5,
    overall_positive_attitude: 57.2916666667
  });
  assert.deepEqual(AI_SCORE_METADATA.cautious_use, { descriptive: true });
  assert.deepEqual(result.metadata.ai.cautious_use, { descriptive: true });
});
