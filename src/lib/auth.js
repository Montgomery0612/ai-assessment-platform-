/**
 * Server-only admin authentication. This module must never be imported into a
 * client component — it holds the credential and session secret.
 *
 * Credentials are read from environment variables so they can be set as
 * Cloudflare secrets / vars in production (ADMIN_EMAIL, ADMIN_PASSWORD,
 * SESSION_SECRET). ADMIN_PASSWORD and SESSION_SECRET have no fallback — when
 * they are not configured, login and session verification fail closed.
 *
 * NOTE: This is a minimal demo auth (plaintext credential + HMAC-signed cookie).
 * For a real deployment, replace with a proper auth system and a hashed password.
 */

import crypto from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const SESSION_COOKIE_NAME = "admin_session";

// Resolution order: Cloudflare env binding → process.env → fallback.
function config(key, fallback) {
  try {
    const { env } = getCloudflareContext();
    if (env && env[key]) return env[key];
  } catch {
    // Not inside a request context (e.g. plain `next dev` without bindings).
  }
  return process.env[key] || fallback;
}

function adminEmail() {
  return config("ADMIN_EMAIL", "monty_2025@sjtu.edu.cn");
}
function adminPassword() {
  // No fallback: login fails closed when the password is not configured.
  return config("ADMIN_PASSWORD", "");
}
function sessionSecret() {
  // No fallback: session verification fails closed when the secret is not configured.
  return config("SESSION_SECRET", "");
}

function hmac(email) {
  return crypto.createHmac("sha256", sessionSecret()).update(email).digest("hex");
}

// base64url keeps the payload free of "." and "@" so the cookie value is not
// mangled on the round trip. Implemented with portable Web APIs (no Node Buffer)
// so it runs on Cloudflare Workers.
function base64urlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function verifyCredentials(email, password) {
  const expected = adminPassword();
  if (!expected) return false;
  return email === adminEmail() && password === expected;
}

export function createSessionToken(email) {
  const payload = base64urlEncode(email);
  return `${payload}.${hmac(email)}`;
}

export function verifySessionToken(token) {
  const secret = sessionSecret();
  if (!secret) return false;
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const separator = token.lastIndexOf(".");
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let email;
  try {
    email = base64urlDecode(payload);
  } catch {
    return false;
  }

  return email === adminEmail() && signature === hmac(email);
}
