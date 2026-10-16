import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";
import { loadCatalog } from "@/lib/catalog.server";
import { JsonLd, SITE_DESCRIPTION, layananLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "VENCORAGO — Top Up & Bayar Tagihan",
  description: SITE_DESCRIPTION,
  path: "/",
});

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/">) {
  const sp = await props.searchParams;
  /* Katalog datang dari Supabase (lib/catalog.server.ts), bukan dari konstanta
     di kode: kategori, nominal, harga, metode bayar, dan biaya admin semuanya
     bisa diubah dari /admin/produk (produk + harga) dan /admin/katalog
     (kategori, penyedia, metode) tanpa deploy ulang. */
  const catalog = await loadCatalog();
  return (
    <>
      {/* Daftar layanan beserta tautan kategorinya: crawler dan AI jadi tahu
          cakupan katalog tanpa menebak dari kartu yang tampil di layar. */}
      <JsonLd data={layananLd(catalog.cats)} />
      <HomeView
        catalog={catalog}
        k={one(sp.k)}
        h={one(sp.h)}
        p={one(sp.p)}
        no={one(sp.no)}
      />
    </>
  );
}
