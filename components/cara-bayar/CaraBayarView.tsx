"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { rp, type Method as CatalogMethod } from "@/lib/catalog";
import s from "./cara-bayar.module.css";

const SV = {
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M21 14v7h-4" />
    </>
  ),
  bank: <path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <circle cx="16" cy="13.5" r="1.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
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

type Method = {
  i: string;
  d: string;
  apps: string[];
  info: [string, string][];
  mt: string;
  tip: string;
  sub: Record<string, [string, string][]>;
};

const M: Record<string, Method> = {
  QRIS: {
    i: "qr",
    d: "Bayar pakai aplikasi e-wallet atau m-banking apa saja yang mendukung QRIS.",
    apps: ["DANA", "OVO", "GoPay", "ShopeePay", "LinkAja", "BCA mobile", "Livin'"],
    info: [
      ["Biaya admin", "Rp 1.500"],
      ["Biaya tambahan", "Gratis"],
      ["Batas waktu", "15 menit"],
      ["Verifikasi", "Otomatis, instan"],
    ],
    mt: "Scan QR untuk bayar",
    sub: {
      "Semua aplikasi": [
        [
          "Pilih produk & isi nomor",
          "Pilih layanan di beranda, masukkan nomor tujuan, lalu klik <b>Cek & Bayar</b>.",
        ],
        [
          "Pilih metode QRIS",
          "Di langkah pembayaran, pilih <b>QRIS</b> lalu klik <b>Bayar Sekarang</b>. Kode QR akan muncul.",
        ],
        [
          "Buka aplikasi pembayaran",
          "Buka e-wallet atau m-banking kamu, lalu tekan menu <b>Scan / Bayar</b>.",
        ],
        [
          "Scan kode QR",
          "Arahkan kamera ke kode QR. Pastikan nama merchant <code>VENCORAGO</code> dan nominal sudah sesuai.",
        ],
        ["Konfirmasi & masukkan PIN", "Tekan <b>Bayar</b> lalu masukkan PIN aplikasi kamu."],
        [
          "Selesai",
          "Kembali ke VENCORAGO dan klik <b>Saya Sudah Bayar</b>. Struk dan SN/token muncul otomatis.",
        ],
      ],
    },
    tip: "Kalau bayar dari HP yang sama, screenshot kode QR lalu pilih <b>Upload dari galeri</b> di menu scan aplikasi kamu.",
  },
  VA: {
    i: "bank",
    d: "Transfer ke nomor Virtual Account lewat m-banking, internet banking, atau ATM.",
    apps: ["BCA", "Mandiri"],
    info: [
      ["Biaya admin", "Rp 1.500"],
      ["Biaya VA", "+ Rp 2.500"],
      ["Batas waktu", "15 menit"],
      ["Verifikasi", "Otomatis, 1-5 menit"],
    ],
    mt: "Nomor VA: 8808 xxxx",
    sub: {
      "BCA mobile": [
        [
          "Salin nomor VA",
          "Pilih <b>Virtual Account BCA</b> saat checkout, lalu klik <b>Salin</b> pada nomor VA.",
        ],
        ["Buka BCA mobile", "Login ke aplikasi BCA mobile, pilih <b>m-Transfer</b>."],
        [
          "Pilih BCA Virtual Account",
          "Masuk ke menu <b>BCA Virtual Account</b>, tempel nomor VA kamu.",
        ],
        [
          "Cek detail tagihan",
          "Pastikan nama <code>VENCORAGO</code> dan total pembayaran sesuai, lalu tekan <b>OK</b>.",
        ],
        ["Masukkan PIN", "Masukkan PIN m-BCA untuk menyelesaikan pembayaran."],
        ["Selesai", "Status berubah otomatis. Cek struk di halaman <b>Cek Status</b>."],
      ],
      "Livin' Mandiri": [
        [
          "Salin nomor VA",
          "Pilih <b>Virtual Account Mandiri</b> saat checkout, lalu salin nomornya.",
        ],
        [
          "Buka Livin' by Mandiri",
          "Login, pilih menu <b>Bayar</b> lalu <b>Buat Pembayaran Baru</b>.",
        ],
        [
          "Cari penyedia",
          "Ketik <code>VENCORAGO</code> atau pilih <b>Multipayment</b>, lalu masukkan nomor VA.",
        ],
        ["Konfirmasi", "Periksa nama dan total tagihan, lalu tekan <b>Lanjut</b>."],
        ["Masukkan PIN", "Masukkan PIN Livin' kamu."],
        ["Selesai", "Pembayaran terverifikasi otomatis dalam beberapa menit."],
      ],
      ATM: [
        ["Catat nomor VA", "Catat atau screenshot nomor VA dari halaman pembayaran."],
        ["Masukkan kartu & PIN", "Di ATM BCA/Mandiri, masukkan kartu dan PIN."],
        [
          "Pilih menu transfer",
          "Pilih <b>Transaksi Lainnya → Transfer → Virtual Account</b> (BCA) atau <b>Bayar/Beli → Multipayment</b> (Mandiri).",
        ],
        ["Masukkan nomor VA", "Ketik nomor VA, lalu tekan <b>Benar</b>."],
        [
          "Konfirmasi",
          "Pastikan nama <code>VENCORAGO</code> dan nominal sesuai, lalu tekan <b>Ya</b>.",
        ],
        ["Simpan struk", "Simpan struk ATM sebagai bukti pembayaran."],
      ],
    },
    tip: "Transfer harus <b>sama persis</b> dengan total yang tertera. Nomor VA hanya berlaku untuk satu transaksi.",
  },
  DANA: {
    i: "wallet",
    d: "Bayar langsung dari saldo DANA tanpa perlu scan atau salin nomor.",
    apps: ["DANA"],
    info: [
      ["Biaya admin", "Rp 1.500"],
      ["Biaya tambahan", "Gratis"],
      ["Batas waktu", "15 menit"],
      ["Verifikasi", "Otomatis, instan"],
    ],
    mt: "Bayar dengan DANA",
    sub: {
      "Aplikasi DANA": [
        [
          "Pilih produk & isi nomor",
          "Pilih layanan, masukkan nomor tujuan, lalu klik <b>Cek & Bayar</b>.",
        ],
        ["Pilih metode DANA", "Di langkah pembayaran pilih <b>DANA</b>, lalu klik <b>Bayar Sekarang</b>."],
        [
          "Diarahkan ke DANA",
          "Aplikasi DANA akan terbuka otomatis (atau halaman login DANA di desktop).",
        ],
        ["Cek detail pembayaran", "Pastikan merchant <code>VENCORAGO</code> dan nominal sesuai."],
        ["Masukkan PIN DANA", "Tekan <b>Bayar</b> lalu masukkan 6 digit PIN DANA."],
        ["Selesai", "Kamu kembali ke VENCORAGO dan struk langsung muncul."],
      ],
    },
    tip: "Pastikan saldo DANA cukup sebelum membayar. Kamu juga bisa bayar DANA lewat <b>QRIS</b>.",
  },
};

const TN: Record<string, string> = { QRIS: "QRIS", VA: "Virtual Account", DANA: "DANA" };

export default function CaraBayarView({
  m: initM = "QRIS",
  methods = [],
  adminFee = 0,
}: {
  m?: string;
  /** Metode pembayaran dari katalog — dipakai hanya untuk angka biayanya. */
  methods?: CatalogMethod[];
  adminFee?: number;
}) {
  const [m, setM] = useState(M[initM] ? initM : "QRIS");
  const [sub, setSub] = useState<string | null>(null);

  const x = M[m];
  /* Dua baris biaya diambil dari katalog (biaya admin + biaya Virtual Account),
     jadi angka di panduan tidak bisa berbeda dengan yang ditagih checkout. */
  const vaFee = methods.find((it) => it.kind === "va")?.fee ?? 0;
  const info = x.info.map(([a, b]) =>
    a === "Biaya admin" ? [a, rp(adminFee)] : a === "Biaya VA" ? [a, "+ " + rp(vaFee)] : [a, b]
  );
  const subKeys = Object.keys(x.sub);
  const cur = sub && x.sub[sub] ? sub : subKeys[0];
  const tt = "Bayar pakai " + TN[m] + (subKeys.length > 1 ? " · " + cur : "");

  useEffect(() => {
    window.history.replaceState(null, "", "?m=" + m);
  }, [m]);

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/" },
          { label: "Produk", href: "/produk" },
          { label: "Cara Bayar", href: "/cara-bayar", on: true },
          { label: "Bantuan", href: "/bantuan" },
          { label: "Kontak", href: "/kontak" },
        ]}
      />

      <main className={s.wrap}>
        <div className={s.hero} style={{ textAlign: "center" }}>
          <div className={s.kick}>PANDUAN PEMBAYARAN</div>
          <h1>
            Cara bayar di
            <br />
            <em>VENCORAGO</em>
          </h1>
          <p style={{ margin: "0 auto" }}>
            Pilih metode pembayaran dan ikuti langkahnya. Semua pembayaran terverifikasi otomatis.
          </p>
          <br />
          <br />
        </div>
        <div className={s.tabs}>
          {Object.keys(M).map((k) => (
            <div
              key={k}
              className={`${s.tab} ${k == m ? s.on : ""}`}
              onClick={() => {
                setM(k);
                setSub(null);
              }}
            >
              <Ic n={M[k].i as IconName} />
              <span>{TN[k]}</span>
            </div>
          ))}
        </div>
        <div className={s.sub2}>
          {subKeys.length > 1 &&
            subKeys.map((k) => (
              <div key={k} className={`${s.chip} ${k == cur ? s.on : ""}`} onClick={() => setSub(k)}>
                {k}
              </div>
            ))}
        </div>
        <div className={s.lay}>
          <div className={s.card}>
            <h2>{tt}</h2>
            <p className={s.sub}>{x.d}</p>
            <div>
              {x.sub[cur].map((t, i) => (
                <div key={t[0]} className={s.st} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className={s.n}>{i + 1}</div>
                  <div>
                    <b>{t[0]}</b>
                    <p dangerouslySetInnerHTML={{ __html: t[1] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className={s.tip} dangerouslySetInnerHTML={{ __html: "<b>Tips:</b> " + x.tip }} />
          </div>
          <div className={s.side}>
            <div className={`${s.card} ${s.mock}`}>
              <div className={s.ph}>
                <b style={{ color: "var(--ink)" }}>VENCORAGO</b>
                <div className={s.ic2}>
                  <Ic n={x.i as IconName} />
                </div>
                <div>{x.mt}</div>
              </div>
              <div className={s.apps} style={{ justifyContent: "center" }}>
                {x.apps.map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
            </div>
            <div className={s.card}>
              <h3 style={{ marginBottom: 8 }}>Info metode</h3>
              <div>
                {info.map(([a, b]) => (
                  <div className={s.li} key={a}>
                    <span>{a}</span>
                    <b>{b}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <section className={s.cta}>
          <div>
            <h2 style={{ fontSize: 26 }}>Sudah siap bayar?</h2>
            <p className={s.sub} style={{ margin: 0 }}>
              Pilih produk dan selesaikan transaksi dalam hitungan detik.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link className={`${s.btn} ${s.ghost}`} href="/bantuan">
              Pusat Bantuan
            </Link>
            <Link className={s.btn} href="/">
              Mulai Transaksi <Ic n="arrow" />
            </Link>
          </div>
        </section>
      </main>
      <footer>
        <div className={s.wrap}>
          <span>© 2026 VENCORAGO. Solusi pembayaran digital.</span>
          <nav>
            <Link href="/produk">Produk</Link>
            <Link href="/status">Cek Status</Link>
            <Link href="/cara-bayar">Cara Bayar</Link>
            <Link href="/bantuan">Pusat Bantuan</Link>
            <Link href="/kontak">Kontak</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
