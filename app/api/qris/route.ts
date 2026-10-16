import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/* Foto QRIS tunggal di Supabase Storage (bucket `qris`).
   - GET     : URL foto aktif — publik, dipakai checkout & halaman admin.
   - POST    : ganti foto. Nama file membawa timestamp sehingga URL selalu baru
               (aman dari cache CDN), lalu SEMUA file lain dihapus — jadi foto
               lama otomatis hilang dan hanya satu QRIS yang tersimpan.
   - DELETE  : hapus foto (checkout kembali ke QR placeholder).
   Aksi tulis hanya untuk sesi admin yang sah (cookie dari /api/admin/login). */

const BUCKET = "qris";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type Env = { url: string; key: string };

function envNow(): Env | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
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

const bucketMissing = (msg: string) => /bucket not found/i.test(msg);

/** Sesi admin dari cookie (ditandatangani, diverifikasi tanpa akses database). */
async function adminAuthed() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
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
  if (!env) return fail("not-configured", 503);
  if (!(await adminAuthed())) return fail("unauthorized", 401);

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

export async function DELETE(_req: Request) {
  await connection();
  const env = envNow();
  if (!env) return fail("not-configured", 503);
  if (!(await adminAuthed())) return fail("unauthorized", 401);

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
