export const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export type Item = { n: string; d: string; v: number; p: number };
export type Cat = {
  i: string;
  d: string;
  nl: string;
  ph: string;
  bill?: Record<string, string>;
  ops: Record<string, Item[]>;
};

export const N = (a: number[], m = 1000): Item[] =>
  a.map((v) => ({ n: rp(v), v, p: v + (v < 2e4 ? m : 500), d: "Masuk instan ke nomor tujuan" }));

export const K: Record<string, Cat> = {
  Pulsa: {
    i: "phone",
    d: "Isi pulsa semua operator, masuk dalam hitungan detik.",
    nl: "Nomor HP",
    ph: "08xxxxxxxxxx",
    ops: {
      Telkomsel: N([5e3, 1e4, 2e4, 25e3, 5e4, 1e5]),
      Indosat: N([5e3, 1e4, 25e3, 5e4, 1e5]),
      XL: N([5e3, 1e4, 25e3, 5e4, 1e5]),
      Tri: N([5e3, 1e4, 2e4, 5e4, 1e5]),
      Smartfren: N([1e4, 2e4, 5e4, 1e5]),
    },
  },
  "Paket Data": {
    i: "wifi",
    d: "Kuota internet hemat untuk semua operator.",
    nl: "Nomor HP",
    ph: "08xxxxxxxxxx",
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
    ops: { "PLN Prabayar": N([2e4, 5e4, 1e5, 2e5, 5e5, 1e6]) },
  },
  "E-Wallet": {
    i: "wallet",
    d: "Top up saldo dompet digital favorit kamu.",
    nl: "Nomor HP terdaftar",
    ph: "08xxxxxxxxxx",
    ops: {
      DANA: N([2e4, 5e4, 1e5, 2e5, 5e5]),
      OVO: N([2e4, 5e4, 1e5, 2e5]),
      GoPay: N([2e4, 5e4, 1e5, 2e5]),
      ShopeePay: N([2e4, 5e4, 1e5]),
    },
  },
  PDAM: {
    i: "drop",
    d: "Bayar tagihan air PDAM di berbagai daerah.",
    nl: "ID Pelanggan PDAM",
    ph: "Nomor pelanggan",
    bill: { "Contoh tagihan": "Rp 87.500", "Jatuh tempo": "Tanggal 20 setiap bulan" },
    ops: { "PDAM Jakarta": [], "PDAM Surabaya": [], "PDAM Bandung": [], "PDAM Medan": [] },
  },
  "BPJS Kesehatan": {
    i: "shield",
    d: "Bayar iuran BPJS Kesehatan untuk seluruh anggota keluarga.",
    nl: "Nomor VA Keluarga",
    ph: "8888xxxxxxxxxxx",
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
    bill: { "Contoh tagihan": "Rp 385.000", "Cek tagihan": "Otomatis setelah input" },
    ops: { IndiHome: [], "First Media": [], MyRepublic: [], Biznet: [] },
  },
  Multifinance: {
    i: "bank",
    d: "Bayar angsuran kendaraan dan pinjaman.",
    nl: "Nomor Kontrak",
    ph: "Nomor kontrak",
    bill: { "Contoh angsuran": "Rp 1.250.000", "Konfirmasi": "Real-time ke leasing" },
    ops: { "Adira Finance": [], FIF: [], BAF: [], "WOM Finance": [] },
  },
};

export const CATS = Object.keys(K);
export const DEFAULT_CAT = "Pulsa";
