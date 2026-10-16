import type { Metadata } from "next";
import StatusView from "@/components/status/StatusView";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

/* `?inv=` dibaca di client dan isinya satu transaksi, jadi canonical selalu
   /status — halaman invoice per pelanggan tidak untuk diindeks. */
export const metadata: Metadata = pageMetadata({
  title: "Cek Status Transaksi — VENCORAGO",
  description:
    "Lacak transaksi VENCORAGO dengan nomor invoice: lihat apakah pembayaran berhasil, masih menunggu, atau gagal, lengkap dengan SN/token dan waktu prosesnya.",
  path: "/status",
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Cek Status", path: "/status" }])} />
      <StatusView />
    </>
  );
}
