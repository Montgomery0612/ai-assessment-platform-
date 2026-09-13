import bfiConfig from "../../../config/items.bfi10.v1.json";
import aiConfig from "../../../config/items.ai_attitude.v1.json";
import {
  ScoringValidationError,
  scoreAssessment
} from "../../../src/lib/scoring.js";
import { appendResponse, readResponseById } from "../../../src/lib/storage.js";

export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  try {
    const result = scoreAssessment(body?.answers, { bfiConfig, aiConfig });
    const record = {
      id: globalThis.crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      answers: body.answers,
      result
    };
    await appendResponse(record);
    return json({ ok: true, id: record.id });
  } catch (error) {
    if (error instanceof ScoringValidationError) {
      return json({ ok: false, error: error.message }, 400);
    }
    return json({ ok: false, error: "Internal error" }, 500);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return json({ ok: false, error: "Missing id" }, 400);
  }

  const record = await readResponseById(id);
  if (!record) {
    return json({ ok: false, error: "Not found" }, 404);
  }

  return json({ ok: true, record });
}
