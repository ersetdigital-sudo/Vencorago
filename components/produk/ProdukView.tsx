"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import s from "./produk.module.css";
import { CATS, K, checkNumber, normalizeNumber, rp } from "./data";

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

const ADMIN = 1500;

const FAQS: [string, string][] = [
  ["Berapa lama prosesnya?", "Rata-rata 5 detik sampai 3 menit setelah pembayaran terverifikasi."],
  ["Bagaimana kalau transaksi gagal?", "Dana dikembalikan 100% ke saldo atau rekening kamu maksimal 1x24 jam."],
  [
    "Apakah ada biaya tambahan?",
    "Harga di atas sudah termasuk margin produk. Biaya admin Rp 1.500, dan Virtual Account dikenakan tambahan Rp 2.500.",
  ],
  ["Bisa cek transaksi sebelumnya?", "Bisa, buka halaman Cek Status dan masukkan nomor invoice kamu."],
];

export default function ProdukView({
  k = "Pulsa",
  op: opParam = "",
  h = "",
}: {
  k?: string;
  op?: string;
  h?: string;
}) {
  const cat = k;
  const c = K[cat];
  const firstOp = opParam && c.ops[opParam] ? opParam : Object.keys(c.ops)[0];
  const [op, setOp] = useState(firstOp);
  // Nominal yang dikirim beranda langsung terpilih di grid item.
  const [selIdx, setSelIdx] = useState<number | null>(() => {
    const v = +h || 0;
    if (!v) return null;
    const i = c.ops[firstOp].findIndex((x) => x.v === v);
    return i < 0 ? null : i;
  });
  const [num, setNum] = useState("");
  const [err, setErr] = useState("");

  const items = c.ops[op];
  const isBill = c.kind == "tagihan";
  const showOps = Object.keys(c.ops).length > 1 || isBill;
  /* Kalau baris penyedia tidak dirender (kategori berpenyedia tunggal seperti Token
     PLN), judul section memakai label pilihan berikutnya supaya tidak menggantung. */
  const sectionTitle = showOps ? c.opLabel : c.nomLabel;
  /* Sub-judul hanya muncul kalau judul section sudah dipakai baris penyedia —
     tidak ada dua label berbeda untuk fungsi yang sama. */
  const showNomLabel = showOps && c.nomLabel;

  const sel = isBill ? { n: op, p: 0, v: 0, d: "" } : selIdx != null ? items[selIdx] : null;

  const harga = !sel ? "Belum dipilih" : isBill || !sel.p ? "Dicek otomatis" : rp(sel.p);
  const total = isBill || !sel || !sel.p ? (isBill ? "Dicek otomatis" : "Rp 0") : rp(sel.p + ADMIN);

  /* Belum ada produk dipilih: ringkasan menampilkan petunjuk, bukan angka Rp 0
     yang ditonjolkan. Perhitungannya sendiri tidak berubah. */
  const belumPilih = !isBill && !sel;

  /* Ringkasan ikut berubah begitu penyedia/nominal berganti karena semuanya
     diturunkan dari `sel` — tidak ada nilai yang disimpan terpisah. */
  const summary = (
    <>
      <div className={s.sumGroup}>
        <div className={s.li}>
          <span>Produk</span>
          <b>{cat}</b>
        </div>
        <div className={s.li}>
          <span>Penyedia</span>
          <b>{op}</b>
        </div>
        {isBill ? (
          <div className={s.li}>
            <span>Tagihan</span>
            <b>Dicek otomatis</b>
          </div>
        ) : (
          <>
            <div className={s.li}>
              <span>{c.kind == "paket" ? "Paket" : "Nominal"}</span>
              <b className={belumPilih ? s.liEmpty : undefined}>{sel ? sel.n : "Belum dipilih"}</b>
            </div>
            {c.kind == "paket" && sel ? (
              <div className={s.li}>
                <span>Masa aktif</span>
                <b>{sel.d}</b>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className={s.sumGroup}>
        <div className={s.li}>
          <span>Harga</span>
          <b className={belumPilih ? s.liEmpty : undefined}>{belumPilih ? "—" : harga}</b>
        </div>
        <div className={s.li}>
          <span>Biaya admin</span>
          <b>{rp(ADMIN)}</b>
        </div>
      </div>
      <div className={`${s.tot} ${belumPilih ? s.totEmpty : ""}`}>
        <span>Total</span>
        <b>{belumPilih ? "—" : total}</b>
      </div>
      {belumPilih ? (
        <p className={s.sumHint}>
          Pilih {c.kind == "paket" ? "paket data" : "nominal"} di atas untuk melihat total pembayaran.
        </p>
      ) : null}
    </>
  );

  function pickItem(i: number) {
    setSelIdx(i);
    setErr("");
  }

  function go() {
    if (!sel) return setErr(c.kind == "paket" ? "Pilih paket data dulu" : "Pilih nominal dulu");
    const bad = checkNumber(cat, num);
    if (bad) return setErr(bad);
    setErr("");
    const n = normalizeNumber(num);
    /* Paket sudah punya harga jual sendiri, sedangkan pulsa/token/e-wallet
       dikirim sebagai nominal supaya checkout menghitung marginnya. */
    const hargaKirim = c.kind == "paket" ? sel.p : sel.v;
    location.href = `/?k=${encodeURIComponent(cat)}&h=${hargaKirim}&p=${encodeURIComponent(
      isBill ? op : op + " " + sel.n
    )}&no=${n}`;
  }

  const how = isBill
    ? [
        `Pilih ${c.opLabel.replace("Pilih ", "").toLowerCase()}`,
        `Masukkan ${c.nl.toLowerCase()}`,
        "Klik Lanjut Bayar lalu cek detail tagihan",
        "Pilih metode bayar: QRIS, Virtual Account, atau DANA",
        "Nominal tagihan muncul setelah data pelanggan ditemukan",
      ]
    : [
        showOps ? "Pilih operator dan nominal" : "Pilih nominal",
        `Masukkan ${c.nl.toLowerCase()}`,
        "Klik Lanjut Bayar lalu cek detail pesanan",
        "Pilih metode bayar: QRIS, Virtual Account, atau DANA",
        cat == "Token PLN"
          ? "Token listrik langsung muncul setelah pembayaran"
          : "Transaksi diproses otomatis, cek status kapan saja",
      ];

  const numInput = (
    <input
      id="nomor"
      inputMode="numeric"
      enterKeyHint="go"
      placeholder={c.ph}
      aria-invalid={Boolean(err)}
      value={num}
      onChange={(e) => {
        setNum(e.target.value);
        if (err) setErr("");
      }}
      onKeyDown={(e) => {
        if (e.key == "Enter") go();
      }}
    />
  );

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
              <h2>{isBill ? "Data Pelanggan" : "Nomor Tujuan"}</h2>
              <label htmlFor="nomor-mobile" className={s.lbl}>
                {c.nl}
              </label>
              <input
                id="nomor-mobile"
                inputMode="numeric"
                enterKeyHint="go"
                placeholder={c.ph}
                aria-invalid={Boolean(err)}
                value={num}
                onChange={(e) => {
                  setNum(e.target.value);
                  if (err) setErr("");
                }}
                onKeyDown={(e) => {
                  if (e.key == "Enter") go();
                }}
              />
              {err ? (
                <p className={s.err} role="alert">
                  {err}
                </p>
              ) : null}
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
              <h2>{sectionTitle}</h2>
              {showOps ? (
                <div className={s.ops} role="group" aria-label={c.opLabel}>
                  {Object.keys(c.ops).map((o) => (
                    <div
                      key={o}
                      className={`${s.op} ${o == op ? s.on : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={o == op}
                      onClick={() => {
                        setOp(o);
                        setSelIdx(null);
                        setErr("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key == "Enter" || e.key == " ") {
                          e.preventDefault();
                          setOp(o);
                          setSelIdx(null);
                          setErr("");
                        }
                      }}
                    >
                      {/* Tidak ada aset logo resmi di proyek ini, jadi semua
                          penyedia memakai monogram seragam dari namanya. */}
                      <span className={s.opMark} aria-hidden="true">
                        {o.charAt(0)}
                      </span>
                      {o}
                    </div>
                  ))}
                </div>
              ) : null}

              {isBill ? (
                <div className={s.billWrap}>
                  <p className={s.note}>
                    Nominal tagihan dicek otomatis berdasarkan {c.nl}. Angka di bawah hanya
                    gambaran; tagihan asli muncul setelah data pelanggan ditemukan.
                  </p>
                  <div className={s.bill}>
                    {Object.entries(c.bill ?? {}).map(([a, b]) => (
                      <div key={a}>
                        {a}
                        <b>{b}</b>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {showNomLabel ? <div className={s.lbl}>{c.nomLabel}</div> : null}
                  {items.length == 0 ? (
                    <p className={s.emptyItems}>
                      Belum ada {c.kind == "paket" ? "paket" : "nominal"} untuk {op}.
                    </p>
                  ) : (
                    <div className={s.items}>
                      {items.map((x, i) => (
                        <div
                          key={i}
                          className={`${s.it} ${selIdx == i ? s.on : ""} ${c.kind == "paket" ? s.pk : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selIdx == i}
                          onClick={() => pickItem(i)}
                          onKeyDown={(e) => {
                            if (e.key == "Enter" || e.key == " ") {
                              e.preventDefault();
                              pickItem(i);
                            }
                          }}
                        >
                          {c.kind == "paket" ? (
                            <>
                              <b className={s.quota}>{x.n}</b>
                              <span className={s.pkChips}>
                                {x.d.split(",").map((part) => (
                                  <span key={part}>{part.trim()}</span>
                                ))}
                              </span>
                              <span className={s.pkgRow}>
                                <span className={s.pr}>{rp(x.p)}</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <b>{x.n}</b>
                              <span className={s.pr}>{rp(x.p)}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`${s.card} ${s.mobileSum}`}>
              <h2>Ringkasan</h2>
              {summary}
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
              <label htmlFor="nomor" className={s.lbl}>
                {c.nl}
              </label>
              {numInput}
              {err ? (
                <p className={s.err} role="alert">
                  {err}
                </p>
              ) : null}
              {summary}
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
          <b>{belumPilih ? "—" : total}</b>
        </div>
        <button className={s.btn} onClick={go}>
          Lanjut Bayar →
        </button>
      </div>
    </div>
  );
}
