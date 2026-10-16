import type { Metadata } from "next";
import CaraBayarView from "@/components/cara-bayar/CaraBayarView";
import { loadCatalog } from "@/lib/catalog.server";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const instant = false;

/* Panduan yang sama muncul untuk semua metode, jadi `?m=` (QRIS/VA/DANA)
   di-canonical ke /cara-bayar saja. */
export const metadata: Metadata = pageMetadata({
  title: "Cara Bayar — VENCORAGO",
  description:
    "Panduan cara bayar di VENCORAGO lewat QRIS, Virtual Account BCA dan Mandiri, atau DANA: langkah per langkah, biaya admin, batas waktu, dan bukti pembayaran yang perlu disimpan.",
  path: "/cara-bayar",
});

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/cara-bayar">) {
  const sp = await props.searchParams;
  /* Panduan langkahnya tetap teks di komponen; hanya angka biaya yang diambil
     dari katalog supaya tidak bisa berbeda dengan yang ditagih checkout. */
  const catalog = await loadCatalog();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Cara Bayar", path: "/cara-bayar" }])} />
      <CaraBayarView m={one(sp.m)} methods={catalog.methods} adminFee={catalog.adminFee} />
    </>
  );
}
