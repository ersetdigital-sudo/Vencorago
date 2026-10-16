import { connection, NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { KATALOG_TAG } from "@/lib/catalog";

/* ============================================================================
   Satu-satunya pintu tulis katalog.

   - GET  : seluruh isi katalog apa adanya (termasuk yang nonaktif) untuk panel
            admin /admin/katalog. Wajib sesi admin.
   - POST : { entity, op, data } → simpan (`simpan`) atau hapus (`hapus`).

   Semua query di sini memakai SUPABASE_SERVICE_ROLE_KEY (server-only) karena
   tabel katalog RLS-nya hanya mengizinkan SELECT untuk anon. Setelah perubahan,
   cache tag `katalog` di-revalidate supaya halaman publik ikut berubah tanpa
   deploy ulang.
   ========================================================================== */

const ENTITIES = ["category", "provider", "item", "method", "setting"] as const;
type Entity = (typeof ENTITIES)[number];

const ICONS = ["phone", "wifi", "zap", "drop", "shield", "tv", "wallet", "bank", "clock", "check"];
const KINDS = ["nominal", "paket", "tagihan"];
const METHOD_KINDS = ["qris", "va", "wallet"];

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (code: string, status: number) => json({ ok: false, code }, status);

function server() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const authed = async () => verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);

/* ------------------------------------------------------------- validasi -- */

const text = (v: unknown, max: number, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;

const angka = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const bulat = Math.round(n);
  if (bulat < min) return min;
  if (bulat > max) return max;
  return bulat;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const pilihan = (v: unknown, opsi: string[], fallback: string) =>
  typeof v === "string" && opsi.includes(v) ? v : fallback;

/** `bill` boleh datang sebagai objek atau teks JSON dari editor. */
function objekBill(v: unknown): Record<string, string> {
  let nilai: unknown = v;
  if (typeof v === "string") {
    try {
      nilai = JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (!nilai || typeof nilai !== "object" || Array.isArray(nilai)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(nilai as Record<string, unknown>)) {
    const key = k.trim().slice(0, 60);
    if (key) out[key] = String(val).slice(0, 120);
  }
  return out;
}

function barisCategory(d: Record<string, unknown>) {
  const name = text(d.name, 60);
  if (!name) return null;
  const kind = pilihan(d.kind, KINDS, "nominal") as "nominal" | "paket" | "tagihan";
  const min = angka(d.number_min, 1, 40, 8);
  const max = angka(d.number_max, min, 40, Math.max(min, 16));
  const sample = d.bill_sample == null || d.bill_sample === "" ? null : angka(d.bill_sample, 0, 1e12, 0);
  return {
    slug: slugify(typeof d.slug === "string" && d.slug ? d.slug : name),
    name,
    icon: pilihan(d.icon, ICONS, "phone"),
    description: text(d.description, 300),
    tile_note: text(d.tile_note, 80),
    kind,
    number_label: text(d.number_label, 60, "Nomor Tujuan"),
    number_ph: text(d.number_ph, 60),
    number_min: min,
    number_max: max,
    provider_label: text(d.provider_label, 60, "Pilih Penyedia"),
    item_label: text(d.item_label, 60, "Pilih Nominal"),
    bill: objekBill(d.bill),
    bill_sample: kind === "tagihan" ? sample : null,
    sort: angka(d.sort, 0, 9999, 99),
    active: d.active !== false,
    updated_at: new Date().toISOString(),
  };
}

function barisProvider(d: Record<string, unknown>) {
  const name = text(d.name, 60);
  const category_slug = slugify(text(d.category_slug, 60));
  if (!name || !category_slug) return null;
  const id = Number(d.id);
  return {
    ...(Number.isFinite(id) && id > 0 ? { id } : {}),
    category_slug,
    name,
    sort: angka(d.sort, 0, 9999, 99),
    active: d.active !== false,
    updated_at: new Date().toISOString(),
  };
}

function barisItem(d: Record<string, unknown>) {
  const name = text(d.name, 80);
  const provider_id = Number(d.provider_id);
  if (!name || !Number.isFinite(provider_id) || provider_id <= 0) return null;
  const id = Number(d.id);
  const featured = d.featured === true;
  return {
    ...(Number.isFinite(id) && id > 0 ? { id } : {}),
    provider_id,
    name,
    note: text(d.note, 160),
    value: angka(d.value, 0, 1e12, 0),
    price: angka(d.price, 0, 1e12, 0),
    featured,
    /* Hanya item unggulan yang bisa muncul di kartu beranda, jadi labelnya
       dibersihkan begitu tanda unggulan dilepas. */
    card_label: featured ? text(d.card_label, 60) : "",
    sort: angka(d.sort, 0, 9999, 99),
    active: d.active !== false,
    updated_at: new Date().toISOString(),
  };
}

/* Kode metode adalah primary key dan tidak boleh "diperhalus" seperti slug:
   VA_BCA harus tetap VA_BCA. Hanya karakter aneh yang diganti garis bawah. */
const kode = (v: string) =>
  v
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

function barisMethod(d: Record<string, unknown>) {
  const name = text(d.name, 60);
  if (!name) return null;
  const code = kode(text(d.code, 40) || name) || "METODE";
  return {
    code,
    name,
    note: text(d.note, 80),
    kind: pilihan(d.kind, METHOD_KINDS, "va") as "qris" | "va" | "wallet",
    fee: angka(d.fee, 0, 1e9, 0),
    prefix: text(d.prefix, 12),
    icon: text(d.icon, 20, "card"),
    sort: angka(d.sort, 0, 9999, 99),
    active: d.active !== false,
  };
}

/* ----------------------------------------------------------------- GET -- */

async function raw(sb: SupabaseClient) {
  const [cats, providers, items, methods, settings] = await Promise.all([
    sb.from("catalog_categories").select("*").order("sort").order("name"),
    sb.from("catalog_providers").select("*").order("sort").order("name"),
    sb.from("catalog_items").select("*").order("sort").order("id"),
    sb.from("payment_methods").select("*").order("sort").order("name"),
    sb.from("catalog_settings").select("*").order("key"),
  ]);
  for (const r of [cats, providers, items, methods, settings]) {
    if (r.error) throw new Error(r.error.message);
  }
  return {
    cats: cats.data ?? [],
    providers: providers.data ?? [],
    items: items.data ?? [],
    methods: methods.data ?? [],
    settings: settings.data ?? [],
    icons: ICONS,
    kinds: KINDS,
    methodKinds: METHOD_KINDS,
  };
}

export async function GET() {
  await connection();
  if (!(await authed())) return fail("unauthorized", 401);
  const sb = server();
  if (!sb) return fail("not-configured", 503);
  try {
    return json({ ok: true, ...(await raw(sb)) });
  } catch {
    return fail("read-failed", 502);
  }
}

/* ---------------------------------------------------------------- POST -- */

export async function POST(req: NextRequest) {
  await connection();
  if (!(await authed())) return fail("unauthorized", 401);
  const sb = server();
  if (!sb) return fail("not-configured", 503);

  const body = (await req.json().catch(() => null)) as
    | { entity?: unknown; op?: unknown; data?: unknown }
    | null;
  const entity = ENTITIES.includes(body?.entity as Entity) ? (body?.entity as Entity) : null;
  const op = body?.op === "hapus" ? "hapus" : body?.op === "simpan" ? "simpan" : null;
  const data = (body?.data ?? {}) as Record<string, unknown>;
  if (!entity || !op) return fail("bad-request", 400);

  /* PostgrestError dari supabase-js — cukup diambil pesannya untuk dibalas. */
  let error: { message: string } | null = null;

  if (op === "hapus") {
    const id = Number(data.id);
    if (entity === "category") {
      const slug = slugify(text(data.slug, 60));
      if (!slug) return fail("bad-request", 400);
      ({ error } = await sb.from("catalog_categories").delete().eq("slug", slug));
    } else if (entity === "provider") {
      if (!Number.isFinite(id)) return fail("bad-request", 400);
      ({ error } = await sb.from("catalog_providers").delete().eq("id", id));
    } else if (entity === "item") {
      if (!Number.isFinite(id)) return fail("bad-request", 400);
      ({ error } = await sb.from("catalog_items").delete().eq("id", id));
    } else if (entity === "method") {
      const code = text(data.code, 40);
      if (!code) return fail("bad-request", 400);
      ({ error } = await sb.from("payment_methods").delete().eq("code", code));
    } else {
      const key = text(data.key, 60);
      if (!key) return fail("bad-request", 400);
      ({ error } = await sb.from("catalog_settings").delete().eq("key", key));
    }
  } else {
    if (entity === "category") {
      const row = barisCategory(data);
      if (!row) return fail("bad-request", 400);
      ({ error } = await sb.from("catalog_categories").upsert(row, { onConflict: "slug" }));
    } else if (entity === "provider") {
      const row = barisProvider(data);
      if (!row) return fail("bad-request", 400);
      /* Update lewat id (nama boleh berubah), insert tanpa id. Kolom id bertipe
         identity sehingga tidak boleh ikut dikirim saat update. */
      const { id, ...patch } = row;
      const { error: err } =
        id === undefined
          ? await sb.from("catalog_providers").insert(row)
          : await sb.from("catalog_providers").update(patch).eq("id", id);
      error = err ?? null;
    } else if (entity === "item") {
      const row = barisItem(data);
      if (!row) return fail("bad-request", 400);
      const { id, ...patch } = row;
      const { error: err } =
        id === undefined
          ? await sb.from("catalog_items").insert(row)
          : await sb.from("catalog_items").update(patch).eq("id", id);
      error = err ?? null;
    } else if (entity === "method") {
      const row = barisMethod(data);
      if (!row) return fail("bad-request", 400);
      ({ error } = await sb.from("payment_methods").upsert(row, { onConflict: "code" }));
    } else {
      const key = text(data.key, 60);
      if (!key) return fail("bad-request", 400);
      const value = typeof data.value === "string" ? jsonCoba(data.value) : data.value;
      if (value === undefined) return fail("bad-request", 400);
      ({ error } = await sb
        .from("catalog_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" }));
    }
  }

  if (error) return json({ ok: false, code: "write-failed", detail: error.message }, 502);

  /* Halaman publik memakai cache bertag `katalog`. `{ expire: 0 }` dipilih
     supaya permintaan berikutnya mengambil data baru (bukan menyajikan versi
     lama dulu): admin yang baru mengubah harga harus langsung melihat
     hasilnya. updateTag tidak bisa dipakai di sini karena hanya tersedia di
     Server Function. */
  revalidateTag(KATALOG_TAG, { expire: 0 });

  try {
    return json({ ok: true, ...(await raw(sb)) });
  } catch {
    return json({ ok: true, write: "ok", code: "read-failed" }, 200);
  }
}

/** Nilai setelan boleh dikirim sebagai teks JSON ("1500", "\"Pulsa\""). */
function jsonCoba(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
