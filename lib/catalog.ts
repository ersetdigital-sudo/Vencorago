/* ============================================================================
   Bentuk katalog VENCORAGO + aturan yang dipakai halaman publik.

   File ini sengaja TANPA import server (tidak ada next/cache atau supabase-js)
   supaya aman dipakai komponen client. Pengambilan datanya ada di
   `lib/catalog.server.ts`.

   Nama pendek (i/d/nl/ph/…) dipertahankan dari katalog statis yang dulu ada di
   components/produk/data.ts supaya markup + CSS halaman publik tidak berubah.
   ========================================================================== */

export type Kind = "nominal" | "paket" | "tagihan";

/** Satu produk jual: `v` nominal/nilai, `p` harga yang benar-benar dibayar. */
export type Item = { n: string; d: string; v: number; p: number };

export type Cat = {
  /** Nama kategori — ini juga nilai kolom `cat` di tabel transaksi. */
  n: string;
  i: string;
  d: string;
  /** Satu baris untuk kartu kategori di beranda. */
  tile: string;
  nl: string;
  ph: string;
  kind: Kind;
  opLabel: string;
  nomLabel: string;
  /** Rentang panjang nomor tujuan yang diterima, dipakai checkNumber(). */
  len: [number, number];
  /** Baris info kategori tagihan ("Contoh tagihan": "Rp 87.500", …). */
  bill?: Record<string, string>;
  /** Contoh nominal tagihan, dipakai beranda sebelum tagihan asli diketahui. */
  sample?: number;
  ops: Record<string, Item[]>;
};

export type Method = {
  code: string;
  name: string;
  note: string;
  fee: number;
  kind: "qris" | "va" | "wallet";
  /** Awalan nomor Virtual Account (kosong untuk metode non-VA). */
  prefix: string;
  icon: string;
};

/** Kartu "Produk Pilihan" di beranda, berasal dari item yang ditandai unggulan. */
export type Featured = {
  icon: string;
  label: string;
  value: number;
  price: number;
  cat: string;
  provider: string;
};

export type Catalog = {
  /** false = katalog tidak bisa dibaca: halaman menampilkan pesan, bukan data karangan. */
  ok: boolean;
  error: string;
  cats: Cat[];
  methods: Method[];
  featured: Featured[];
  adminFee: number;
  defaultCat: string;
};

export const KATALOG_TAG = "katalog";

export const KATALOG_KOSONG: Catalog = {
  ok: false,
  error: "",
  cats: [],
  methods: [],
  featured: [],
  adminFee: 0,
  defaultCat: "",
};

/* ------------------------------------------------------------------ helper -- */

export const normalizeNumber = (raw: string) => {
  const n = raw.replace(/\D/g, "");
  return n.startsWith("62") ? "0" + n.slice(2) : n;
};

export const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export const catOf = (catalog: Catalog, name: string | null | undefined) =>
  catalog.cats.find((c) => c.n === name);

/** Kategori yang dipakai halaman: yang diminta → default dari database → yang pertama. */
export function pickCat(catalog: Catalog, name: string | null | undefined): Cat | undefined {
  return catOf(catalog, name) ?? catOf(catalog, catalog.defaultCat) ?? catalog.cats[0];
}

export const methodOf = (catalog: Catalog, name: string | null | undefined) =>
  catalog.methods.find((m) => m.name === name);

/** Nama penyedia di satu kategori (urut sesuai `sort` di database). */
export const providerNames = (c: Cat) => Object.keys(c.ops);

/** Nominal yang benar-benar ada di katalog (gabungan penyedia), urut naik. */
export function nominalsOf(c: Cat): number[] {
  const set = new Set<number>();
  for (const items of Object.values(c.ops)) for (const it of items) if (it.v) set.add(it.v);
  return [...set].sort((a, b) => a - b);
}

/** Harga jual untuk sebuah nominal. null kalau nominalnya tidak ada di katalog. */
export function priceOf(c: Cat, value: number): number | null {
  for (const items of Object.values(c.ops)) {
    const hit = items.find((it) => it.v === value);
    if (hit) return hit.p;
  }
  return null;
}

/** Biaya metode tertentu (0 kalau metodenya tidak ada di katalog). */
export const feeOf = (catalog: Catalog, name: string | null | undefined) =>
  methodOf(catalog, name)?.fee ?? 0;

/** Validasi nomor tujuan. Mengembalikan pesan error, atau null kalau valid. */
export function checkNumber(c: Cat | undefined, raw: string): string | null {
  if (!c) return "Pilih produk dulu";
  const n = normalizeNumber(raw);
  if (!n) return c.nl + " belum diisi";
  const [min, max] = c.len;
  if (n.length < min || n.length > max)
    return min === max ? `${c.nl} harus ${min} digit` : `${c.nl} harus ${min}–${max} digit`;
  if (c.nl.startsWith("Nomor HP") && !n.startsWith("08")) return "Nomor HP harus diawali 08";
  return null;
}

/**
 * Yang dibayar pelanggan = harga produk + biaya metode + biaya admin.
 * `harga` adalah harga produk: untuk kategori `nominal`, h yang dikirim halaman
 * produk adalah nominal sehingga harganya dicari di katalog; untuk kategori
 * `paket` dan `tagihan`, h sudah berupa harga/tagihan itu sendiri.
 */
export function totalOf(
  catalog: Catalog,
  h: number,
  catName: string | null | undefined,
  methodName: string | null | undefined
) {
  if (!h) return { harga: 0, total: 0 };
  const c = catOf(catalog, catName);
  const harga = c && c.kind === "nominal" ? (priceOf(c, h) ?? h) : h;
  return { harga, total: harga + feeOf(catalog, methodName) + catalog.adminFee };
}
