"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import s from "./produk.module.css";
import { CATS, K, rp } from "./data";

const SV = {
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  wifi: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="m8 2 4 4 4-4" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <circle cx="16" cy="13.5" r="1.2" />
    </>
  ),
  bank: <path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
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

const FAQS: [string, string][] = [
  ["Berapa lama prosesnya?", "Rata-rata 5 detik sampai 3 menit setelah pembayaran terverifikasi."],
  ["Bagaimana kalau transaksi gagal?", "Dana dikembalikan 100% ke saldo atau rekening kamu maksimal 1x24 jam."],
  ["Apakah ada biaya tambahan?", "Hanya biaya admin Rp 1.500. Virtual Account dikenakan tambahan Rp 2.500."],
  ["Bisa cek transaksi sebelumnya?", "Bisa, buka halaman Cek Status dan masukkan nomor invoice kamu."],
];

export default function ProdukView({ k = "Pulsa" }: { k?: string }) {
  const cat = k;
  const c = K[cat];
  const [op, setOp] = useState(Object.keys(c.ops)[0]);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [num, setNum] = useState("");

  const items = c.ops[op];
  const sel: { n: string; p: number; i: number; v?: number } | null = c.bill
    ? { n: op, p: 0, i: -1 }
    : selIdx != null
      ? { ...items[selIdx], i: selIdx }
      : null;

  const sp = sel ? (c.bill ? op : op + " " + sel.n) : "-";
  const sh = sel ? (sel.p ? rp(sel.p) : "Dicek otomatis") : "-";
  const stt = sel && sel.p ? rp(sel.p + 1500) : c.bill && sel ? "Dicek otomatis" : "Rp 0";

  function go() {
    if (!sel) return alert("Pilih produk dulu ya");
    const n = num.replace(/\D/g, "");
    if (n.length < 8) return alert(c.nl + " minimal 8 digit");
    location.href = `/?k=${encodeURIComponent(cat)}&h=${sel.v || 0}&p=${encodeURIComponent(
      c.bill ? op : op + " " + sel.n
    )}&no=${n}`;
  }

  const how = [
    `Pilih ${c.bill ? "penyedia" : "operator dan nominal"}`,
    `Masukkan ${c.nl.toLowerCase()}`,
    "Klik Lanjut Bayar lalu cek detail pesanan",
    "Pilih metode bayar: QRIS, Virtual Account, atau DANA",
    cat == "Token PLN"
      ? "Token listrik langsung muncul setelah pembayaran"
      : "Transaksi diproses otomatis, cek status kapan saja",
  ];

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/" },
          { label: "Produk", href: "/produk", on: true },
          { label: "Cek Status", href: "/status" },
          { label: "Cara Bayar", href: "/cara-bayar" },
          { label: "Bantuan", href: "/bantuan" },
          { label: "Kontak", href: "/kontak" },
        ]}
      />

      <main className={s.wrap}>
        <div className={s.tabs}>
          {CATS.map((name) => (
            <Link
              key={name}
              href={`/produk?k=${encodeURIComponent(name)}`}
              className={name == cat ? s.on : undefined}
            >
              <Ic n={K[name].i as IconName} /> {name}
            </Link>
          ))}
        </div>
        <div className={s.crumb}>
          <Link href="/">Beranda</Link>
          {" / Produk / "}
          <b>{cat}</b>
        </div>
        <section className={s.hero}>
          <div className={s.big}>
            <Ic n={c.i as IconName} />
          </div>
          <div>
            <h1>{cat}</h1>
            <p>{c.d}</p>
          </div>
        </section>
        <div className={s.grid}>
          <div>
            <div className={`${s.card} ${s.mobileTop}`}>
              <h2>Nomor Tujuan</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go();
                }}
              >
                <label htmlFor="nomor" style={{ fontSize: 13, fontWeight: 600 }}>
                  {c.nl}
                </label>
                <input
                  id="nomor"
                  inputMode="numeric"
                  enterKeyHint="go"
                  placeholder={c.ph}
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                />
              </form>
              <div className={s.feat}>
                <span>
                  <Ic n="clock" /> Proses otomatis 24 jam
                </span>
                <span>
                  <Ic n="shield" /> Transaksi aman &amp; terenkripsi
                </span>
                <span>
                  <Ic n="check" /> Garansi uang kembali jika gagal
                </span>
              </div>
            </div>
            <div className={s.card}>
              <h2>{c.bill ? "Pilih penyedia" : "Pilih operator & nominal"}</h2>
              {(Object.keys(c.ops).length > 1 || c.bill) && (
                <div className={s.ops}>
                  {Object.keys(c.ops).map((o) => (
                    <div
                      key={o}
                      className={`${s.op} ${o == op ? s.on : ""}`}
                      onClick={() => {
                        setOp(o);
                        setSelIdx(null);
                      }}
                    >
                      {o}
                    </div>
                  ))}
                </div>
              )}
              <div>
                {c.bill ? (
                  <>
                    <p style={{ fontSize: 13, color: "var(--mut)", margin: "14px 0" }}>
                      Tagihan dicek otomatis berdasarkan nomor pelanggan.
                    </p>
                    <div className={s.bill}>
                      {Object.entries(c.bill).map(([a, b]) => (
                        <div key={a}>
                          {a}
                          <b>{b}</b>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={s.items} style={{ marginTop: 14 }}>
                    {items.map((x, i) => (
                      <div
                        key={i}
                        className={`${s.it} ${sel && sel.i == i ? s.on : ""}`}
                        onClick={() => setSelIdx(i)}
                      >
                        {i == 1 ? <span className={s.hot}>TERLARIS</span> : null}
                        <b>{x.n}</b>
                        <small>{x.d}</small>
                        <span className={s.pr}>{rp(x.p)}</span>
                        {x.p > x.v ? <s>{rp(x.p + 1500)}</s> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={`${s.card} ${s.mobileSum}`}>
              <h2>Ringkasan</h2>
              <div className={s.li}>
                <span>Produk</span>
                <b>{sp}</b>
              </div>
              <div className={s.li}>
                <span>Harga</span>
                <b>{sh}</b>
              </div>
              <div className={s.li}>
                <span>Biaya admin</span>
                <b>Rp 1.500</b>
              </div>
              <div className={s.tot}>
                <span>Total</span>
                <b>{stt}</b>
              </div>
            </div>
            <div className={s.card}>
              <h2>Cara pembelian</h2>
              <ol>
                {how.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </div>
            <div className={s.card}>
              <h2>Pertanyaan umum</h2>
              <div>
                {FAQS.map(([a, b]) => (
                  <details key={a}>
                    <summary>{a}</summary>
                    <p>{b}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
          <aside>
            <div className={s.card}>
              <h2>Ringkasan</h2>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{c.nl}</label>
              <input
                inputMode="numeric"
                placeholder={c.ph}
                value={num}
                onChange={(e) => setNum(e.target.value)}
              />
              <div className={s.li}>
                <span>Produk</span>
                <b>{sp}</b>
              </div>
              <div className={s.li}>
                <span>Harga</span>
                <b>{sh}</b>
              </div>
              <div className={s.li}>
                <span>Biaya admin</span>
                <b>Rp 1.500</b>
              </div>
              <div className={s.tot}>
                <span>Total</span>
                <b>{stt}</b>
              </div>
              <button className={`${s.btn} ${s.full}`} onClick={go}>
                Lanjut Bayar →
              </button>
              <div className={s.feat}>
                <span>
                  <Ic n="clock" /> Proses otomatis 24 jam
                </span>
                <span>
                  <Ic n="shield" /> Transaksi aman &amp; terenkripsi
                </span>
                <span>
                  <Ic n="check" /> Garansi uang kembali jika gagal
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer>
        © 2026 VENCORAGO ·{" "}
        <Link href="/status" style={{ color: "var(--teal)", fontWeight: 600 }}>
          Cek status transaksi
        </Link>
      </footer>

      <div className={s.bar}>
        <div className={s.barInfo}>
          <small>Total</small>
          <b>{stt}</b>
        </div>
        <button className={s.btn} onClick={go}>
          Lanjut Bayar →
        </button>
      </div>
    </div>
  );
}
