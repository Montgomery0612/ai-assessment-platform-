import { appendFeedback, readResponseById } from "../../../src/lib/storage.js";

export const runtime = "nodejs";

const RATING_FIELDS = Object.freeze([
  "clarity",
  "usability",
  "interpretability",
  "length"
]);

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

  const id = body?.id;
  if (!id) {
    return json({ ok: false, error: "Missing id" }, 400);
  }

  // Feedback must be linked to an existing anonymous session.
  const record = await readResponseById(id);
  if (!record) {
    return json({ ok: false, error: "Not found" }, 404);
  }

  const ratings = body?.ratings ?? {};
  for (const field of RATING_FIELDS) {
    const value = ratings[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 5) {
      return json({ ok: false, error: "Invalid rating" }, 400);
    }
  }

  const feedback = {
    id,
    submittedAt: new Date().toISOString(),
    ratings,
    confusion: typeof body.confusion === "string" ? body.confusion.trim() : "",
    improvements: typeof body.improvements === "string" ? body.improvements.trim() : ""
  };

  await appendFeedback(feedback);
  return json({ ok: true });
}
