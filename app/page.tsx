import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";
import { loadCatalog } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "VENCORAGO — Top Up & Bayar Tagihan",
};

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
    <HomeView
      catalog={catalog}
      k={one(sp.k)}
      h={one(sp.h)}
      p={one(sp.p)}
      no={one(sp.no)}
    />
  );
}
