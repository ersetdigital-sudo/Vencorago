/* Akses foto QRIS di Supabase Storage lewat route server `/api/qris`.
   Browser tidak menyimpan kredensial Supabase sama sekali — hanya menerima
   URL publik hasil kerja server (unggah/hapus dijaga PIN). */

export type QrisState = {
  /** env Supabase (URL + key) sudah terisi di server */
  configured: boolean;
  /** URL publik foto QRIS aktif; null = belum ada foto (pakai QR placeholder) */
  url: string | null;
  /** false = bucket `qris` belum bisa diakses (SQL setup belum dijalankan) */
  bucketOk?: boolean;
};

export async function fetchQris(): Promise<QrisState> {
  try {
    const r = await fetch("/api/qris", { cache: "no-store" });
    if (!r.ok) return { configured: false, url: null };
    const j = (await r.json()) as Partial<QrisState>;
    return {
      configured: j.configured === true,
      url: typeof j.url === "string" ? j.url : null,
      bucketOk: j.bucketOk,
    };
  } catch {
    return { configured: false, url: null };
  }
}
