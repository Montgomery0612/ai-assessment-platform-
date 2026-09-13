/**
 * Shared questionnaire content derived from the versioned config files.
 * Imported by both server-side routes and client-side pages.
 */

import bfiConfig from "../../config/items.bfi10.v1.json";
import aiConfig from "../../config/items.ai_attitude.v1.json";

export const OPTION_LABELS = Object.freeze([
  "非常不同意",
  "比较不同意",
  "不确定",
  "比较同意",
  "非常同意"
]);

export const BFI_ITEMS = Object.freeze(bfiConfig.items);
export const AI_ITEMS = Object.freeze(aiConfig.items);

export const BFI_DIMENSIONS = Object.freeze([
  "extraversion",
  "agreeableness",
  "conscientiousness",
  "neuroticism",
  "openness"
]);

export const AI_SUBSCALES = Object.freeze([
  "trust",
  "cautious_use",
  "concern",
  "use_intent",
  "social_impact"
]);

export const DIMENSION_LABELS = Object.freeze({
  extraversion: "外向性",
  agreeableness: "宜人性",
  conscientiousness: "尽责性",
  neuroticism: "神经质",
  openness: "开放性"
});

export const SUBSCALE_LABELS = Object.freeze({
  trust: "对 AI 的信任",
  cautious_use: "审慎使用",
  concern: "AI 担忧（反向）",
  use_intent: "使用意愿",
  social_impact: "AI 社会影响看法"
});

export const ALL_ITEM_IDS = Object.freeze([
  ...bfiConfig.items.map((item) => item.id),
  ...aiConfig.items.map((item) => item.id)
]);
