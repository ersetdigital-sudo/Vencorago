import type { Metadata } from "next";
import KontakView from "@/components/kontak/KontakView";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Kontak — VENCORAGO",
  description:
    "Hubungi VENCORAGO lewat WhatsApp, email, atau formulir kontak untuk pertanyaan transaksi, refund, dan kerja sama. Sertakan nomor invoice agar bisa dicek lebih cepat.",
  path: "/kontak",
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Kontak", path: "/kontak" }])} />
      <KontakView />
    </>
  );
}
