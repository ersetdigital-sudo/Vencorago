export type TxStatus = "success" | "pending" | "expired";

export type Tx = {
  inv: string;
  prod: string;
  cat: string;
  no: string;
  name: string;
  pm: string;
  total: number;
  status: "pending" | "success";
  sn: string;
  time: number;
  paid: number | null;
};

export const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const rpShort = (n: number) => {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1).replace(".", ",") + " M";
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1).replace(".", ",") + " jt";
  if (n >= 1_000) return "Rp " + Math.round(n / 1_000) + " rb";
  return rp(n);
};

export function stat(t: Tx): TxStatus {
  if (t.status === "pending" && Date.now() - t.time > 15 * 60e3) return "expired";
  return t.status;
}

export const LBL: Record<TxStatus, string> = {
  success: "Berhasil",
  pending: "Menunggu",
  expired: "Gagal",
};

export const dt = (t: number) =>
  new Date(t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export const dtShort = (t: number) =>
  new Date(t).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

const CATS: [string, string, number, number][] = [
  ["E-Wallet", "Saldo DANA", 100000, 2500],
  ["E-Wallet", "Saldo OVO", 200000, 5000],
  ["Pulsa", "Pulsa Telkomsel", 25000, 1500],
  ["Pulsa", "Pulsa Indosat", 50000, 1500],
  ["Token PLN", "Token PLN", 100000, 0],
  ["Paket Data", "Kuota 15 GB", 85000, 1500],
  ["PDAM", "Tagihan PDAM", 87500, 1500],
  ["BPJS Kesehatan", "Iuran BPJS", 150000, 1500],
  ["Internet & TV", "IndiHome", 385000, 2500],
  ["Multifinance", "Angsuran Adira", 1250000, 2500],
];

const PM = ["QRIS", "Virtual Account BCA", "Virtual Account Mandiri", "DANA"];
const NAMES = [
  "Budi Santoso",
  "Siti Rahma",
  "Andi Pratama",
  "Dewi Lestari",
  "Rizky Maulana",
  "Putri Handayani",
  "Agus Setiawan",
  "Nadia Utami",
];

// Deterministic PRNG so the demo data is stable across reloads and screenshots.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedDemo(count = 128, days = 14): Tx[] {
  const rnd = mulberry32(20260415);
  const out: Tx[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const c = CATS[Math.floor(rnd() * CATS.length)];
    const dayOffset = Math.floor(rnd() * rnd() * days);
    let time = now - dayOffset * 86400e3 - Math.floor(rnd() * 20) * 3600e3 - Math.floor(rnd() * 60) * 60e3;
    const roll = rnd();
    const status: "success" | "pending" = roll < 0.78 ? "success" : "pending";
    // Keep part of the pending rows inside the 15-minute payment window, so the
    // "menunggu" bucket and the header badge show real values.
    if (status === "pending" && rnd() < 0.45) {
      time = now - (2 + Math.floor(rnd() * 10)) * 60e3;
    }
    const total = c[2] + c[3] + 1500;
    out.push({
      inv: "VCR" + String(700000000 + i * 137 + (time % 997)).slice(-9),
      prod: c[1],
      cat: c[0],
      no: "08" + String(1000000000 + Math.floor(rnd() * 8999999999)).slice(0, 10),
      name: NAMES[Math.floor(rnd() * NAMES.length)],
      pm: PM[Math.floor(rnd() * PM.length)],
      total,
      status,
      sn: c[0] === "Token PLN" ? `${1000 + Math.floor(rnd() * 8999)}-${1000 + Math.floor(rnd() * 8999)}-${1000 + Math.floor(rnd() * 8999)}` : "SN" + String(1000000000 + i * 7919).slice(-10),
      time: Math.min(time, now - 60e3),
      paid: status === "success" ? time + 45000 : null,
    });
  }
  return out.sort((a, b) => b.time - a.time);
}

export function readLocal(): Tx[] {
  if (typeof window === "undefined") return [];
  try {
    return Object.values(JSON.parse(localStorage.getItem("vcr_tx") || "{}")) as Tx[];
  } catch {
    return [];
  }
}
