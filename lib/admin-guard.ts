import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/* Pemeriksaan otoritatif untuk halaman admin (Server Component). `proxy.ts`
   hanya jalur cepat supaya UI tidak sempat berkedip; keputusan akhir ada di
   sini, dan ini yang tetap berlaku kalau proxy dilewati. */
export async function requireAdmin(): Promise<void> {
  /* Prerender berhenti di sini: validasi sesi (yang membaca waktu kedaluwarsa)
     baru dijalankan saat request, sesuai doc Next 16 untuk `Date.now()`. */
  await connection();
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");
}
