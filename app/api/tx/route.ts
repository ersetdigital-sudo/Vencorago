import { connection, NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/* Satu-satunya pintu ke tabel `transactions` (Supabase).

   - GET  ?inv=VCR…  : publik, dipakai halaman "Cek Status" (satu invoice saja).
   - GET  (tanpa inv): wajib sesi admin — daftar order untuk dashboard.
   - POST            : checkout publik menulis order; migrasi data lama dari
                       perangkat admin juga lewat sini (status `success` hanya
                       diterima kalau ada sesi admin).

   Kunci `SUPABASE_SERVICE_ROLE_KEY` hanya hidup di server (tidak pernah
   dikirim ke browser), dan tabelnya RLS-tanpa-policy sehingga publishable key
   tidak bisa menyentuhnya. */

const TABLE = "transactions";
const MAX_BODY = 8 * 1024;
const MAX_ROWS = 500;
const INV = /^VCR[0-9]{9}$/;

type Row = {
  inv: string;
  prod: string;
  cat: string;
  no: string;
  pm: string;
  total: number | string;
  status: "pending" | "success";
  sn: string;
  time: string;
  paid: string | null;
};

type Order = {
  inv: string;
  prod: string;
  cat: string;
  no: string;
  pm: string;
  total: number;
  status: "pending" | "success";
  sn: string;
  time: string;
  paid: string | null;
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (code: string, status: number) => json({ ok: false, code }, status);

function serverEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

const storage = (env: { url: string; key: string }) =>
  createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });

async function adminAuthed() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

const toTx = (r: Row) => ({
  inv: r.inv,
  prod: r.prod,
  cat: r.cat,
  no: r.no,
  pm: r.pm,
  total: Number(r.total),
  status: r.status,
  sn: r.sn,
  time: Date.parse(r.time),
  paid: r.paid ? Date.parse(r.paid) : null,
});

const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null;

function parseOrder(v: unknown): Order | null {
  const o = (v ?? {}) as Record<string, unknown>;
  const inv = typeof o.inv === "string" ? o.inv.trim().toUpperCase() : "";
  if (!INV.test(inv)) return null;

  const prod = text(o.prod, 60);
  const cat = text(o.cat, 60);
  const no = text(o.no, 40);
  const pm = text(o.pm, 40);
  if (!prod || !cat || !no || !pm) return null;

  const total = Number(o.total);
  if (!Number.isFinite(total) || Math.round(total) !== total || total <= 0 || total > 1e9) return null;

  const status = o.status === "success" ? "success" : o.status === "pending" ? "pending" : null;
  if (!status) return null;

  /* Waktu dari browser: epoch milidetik (bukan detik), dan tidak lebih dari
     6 jam di depan supaya jam perangkat yang ngawur tidak merusak data. */
  const t = Number(o.time);
  const now = Date.now();
  if (!Number.isFinite(t) || t < 1_600_000_000_000 || t > now + 6 * 3600e3) return null;

  const sn = typeof o.sn === "string" ? o.sn.slice(0, 40) : "";
  const paidMs = Number(o.paid);
  const paid =
    status === "success"
      ? new Date(Number.isFinite(paidMs) && paidMs > 0 ? paidMs : now).toISOString()
      : null;

  return { inv, prod, cat, no, pm, total: Math.round(total), status, sn, time: new Date(t).toISOString(), paid };
}

/* Pembatas best-effort (memori proses): cukup meredam spam order palsu, bukan
   pengganti rate limit platform. Ditambahkan ke README sebagai batasan. */
const WINDOW_MS = 60 * 1000;
const MAX_POSTS = 30;
const posts = new Map<string, { n: number; reset: number }>();

function clientKey(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? "lokal").trim() || "lokal";
}

function tooMany(key: string, now: number) {
  const a = posts.get(key);
  return Boolean(a && a.reset > now && a.n >= MAX_POSTS);
}

function note(key: string, now: number) {
  const a = posts.get(key);
  if (!a || a.reset <= now) posts.set(key, { n: 1, reset: now + WINDOW_MS });
  else a.n += 1;
}

export async function GET(req: NextRequest) {
  await connection();
  const env = serverEnv();
  if (!env) return fail("not-configured", 503);

  const sb = storage(env);
  const inv = req.nextUrl.searchParams.get("inv")?.trim().toUpperCase() ?? "";

  if (inv) {
    if (!INV.test(inv)) return fail("bad-invoice", 400);
    const { data, error } = await sb.from(TABLE).select("*").eq("inv", inv).maybeSingle();
    if (error) return fail("read-failed", 502);
    return json({ ok: true, tx: data ? toTx(data as Row) : null });
  }

  if (!(await adminAuthed())) return fail("unauthorized", 401);
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("time", { ascending: false })
    .limit(MAX_ROWS);
  if (error) return fail("read-failed", 502);
  return json({ ok: true, rows: (data ?? []).map((r) => toTx(r as Row)) });
}

export async function POST(req: NextRequest) {
  await connection();
  const env = serverEnv();
  if (!env) return fail("not-configured", 503);

  const authed = await adminAuthed();
  const now = Date.now();
  const key = clientKey(req);
  if (!authed && tooMany(key, now)) return fail("too-many", 429);

  const raw = await req.text().catch(() => "");
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  const order = raw.length <= MAX_BODY ? parseOrder(body) : null;
  if (!order) {
    note(key, now);
    return fail("bad-request", 400);
  }

  const sb = storage(env);
  const { data: existing, error: readErr } = await sb
    .from(TABLE)
    .select("status")
    .eq("inv", order.inv)
    .maybeSingle();
  if (readErr) return fail("read-failed", 502);

  if (!existing) {
    /* Order baru selalu `pending` dari checkout. `success` langsung hanya dari
       migrasi data lama di perangkat admin (sudah punya sesi). */
    if (order.status === "success" && !authed) {
      note(key, now);
      return fail("forbidden", 403);
    }
    const { error } = await sb.from(TABLE).insert(order);
    if (error) return fail("write-failed", 502);
    return json({ ok: true, created: true });
  }

  const stored = (existing as { status: "pending" | "success" }).status;

  /* Order yang sudah selesai tidak bisa diubah lagi, dan status tidak pernah
     boleh mundur: aksi tulis dari publik hanya "tandai sudah dibayar". */
  if (stored === "success" || order.status !== "success") return json({ ok: true, created: false });

  const { error } = await sb
    .from(TABLE)
    .update({
      status: "success",
      sn: order.sn,
      paid: order.paid ?? new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    })
    .eq("inv", order.inv);
  if (error) return fail("write-failed", 502);
  return json({ ok: true, created: false });
}
