import type { Metadata } from "next";
import ProdukView from "@/components/produk/ProdukView";
import { DEFAULT_CAT, K } from "@/components/produk/data";

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

/* `op` dan `h` datang dari kartu produk di beranda, supaya halaman detail
   benar-benar terbuka pada operator + nominal yang tadi dipilih. */
async function params(props: PageProps<"/produk">) {
  const sp = await props.searchParams;
  const k = one(sp.k);
  return { cat: k && K[k] ? k : DEFAULT_CAT, op: one(sp.op), h: one(sp.h) };
}

export async function generateMetadata(props: PageProps<"/produk">): Promise<Metadata> {
  return { title: (await params(props)).cat + " — VENCORAGO" };
}

export default async function Page(props: PageProps<"/produk">) {
  const { cat, op, h } = await params(props);
  return <ProdukView key={`${cat}|${op}|${h}`} k={cat} op={op} h={h} />;
}
