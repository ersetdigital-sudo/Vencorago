import { cacheLife, cacheTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  KATALOG_KOSONG,
  KATALOG_TAG,
  type Cat,
  type Catalog,
  type Featured,
  type Item,
  type Kind,
  type Method,
} from "@/lib/catalog";

/* ============================================================================
   Pengambilan katalog dari Supabase (server saja).

   Baca memakai publishable key: RLS katalog mengizinkan SELECT untuk anon.
   Tulis TIDAK mungkin dari sini — tidak ada policy insert/update/delete, jadi
   perubahan hanya lewat /api/catalog (service role + sesi admin).

   Hasilnya di-cache dengan tag `katalog`; setiap perubahan dari panel admin
   memanggil revalidateTag('katalog') sehingga halaman publik langsung ikut
   berubah tanpa deploy ulang.
   ========================================================================== */

type CatRow = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tile_note: string;
  kind: Kind;
  number_label: string;
  number_ph: string;
  number_min: number;
  number_max: number;
  provider_label: string;
  item_label: string;
  bill: Record<string, string> | null;
  bill_sample: number | null;
  active: boolean;
};

type ProvRow = { id: number; category_slug: string; name: string; sort: number; active: boolean };

type ItemRow = {
  id: number;
  provider_id: number;
  name: string;
  note: string;
  value: number;
  price: number;
  featured: boolean;
  card_label: string;
  sort: number;
  active: boolean;
};

type MethodRow = {
  code: string;
  name: string;
  note: string;
  kind: "qris" | "va" | "wallet";
  fee: number;
  prefix: string;
  icon: string;
  active: boolean;
};

const angka = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Katalog publik dari baris mentah Supabase. Dipakai halaman maupun panel admin. */
export function susunKatalog(
  catRows: CatRow[],
  provRows: ProvRow[],
  itemRows: ItemRow[],
  methodRows: MethodRow[],
  setting: Record<string, unknown>
): Pick<Catalog, "cats" | "methods" | "featured" | "adminFee" | "defaultCat"> {
  const itemsPerProvider = new Map<number, ItemRow[]>();
  for (const it of itemRows) {
    const list = itemsPerProvider.get(it.provider_id);
    if (list) list.push(it);
    else itemsPerProvider.set(it.provider_id, [it]);
  }

  const featured: Featured[] = [];
  const cats: Cat[] = catRows.map((c) => {
    const ops: Record<string, Item[]> = {};
    for (const p of provRows.filter((row) => row.category_slug === c.slug)) {
      const list = (itemsPerProvider.get(p.id) ?? []).sort((a, b) => a.sort - b.sort || a.id - b.id);
      ops[p.name] = list.map((it) => ({ n: it.name, d: it.note, v: angka(it.value), p: angka(it.price) }));
      for (const it of list) {
        if (!it.featured || !it.card_label) continue;
        featured.push({
          icon: c.icon,
          label: it.card_label,
          value: angka(it.value),
          price: angka(it.price),
          cat: c.name,
          provider: p.name,
        });
      }
    }
    const bill =
      c.bill && typeof c.bill === "object" ? Object.fromEntries(Object.entries(c.bill)) : undefined;
    return {
      n: c.name,
      i: c.icon,
      d: c.description,
      tile: c.tile_note,
      nl: c.number_label,
      ph: c.number_ph,
      kind: c.kind,
      opLabel: c.provider_label,
      nomLabel: c.item_label,
      len: [angka(c.number_min, 8), angka(c.number_max, 16)] as [number, number],
      bill,
      sample: c.bill_sample == null ? undefined : angka(c.bill_sample),
      ops,
    };
  });

  const methods: Method[] = methodRows.map((m) => ({
    code: m.code,
    name: m.name,
    note: m.note,
    fee: angka(m.fee),
    kind: m.kind,
    prefix: m.prefix,
    icon: m.icon,
  }));

  /* Kartu unggulan mengikuti urutan kategori di UI, bukan urutan penyisipan. */
  const urutanCat = new Map(catRows.map((c, i) => [c.name, i]));
  featured.sort((a, b) => (urutanCat.get(a.cat) ?? 0) - (urutanCat.get(b.cat) ?? 0));

  return {
    cats,
    methods,
    featured,
    adminFee: angka(setting.admin_fee, 0),
    defaultCat: typeof setting.default_category === "string" ? setting.default_category : "",
  };
}

/** Klien publishable key untuk baca katalog (RLS: SELECT bebas, tulis tertutup). */
export function klienPublik(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type KatalogMentah = {
  cats: (CatRow & { sort: number })[];
  providers: (ProvRow & { sort: number })[];
  items: (ItemRow & { sort: number })[];
  methods: (MethodRow & { sort: number })[];
  settings: { key: string; value: unknown }[];
};

/** Semua baris katalog apa adanya — dipakai panel admin (termasuk yang nonaktif). */
export async function bacaMentah(sb: SupabaseClient): Promise<KatalogMentah> {
  const [c, p, i, m, st] = await Promise.all([
    sb.from("catalog_categories").select("*").order("sort").order("name"),
    sb.from("catalog_providers").select("*").order("sort").order("name"),
    sb.from("catalog_items").select("*").order("sort").order("id"),
    sb.from("payment_methods").select("*").order("sort").order("name"),
    sb.from("catalog_settings").select("key, value"),
  ]);
  for (const r of [c, p, i, m, st]) if (r.error) throw new Error(r.error.message);
  return {
    cats: (c.data ?? []) as KatalogMentah["cats"],
    providers: (p.data ?? []) as KatalogMentah["providers"],
    items: (i.data ?? []) as KatalogMentah["items"],
    methods: (m.data ?? []) as KatalogMentah["methods"],
    settings: (st.data ?? []) as { key: string; value: unknown }[],
  };
}

/** Katalog untuk halaman publik: hanya baris aktif, di-cache sampai di-revalidate. */
export async function loadCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag(KATALOG_TAG);

  const sb = klienPublik();
  if (!sb) {
    return {
      ...KATALOG_KOSONG,
      error: "Katalog belum terhubung: env Supabase belum di-set di server ini.",
    };
  }

  try {
    const mentah = await bacaMentah(sb);
    const setting: Record<string, unknown> = {};
    for (const row of mentah.settings) setting[row.key] = row.value;
    return {
      ok: true,
      error: "",
      ...susunKatalog(
        mentah.cats.filter((r) => r.active),
        mentah.providers.filter((r) => r.active),
        mentah.items.filter((r) => r.active),
        mentah.methods.filter((r) => r.active),
        setting
      ),
    };
  } catch {
    return { ...KATALOG_KOSONG, error: "Katalog sedang tidak bisa dibaca dari Supabase." };
  }
}
