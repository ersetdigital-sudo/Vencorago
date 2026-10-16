import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_TTL_SECONDS,
  adminConfigured,
  createSessionToken,
  passwordMatches,
} from "@/lib/admin-session";

/* Masuk admin: satu password bersama (ADMIN_PASSWORD) → cookie sesi httpOnly
   bertanda tangan. Pembatas percobaan di bawah ini best-effort (memori proses,
   jadi di serverless hanya berlaku per instance) — cukup untuk meredam coba-coba
   otomatis, bukan pengganti rate limit di level platform. */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { n: number; reset: number }>();

function clientKey(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? "lokal").trim() || "lokal";
}

function blocked(key: string, now: number) {
  const a = attempts.get(key);
  return Boolean(a && a.reset > now && a.n >= MAX_ATTEMPTS);
}

function noteFailure(key: string, now: number) {
  const a = attempts.get(key);
  if (!a || a.reset <= now) attempts.set(key, { n: 1, reset: now + WINDOW_MS });
  else a.n += 1;
}

function isSecure(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  return proto ? proto.split(",")[0].trim() === "https" : req.nextUrl.protocol === "https:";
}

function sessionCookie(value: string, maxAge: number, secure: boolean) {
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    secure ? "; Secure" : ""
  }`;
}

export async function POST(req: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };

  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, code: "not-configured" }, { status: 503, headers: noStore });
  }

  const now = Date.now();
  const key = clientKey(req);
  if (blocked(key, now)) {
    return NextResponse.json({ ok: false, code: "too-many" }, { status: 429, headers: noStore });
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 200) {
    noteFailure(key, now);
    return NextResponse.json({ ok: false, code: "bad-request" }, { status: 400, headers: noStore });
  }

  if (!(await passwordMatches(password))) {
    noteFailure(key, now);
    return NextResponse.json({ ok: false, code: "bad-password" }, { status: 401, headers: noStore });
  }

  const token = await createSessionToken(now);
  if (!token) {
    return NextResponse.json({ ok: false, code: "not-configured" }, { status: 503, headers: noStore });
  }

  attempts.delete(key);
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { ...noStore, "Set-Cookie": sessionCookie(token, ADMIN_TTL_SECONDS, isSecure(req)) },
    }
  );
}
