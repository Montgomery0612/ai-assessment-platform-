/**
 * Pure scoring functions for the assessment platform.
 * This module has no file, network, database, clock, or environment access.
 * Scores are rounded only when standardize returns a final 0--100 value, to a
 * fixed 10 decimal places. Intermediate means and weighted means are unrounded.
 */

export const SCORE_ROUNDING_DECIMALS = 10;

export class ScoringValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScoringValidationError";
  }
}

/**
 * Metadata lets callers label cautious_use without changing its numeric score.
 */
export const AI_SCORE_METADATA = Object.freeze({
  cautious_use: Object.freeze({ descriptive: true })
});

const BFI_DIMENSIONS = Object.freeze([
  "extraversion",
  "agreeableness",
  "conscientiousness",
  "neuroticism",
  "openness"
]);

const REQUIRED_AI_SUBSCALES = Object.freeze([
  "trust",
  "cautious_use",
  "concern",
  "use_intent",
  "social_impact"
]);

function assertPlainObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ScoringValidationError(`${name} must be an object.`);
  }
}

function roundScore(value) {
  return Number(value.toFixed(SCORE_ROUNDING_DECIMALS));
}

function standardize(mean) {
  return roundScore(((mean - 1) / 4) * 100);
}

function average(values) {
  if (values.length === 0) {
    throw new ScoringValidationError("Cannot average an empty set of answers.");
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getValidatedAnswer(answers, questionId) {
  if (!Object.hasOwn(answers, questionId)) {
    throw new ScoringValidationError(`Missing required answer: ${questionId}`);
  }

  const value = answers[questionId];
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new ScoringValidationError(
      `Invalid answer for ${questionId}: must be an integer from 1 to 5`
    );
  }

  return value;
}

function assertUniqueItemIds(items, configName) {
  const ids = new Set();
  for (const item of items) {
    if (!item?.id || typeof item.id !== "string") {
      throw new ScoringValidationError(`${configName} contains an item without an id.`);
    }
    if (ids.has(item.id)) {
      throw new ScoringValidationError(`${configName} contains duplicate item id: ${item.id}.`);
    }
    ids.add(item.id);
  }
}

function validateConfigs(bfiConfig, aiConfig) {
  assertPlainObject(bfiConfig, "bfiConfig");
  assertPlainObject(aiConfig, "aiConfig");

  if (!Array.isArray(bfiConfig.items) || !Array.isArray(aiConfig.items)) {
    throw new ScoringValidationError("Each config must contain an items array.");
  }

  assertUniqueItemIds(bfiConfig.items, "bfiConfig");
  assertUniqueItemIds(aiConfig.items, "aiConfig");

  if (!Array.isArray(bfiConfig.dimensions)) {
    throw new ScoringValidationError("bfiConfig must contain a dimensions array.");
  }

  for (const dimension of BFI_DIMENSIONS) {
    if (!bfiConfig.dimensions.includes(dimension)) {
      throw new ScoringValidationError(`bfiConfig is missing dimension: ${dimension}.`);
    }
  }

  if (!Array.isArray(aiConfig.subscales)) {
    throw new ScoringValidationError("aiConfig must contain a subscales array.");
  }

  const subscaleIds = new Set(aiConfig.subscales.map((subscale) => subscale.id));
  for (const subscale of REQUIRED_AI_SUBSCALES) {
    if (!subscaleIds.has(subscale)) {
      throw new ScoringValidationError(`aiConfig is missing subscale: ${subscale}.`);
    }
  }
}

function scoreBfi(answers, bfiConfig) {
  const valuesByDimension = Object.fromEntries(
    BFI_DIMENSIONS.map((dimension) => [dimension, []])
  );

  for (const item of bfiConfig.items) {
    if (!BFI_DIMENSIONS.includes(item.dimension)) {
      throw new ScoringValidationError(`Unknown BFI dimension for ${item.id}.`);
    }

    const rawAnswer = getValidatedAnswer(answers, item.id);
    valuesByDimension[item.dimension].push(
      item.reverseScored ? 6 - rawAnswer : rawAnswer
    );
  }

  return Object.fromEntries(
    BFI_DIMENSIONS.map((dimension) => {
      const itemValues = valuesByDimension[dimension];
      if (itemValues.length !== 2) {
        throw new ScoringValidationError(
          `BFI dimension ${dimension} must contain exactly two items.`
        );
      }
      return [dimension, standardize(average(itemValues))];
    })
  );
}

/**
 * Scores AI-attitude subscales. concern 返回的是积极方向（越高代表越不担忧）；
 * 原始担忧方向仅在分量表内部平均时使用。
 */
function scoreAi(answers, aiConfig) {
  const valuesBySubscale = Object.fromEntries(
    REQUIRED_AI_SUBSCALES.map((subscale) => [subscale, []])
  );

  for (const item of aiConfig.items) {
    const rawAnswer = getValidatedAnswer(answers, item.id);

    if (item.scored === false) {
      continue;
    }

    if (!Object.hasOwn(valuesBySubscale, item.subscale)) {
      throw new ScoringValidationError(`Unknown or unscored AI subscale for ${item.id}.`);
    }

    valuesBySubscale[item.subscale].push(
      item.reverseScoredWithinSubscale ? 6 - rawAnswer : rawAnswer
    );
  }

  const rawMeans = Object.fromEntries(
    REQUIRED_AI_SUBSCALES.map((subscale) => [
      subscale,
      average(valuesBySubscale[subscale])
    ])
  );

  // concern remains unreversed while its own answers are averaged. It is then
  // reversed once to align it with the positive direction of the total score.
  const positiveAlignedMeans = {
    trust: rawMeans.trust,
    cautious_use: rawMeans.cautious_use,
    concern: 6 - rawMeans.concern,
    use_intent: rawMeans.use_intent,
    social_impact: rawMeans.social_impact
  };

  const overallPositiveMean = average([
    positiveAlignedMeans.trust,
    positiveAlignedMeans.concern,
    positiveAlignedMeans.use_intent,
    positiveAlignedMeans.social_impact
  ]);

  return {
    trust: standardize(positiveAlignedMeans.trust),
    cautious_use: standardize(positiveAlignedMeans.cautious_use),
    concern: standardize(positiveAlignedMeans.concern),
    use_intent: standardize(positiveAlignedMeans.use_intent),
    social_impact: standardize(positiveAlignedMeans.social_impact),
    overall_positive_attitude: standardize(overallPositiveMean)
  };
}

/**
 * Scores one complete assessment.
 *
 * @param {Record<string, number>} answers Question id to raw 1--5 response.
 * @param {{ bfiConfig: object, aiConfig: object }} configs Loaded versioned configs.
 * @returns {{
 *   bfi: Record<string, number>,
 *   ai: Record<string, number>,
 *   metadata: { ai: typeof AI_SCORE_METADATA }
 * }}
 */
export function scoreAssessment(answers, { bfiConfig, aiConfig }) {
  assertPlainObject(answers, "answers");
  validateConfigs(bfiConfig, aiConfig);

  return {
    bfi: scoreBfi(answers, bfiConfig),
    ai: scoreAi(answers, aiConfig),
    metadata: {
      ai: AI_SCORE_METADATA
    }
  };
}
