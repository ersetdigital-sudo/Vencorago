/* Sesi admin: nilai cookie httpOnly bertanda tangan HMAC-SHA256.

   Modul ini sengaja hanya memakai Web Crypto (bukan `node:crypto` maupun
   `next/headers`) supaya bisa dipakai bersama oleh `proxy.ts` dan route
   handler. Token berisi payload `{ exp }` + tanda tangan, jadi tidak bisa
   dipalsukan tanpa `ADMIN_SESSION_SECRET`.

   Kalau env belum diisi, semuanya gagal-tertutup (fail closed): tidak ada
   sesi yang bisa dibuat maupun diterima. */

export const ADMIN_COOKIE = "vcr_admin";
export const ADMIN_TTL_SECONDS = 8 * 60 * 60; // 8 jam

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(v: string): Uint8Array | null {
  try {
    const s = atob(v.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Perbandingan tahan-timing: panjang/waktu balas tidak membocorkan nilai. */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sha256(v: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(v)));
}

export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function adminSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

/** Apakah kredensial admin (password + secret sesi) sudah lengkap. */
export function adminConfigured(): boolean {
  return Boolean(adminPassword() && adminSecret());
}

export async function passwordMatches(given: string): Promise<boolean> {
  const want = adminPassword();
  if (!want) return false;
  return equalBytes(await sha256(given), await sha256(want));
}

/** Nilai cookie sesi baru; null kalau secret belum di-set. */
export async function createSessionToken(now = Date.now()): Promise<string | null> {
  const secret = adminSecret();
  if (!secret) return null;
  const payload = b64url(enc.encode(JSON.stringify({ exp: now + ADMIN_TTL_SECONDS * 1000 })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

/** Validasi tanda tangan + masa berlaku token sesi. */
export async function verifySessionToken(token: string | null | undefined, now = Date.now()): Promise<boolean> {
  const secret = adminSecret();
  if (!token || !secret) return false;

  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = unb64url(token.slice(dot + 1));
  if (!sig) return false;

  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload)));
  if (!equalBytes(sig, expected)) return false;

  const raw = unb64url(payload);
  if (!raw) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(raw)) as { exp?: unknown };
    return typeof exp === "number" && exp > now;
  } catch {
    return false;
  }
}
