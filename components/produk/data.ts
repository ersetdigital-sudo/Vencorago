export const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export type Item = { n: string; d: string; v: number; p: number };

/* Jenis transaksi menentukan pola UI-nya:
   - nominal : pelanggan memilih nominal tetap (pulsa, token listrik, top up e-wallet)
   - paket   : pelanggan memilih paket dengan benefit & masa aktif (paket data)
   - tagihan : pelanggan memasukkan ID pelanggan, nominalnya menyusul (PDAM, BPJS,
               internet & TV, multifinance) */
export type Kind = "nominal" | "paket" | "tagihan";

export type Cat = {
  i: string;
  d: string;
  /* Label input nomor tujuan (nl) + placeholder-nya (ph). */
  nl: string;
  ph: string;
  kind: Kind;
  /* Judul section pilihan penyedia. Kalau kategorinya cuma punya satu penyedia,
     baris penyedia tidak dirender sehingga judulnya memakai label pilihan
     berikutnya (nomLabel) supaya tidak ada judul yang menggantung. */
  opLabel: string;
  nomLabel: string;
  /* Rentang panjang nomor tujuan yang diterima, dipakai checkNumber(). */
  len: [number, number];
  bill?: Record<string, string>;
  ops: Record<string, Item[]>;
};

export const N = (a: number[], m = 1000): Item[] =>
  a.map((v) => ({ n: rp(v), v, p: v + (v < 2e4 ? m : 500), d: "Masuk instan ke nomor tujuan" }));

/* ----------------------------------------------------------------------------
   Tangga nominal.

   Ini daftar TINGKAT APLIKASI (placeholder), bukan hasil verifikasi supplier:
   proyek ini belum terhubung ke feed produk mana pun, jadi tidak ada SKU,
   product ID, harga modal, atau harga promo di sini. Saat integrasi tersedia,
   ganti konstanta di bawah dengan hasil tarik katalog supplier — jangan tambah
   nominal langsung di `ops` supaya tetap satu sumber.
   ---------------------------------------------------------------------------- */

/* Top up dompet digital. Dipakai semua provider e-wallet supaya tidak ada
   nominal yang tersedia di satu provider tapi hilang di provider lain. */
export const NOMINAL_TOPUP = [
  1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 75e3, 1e5, 15e4, 2e5, 25e4, 3e5, 4e5, 5e5, 1e6,
];

/* Nominal pulsa prabayar. */
export const NOMINAL_PULSA = [5e3, 1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 75e3, 1e5];

/* Denominasi token listrik prabayar (angka bulat, bukan tangga top up). */
export const NOMINAL_TOKEN = [2e4, 5e4, 1e5, 2e5, 5e5, 1e6];

export const K: Record<string, Cat> = {
  Pulsa: {
    i: "phone",
    d: "Isi pulsa semua operator, masuk dalam hitungan detik.",
    nl: "Nomor HP",
    ph: "08xxxxxxxxxx",
    kind: "nominal",
    opLabel: "Pilih Operator",
    nomLabel: "Pilih Nominal Pulsa",
    len: [10, 13],
    ops: {
      Telkomsel: N(NOMINAL_PULSA),
      Indosat: N(NOMINAL_PULSA),
      XL: N(NOMINAL_PULSA),
      Tri: N(NOMINAL_PULSA),
      Smartfren: N(NOMINAL_PULSA),
    },
  },
  "Paket Data": {
    i: "wifi",
    d: "Kuota internet hemat untuk semua operator.",
    nl: "Nomor HP",
    ph: "08xxxxxxxxxx",
    kind: "paket",
    opLabel: "Pilih Operator",
    nomLabel: "Pilih Paket Data",
    len: [10, 13],
    ops: {
      Telkomsel: [
        { n: "Kuota 7 GB", d: "30 hari, semua jaringan", v: 5e4, p: 51e3 },
        { n: "Kuota 15 GB", d: "30 hari + 2 GB malam", v: 85e3, p: 86e3 },
        { n: "Kuota 30 GB", d: "30 hari, 4G/5G", v: 13e4, p: 131e3 },
      ],
      Indosat: [
        { n: "Freedom 9 GB", d: "30 hari", v: 45e3, p: 46e3 },
        { n: "Freedom 20 GB", d: "30 hari", v: 8e4, p: 81e3 },
        { n: "Freedom Unlimited", d: "30 hari, FUP harian", v: 1e5, p: 101e3 },
      ],
      XL: [
        { n: "Xtra Combo 10 GB", d: "30 hari + nelpon", v: 6e4, p: 61e3 },
        { n: "Xtra Combo 25 GB", d: "30 hari + nelpon", v: 11e4, p: 111e3 },
      ],
    },
  },
  "Token PLN": {
    i: "zap",
    d: "Beli token listrik prabayar, token langsung tampil setelah bayar.",
    nl: "Nomor Meter / ID Pelanggan",
    ph: "11 atau 12 digit",
    kind: "nominal",
    opLabel: "Pilih Layanan",
    nomLabel: "Pilih Nominal Token",
    len: [11, 12],
    ops: { "PLN Prabayar": N(NOMINAL_TOKEN) },
  },
  "E-Wallet": {
    i: "wallet",
    d: "Isi saldo dompet digital dengan mudah dan cepat.",
    nl: "Nomor HP terdaftar",
    ph: "08xxxxxxxxxx",
    kind: "nominal",
    opLabel: "Pilih Dompet Digital",
    nomLabel: "Pilih nominal top up",
    len: [10, 13],
    ops: {
      DANA: N(NOMINAL_TOPUP),
      OVO: N(NOMINAL_TOPUP),
      GoPay: N(NOMINAL_TOPUP),
      ShopeePay: N(NOMINAL_TOPUP),
    },
  },
  PDAM: {
    i: "drop",
    d: "Bayar tagihan air PDAM di berbagai daerah.",
    nl: "ID Pelanggan PDAM",
    ph: "Nomor pelanggan",
    kind: "tagihan",
    opLabel: "Pilih Wilayah PDAM",
    nomLabel: "",
    len: [8, 12],
    bill: { "Contoh tagihan": "Rp 87.500", "Jatuh tempo": "Tanggal 20 setiap bulan" },
    ops: { "PDAM Jakarta": [], "PDAM Surabaya": [], "PDAM Bandung": [], "PDAM Medan": [] },
  },
  "BPJS Kesehatan": {
    i: "shield",
    d: "Bayar iuran BPJS Kesehatan untuk seluruh anggota keluarga.",
    nl: "Nomor VA Keluarga",
    ph: "8888xxxxxxxxxxx",
    kind: "tagihan",
    opLabel: "Pilih Layanan",
    nomLabel: "",
    len: [11, 16],
    bill: {
      "Kelas 1": "Rp 150.000 / orang",
      "Kelas 2": "Rp 100.000 / orang",
      "Kelas 3": "Rp 42.000 / orang",
      "Bayar sampai": "12 bulan sekaligus",
    },
    ops: { "BPJS Kesehatan": [] },
  },
  "Internet & TV": {
    i: "tv",
    d: "Bayar tagihan internet rumah dan TV berbayar.",
    nl: "Nomor Pelanggan",
    ph: "ID pelanggan",
    kind: "tagihan",
    opLabel: "Pilih Penyedia",
    nomLabel: "",
    len: [8, 16],
    bill: { "Contoh tagihan": "Rp 385.000", "Cek tagihan": "Otomatis setelah input" },
    ops: { IndiHome: [], "First Media": [], MyRepublic: [], Biznet: [] },
  },
  Multifinance: {
    i: "bank",
    d: "Bayar angsuran kendaraan dan pinjaman.",
    nl: "Nomor Kontrak",
    ph: "Nomor kontrak",
    kind: "tagihan",
    opLabel: "Pilih Perusahaan Pembiayaan",
    nomLabel: "",
    len: [8, 16],
    bill: { "Contoh angsuran": "Rp 1.250.000", "Konfirmasi": "Real-time ke leasing" },
    ops: { "Adira Finance": [], FIF: [], BAF: [], "WOM Finance": [] },
  },
};

export const CATS = Object.keys(K);
export const DEFAULT_CAT = "Pulsa";

/* Nomor tujuan disimpan dalam bentuk 0-prefix: "62812…" dinormalkan jadi "0812…"
   supaya halaman produk dan checkout beranda memakai nilai yang sama. */
export const normalizeNumber = (raw: string) => {
  const n = raw.replace(/\D/g, "");
  return n.startsWith("62") ? "0" + n.slice(2) : n;
};

/* Satu aturan validasi untuk semua halaman. Sebelumnya halaman produk hanya
   memeriksa "minimal 8 digit" sehingga format yang diterima berbeda antar
   halaman. Mengembalikan pesan error, atau null kalau valid. */
export function checkNumber(cat: string, raw: string): string | null {
  const c = K[cat];
  if (!c) return "Pilih produk dulu";
  const n = normalizeNumber(raw);
  if (!n) return c.nl + " belum diisi";
  const [min, max] = c.len;
  if (n.length < min || n.length > max)
    return min === max ? `${c.nl} harus ${min} digit` : `${c.nl} harus ${min}–${max} digit`;
  if (c.nl.startsWith("Nomor HP") && !n.startsWith("08")) return "Nomor HP harus diawali 08";
  return null;
}

/* Daftar nominal yang benar-benar ada di katalog, gabungan semua penyedia pada
   satu kategori. Dipakai beranda supaya pilihan cepatnya tidak menyimpang dari
   halaman produk. */
export function nominalsOf(cat: string): number[] {
  const c = K[cat];
  if (!c) return [];
  const set = new Set<number>();
  for (const items of Object.values(c.ops)) for (const it of items) if (it.v) set.add(it.v);
  return [...set].sort((a, b) => a - b);
}
