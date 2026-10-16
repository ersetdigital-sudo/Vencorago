import type { Metadata } from "next";
import ProdukView from "@/components/produk/ProdukView";
import { pickCat } from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog.server";

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

/* `op` dan `h` datang dari kartu produk di beranda, supaya halaman detail
   benar-benar terbuka pada operator + nominal yang tadi dipilih. */
async function params(props: PageProps<"/produk">) {
  const sp = await props.searchParams;
  return { k: one(sp.k), op: one(sp.op), h: one(sp.h) };
}

export async function generateMetadata(props: PageProps<"/produk">): Promise<Metadata> {
  const { k } = await params(props);
  const catalog = await loadCatalog();
  return { title: (pickCat(catalog, k)?.n ?? "Produk") + " — VENCORAGO" };
}

export default async function Page(props: PageProps<"/produk">) {
  const { k, op, h } = await params(props);
  const catalog = await loadCatalog();
  const cat = pickCat(catalog, k);
  return (
    <ProdukView
      key={`${cat?.n ?? k}|${op}|${h}`}
      catalog={catalog}
      cat={cat}
      op={op}
      h={h}
    />
  );
}
