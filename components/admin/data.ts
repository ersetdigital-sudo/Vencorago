/* Bentuk record order + format angka/tanggal untuk panel admin.

   Sumber datanya tabel `transactions` di Supabase (lewat `/api/tx`, lihat
   `useTx`). `readLocal` hanya dipakai untuk memindahkan sisa order yang masih
   tersimpan di perangkat ini saat dashboard pertama dibuka. Tidak ada data
   contoh — kalau belum ada order, daftarnya memang kosong. */

export type TxStatus = "success" | "pending" | "expired";

export type Tx = {
  inv: string;
  prod: string;
  cat: string;
  no: string;
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

export function readLocal(): Tx[] {
  if (typeof window === "undefined") return [];
  try {
    return Object.values(JSON.parse(localStorage.getItem("vcr_tx") || "{}")) as Tx[];
  } catch {
    return [];
  }
}
