/**
 * Qualified, exploratory interpretation text for results.
 * Thresholds are coarse (>=60 较高, <=40 较低, otherwise 中等) and are
 * intended for self-reflection only — never a psychological or clinical claim.
 */

function level(score) {
  if (score >= 60) return "high";
  if (score <= 40) return "low";
  return "mid";
}

export function levelLabel(score) {
  if (score >= 60) return "较高";
  if (score <= 40) return "较低";
  return "中等";
}

const BFI_TEXT = Object.freeze({
  extraversion: {
    high: "你在社交与外界互动方面倾向主动、健谈，通常乐于参与群体活动并从中获得能量。",
    mid: "你在内外向之间较为平衡，既能适应社交场合，也能享受独处。",
    low: "你倾向安静、内敛，偏好独处或小范围的深入交流，社交活动可能更快消耗你的精力。"
  },
  agreeableness: {
    high: "你通常表现出合作、友善与信任他人的倾向，重视与他人和谐相处。",
    mid: "你在合作与坚持己见之间较为均衡，会视情境调整自己的立场。",
    low: "你倾向直接表达不同意见、更具批判性，在竞争情境中可能表现得更加坚定。"
  },
  conscientiousness: {
    high: "你通常自律、有条理、做事认真可靠，倾向于提前规划与坚持目标。",
    mid: "你在计划与随性之间较为平衡，既能坚持目标也能灵活调整。",
    low: "你倾向灵活、随性，可能更喜欢顺其自然，较少拘泥于细节和计划。"
  },
  neuroticism: {
    high: "你可能更容易感受到焦虑、紧张或情绪波动，对压力的反应较为敏感。",
    mid: "你的情绪稳定性处于中等水平，压力情境下表现相对均衡。",
    low: "你通常情绪较为稳定、从容，面对压力时能保持相对平静。"
  },
  openness: {
    high: "你通常好奇心强、富有想象力，乐于尝试新事物和新观念。",
    mid: "你在求新与务实之间较为平衡，对熟悉与新奇都保持开放。",
    low: "你倾向务实、偏好熟悉与常规，更重视经验与实际可行的解决方案。"
  }
});

const AI_TEXT = Object.freeze({
  trust: {
    high: "你倾向于相信 AI 提供的信息和建议具有参考价值。",
    mid: "你对 AI 信息的态度较为审慎，会视情况判断是否采信。",
    low: "你对 AI 提供的信息和建议持较为保留或怀疑的态度。"
  },
  cautious_use: {
    high: "你在涉及重要决定时，倾向对 AI 的回答保持谨慎并主动核实。",
    mid: "你对 AI 的使用抱有一定谨慎，但程度适中。",
    low: "你在使用 AI 时相对放松，较少主动进行额外核实。"
  },
  concern: {
    high: "你目前对 AI 广泛使用带来的负面后果担忧较少。",
    mid: "你对 AI 的影响存在一定的顾虑，但程度适中。",
    low: "你对 AI 广泛使用可能带来的负面后果较为担忧。"
  },
  use_intent: {
    high: "你愿意在学习、工作或日常生活中积极使用并推荐 AI 工具。",
    mid: "你对使用 AI 工具持开放态度，意愿适中。",
    low: "你目前使用 AI 工具的意愿较低，或仍持观望态度。"
  },
  social_impact: {
    high: "你倾向认为 AI 的发展整体上会给社会带来积极影响。",
    mid: "你对 AI 的社会影响持中性、观望的态度。",
    low: "你倾向认为 AI 的发展可能带来较多风险或消极影响。"
  }
});

export function bfiText(dimension, score) {
  return BFI_TEXT[dimension][level(score)];
}

export function aiText(subscale, score) {
  return AI_TEXT[subscale][level(score)];
}

export const DISCLAIMER =
  "本评估结果仅供教育与研究探索使用，反映的是你当前的自我报告倾向，" +
  "不构成心理测量诊断、临床判断或任何专业建议。";
