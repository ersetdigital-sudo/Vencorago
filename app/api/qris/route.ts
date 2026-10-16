import { connection } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Foto QRIS tunggal di Supabase Storage (bucket `qris`).
   - GET     : URL foto aktif (baru) — dipakai checkout & halaman admin.
   - POST    : ganti foto. Nama file membawa timestamp sehingga URL selalu baru
               (aman dari cache CDN), lalu SEMUA file lain dihapus — jadi foto
               lama otomatis hilang dan hanya satu QRIS yang tersimpan.
   - DELETE  : hapus foto (checkout kembali ke QR placeholder).
   Aksi tulis dijaga PIN admin (ADMIN_PIN) yang hanya dibaca di server. */

const BUCKET = "qris";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type Env = { url: string; key: string; pin: string | null };

function envNow(): Env | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url, key, pin: process.env.ADMIN_PIN?.trim() || null };
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (code: string, status: number) => json({ ok: false, code }, status);

function storage(env: Env): SupabaseClient {
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function pubUrl(env: Env, name: string) {
  return `${env.url}/storage/v1/object/public/${BUCKET}/${name}`;
}

/** Perbandingan PIN tahan timing (nilai PIN tidak boleh bocor lewat waktu balas). */
function pinOk(got: string, want: string) {
  const a = Buffer.from(got, "utf8");
  const b = Buffer.from(want, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const bucketMissing = (msg: string) => /bucket not found/i.test(msg);

/** Kunci akses tulis: env lengkap + PIN cocok. null = boleh lanjut. */
function guard(req: Request, env: Env | null): Response | null {
  if (!env) return fail("not-configured", 503);
  if (!env.pin) return fail("no-pin", 503);
  if (!pinOk(req.headers.get("x-admin-pin") ?? "", env.pin)) return fail("bad-pin", 401);
  return null;
}

export async function GET() {
  /* Cache Components: pastikan env dibaca saat request, bukan saat build. */
  await connection();
  const env = envNow();
  if (!env) return json({ configured: false, url: null });

  const { data, error } = await storage(env).storage.from(BUCKET).list("");
  if (error) return json({ configured: true, url: null, bucketOk: false });

  /* File unggahan selalu bernama qris-<timestamp>.<ext>; yang terbaru = aktif. */
  const newest = (data ?? [])
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];

  return json({
    configured: true,
    url: newest ? pubUrl(env, newest.name) : null,
    bucketOk: true,
  });
}

export async function POST(req: Request) {
  await connection();
  const env = envNow();
  const denied = guard(req, env);
  if (denied || !env) return denied ?? fail("not-configured", 503);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("no-file", 400);
  if (file.size === 0) return fail("empty", 400);
  if (file.size > MAX_BYTES) return fail("too-big", 413);
  const ext = EXT[file.type];
  if (!ext) return fail("bad-type", 415);

  const bucket = storage(env).storage.from(BUCKET);
  const name = `qris-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const up = await bucket.upload(name, bytes, { contentType: file.type, upsert: false });
  if (up.error) return fail(bucketMissing(up.error.message) ? "no-bucket" : "upload-failed", 502);

  /* Upload dulu baru hapus yang lama: tidak ada jeda tanpa QRIS. Kalau
     pembersihan gagal, foto baru tetap aktif dan sisa file dibersihkan
     otomatis di unggahan berikutnya. */
  const { data: old } = await bucket.list("");
  const stale = (old ?? []).map((f) => f.name).filter((n) => n !== name);
  let cleanup: "ok" | "partial" = "ok";
  if (stale.length) {
    const rm = await bucket.remove(stale);
    if (rm.error) cleanup = "partial";
  }

  return json({ ok: true, url: pubUrl(env, name), cleanup });
}

export async function DELETE(req: Request) {
  await connection();
  const env = envNow();
  const denied = guard(req, env);
  if (denied || !env) return denied ?? fail("not-configured", 503);

  const bucket = storage(env).storage.from(BUCKET);
  const { data: old, error } = await bucket.list("");
  if (error) return fail(bucketMissing(error.message) ? "no-bucket" : "remove-failed", 502);

  const names = (old ?? []).map((f) => f.name);
  if (names.length) {
    const rm = await bucket.remove(names);
    if (rm.error) return fail("remove-failed", 502);
  }
  return json({ ok: true, url: null });
}
