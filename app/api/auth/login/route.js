import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifyCredentials
} from "../../../../src/lib/auth.js";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyCredentials(email, password)) {
    return Response.json({ ok: false, error: "账号或密码错误" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  return Response.json({ ok: true });
}
