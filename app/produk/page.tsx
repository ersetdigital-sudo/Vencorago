import type { Metadata } from "next";
import ProdukView from "@/components/produk/ProdukView";
import { pickCat } from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog.server";
import {
  JsonLd,
  breadcrumbLd,
  kategoriDescription,
  kategoriPath,
  pageMetadata,
  serviceLd,
} from "@/lib/seo";

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

/* `op` dan `h` datang dari kartu produk di beranda, supaya halaman detail
   benar-benar terbuka pada operator + nominal yang tadi dipilih. */
async function params(props: PageProps<"/produk">) {
  const sp = await props.searchParams;
  return { k: one(sp.k), op: one(sp.op), h: one(sp.h) };
}

/* Title dan description dibuat per kategori — halaman Pulsa, Paket Data, dan
   PDAM masing-masing punya kalimat sendiri berisi penyedia dan harga termurah
   yang sedang berlaku, jadi tidak ada delapan halaman dengan meta kembar.
   canonical-nya juga mengarah ke bentuk ?k= saja (tanpa op/h), supaya kombinasi
   parameter dari kartu beranda tidak jadi halaman duplikat. */
export async function generateMetadata(props: PageProps<"/produk">): Promise<Metadata> {
  const { k } = await params(props);
  const catalog = await loadCatalog();
  const cat = pickCat(catalog, k);
  if (!cat) {
    return pageMetadata({
      title: "Produk — VENCORAGO",
      description:
        "Daftar produk VENCORAGO: pulsa, paket data, token listrik, e-wallet, dan tagihan bulanan. Katalog sedang tidak bisa dibaca, coba beberapa saat lagi.",
      path: "/produk",
    });
  }
  return pageMetadata({
    title: `${cat.n} — VENCORAGO`,
    description: kategoriDescription(cat, catalog),
    path: kategoriPath(cat),
  });
}

export default async function Page(props: PageProps<"/produk">) {
  const { k, op, h } = await params(props);
  const catalog = await loadCatalog();
  const cat = pickCat(catalog, k);
  /* Penyedia yang benar-benar dirender grid — dipilih dengan aturan yang sama
     seperti ProdukView, supaya daftar harga di JSON-LD tidak pernah berbeda
     dari harga yang terlihat di layar. */
  const penyedia = cat ? (op && cat.ops[op] ? op : Object.keys(cat.ops)[0]) : "";
  return (
    <>
      {cat ? (
        <JsonLd
          data={[
            breadcrumbLd([{ name: "Produk", path: "/produk" }, { name: cat.n, path: kategoriPath(cat) }]),
            serviceLd(cat, catalog, penyedia),
          ]}
        />
      ) : null}
      <ProdukView
        key={`${cat?.n ?? k}|${op}|${h}`}
        catalog={catalog}
        cat={cat}
        op={op}
        h={h}
      />
    </>
  );
}
