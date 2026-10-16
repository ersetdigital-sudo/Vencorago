import { loadCatalog } from "@/lib/catalog.server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, abs, kategoriPath } from "@/lib/seo";

/* /llms.txt — indeks situs untuk agen AI (lihat llmstxt.org).

   Isinya ringkas dan hanya menunjuk halaman yang benar-benar bisa dibuka
   crawler (semua URL di sini ada juga di sitemap.xml). Angka biaya diambil
   dari katalog yang sama dengan yang ditagih checkout, jadi jawaban AI tentang
   biaya tidak bisa menyimpang dari situs.

   Catatan: Google mengabaikan llms.txt, jadi ini bukan alat peringkat — ini
   untuk agen/alat yang memang membacanya, dan biayanya nol. */

export async function GET() {
  const catalog = await loadCatalog();
  const adminFee = catalog.adminFee;
  const vaFee = catalog.methods.find((m) => m.kind === "va")?.fee ?? 0;

  const baris: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Layanan",
    ...catalog.cats.map((c) => {
      const daftar = Object.keys(c.ops).join(", ");
      return `- [${c.n}](${abs(kategoriPath(c))}): ${c.d}${daftar ? ` Penyedia: ${daftar}.` : ""}`;
    }),
    "",
    "## Halaman",
    `- [Beranda](${SITE_URL}/): pilih layanan, isi nomor tujuan, lalu bayar.`,
    `- [Cara Bayar](${SITE_URL}/cara-bayar): langkah pembayaran lewat QRIS, Virtual Account, dan DANA.`,
    `- [Cek Status](${SITE_URL}/status): lacak transaksi dengan nomor invoice.`,
    `- [Pusat Bantuan](${SITE_URL}/bantuan): pertanyaan soal pembayaran, transaksi gagal, refund, token listrik, tagihan, dan keamanan.`,
    `- [Kontak](${SITE_URL}/kontak): kanal bantuan resmi.`,
    "",
    "## Biaya",
    `- Biaya admin: Rp ${Math.round(adminFee).toLocaleString("id-ID")} per transaksi.`,
    `- Virtual Account: tambahan Rp ${Math.round(vaFee).toLocaleString("id-ID")}.`,
    "- QRIS dan DANA: tanpa biaya tambahan.",
    "",
    "## Catatan",
    "- Harga produk dan biaya di atas datang dari katalog yang sama dengan yang dipakai checkout, jadi selalu yang berlaku saat ini.",
    "- Halaman admin tidak untuk publik dan tidak ada di sitemap.xml.",
  ];

  return new Response(baris.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
