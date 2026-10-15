"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import s from "./kontak.module.css";

const SV = {
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  ig: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
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

const WA = "6281234567890";

export default function KontakView() {
  const [nm, setNm] = useState("");
  const [wa, setWa] = useState("");
  const [tp, setTp] = useState("Pertanyaan umum");
  const [iv, setIv] = useState("");
  const [ms, setMs] = useState("");
  const [sent, setSent] = useState(false);

  function kirim() {
    const t = `Halo VENCORAGO,%0ANama: ${nm}%0AWA: ${wa}%0ATopik: ${tp}${
      iv ? "%0AInvoice: " + iv : ""
    }%0A%0A${encodeURIComponent(ms)}`;
    setSent(true);
    window.open(`https://wa.me/${WA}?text=${t}`, "_blank");
  }

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/" },
          { label: "Produk", href: "/produk" },
          { label: "Cek Status", href: "/status" },
          { label: "Cara Bayar", href: "/cara-bayar" },
          { label: "Bantuan", href: "/bantuan" },
          { label: "Kontak", href: "/kontak", on: true },
        ]}
      />

      <main className={s.wrap}>
        <div className={s.hero}>
          <div className={s.kick}>HUBUNGI KAMI</div>
          <h1>
            Ada yang bisa
            <br />
            <em>kami bantu?</em>
          </h1>
          <p>
            Tim CS VENCORAGO siap bantu 24 jam setiap hari. Rata-rata respons kurang dari 5 menit.
          </p>
          <div className={s.live}>CS sedang online</div>
          <br />
          <br />
          <br />
        </div>
        <div className={s.ch}>
          <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">
            <div className={s.ico}>
              <Ic n="chat" />
            </div>
            <b>WhatsApp</b>
            <small>+62 812 3456 7890</small>
            <span>
              Chat sekarang <Ic n="arrow" />
            </span>
          </a>
          <a href="mailto:halo@vencorago.id">
            <div className={s.ico}>
              <Ic n="mail" />
            </div>
            <b>Email</b>
            <small>halo@vencorago.id</small>
            <span>
              Kirim email <Ic n="arrow" />
            </span>
          </a>
          <a href="tel:02150001234">
            <div className={s.ico}>
              <Ic n="phone" />
            </div>
            <b>Telepon</b>
            <small>(021) 5000 1234</small>
            <span>
              Telepon kami <Ic n="arrow" />
            </span>
          </a>
          <a href="https://instagram.com/" target="_blank" rel="noreferrer">
            <div className={s.ico}>
              <Ic n="ig" />
            </div>
            <b>Instagram</b>
            <small>@vencorago.id</small>
            <span>
              Ikuti kami <Ic n="arrow" />
            </span>
          </a>
        </div>
        <section className={s.two}>
          <div className={s.card}>
            <h2>Kirim pesan</h2>
            <p className={s.sub}>Isi formulir, pesanmu langsung diteruskan ke WhatsApp CS kami.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                kirim();
              }}
            >
              <div className={s.row2}>
                <div>
                  <label>Nama lengkap</label>
                  <input
                    required
                    placeholder="Nama kamu"
                    value={nm}
                    onChange={(e) => setNm(e.target.value)}
                  />
                </div>
                <div>
                  <label>Nomor WhatsApp</label>
                  <input
                    required
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                  />
                </div>
              </div>
              <div className={s.row2}>
                <div>
                  <label>Topik</label>
                  <select value={tp} onChange={(e) => setTp(e.target.value)}>
                    <option>Pertanyaan umum</option>
                    <option>Transaksi gagal / pending</option>
                    <option>Refund dana</option>
                    <option>Kerja sama / reseller</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label>No. Invoice (opsional)</label>
                  <input placeholder="VCR..." value={iv} onChange={(e) => setIv(e.target.value)} />
                </div>
              </div>
              <label>Pesan</label>
              <textarea
                rows={5}
                required
                placeholder="Ceritakan kendala atau pertanyaan kamu..."
                value={ms}
                onChange={(e) => setMs(e.target.value)}
              />
              <button className={s.btn} style={{ marginTop: 18, borderRadius: 12, padding: "14px 26px" }}>
                <Ic n="send" /> Kirim Pesan
              </button>
              <div className={s.ok} style={{ display: sent ? "block" : "none" }}>
                Pesan siap dikirim, WhatsApp akan terbuka di tab baru.
              </div>
            </form>
          </div>
          <div className={`${s.card} ${s.info}`}>
            <h2>Info kantor</h2>
            <p className={s.sub}>Layanan online, kantor buka di hari kerja.</p>
            <div>
              <div className={s.ico}>
                <Ic n="pin" />
              </div>
              <div>
                <b>Alamat</b>
                <small>
                  Jl. Sudirman No. 21, Lt. 8
                  <br />
                  Jakarta Selatan 12190
                </small>
              </div>
            </div>
            <div>
              <div className={s.ico}>
                <Ic n="clock" />
              </div>
              <div>
                <b>Jam operasional</b>
                <small>
                  Layanan online: 24 jam, setiap hari
                  <br />
                  Kantor: Senin–Jumat, 09.00–17.00 WIB
                </small>
              </div>
            </div>
            <div>
              <div className={s.ico}>
                <Ic n="shield" />
              </div>
              <div>
                <b>Keamanan</b>
                <small>CS tidak pernah meminta PIN, OTP, atau password kamu.</small>
              </div>
            </div>
          </div>
        </section>
        <section className={s.cta}>
          <div>
            <h2 style={{ fontSize: 26 }}>Cari jawaban lebih cepat?</h2>
            <p className={s.sub} style={{ margin: 0 }}>
              Banyak pertanyaan sudah terjawab di Pusat Bantuan.
            </p>
          </div>
          <Link className={s.btn} href="/bantuan">
            Buka Pusat Bantuan <Ic n="arrow" />
          </Link>
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
