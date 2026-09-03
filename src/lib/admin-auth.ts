import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { adminDatabaseIsConfigured, getStoredAdmin, saveStoredAdmin } from "@/lib/admin-credentials";

const cookieName = "utilitech_admin_session";
const siteKey = "utilitech";
const sessionSeconds = 60 * 60 * 8;
const scryptAsync = promisify(scrypt);

function secret() { return process.env.ADMIN_SESSION_SECRET ?? ""; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

function equal(left: string, right: string) {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

async function passwordHash(password: string, salt: string) {
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return derived.toString("base64url");
}

export function adminIsConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && secret().length >= 32);
}

export async function credentialsMatch(email: string, password: string) {
  if (!adminIsConfigured()) return false;
  const normalEmail = email.trim().toLowerCase();

  if (adminDatabaseIsConfigured()) {
    try {
      const stored = await getStoredAdmin(siteKey);
      if (stored) {
        const derived = await passwordHash(password, stored.password_salt);
        return equal(stored.email, normalEmail) && equal(stored.password_hash, derived);
      }
    } catch {
      return false;
    }
  }

  return equal(process.env.ADMIN_EMAIL!.trim().toLowerCase(), normalEmail)
    && equal(process.env.ADMIN_PASSWORD!, password);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  if (!adminDatabaseIsConfigured()) return false;
  const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
  if (!(await credentialsMatch(email, currentPassword))) return false;
  const salt = randomBytes(16).toString("base64url");
  await saveStoredAdmin(siteKey, email, await passwordHash(newPassword, salt), salt);
  return true;
}

export async function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + sessionSeconds * 1000 })).toString("base64url");
  (await cookies()).set(cookieName, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionSeconds });
}

export async function clearAdminSession() { (await cookies()).delete(cookieName); }

export async function isAdminAuthenticated() {
  if (!adminIsConfigured()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number }; return typeof data.exp === "number" && data.exp > Date.now(); } catch { return false; }
}
