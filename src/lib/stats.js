/**
 * Server-only aggregate statistics over all stored responses.
 * Used by the researcher dashboard (/api/stats).
 */

import {
  BFI_ITEMS,
  AI_ITEMS,
  BFI_DIMENSIONS,
  AI_SUBSCALES,
  DIMENSION_LABELS,
  SUBSCALE_LABELS
} from "./items.js";
import { readAllResponses, readAllFeedback } from "./storage.js";

const BFI_METRIC_KEYS = BFI_DIMENSIONS;
const AI_METRIC_KEYS = [...AI_SUBSCALES, "overall_positive_attitude"];
const METRIC_LABELS = {
  ...DIMENSION_LABELS,
  ...SUBSCALE_LABELS,
  overall_positive_attitude: "总体积极态度"
};

const FEEDBACK_RATING_LABELS = Object.freeze({
  clarity: "题目容易理解",
  usability: "平台容易使用",
  interpretability: "结果解释容易理解",
  length: "测评长度合适"
});

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleStd(values) {
  const n = values.length;
  if (n < 2) return null;
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

function histogram(values, bins = 10) {
  const counts = new Array(bins).fill(0);
  for (const value of values) {
    const idx = Math.min(bins - 1, Math.floor(value / (100 / bins)));
    counts[idx]++;
  }
  return counts;
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function round2(value) {
  return value === null ? null : Math.round(value * 100) / 100;
}

function cronbachAlpha(itemColumns) {
  const k = itemColumns.length;
  const n = itemColumns[0]?.length ?? 0;
  if (k < 2 || n < 2) return null;

  const totals = new Array(n).fill(0);
  let sumOfItemVariances = 0;

  for (const column of itemColumns) {
    const m = mean(column);
    sumOfItemVariances += column.reduce((a, b) => a + (b - m) ** 2, 0) / n;
    column.forEach((value, i) => {
      totals[i] += value;
    });
  }

  const totalMean = mean(totals);
  const totalVariance = totals.reduce((a, b) => a + (b - totalMean) ** 2, 0) / n;
  if (totalVariance === 0) return null;

  return (k / (k - 1)) * (1 - sumOfItemVariances / totalVariance);
}

function localDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortId(id) {
  return id ? id.slice(0, 8) : null;
}

async function computeFeedbackSummary() {
  const list = await readAllFeedback();

  const ratings = {};
  for (const [key, label] of Object.entries(FEEDBACK_RATING_LABELS)) {
    const values = list
      .map((f) => f.ratings?.[key])
      .filter((v) => typeof v === "number");
    ratings[key] = {
      label,
      n: values.length,
      mean: values.length ? mean(values) : null
    };
  }

  const toEntries = (field) =>
    list
      .filter((f) => typeof f[field] === "string" && f[field].trim())
      .map((f) => ({ id: shortId(f.id), submittedAt: f.submittedAt, text: f[field].trim() }));

  return {
    count: list.length,
    ratings,
    confusion: toEntries("confusion"),
    improvements: toEntries("improvements")
  };
}

export async function computeStats() {
  const responses = await readAllResponses();
  const count = responses.length;

  // ---- metric summaries (mean / std / distribution) ----
  const summary = {};
  for (const key of BFI_METRIC_KEYS) {
    const values = responses.map((r) => r.result.bfi[key]);
    summary[key] = {
      label: METRIC_LABELS[key],
      group: "bfi",
      n: values.length,
      mean: values.length ? mean(values) : null,
      std: sampleStd(values),
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      distribution: histogram(values)
    };
  }
  for (const key of AI_METRIC_KEYS) {
    const values = responses.map((r) => r.result.ai[key]);
    summary[key] = {
      label: METRIC_LABELS[key],
      group: "ai",
      n: values.length,
      mean: values.length ? mean(values) : null,
      std: sampleStd(values),
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      distribution: histogram(values)
    };
  }

  // ---- item-level response distributions (raw 1-5 counts) ----
  const itemDistributions = [
    ...BFI_ITEMS.map((item) => ({
      id: item.id,
      text: item.text,
      group: "bfi",
      scale: DIMENSION_LABELS[item.dimension],
      counts: new Array(5).fill(0)
    })),
    ...AI_ITEMS.map((item) => ({
      id: item.id,
      text: item.text,
      group: "ai",
      scale: SUBSCALE_LABELS[item.subscale] ?? item.subscale,
      counts: new Array(5).fill(0)
    }))
  ];
  for (const response of responses) {
    for (const item of itemDistributions) {
      const value = response.answers[item.id];
      if (Number.isInteger(value) && value >= 1 && value <= 5) {
        item.counts[value - 1] += 1;
      }
    }
  }

  // ---- Cronbach's alpha ----
  const bfiCronbach = {};
  for (const dimension of BFI_DIMENSIONS) {
    const items = BFI_ITEMS.filter((item) => item.dimension === dimension);
    const columns = items.map((item) =>
      responses.map((r) => {
        const raw = r.answers[item.id];
        return item.reverseScored ? 6 - raw : raw;
      })
    );
    bfiCronbach[dimension] = round2(cronbachAlpha(columns));
  }
  const bfiOverallColumns = BFI_ITEMS.map((item) =>
    responses.map((r) => {
      const raw = r.answers[item.id];
      return item.reverseScored ? 6 - raw : raw;
    })
  );
  const bfiOverallAlpha = round2(cronbachAlpha(bfiOverallColumns));

  const aiCronbach = {};
  for (const subscale of AI_SUBSCALES) {
    const items = AI_ITEMS.filter(
      (item) => item.subscale === subscale && item.scored !== false
    );
    const columns = items.map((item) =>
      responses.map((r) => {
        const raw = r.answers[item.id];
        return item.reverseScoredWithinSubscale ? 6 - raw : raw;
      })
    );
    aiCronbach[subscale] = round2(cronbachAlpha(columns));
  }

  // ---- correlation matrices ----
  function correlationMatrix(metricKeys, getValues) {
    const labels = metricKeys.map((key) => METRIC_LABELS[key]);
    const columns = metricKeys.map((key) => responses.map(getValues(key)));
    const matrix = metricKeys.map((_, i) =>
      metricKeys.map((__, j) => round2(pearson(columns[i], columns[j])))
    );
    return { labels, matrix };
  }

  const bfiCorrelations = correlationMatrix(BFI_METRIC_KEYS, (key) => (r) => r.result.bfi[key]);
  const aiCorrelations = correlationMatrix(AI_METRIC_KEYS, (key) => (r) => r.result.ai[key]);

  // ---- completion per day ----
  const perDayMap = new Map();
  for (const response of responses) {
    const date = localDate(response.submittedAt);
    perDayMap.set(date, (perDayMap.get(date) ?? 0) + 1);
  }
  const perDay = [...perDayMap.entries()]
    .map(([date, n]) => ({ date, count: n }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const dateRange = responses.length
    ? {
        first: responses[0].submittedAt,
        last: responses[responses.length - 1].submittedAt
      }
    : null;

  const feedback = await computeFeedbackSummary();

  return {
    count,
    dateRange,
    summary,
    itemDistributions,
    cronbach: {
      bfi: bfiCronbach,
      bfiOverall: bfiOverallAlpha,
      ai: aiCronbach
    },
    correlations: {
      bfi: bfiCorrelations,
      ai: aiCorrelations
    },
    perDay,
    feedback
  };
}
