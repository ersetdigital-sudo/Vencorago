/* ============================================================================
   Bentuk data GET /api/catalog yang dipakai panel admin.

   Dipakai bersama oleh /admin/katalog (editor struktur katalog) dan
   /admin/produk (editor produk + kartu beranda) supaya keduanya membaca
   respons yang sama dengan tipe yang sama.
   ========================================================================== */

export type Kat = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tile_note: string;
  kind: string;
  number_label: string;
  number_ph: string;
  number_min: number;
  number_max: number;
  provider_label: string;
  item_label: string;
  bill: Record<string, string> | null;
  bill_sample: number | null;
  sort: number;
  active: boolean;
};

export type Penyedia = { id: number; category_slug: string; name: string; sort: number; active: boolean };

export type Item = {
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

export type Metode = {
  code: string;
  name: string;
  note: string;
  kind: string;
  fee: number;
  prefix: string;
  icon: string;
  sort: number;
  active: boolean;
};

export type Setelan = { key: string; value: unknown };

export type DataKatalog = {
  ok: boolean;
  code?: string;
  detail?: string;
  cats: Kat[];
  providers: Penyedia[];
  items: Item[];
  methods: Metode[];
  settings: Setelan[];
  icons: string[];
  kinds: string[];
  methodKinds: string[];
};

export type Entitas = "category" | "provider" | "item" | "method" | "setting";

/* --------------------------------------------------------------- bantuan -- */

/**
 * Alasan sebuah produk unggulan tidak sampai ke beranda. Beranda hanya
 * merender item aktif yang punya label kartu, di penyedia aktif, di kategori
 * aktif (lihat lib/catalog.server.ts → susunKatalog + loadCatalog).
 * Mengembalikan "" kalau produknya memang tampil.
 */
export function alasanTidakTampil(
  it: Item,
  penyedia: Penyedia | undefined,
  kategori: Kat | undefined
): string {
  if (!it.featured) return "Belum dicentang";
  if (!it.card_label) return "Label kartu kosong";
  if (!it.active) return "Produk nonaktif";
  if (!penyedia) return "Penyedia tidak ada";
  if (!penyedia.active) return "Penyedia nonaktif";
  if (!kategori) return "Kategori tidak ada";
  if (!kategori.active) return "Kategori nonaktif";
  return "";
}
