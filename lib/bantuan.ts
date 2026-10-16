/* ============================================================================
   Pertanyaan-jawaban Pusat Bantuan.

   Dipakai dua tempat: BantuanView (client) untuk daftar yang bisa dicari, dan
   app/bantuan/page.tsx (server) untuk membuat FAQPage JSON-LD. Teksnya satu,
   jadi schema-nya tidak mungkin berbeda dari yang dibaca pengunjung.

   Biaya disebut dari katalog (biaya admin + biaya Virtual Account), supaya
   jawaban "apakah ada biaya admin" tidak pernah menyimpang dari yang benar-
   benar ditagih checkout.
   ========================================================================== */

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

/** [topik, pertanyaan, jawaban] */
export type TanyaJawab = [string, string, string];

export function tanyaJawab(adminFee: number, vaFee: number): TanyaJawab[] {
  return [
    [
      "Pembayaran",
      "Metode pembayaran apa saja yang tersedia?",
      "Kamu bisa bayar pakai QRIS (semua e-wallet & m-banking), Virtual Account BCA dan Mandiri, serta DANA.",
    ],
    [
      "Pembayaran",
      "Bagaimana cara bayar pakai QRIS?",
      "Pilih QRIS di langkah pembayaran, lalu scan kode QR yang muncul pakai aplikasi DANA, OVO, GoPay, ShopeePay, atau m-banking. Selesaikan sebelum waktu habis (15 menit).",
    ],
    [
      "Pembayaran",
      "Apakah ada biaya admin?",
      `Biaya admin ${rp(adminFee)} per transaksi. Pembayaran lewat Virtual Account dikenakan tambahan ${rp(vaFee)}.`,
    ],
    [
      "Transaksi Gagal",
      "Transaksi saya pending, apa yang harus dilakukan?",
      "Status pending biasanya selesai dalam 1–15 menit. Cek di halaman Cek Status. Jika lebih dari 1 jam, hubungi CS dengan nomor invoice.",
    ],
    [
      "Transaksi Gagal",
      "Saldo sudah terpotong tapi produk belum masuk",
      "Simpan bukti pembayaran dan nomor invoice, lalu hubungi CS. Kami akan proses ulang atau refund maksimal 1x24 jam.",
    ],
    [
      "Transaksi Gagal",
      "Salah memasukkan nomor tujuan",
      "Transaksi yang sudah berhasil ke nomor yang salah tidak bisa dibatalkan. Selalu cek ulang nomor di halaman detail pesanan sebelum membayar.",
    ],
    [
      "Refund",
      "Berapa lama proses refund?",
      "Refund diproses maksimal 1x24 jam ke metode pembayaran asal setelah transaksi dinyatakan gagal.",
    ],
    [
      "Refund",
      "Bagaimana cara mengajukan refund?",
      "Hubungi CS lewat WhatsApp atau formulir Kontak, sertakan nomor invoice dan bukti pembayaran.",
    ],
    [
      "Token PLN",
      "Token listrik belum masuk setelah bayar",
      "Token tampil di struk dan halaman Cek Status. Jika belum muncul setelah 15 menit, hubungi CS dengan nomor invoice.",
    ],
    [
      "Token PLN",
      "Cara memasukkan token ke meteran",
      "Tekan tombol pada meteran, masukkan 20 digit token, lalu tekan Enter. Pastikan nomor meter sesuai dengan yang kamu beli.",
    ],
    [
      "Tagihan",
      "Kapan tagihan bulanan bisa dibayar?",
      "Tagihan PDAM, BPJS, internet, dan angsuran biasanya tersedia mulai tanggal 1 setiap bulan dan bisa dibayar sebelum jatuh tempo.",
    ],
    [
      "Tagihan",
      "Apakah bisa bayar BPJS untuk beberapa bulan?",
      "Bisa, iuran BPJS Kesehatan dapat dibayar hingga 12 bulan sekaligus.",
    ],
    [
      "Keamanan",
      "Apakah data saya aman?",
      "Semua transaksi dienkripsi dan kami tidak menyimpan data kartu atau PIN kamu.",
    ],
    [
      "Keamanan",
      "Ada yang mengaku CS meminta OTP",
      "Itu penipuan. CS VENCORAGO tidak pernah meminta PIN, OTP, atau password. Laporkan ke WhatsApp resmi kami.",
    ],
  ];
}
