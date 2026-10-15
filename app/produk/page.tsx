import type { Metadata } from "next";
import ProdukView from "@/components/produk/ProdukView";
import { DEFAULT_CAT, K } from "@/components/produk/data";

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

async function kategori(props: PageProps<"/produk">) {
  const sp = await props.searchParams;
  const k = one(sp.k);
  return k && K[k] ? k : DEFAULT_CAT;
}

export async function generateMetadata(props: PageProps<"/produk">): Promise<Metadata> {
  return { title: (await kategori(props)) + " — VENCORAGO" };
}

export default async function Page(props: PageProps<"/produk">) {
  const cat = await kategori(props);
  return <ProdukView key={cat} k={cat} />;
}
