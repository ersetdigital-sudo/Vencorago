"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import s from "./bantuan.module.css";

const SV = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  refund: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  receipt: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

type IconName = keyof typeof SV;

function Ic({ n }: { n: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SV[n]}
    </svg>
  );
}

const T: [string, string, string][] = [
  ["card", "Pembayaran", "QRIS, Virtual Account, dan e-wallet"],
  ["alert", "Transaksi Gagal", "Pending, gagal, atau belum masuk"],
  ["refund", "Refund", "Pengembalian dana dan prosesnya"],
  ["zap", "Token PLN", "Token listrik dan meteran"],
  ["receipt", "Tagihan", "PDAM, BPJS, internet, angsuran"],
  ["shield", "Keamanan", "Akun, data, dan penipuan"],
];

const F: [string, string, string][] = [
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
    "Biaya admin Rp 1.500 per transaksi. Pembayaran lewat Virtual Account dikenakan tambahan Rp 2.500.",
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

export default function BantuanView() {
  const [cur, setCur] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const ftRef = useRef<HTMLHeadingElement>(null);
  const faqRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  const s2 = q.toLowerCase().trim();
  const visible = F.map((f) => (!cur || f[0] == cur) && (!s2 || (f[1] + f[2]).toLowerCase().includes(s2)));
  const n = visible.filter(Boolean).length;

  useEffect(() => {
    let count = 0;
    F.forEach((f, i) => {
      const el = faqRefs.current[i];
      if (!el) return;
      const ok = (!cur || f[0] == cur) && (!s2 || (f[1] + f[2]).toLowerCase().includes(s2));
      el.style.display = ok ? "" : "none";
      if (ok) count++;
      el.open = !!s2 && ok && count == 1;
    });
  }, [cur, s2]);

  function toFaq() {
    ftRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function qs(v: string) {
    setQ(v);
    setCur(null);
    toFaq();
  }

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/" },
          { label: "Produk", href: "/produk" },
          { label: "Cek Status", href: "/status" },
          { label: "Bantuan", href: "/bantuan", on: true },
          { label: "Kontak", href: "/kontak" },
        ]}
      />

      <main className={s.wrap}>
        <div className={s.hero}>
          <div className={s.kick}>PUSAT BANTUAN</div>
          <h1>
            Halo, ada yang
            <br />
            <em>bisa kami bantu?</em>
          </h1>
          <p>Cari jawaban seputar transaksi, pembayaran, dan refund.</p>
          <div className={s.sb}>
            <Ic n="search" />
            <input
              placeholder="Cari pertanyaan, misal: token belum masuk"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className={s.btn} style={{ borderRadius: 10 }} type="button">
              Cari
            </button>
          </div>
          <div className={s.pop}>
            Populer: <a onClick={() => qs("token")}>Token belum masuk</a>
            <a onClick={() => qs("refund")}>Refund</a>
            <a onClick={() => qs("QRIS")}>Bayar QRIS</a>
            <a onClick={() => qs("pending")}>Transaksi pending</a>
          </div>
        </div>
        <section>
          <h2>Topik bantuan</h2>
          <p className={s.sub}>Pilih topik untuk melihat pertanyaan terkait.</p>
          <div className={s.topics}>
            {T.map((t) => (
              <div
                key={t[1]}
                className={`${s.tp} ${cur == t[1] ? s.on : ""}`}
                onClick={() => {
                  setCur(cur == t[1] ? null : t[1]);
                  setQ("");
                  toFaq();
                }}
              >
                <div className={s.ico}>
                  <Ic n={t[0] as IconName} />
                </div>
                <div>
                  <b>{t[1]}</b>
                  <small>{t[2]}</small>
                  <em>{F.filter((f) => f[0] == t[1]).length} artikel</em>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className={s.faqw}>
          <div className={s.card}>
            <h2 ref={ftRef}>{s2 ? `Hasil untuk "${q}"` : cur || "Semua pertanyaan"}</h2>
            <div className={s.cnt}>{n} pertanyaan</div>
            <div>
              {F.map((f, i) => (
                <details
                  key={f[1]}
                  ref={(el) => {
                    faqRefs.current[i] = el;
                  }}
                >
                  <summary>{f[1]}</summary>
                  <p>{f[2]}</p>
                </details>
              ))}
            </div>
            <div className={s.none} style={{ display: n ? "none" : "block" }}>
              Tidak ada hasil. Coba kata lain atau{" "}
              <Link href="/kontak" style={{ color: "var(--teal)", fontWeight: 600 }}>
                hubungi CS
              </Link>
              .
            </div>
          </div>
          <div className={s.side}>
            <div className={s.card}>
              <div className={s.ico}>
                <Ic n="receipt" />
              </div>
              <h3 style={{ margin: "14px 0 6px" }}>Cek status transaksi</h3>
              <p className={s.sub} style={{ margin: 0 }}>
                Lacak pesanan pakai nomor invoice.
              </p>
              <Link className={`${s.btn} ${s.ghost}`} href="/status">
                Cek Status
              </Link>
            </div>
            <div className={s.card}>
              <h3 style={{ marginBottom: 8 }}>Masih butuh bantuan?</h3>
              <div className={s.steps}>
                <div>
                  <b>1</b>Siapkan nomor invoice
                </div>
                <div>
                  <b>2</b>Jelaskan kendala singkat
                </div>
                <div>
                  <b>3</b>CS balas &lt; 5 menit
                </div>
              </div>
              <Link className={s.btn} href="/kontak">
                Hubungi CS
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className={s.wrap}>
          <span>© 2026 VENCORAGO. Solusi pembayaran digital.</span>
          <nav>
            <Link href="/produk">Produk</Link>
            <Link href="/cara-bayar">Cara Bayar</Link>
            <Link href="/status">Cek Status</Link>
            <Link href="/bantuan">Pusat Bantuan</Link>
            <Link href="/kontak">Kontak</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
