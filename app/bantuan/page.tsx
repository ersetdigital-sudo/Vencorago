import type { Metadata } from "next";
import BantuanView from "@/components/bantuan/BantuanView";
import { tanyaJawab } from "@/lib/bantuan";
import { loadCatalog } from "@/lib/catalog.server";
import { JsonLd, breadcrumbLd, faqLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pusat Bantuan — VENCORAGO",
  description:
    "Jawaban soal pembayaran QRIS dan Virtual Account, transaksi pending atau gagal, refund, token listrik yang belum masuk, tagihan bulanan, dan keamanan akun di VENCORAGO.",
  path: "/bantuan",
});

export default async function Page() {
  /* Angka biaya di jawaban diambil dari katalog, sama seperti checkout — dan
     FAQPage JSON-LD dibuat dari daftar yang sama, jadi yang dibaca crawler
     identik dengan yang dilihat pengunjung. */
  const catalog = await loadCatalog();
  const vaFee = catalog.methods.find((m) => m.kind === "va")?.fee ?? 0;
  const qa = tanyaJawab(catalog.adminFee, vaFee);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Pusat Bantuan", path: "/bantuan" }]),
          faqLd(qa.map(([, q, a]) => [q, a] as [string, string])),
        ]}
      />
      <BantuanView adminFee={catalog.adminFee} vaFee={vaFee} />
    </>
  );
}
