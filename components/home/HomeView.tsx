"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import s from "./home.module.css";
import { K, checkNumber, normalizeNumber, nominalsOf } from "@/components/produk/data";
import { fetchQris } from "@/lib/qris";

const SV = {
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1" />
      <rect x="17" y="14" width="4" height="6" rx="1" />
    </>
  ),
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  wifi: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
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
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 12h11L21 7H6" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M21 14v7h-4" />
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

const WA = "6281234567890";
const ADMIN = 1500;
const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const NAMES = ["Budi Santoso", "Siti Rahma", "Andi Pratama", "Dewi Lestari"];

/* Ikon dan teks singkat khusus beranda; daftar nominalnya diturunkan dari
   katalog di components/produk/data.ts supaya pilihan cepat di sini tidak
   menyimpang dari halaman produk. Kategori paket dan tagihan tidak punya
   nominal tetap, jadi pilihannya diarahkan ke halaman produk. */
type Cat = [string, string, string, number[] | null];
const TILES: [string, string, string][] = [
  ["phone", "Pulsa", "Pulsa semua operator"],
  ["wifi", "Paket Data", "Internet lebih hemat"],
  ["zap", "Token PLN", "Listrik prabayar"],
  ["drop", "PDAM", "Tagihan air daerah"],
  ["shield", "BPJS Kesehatan", "Bayar lebih mudah"],
  ["tv", "Internet & TV", "IndiHome, First, dll"],
  ["wallet", "E-Wallet", "DANA, OVO, GoPay"],
  ["bank", "Multifinance", "Angsuran kendaraan"],
];
const C: Cat[] = TILES.map(([icon, name, desc]) => {
  const noms = K[name]?.kind == "nominal" ? nominalsOf(name) : [];
  return [icon, name, desc, noms.length ? noms : null];
});

const BILL: Record<string, number> = {
  PDAM: 87500,
  "BPJS Kesehatan": 150000,
  "Internet & TV": 385000,
  Multifinance: 1250000,
};

/* [icon, nama produk, nominal, kategori (param k), operator (param op)] */
type Prod = [string, string, number, string, string];
const P: Prod[] = [
  ["wallet", "Saldo DANA", 1e5, "E-Wallet", "DANA"],
  ["phone", "Pulsa Telkomsel", 25e3, "Pulsa", "Telkomsel"],
  ["zap", "Token PLN", 5e4, "Token PLN", "PLN Prabayar"],
  ["wallet", "Saldo OVO", 2e5, "E-Wallet", "OVO"],
];

/* Kartu produk mengarah ke halaman detail `/produk` dengan operator dan nominal
   yang sudah terpilih, bukan quick-pick di checkout halaman ini. */
const detailHref = (p: Prod) =>
  `/produk?k=${encodeURIComponent(p[3])}&op=${encodeURIComponent(p[4])}&h=${p[2]}`;

type PayMethod = [string, string, string, number];
const PM: PayMethod[] = [
  ["qr", "QRIS", "Semua e-wallet & m-banking", 0],
  ["card", "Virtual Account BCA", "Cek otomatis", 2500],
  ["card", "Virtual Account Mandiri", "Cek otomatis", 2500],
  ["wallet", "DANA", "Bayar langsung", 0],
];

type St = {
  cat: string;
  h: number;
  prod: string;
  no: string;
  name: string;
  pm: number;
  inv: string;
  sn: string;
};
const EMPTY: St = { cat: "", h: 0, prod: "", no: "", name: "", pm: 0, inv: "", sn: "" };

type View = "empty" | "pick" | "loading" | "detail" | "pay" | "verifying" | "done";
const STEP: Record<View, number> = {
  empty: 0,
  pick: 1,
  loading: 2,
  detail: 2,
  pay: 3,
  verifying: 3,
  done: 4,
};

const catOf = (n: string | null | undefined) => C.find((c) => c[1] === n);

/* Margin produk — rumus yang sama dengan components/produk/data.ts (N()): nominal
   di bawah Rp 20.000 kena Rp 1.000, sisanya Rp 500. Kategori tagihan (nominalnya
   null) tidak pakai margin karena angka yang dibayar adalah tagihannya. */
const margin = (v: number) => (v < 2e4 ? 1000 : 500);

/* Yang dibayar pelanggan: harga produk (nominal + margin) + biaya metode + biaya
   admin. Ini rumus yang dipakai halaman detail produk dan data demo di admin,
   jadi checkout di sini harus menghasilkan angka yang sama. */
function totalOf(h: number, cat: string | null | undefined, pm: number) {
  /* Belum ada produk yang dipilih berarti belum ada yang dibayar. */
  if (!h) return { margin: 0, total: 0 };
  const m = catOf(cat)?.[3] && h ? margin(h) : 0;
  return { margin: m, total: h + m + PM[pm][3] + ADMIN };
}

function QrSvg() {
  const rects: ReactNode[] = [];
  for (let i = 0; i < 21; i++)
    for (let j = 0; j < 21; j++) {
      const f = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
      const on = f
        ? (i % 14 == 0 ||
            i % 14 == 6 ||
            j % 14 == 0 ||
            j % 14 == 6 ||
            (i % 14 > 1 && i % 14 < 5 && j % 14 > 1 && j % 14 < 5)) &&
          !(i % 14 > 4 && i % 14 < 6)
        : (i * 7 + j * 13 + i * j) % 3 == 0;
      if (
        on &&
        !(
          f &&
          (((i % 14 == 1 || i % 14 == 5) && j % 14 > 0 && j % 14 < 6) ||
            ((j % 14 == 1 || j % 14 == 5) && i % 14 > 0 && i % 14 < 6))
        )
      )
        rects.push(<rect key={`${i}-${j}`} x={j} y={i} width="1" height="1" />);
    }
  return (
    <svg viewBox="0 0 21 21" width="100%" height="100%" fill="#111">
      {rects}
    </svg>
  );
}

type Seed = { st: St; view: View; sel: string; num: string; toast: string };

function seedState(k: string, h: string, p: string, no: string): Seed {
  const c = catOf(k);
  if (!c) return { st: EMPTY, view: "empty", sel: "", num: "", toast: "" };
  const hNum = +h || 0;
  const base: St = { cat: k, h: hNum, prod: p || k, no: "", name: "", pm: 0, inv: "", sn: "" };
  if (!no) return { st: base, view: "pick", sel: k, num: "", toast: "" };
  if (c[3] && !hNum)
    return { st: base, view: "pick", sel: k, num: no, toast: "Pilih nominal dulu" };
  const bad = checkNumber(k, no);
  if (bad) return { st: base, view: "pick", sel: k, num: no, toast: bad };
  const noNorm = normalizeNumber(no);
  return {
    /* Kategori tagihan memakai nominal contoh dari BILL; kategori paket sudah
       membawa harga paketnya sendiri dari halaman produk. */
    st: { ...base, h: c[3] ? hNum : (BILL[k] ?? hNum), no: noNorm, name: NAMES[noNorm.length % 4] },
    view: "loading",
    sel: k,
    num: noNorm,
    toast: "",
  };
}

export default function HomeView({
  k = "",
  h = "",
  p = "",
  no = "",
}: {
  k?: string;
  h?: string;
  p?: string;
  no?: string;
}) {
  const seed = seedState(k, h, p, no);
  const [st, setSt] = useState<St>(seed.st);
  const [view, setView] = useState<View>(seed.view);
  const [sel, setSel] = useState(seed.sel);
  const [num, setNum] = useState(seed.num);
  const [secs, setSecs] = useState(900);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qrisTried = useRef(false);

  const [qrisUrl, setQrisUrl] = useState<string | null>(null);

  /* Foto QRIS dari Supabase baru diambil saat user masuk langkah bayar (bukan
     saat halaman dibuka). Kalau belum ada foto atau Supabase belum terhubung,
     tetap pakai QR placeholder seperti semula. */
  useEffect(() => {
    if (view !== "pay" || qrisTried.current) return;
    qrisTried.current = true;
    fetchQris().then((r) => {
      if (r.url) setQrisUrl(r.url);
    });
  }, [view]);

  const cat = catOf(st.cat);
  const catKind = K[st.cat]?.kind;
  const price = totalOf(st.h, st.cat, st.pm);
  const pmFee = PM[st.pm][3] + ADMIN;
  const step = STEP[view];
  const total = rp(price.total);

  function toast(t: string) {
    setToastMsg(t);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2200);
  }

  function start() {
    setSt(EMPTY);
    setView("empty");
  }

  function pick(name: string, h = 0) {
    if (!name) return start();
    setSel(name);
    setSt({ ...EMPTY, cat: name, h: h || 0, prod: name });
    /* Nomor tujuan tidak boleh tertinggal dari kategori sebelumnya: nomor HP
       tidak berlaku sebagai nomor kontrak atau ID pelanggan. */
    if (name != st.cat) setNum("");
    setView("pick");
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function pickNominal(v: number) {
    setSt((prev) => ({ ...prev, h: v }));
  }

  function cek() {
    const c = catOf(st.cat);
    if (!c) return toast("Pilih produk dulu ya");
    if (K[st.cat]?.kind == "paket") return toast("Paket data dipilih dari halaman Produk");
    if (c[3] && !st.h) return toast("Pilih nominal dulu");
    const bad = checkNumber(st.cat, num);
    if (bad) return toast(bad);
    const no = normalizeNumber(num);
    setView("loading");
    setTimeout(() => {
      setSt((prev) => ({
        ...prev,
        h: c[3] ? prev.h : (BILL[c[1]] ?? prev.h),
        no,
        name: NAMES[no.length % 4],
        pm: 0,
      }));
      setView("detail");
    }, 1100);
  }

  function selectPm(i: number) {
    setSt((prev) => ({ ...prev, pm: i }));
  }

  function save(status: "pending" | "success", patch: Partial<St>) {
    const cur = { ...st, ...patch };
    const d = JSON.parse(localStorage.getItem("vcr_tx") || "{}");
    d[cur.inv] = {
      inv: cur.inv,
      prod: cur.prod,
      cat: cur.cat,
      no: cur.no,
      name: cur.name,
      pm: PM[cur.pm][1],
      total: totalOf(cur.h, cur.cat, cur.pm).total,
      status,
      sn: cur.sn || "",
      time: d[cur.inv]?.time || Date.now(),
      paid: status == "success" ? Date.now() : null,
    };
    localStorage.setItem("vcr_tx", JSON.stringify(d));
  }

  function pay() {
    const inv = "VCR" + Date.now().toString().slice(-9);
    setSt((prev) => ({ ...prev, inv }));
    setView("pay");
    save("pending", { inv });
    asideRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function check() {
    setView("verifying");
    setTimeout(done, 1600);
  }

  function done() {
    const tok =
      st.cat == "Token PLN"
        ? Array.from({ length: 5 }, () => String((1000 + Math.random() * 9000) | 0)).join("-")
        : "SN" + Date.now().toString().slice(-10);
    setSt((prev) => ({ ...prev, sn: tok }));
    save("success", { sn: tok });
    setView("done");
  }

  function wa() {
    const m = `Halo VENCORAGO, transaksi saya:%0AInvoice: ${st.inv}%0AProduk: ${st.prod}%0ANomor: ${st.no}%0ATotal: ${total}%0ASN: ${st.sn}`;
    window.open(`https://wa.me/${WA}?text=${m}`, "_blank");
  }

  useEffect(() => {
    if (view != "pay") return;
    setSecs(900);
    const t = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          toast("Waktu habis, silakan ulangi");
          setView("detail");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [view]);

  useEffect(() => {
    if (seed.toast) toast(seed.toast);
    if (seed.sel) searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (seed.view != "loading") return;
    const t = setTimeout(() => setView("detail"), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/", on: true },
          { label: "Produk", href: "/produk" },
          { label: "Cara Bayar", href: "/cara-bayar" },
          { label: "Cek Status", href: "/status" },
          { label: "Bantuan", href: "/bantuan" },
          { label: "Kontak", href: "/kontak" },
        ]}
        btnIcon={
          <i className={s.ic}>
            <Ic n="chat" />
          </i>
        }
      />

      <section className={`${s.wrap} ${s.hero}`}>
        <div>
          <div className={s.kick}>SOLUSI PEMBAYARAN DIGITAL ANDA</div>
          <h1>
            Top Up &amp; Bayar Tagihan,
            <br />
            <em>Jadi Sederhana.</em>
          </h1>
          <p>
            Top up e-wallet, pulsa, token listrik, dan tagihan dalam satu tempat. Proses cepat 24
            jam, aman dan terpercaya.
          </p>
          <div className={s.perks}>
            <div className={s.perk}>
              <i>
                <i className={s.ic}>
                  <Ic n="zap" />
                </i>
              </i>
              <div>
                Proses instan<small>24 jam online</small>
              </div>
            </div>
            <div className={s.perk}>
              <i>
                <i className={s.ic}>
                  <Ic n="shield" />
                </i>
              </i>
              <div>
                Transaksi aman<small>Data terlindungi</small>
              </div>
            </div>
            <div className={s.perk}>
              <i>
                <i className={s.ic}>
                  <Ic n="headset" />
                </i>
              </i>
              <div>
                Harga terbaik<small>Selalu update</small>
              </div>
            </div>
          </div>
        </div>
        <div className={s.art}>
          <div className={s.phone}>
            <div>
              <Logo className={s.lm} lwClass={s.lw} />
              <br />
              <small style={{ font: "12px Inter", color: "#6b7774" }}>Pembayaran Lebih Mudah</small>
            </div>
          </div>
          <div className={`${s.chip} ${s.chip1}`}>
            <span>
              <i className={s.ic}>
                <Ic n="zap" />
              </i>
            </span>
            PLN Prabayar
          </div>
          <div className={`${s.chip} ${s.chip2}`}>
            <span>
              <i className={s.ic}>
                <Ic n="drop" />
              </i>
            </span>
            PDAM
          </div>
          <div className={`${s.chip} ${s.chip3}`}>
            <span>
              <i className={s.ic}>
                <Ic n="wifi" />
              </i>
            </span>
            Internet
          </div>
          <div className={`${s.chip} ${s.chip4}`}>
            <span>
              <i className={s.ic}>
                <Ic n="shield" />
              </i>
            </span>
            BPJS
          </div>
        </div>
      </section>

      <div className={s.wrap}>
        <div className={s.search} ref={searchRef}>
          <div>
            <label>Pilih Produk</label>
            <select value={sel} onChange={(e) => pick(e.target.value)}>
              <option value="">Pilih layanan</option>
              {C.map((c) => (
                <option key={c[1]} value={c[1]}>
                  {c[1]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Nomor Pelanggan</label>
            <input
              ref={numRef}
              inputMode="numeric"
              placeholder="Masukkan nomor pelanggan"
              value={num}
              onChange={(e) => setNum(e.target.value)}
            />
          </div>
          <button className={s.gold} onClick={cek}>
            Cek &amp; Bayar →
          </button>
        </div>
      </div>

      <section className={`${s.wrap} ${s.main}`}>
        <div>
          <h2 id="layanan">
            Kategori <small>— Pilih layanan yang kamu butuhkan</small>
          </h2>
          <div className={s.cats}>
            {C.map((c) => (
              <div
                key={c[1]}
                className={`${s.cat} ${st.cat == c[1] ? s.on : ""}`}
                onClick={() => {
                  pick(c[1]);
                  numRef.current?.focus();
                }}
              >
                <i>
                  <Ic n={c[0] as IconName} />
                </i>
                <b>{c[1]}</b>
                <small>{c[2]}</small>
                <Link
                  href={`/produk?k=${encodeURIComponent(c[1])}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "block", marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--teal)" }}
                >
                  Lihat detail →
                </Link>
              </div>
            ))}
          </div>
          <div className={s.kick} style={{ fontFamily: "'DM Serif Display'", letterSpacing: 0, fontSize: 18 }}>
            Produk Pilihan
          </div>
          <h2 style={{ marginTop: 0 }}>Paling sering dibeli.</h2>
          <div className={s.prods}>
            {P.map((p) => (
              <div className={s.prod} key={p[1]}>
                <div className={s.t}>
                  <span className={s.pi}>
                    <Ic n={p[0] as IconName} />
                  </span>
                  <div>
                    {p[1]}
                    <br />
                    <b>{rp(p[2])}</b>
                  </div>
                </div>
                <span className={s.tag}>Harga bersaing</span>
                <div className={s.row}>
                  {rp(p[2] + margin(p[2]))}
                  <Link className={s.btn} href={detailHref(p)} aria-label={`Beli ${p[1]} — buka halaman detail produk`}>
                    <Ic n="cart" /> Beli
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside ref={asideRef}>
          <div className={s.card}>
            <div className={s.steps}>
              {["Produk", "Detail", "Bayar", "Selesai"].map((label, i) => (
                <div key={label} className={i < step ? s.on : undefined}>
                  {i + 1}
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className={s.pbody} key={view}>
              {view == "empty" && (
                <div className={s.empty}>
                  <div className={s.pi}>
                    <Ic n="receipt" />
                  </div>
                  <b style={{ color: "var(--ink)" }}>Belum ada transaksi</b>
                  <br />
                  Pilih layanan atau produk untuk memulai.
                </div>
              )}

              {view == "pick" && cat && (
                <>
                  <div className={s.lbl} style={{ marginTop: 0 }}>
                    Layanan
                  </div>
                  <div className={s.cust}>
                    <span className={s.pi}>
                      <Ic n={cat[0] as IconName} />
                    </span>
                    <b>{st.cat}</b>
                  </div>
                  {cat[3] ? (
                    <>
                      <div className={s.lbl}>{K[st.cat]?.nomLabel || "Pilih nominal"}</div>
                      <div className={s.noms}>
                        {cat[3].map((v) => (
                          <div
                            key={v}
                            className={`${s.nom} ${v == st.h ? s.on : ""}`}
                            onClick={() => pickNominal(v)}
                          >
                            <b>{rp(v)}</b>
                            <small>Harga {rp(v + margin(v))}</small>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : catKind == "paket" ? (
                    <p style={{ fontSize: 13, color: "var(--mut)", margin: "12px 0" }}>
                      Paket data dipilih per paket beserta masa aktifnya di halaman produk.{" "}
                      <Link
                        href={`/produk?k=${encodeURIComponent(st.cat)}`}
                        style={{ color: "var(--teal)", fontWeight: 600 }}
                      >
                        Lihat daftar paket →
                      </Link>
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--mut)", margin: "12px 0" }}>
                      Tagihan akan dicek otomatis setelah kamu memasukkan nomor pelanggan.
                    </p>
                  )}
                  {catKind != "paket" ? (
                    <button className={`${s.btn} ${s.full}`} onClick={cek}>
                      Lanjut Cek Tagihan →
                    </button>
                  ) : null}
                </>
              )}

              {view == "loading" && (
                <>
                  <div className={s.spin}></div>
                  <p className={s.empty} style={{ padding: 0 }}>
                    Mengecek data pelanggan...
                  </p>
                </>
              )}

              {view == "detail" && (
                <>
                  <div className={s.cust}>
                    <span className={s.pi}>
                      <Ic n="user" />
                    </span>
                    <div>
                      <small style={{ color: "var(--mut)" }}>Nama pelanggan</small>
                      <br />
                      <b>{st.name}</b>
                    </div>
                  </div>
                  <div className={s.li}>
                    <span>Produk</span>
                    <b>{st.prod}</b>
                  </div>
                  {cat?.[3] && st.prod == st.cat ? (
                    <div className={s.li}>
                      <span>Nominal</span>
                      <b>{rp(st.h)}</b>
                    </div>
                  ) : null}
                  <div className={s.li}>
                    <span>No. Pelanggan</span>
                    <b>{st.no}</b>
                  </div>
                  <div className={s.li}>
                    <span>{BILL[st.cat] ? "Tagihan (contoh)" : "Harga"}</span>
                    <b>{rp(st.h + price.margin)}</b>
                  </div>
                  <small style={{ display: "block", fontSize: 11, color: "var(--mut)", marginTop: 2 }}>
                    Nama pelanggan di atas masih data contoh; pengecekan ke penyedia belum terhubung.
                  </small>
                  <div className={s.li}>
                    <span>Biaya admin</span>
                    <b>{rp(pmFee)}</b>
                  </div>
                  <div className={s.lbl}>Metode pembayaran</div>
                  {PM.map((m, i) => (
                    <div
                      key={m[1]}
                      className={`${s.pm} ${i == st.pm ? s.on : ""}`}
                      onClick={() => selectPm(i)}
                    >
                      <span className={s.ic}>
                        <Ic n={m[0] as IconName} />
                      </span>
                      <b>{m[1]}</b>
                      <em>{m[3] ? "+" + rp(m[3]) : m[2]}</em>
                    </div>
                  ))}
                  <div className={s.tot}>
                    <span>Total</span>
                    <b>{total}</b>
                  </div>
                  <button className={`${s.btn} ${s.full}`} onClick={pay}>
                    Bayar Sekarang
                  </button>
                  <button
                    className={`${s.btn} ${s.full} ${s.ghost}`}
                    onClick={() => pick(st.cat, st.h)}
                  >
                    Ubah pesanan
                  </button>
                </>
              )}

              {view == "pay" && (
                <>
                  <div className={s.li}>
                    <span>No. Invoice</span>
                    <b>{st.inv}</b>
                  </div>
                  <div className={s.li}>
                    <span>Total bayar</span>
                    <b style={{ color: "var(--teal)", fontSize: 18 }}>{total}</b>
                  </div>
                  {st.pm == 0 && (
                    <div className={s.qrbox}>
                      <b>Scan QRIS</b>
                      <div className={s.q}>
                        {qrisUrl ? (
                          <img
                            className={s.qImg}
                            src={qrisUrl}
                            alt="QRIS VENCORAGO"
                            width={154}
                            height={154}
                          />
                        ) : (
                          <QrSvg />
                        )}
                      </div>
                      <small style={{ color: "var(--mut)" }}>
                        Bayar pakai DANA, OVO, GoPay, ShopeePay atau m-banking
                      </small>
                    </div>
                  )}
                  {st.pm == 3 && (
                    <div className={s.va}>
                      Kamu akan diarahkan ke aplikasi DANA
                      <br />
                      <small>Selesaikan pembayaran di aplikasi</small>
                    </div>
                  )}
                  {st.pm != 0 && st.pm != 3 && (
                    <div className={s.va}>
                      <small>Nomor {PM[st.pm][1]}</small>
                      <br />
                      <b>
                        8808 {st.inv.slice(-8, -4)} {st.inv.slice(-4)}
                      </b>
                      <br />
                      <button
                        className={`${s.btn} ${s.ghost}`}
                        style={{ marginTop: 8, padding: "6px 12px" }}
                        onClick={() => {
                          navigator.clipboard && navigator.clipboard.writeText("8808" + st.inv.slice(-8));
                          toast("Nomor VA disalin");
                        }}
                      >
                        <Ic n="copy" /> Salin
                      </button>
                    </div>
                  )}
                  <p style={{ textAlign: "center", fontSize: 12, color: "var(--mut)" }}>
                    <Ic n="clock" /> Selesaikan dalam{" "}
                    <b>
                      {mm}:{ss}
                    </b>
                  </p>
                  <button className={`${s.btn} ${s.full}`} onClick={check}>
                    Saya Sudah Bayar
                  </button>
                  <button
                    className={`${s.btn} ${s.full} ${s.ghost}`}
                    onClick={() => setView("detail")}
                  >
                    Ganti metode
                  </button>
                </>
              )}

              {view == "verifying" && (
                <>
                  <div className={s.spin}></div>
                  <p className={s.empty} style={{ padding: 0 }}>
                    Memverifikasi pembayaran...
                  </p>
                </>
              )}

              {view == "done" && (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div className={s.ok}>
                      <Ic n="check" />
                    </div>
                    <b style={{ fontSize: 18 }}>Transaksi Berhasil</b>
                    <p style={{ color: "var(--mut)", fontSize: 12, margin: "4px 0 14px" }}>
                      {new Date().toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className={s.li}>
                    <span>Invoice</span>
                    <b>{st.inv}</b>
                  </div>
                  <div className={s.li}>
                    <span>Produk</span>
                    <b>{st.prod}</b>
                  </div>
                  {cat?.[3] && st.prod == st.cat ? (
                    <div className={s.li}>
                      <span>Nominal</span>
                      <b>{rp(st.h)}</b>
                    </div>
                  ) : null}
                  <div className={s.li}>
                    <span>Pelanggan</span>
                    <b>{st.name}</b>
                  </div>
                  <div className={s.li}>
                    <span>Metode</span>
                    <b>{PM[st.pm][1]}</b>
                  </div>
                  <div className={s.li}>
                    <span>Total</span>
                    <b>{total}</b>
                  </div>
                  <Link
                    href={`/status?inv=${st.inv}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: 12,
                      color: "var(--teal)",
                      fontWeight: 600,
                      margin: "6px 0",
                    }}
                  >
                    Lihat status invoice →
                  </Link>
                  <div className={s.va}>
                    <small>{st.cat == "Token PLN" ? "Token Listrik" : "Serial Number"}</small>
                    <br />
                    <b style={{ fontSize: 16 }}>{st.sn}</b>
                  </div>
                  <button className={`${s.btn} ${s.full} ${s.wa}`} onClick={wa}>
                    <Ic n="chat" /> Kirim bukti via WhatsApp
                  </button>
                  <button
                    className={`${s.btn} ${s.full} ${s.ghost}`}
                    onClick={() => {
                      setNum("");
                      start();
                    }}
                  >
                    Transaksi Baru
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </section>

      <footer id="kontak">
        <div className={`${s.wrap} ${s.fgrid}`}>
          <div>
            <div className={s.logo} style={{ color: "#16302e" }}>
              <Logo className={s.lm} lwClass={s.lw} />
            </div>
            <p style={{ marginTop: 10 }}>
              Solusi pembayaran digital yang aman, cepat dan terpercaya untuk kebutuhan harian kamu.
            </p>
          </div>
          <div>
            <h4>Menu</h4>
            <Link href="/">Beranda</Link>
            <a href="#layanan">Layanan</a>
            <Link href="/cara-bayar">Cara Bayar</Link>
            <Link href="/kontak">Kontak</Link>
          </div>
          <div>
            <h4>Bantuan</h4>
            <Link href="/bantuan">Pusat Bantuan</Link>
            <a>Syarat &amp; Ketentuan</a>
            <a>Kebijakan Privasi</a>
            <Link href="/status">Status Transaksi</Link>
          </div>
          <div>
            <h4>Hubungi Kami</h4>
            <a href="https://wa.me/6281234567890">
              <i className={s.ic}>
                <Ic n="chat" />
              </i>{" "}
              +62 812 3456 7890
            </a>
            <small>Online setiap hari (24 jam)</small>
          </div>
          <div>
            <h4>Metode Pembayaran</h4>
            <div className={s.pay}>
              <span>QRIS</span>
              <span>DANA</span>
              <span>OVO</span>
              <span>GoPay</span>
              <span>ShopeePay</span>
            </div>
          </div>
        </div>
        <div className={s.wrap} style={{ marginTop: 24 }}>
          © 2026 VENCORAGO. All rights reserved.
        </div>
      </footer>

      <div className={`${s.toast} ${toastOn ? s.show : ""}`}>{toastMsg}</div>
    </div>
  );
}
