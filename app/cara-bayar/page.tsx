import type { Metadata } from "next";
import CaraBayarView from "@/components/cara-bayar/CaraBayarView";
import { loadCatalog } from "@/lib/catalog.server";

export const instant = false;

export const metadata: Metadata = {
  title: "Cara Bayar — VENCORAGO",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/cara-bayar">) {
  const sp = await props.searchParams;
  /* Panduan langkahnya tetap teks di komponen; hanya angka biaya yang diambil
     dari katalog supaya tidak bisa berbeda dengan yang ditagih checkout. */
  const catalog = await loadCatalog();
  return <CaraBayarView m={one(sp.m)} methods={catalog.methods} adminFee={catalog.adminFee} />;
}
