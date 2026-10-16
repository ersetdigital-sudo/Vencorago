import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/catalog.server";
import { abs, kategoriPath } from "@/lib/seo";

/* sitemap.xml.

   Isinya hanya URL kanonis: halaman tetap + satu URL per kategori produk.
   `/produk` tanpa parameter tidak dimasukkan karena canonical-nya mengarah ke
   kategori default — URL yang canonical-nya ke halaman lain tidak perlu ada di
   sitemap. Kategorinya dibaca dari katalog Supabase, jadi kategori baru dari
   /admin/katalog langsung ikut terdaftar. */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await loadCatalog();

  const tetap: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    { url: abs("/status"), changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/cara-bayar"), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/bantuan"), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/kontak"), changeFrequency: "yearly", priority: 0.4 },
  ];

  const kategori: MetadataRoute.Sitemap = catalog.cats.map((c) => ({
    url: abs(kategoriPath(c)),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...tetap, ...kategori];
}
