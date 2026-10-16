"use client";

import Link from "next/link";
import Header, { type MenuItem } from "./Header";

/* Dipakai halaman publik kalau katalog tidak bisa dibaca dari Supabase.
   Sengaja menampilkan pesan apa adanya, bukan daftar produk cadangan: katalog
   hanya punya satu sumber (database), jadi salinan di kode tidak pernah ada. */
export default function KatalogKosong({
  s,
  menu,
  pesan,
  title = "Katalog belum bisa dimuat",
}: {
  s: Record<string, string>;
  menu: MenuItem[];
  pesan: string;
  title?: string;
}) {
  return (
    <div className={s.pg}>
      <Header s={s} menu={menu} />
      <main className={s.wrap}>
        <div className={s.card} style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
          <h2>{title}</h2>
          <p style={{ color: "var(--mut, #6b7774)", fontSize: 14, margin: "8px 0 16px" }}>
            {pesan || "Data katalog tidak tersedia saat ini."}
          </p>
          <Link
            href="/"
            style={{ color: "var(--teal)", fontWeight: 600, fontSize: 14 }}
          >
            Coba lagi dari beranda →
          </Link>
        </div>
      </main>
    </div>
  );
}
