import bfiConfig from "../../../../config/items.bfi10.v1.json";
import aiConfig from "../../../../config/items.ai_attitude.v1.json";
import {
  ScoringValidationError,
  scoreAssessment
} from "../../../../src/lib/scoring.js";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;

class PayloadTooLargeError extends Error {}

function json(body, status) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function isJsonContentType(contentType) {
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

async function readBodyWithinLimit(request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return json({ ok: false, error: "Content-Type must be application/json" }, 415);
  }

  let rawBody;
  try {
    rawBody = await readBodyWithinLimit(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ ok: false, error: "Request body too large" }, 413);
    }
    return json({ ok: false, error: "Internal error" }, 500);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  try {
    const result = scoreAssessment(body?.answers, { bfiConfig, aiConfig });
    return json({ ok: true, result }, 200);
  } catch (error) {
    if (error instanceof ScoringValidationError) {
      return json({ ok: false, error: error.message }, 400);
    }

    return json({ ok: false, error: "Internal error" }, 500);
  }
}
