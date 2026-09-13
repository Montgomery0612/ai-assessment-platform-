/**
 * Server-only persistence backed by Cloudflare D1 (SQLite).
 *
 * The original JSONL-on-disk approach (fs) was replaced so the app can run on
 * Cloudflare Workers, which has no writable filesystem. No personally
 * identifiable information is collected or stored.
 *
 * Tables (auto-created on first use):
 *   responses(id, submittedAt, answers, result)
 *   feedback(id, submittedAt, ratings, confusion, improvements)
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

const RESPONSES_SCHEMA = `CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  submittedAt TEXT NOT NULL,
  answers TEXT NOT NULL,
  result TEXT NOT NULL
)`;

const FEEDBACK_SCHEMA = `CREATE TABLE IF NOT EXISTS feedback (
  id TEXT NOT NULL,
  submittedAt TEXT NOT NULL,
  ratings TEXT NOT NULL,
  confusion TEXT NOT NULL DEFAULT '',
  improvements TEXT NOT NULL DEFAULT ''
)`;

let schemaReady = false;

function db() {
  const { env } = getCloudflareContext();
  if (!env?.DB) {
    throw new Error(
      "D1 binding 'DB' is not configured. Add a d1_databases entry to wrangler.jsonc."
    );
  }
  return env.DB;
}

async function ensureSchema() {
  if (schemaReady) return;
  const handle = db();
  await handle.prepare(RESPONSES_SCHEMA).run();
  await handle.prepare(FEEDBACK_SCHEMA).run();
  schemaReady = true;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function appendResponse(record) {
  await ensureSchema();
  await db()
    .prepare(
      "INSERT INTO responses (id, submittedAt, answers, result) VALUES (?, ?, ?, ?)"
    )
    .bind(
      record.id,
      record.submittedAt,
      JSON.stringify(record.answers),
      JSON.stringify(record.result)
    )
    .run();
}

export async function readAllResponses() {
  await ensureSchema();
  const { results } = await db()
    .prepare(
      "SELECT id, submittedAt, answers, result FROM responses ORDER BY submittedAt ASC"
    )
    .all();
  return results.map((row) => ({
    id: row.id,
    submittedAt: row.submittedAt,
    answers: parseJson(row.answers, {}),
    result: parseJson(row.result, null)
  }));
}

export async function readResponseById(id) {
  await ensureSchema();
  const row = await db()
    .prepare("SELECT id, submittedAt, answers, result FROM responses WHERE id = ?")
    .bind(id)
    .first();
  if (!row) return null;
  return {
    id: row.id,
    submittedAt: row.submittedAt,
    answers: parseJson(row.answers, {}),
    result: parseJson(row.result, null)
  };
}

/**
 * Pilot feedback is stored separately from responses, keyed by the same
 * anonymous session id. No personally identifiable information is collected.
 */
export async function appendFeedback(feedback) {
  await ensureSchema();
  await db()
    .prepare(
      "INSERT INTO feedback (id, submittedAt, ratings, confusion, improvements) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      feedback.id,
      feedback.submittedAt,
      JSON.stringify(feedback.ratings),
      feedback.confusion ?? "",
      feedback.improvements ?? ""
    )
    .run();
}

export async function readAllFeedback() {
  await ensureSchema();
  const { results } = await db()
    .prepare(
      "SELECT id, submittedAt, ratings, confusion, improvements FROM feedback ORDER BY submittedAt ASC"
    )
    .all();
  return results.map((row) => ({
    id: row.id,
    submittedAt: row.submittedAt,
    ratings: parseJson(row.ratings, {}),
    confusion: row.confusion ?? "",
    improvements: row.improvements ?? ""
  }));
}
