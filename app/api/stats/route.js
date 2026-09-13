import { computeStats } from "../../../src/lib/stats.js";

export const runtime = "nodejs";

export async function GET() {
  const stats = await computeStats();
  return Response.json({ ok: true, stats });
}
