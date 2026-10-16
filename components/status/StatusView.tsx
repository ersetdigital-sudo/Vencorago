"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import s from "./status.module.css";

type Tx = {
  inv: string;
  prod: string;
  cat: string;
  no: string;
  pm: string;
  total: number;
  status: "pending" | "success";
  sn: string;
  time: number;
  paid: number | null;
};

const WA = "6281234567890";
const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const dt = (t: number) =>
  new Date(t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
const LBL: Record<string, string> = {
  success: "Berhasil",
  pending: "Menunggu Pembayaran",
  expired: "Kedaluwarsa",
};

function db(): Record<string, Tx> {
  try {
    return JSON.parse(localStorage.getItem("vcr_tx") || "{}");
  } catch {
    return {};
  }
}

function stat(t: Tx) {
  if (t.status == "pending" && Date.now() - t.time > 15 * 60e3) return "expired";
  return t.status;
}

export default function StatusView() {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Tx | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hist, setHist] = useState<Tx[]>([]);

  /* Invoice dicari di Supabase lewat /api/tx — jadi status bisa dicek dari
     perangkat mana pun, bukan cuma dari HP yang memesan. */
  async function find(input: string, scroll = false) {
    const inv = input.trim().toUpperCase();
    if (!inv) return;
    window.history.replaceState(null, "", "?inv=" + inv);
    setQ(inv);
    let t: Tx | null = null;
    try {
      const r = await fetch(`/api/tx?inv=${encodeURIComponent(inv)}`);
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; tx?: Tx | null };
      t = r.ok && j.ok ? (j.tx ?? null) : null;
    } catch {
      t = null;
    }
    /* Kalau Supabase belum dikonfigurasi (atau jaringan putus), pakai salinan di
       perangkat ini supaya pelanggan tetap bisa melihat order miliknya. */
    if (!t) t = db()[inv] ?? null;
    if (!t) {
      setFound(null);
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setFound(t);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    setHist(Object.values(db()).sort((a, b) => b.time - a.time).slice(0, 5));
    const p = new URLSearchParams(window.location.search).get("inv");
    if (p) find(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = found ? stat(found) : "";

  return (
    <div className={s.pg}>
      <Header
        s={s}
        menu={[
          { label: "Beranda", href: "/" },
          { label: "Produk", href: "/produk" },
          { label: "Cek Status", href: "/status", on: true },
          { label: "Cara Bayar", href: "/cara-bayar" },
          { label: "Bantuan", href: "/bantuan" },
          { label: "Kontak", href: "/kontak" },
        ]}
      />

      <main className={s.wrap}>
        <section className={s.hero}>
          <div className={s.kick}>LACAK PESANAN KAMU</div>
          <h1>
            Cek Status <em>Transaksi</em>
          </h1>
          <p>Masukkan nomor invoice untuk melihat status pembayaran dan pesanan.</p>
        </section>
        <form
          className={s.box}
          onSubmit={(e) => {
            e.preventDefault();
            find(q);
          }}
        >
          <input
            placeholder="Contoh: VCR123456789"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className={s.gold}>Cek Status</button>
        </form>
        <div className={s.res}>
          {notFound && (
            <div className={`${s.card} ${s.empty}`}>
              <b style={{ color: "var(--ink)" }}>Invoice tidak ditemukan</b>
              <br />
              Pastikan nomor invoice benar, atau hubungi CS kami.
            </div>
          )}
          {found && (
            <div className={s.card} key={found.inv}>
              <div className={s.head}>
                <div>
                  <small style={{ color: "var(--mut)" }}>No. Invoice</small>
                  <br />
                  <b style={{ fontSize: 18 }}>{found.inv}</b>
                </div>
                <span className={`${s.badge} ${s[state]}`}>{LBL[state]}</span>
              </div>
              <div className={s.li}>
                <span>Produk</span>
                <b>{found.prod}</b>
              </div>
              <div className={s.li}>
                <span>No. Pelanggan</span>
                <b>{found.no}</b>
              </div>
              <div className={s.li}>
                <span>Metode</span>
                <b>{found.pm}</b>
              </div>
              <div className={s.li}>
                <span>Total</span>
                <b style={{ color: "var(--teal)" }}>{rp(found.total)}</b>
              </div>
              <div className={s.tl}>
                <div className={s.on}>
                  Pesanan dibuat
                  <small>{dt(found.time)}</small>
                </div>
                <div className={state == "success" ? s.on : undefined}>
                  {state == "expired" ? "Batas waktu pembayaran habis" : "Pembayaran diterima"}
                  <small>
                    {state == "success"
                      ? dt(found.paid as number)
                      : state == "expired"
                        ? dt(found.time + 15 * 60e3)
                        : "Menunggu pembayaran..."}
                  </small>
                </div>
                <div className={state == "success" ? s.on : undefined}>
                  Pesanan selesai diproses
                  <small>{state == "success" ? dt(found.paid as number) : "-"}</small>
                </div>
              </div>
              {state == "success" && found.sn ? (
                <div className={s.sn}>
                  <small>{found.cat == "Token PLN" ? "Token Listrik" : "Serial Number"}</small>
                  <br />
                  <b>{found.sn}</b>
                </div>
              ) : null}
              <div className={s.acts}>
                {state != "success" && (
                  <Link className={s.btn} href="/">
                    Buat Pesanan Baru
                  </Link>
                )}
                <a
                  className={`${s.btn} ${s.ghost}`}
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${WA}?text=Halo%20VENCORAGO,%20saya%20mau%20tanya%20invoice%20${found.inv}`}
                >
                  Tanya CS
                </a>
              </div>
            </div>
          )}
        </div>
        <div className={s.res}>
          {hist.length > 0 && (
            <>
              <h3>Transaksi terakhir di perangkat ini</h3>
              <div className={s.hist}>
                {hist.map((t) => {
                  const bs = stat(t);
                  return (
                    <a
                      key={t.inv}
                      href={`?inv=${t.inv}`}
                      onClick={(e) => {
                        e.preventDefault();
                        find(t.inv, true);
                      }}
                    >
                      <span>
                        <b>{t.inv}</b>
                        <br />
                        <small style={{ color: "var(--mut)" }}>
                          {t.prod} · {rp(t.total)}
                        </small>
                      </span>
                      <span className={`${s.badge} ${s[bs]}`}>{LBL[bs]}</span>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <footer>
        © 2026 VENCORAGO. Butuh bantuan?{" "}
        <a href={`https://wa.me/${WA}`} style={{ color: "var(--teal)", fontWeight: 600 }}>
          Chat WhatsApp
        </a>
      </footer>
    </div>
  );
}
