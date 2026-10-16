"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon } from "./ui";
import { rp, rpShort } from "./data";
import { downloadCsv, groupBy, toCsv } from "./metrics";
import { useTx } from "./useTx";
import { alasanTidakTampil, type DataKatalog, type Entitas, type Item, type Penyedia } from "./katalog";

/* Halaman Produk: tempat mengatur produk yang tampil di beranda.

   Produknya sendiri hidup di tabel `catalog_items` Supabase (128 baris di
   katalog sekarang) — bukan di tabel transaksi. Karena itu halaman ini membaca
   katalog lewat /api/catalog (sesi admin, service role), bukan /api/tx:

   - "Kartu Produk Pilihan di beranda" menampilkan produk yang benar-benar
     dirender beranda, dengan urutan yang sama seperti beranda.
   - "Semua produk" = satu tabel seluruh produk + pencarian, filter kategori,
     kolom "Beranda" (tanda unggulan), dan "Label kartu".
   - Angka penjualan per produk ikut di bawah, tapi hanya muncul kalau sudah
     ada transaksi — biar halaman ini tidak pernah tampil seolah kosong.

   Setiap perubahan lewat /api/catalog dan cache tag `katalog` di-revalidate,
   jadi beranda ikut berubah tanpa deploy ulang. */

export default function ProdukView() {
  const [data, setData] = useState<DataKatalog | null>(null);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState("");
  const [hanyaTampil, setHanyaTampil] = useState(false);
  const { tx } = useTx();

  const muat = useCallback(async () => {
    try {
      const r = await fetch("/api/catalog");
      const j = (await r.json().catch(() => ({}))) as DataKatalog;
      if (r.ok && j.ok) {
        setData(j);
        setGalat("");
      } else {
        setGalat(
          j.code === "not-configured"
            ? "SUPABASE_SERVICE_ROLE_KEY belum di-set — produk tidak bisa dibuka."
            : j.code === "unauthorized"
              ? "Sesi admin sudah berakhir. Muat ulang halaman lalu masuk lagi."
              : "Gagal memuat produk dari Supabase."
        );
      }
    } catch {
      setGalat("Jaringan bermasalah — produk tidak bisa dimuat.");
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const kirim = useCallback(
    async (entity: Entitas, op: "simpan" | "hapus", payload: Record<string, unknown>, sukses: string) => {
      setBusy(true);
      setPesan("");
      try {
        const r = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity, op, data: payload }),
        });
        const j = (await r.json().catch(() => ({}))) as DataKatalog;
        if (r.ok && j.ok) {
          setData(j);
          setPesan(sukses + " Beranda sudah memakai data ini.");
        } else {
          setPesan(`Gagal menyimpan (${j.code ?? r.status})${j.detail ? ": " + j.detail : ""}`);
        }
      } catch {
        setPesan("Gagal menyimpan: jaringan bermasalah.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  /* Penjualan per produk — hanya dipakai kalau tabel transaksi sudah terisi. */
  const prods = useMemo(() => groupBy(tx, (t) => t.prod, (t) => t.cat), [tx]);
  const catsTerjual = useMemo(() => groupBy(tx, (t) => t.cat), [tx]);
  const methods = useMemo(() => groupBy(tx, (t) => t.pm), [tx]);

  const exportCsv = () => {
    const csv = toCsv(
      ["produk", "kategori", "transaksi", "pendapatan", "porsi_persen"],
      prods.map((p) => [p.key, p.sub ?? "", p.count, p.revenue, p.share.toFixed(2)])
    );
    downloadCsv("vencorago-produk.csv", csv);
  };

  const kepala = (sub: string) => (
    <div className={s.pageHead}>
      <div>
        <h1 className={s.pageTitle}>Produk</h1>
        <p className={s.pageSub}>{sub}</p>
      </div>
      <div className={s.pageAction}>
        <a className={`${s.btn} ${s.btnSm}`} href="/" target="_blank" rel="noreferrer">
          <Icon n="external" /> Lihat beranda
        </a>
        {data ? (
          <button className={`${s.btn} ${s.btnSm}`} onClick={() => void muat()} disabled={busy}>
            <Icon n="trend" /> Muat ulang
          </button>
        ) : null}
      </div>
    </div>
  );

  if (galat) return kepala(galat);
  if (!data) return kepala("Menyiapkan data…");

  const penyediaDari = (id: number): Penyedia | undefined => data.providers.find((p) => p.id === id);
  const katDari = (slugKat: string) => data.cats.find((c) => c.slug === slugKat);
  const katItem = (it: Item) => {
    const p = penyediaDari(it.provider_id);
    return p ? katDari(p.category_slug) : undefined;
  };

  /* Urutan kartu di beranda: kategori → penyedia → produk, sama seperti
     susunKatalog() di lib/catalog.server.ts. */
  const urutKat = new Map(data.cats.map((c, i) => [c.slug, i]));
  const urutPenyedia = new Map(data.providers.map((p, i) => [p.id, i]));
  const urutItem = new Map(data.items.map((it, i) => [it.id, i]));
  const kunci = (it: Item) => [
    urutKat.get(penyediaDari(it.provider_id)?.category_slug ?? "") ?? 99,
    urutPenyedia.get(it.provider_id) ?? 99,
    urutItem.get(it.id) ?? 99,
  ];
  const urut = (a: Item, b: Item) => {
    const ka = kunci(a);
    const kb = kunci(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
  };

  const diBeranda = data.items.filter((it) => it.featured).sort(urut);
  const tampil = diBeranda.filter((it) => !alasanTidakTampil(it, penyediaDari(it.provider_id), katItem(it)));

  const cari = q.trim().toLowerCase();
  const cocok = (it: Item) => {
    const p = penyediaDari(it.provider_id);
    if (slug && p?.category_slug !== slug) return false;
    if (hanyaTampil && !it.featured) return false;
    if (!cari) return true;
    return [it.name, it.note, it.card_label, p?.name ?? "", katItem(it)?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(cari);
  };
  const baris = data.items.filter(cocok).sort(urut);

  return (
    <>
      {kepala(`${data.items.length} produk · ${tampil.length} tampil di beranda`)}
      {pesan ? (
        <Card>
          <p style={{ margin: 0, fontSize: 13 }}>{pesan}</p>
        </Card>
      ) : null}

      <Card
        title="Kartu Produk Pilihan di beranda"
        note={`${tampil.length} tampil · ${diBeranda.length - tampil.length} bermasalah`}
      >
        {diBeranda.length === 0 ? (
          <Empty title="Belum ada produk yang tampil di beranda">
            Centang kolom “Beranda” pada tabel di bawah, lalu isi “Label kartu”.
          </Empty>
        ) : (
          <div className={s.rankList}>
            {diBeranda.map((it, i) => {
              const kenapa = alasanTidakTampil(it, penyediaDari(it.provider_id), katItem(it));
              return (
                <div className={s.rankRow} key={it.id}>
                  <div className={s.rankBody}>
                    <div className={s.rankTitle}>
                      <span className={s.rankIdx} style={{ marginRight: 8 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {it.card_label || <i style={{ color: "var(--fg-muted)" }}>{it.name}</i>}
                      <small>
                        {katItem(it)?.name ?? "—"} · {penyediaDari(it.provider_id)?.name ?? "—"} ·{" "}
                        {rp(it.price)}
                      </small>
                    </div>
                    <div className={s.rankSub}>
                      {kenapa ? <Badge tone="warn">{kenapa} — tidak muncul di beranda</Badge> : null}
                    </div>
                  </div>
                  <div className={s.cellRight} style={{ whiteSpace: "nowrap" }}>
                    <button
                      className={`${s.btn} ${s.btnSm}`}
                      disabled={busy}
                      onClick={() =>
                        void kirim(
                          "item",
                          "simpan",
                          { ...it, featured: false, card_label: "" },
                          `“${it.name}” dilepas dari beranda.`
                        )
                      }
                    >
                      Lepas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Semua produk" note={`${baris.length} dari ${data.items.length} baris`}>
        <div className={s.toolbar}>
          <div className={s.toolbarSearch}>
            <Icon n="search" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama produk, penyedia, atau kategori"
              aria-label="Cari produk"
            />
          </div>

          <select
            className={s.field}
            style={{ width: 220, height: 40 }}
            value={slug}
            aria-label="Filter kategori"
            onChange={(e) => setSlug(e.target.value)}
          >
            <option value="">Semua kategori</option>
            {data.cats.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <div className={s.segmented} role="group" aria-label="Filter kartu beranda">
            <button className={s.seg} aria-pressed={!hanyaTampil} onClick={() => setHanyaTampil(false)}>
              Semua
            </button>
            <button className={s.seg} aria-pressed={hanyaTampil} onClick={() => setHanyaTampil(true)}>
              Tampil di beranda
            </button>
          </div>
        </div>

        <TabelProduk
          baris={baris}
          data={data}
          busy={busy}
          onSimpan={(b) => void kirim("item", "simpan", { ...b }, `Produk “${b.name}” disimpan.`)}
          onHapus={(b) => {
            if (!confirm(`Hapus produk “${b.name}”?`)) return;
            void kirim("item", "hapus", { id: b.id }, `Produk “${b.name}” dihapus.`);
          }}
          onTambah={(b) => void kirim("item", "simpan", { ...b }, `Produk “${b.name}” ditambahkan.`)}
        />
      </Card>

      {prods.length > 0 ? (
        <>
          <Card
            title="Produk terlaris"
            note="berdasarkan pendapatan berhasil"
            action={
              <button className={`${s.btn} ${s.btnSm}`} onClick={exportCsv}>
                <Icon n="download" /> Ekspor CSV
              </button>
            }
          >
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th className={s.cellRight}>Transaksi</th>
                    <th className={s.cellRight}>Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {prods.slice(0, 12).map((p, i) => (
                    <tr key={p.key} style={{ cursor: "default" }}>
                      <td>
                        <span className={s.rankIdx} style={{ marginRight: 8 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={s.cellStrong}>{p.key}</span>
                      </td>
                      <td>
                        <Badge tone="info">{p.label}</Badge>
                      </td>
                      <td className={`${s.cellRight} ${s.num}`}>{p.count}</td>
                      <td className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>{rp(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className={`${s.grid} ${s.split5}`}>
            <Card title="Kategori terjual">
              <div className={s.rankList}>
                {catsTerjual.map((c) => (
                  <div className={s.rankRow} key={c.key}>
                    <div className={s.rankBody}>
                      <div className={s.rankTitle}>
                        {c.key}
                        <small>{c.count} transaksi</small>
                      </div>
                    </div>
                    <div className={s.rankValue}>{rpShort(c.revenue)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Metode pembayaran">
              <div className={s.rankList}>
                {methods.map((m) => (
                  <div className={s.rankRow} key={m.key}>
                    <div className={s.rankBody}>
                      <div className={s.rankTitle}>
                        {m.key}
                        <small>{m.share.toFixed(0)}%</small>
                      </div>
                      <div className={s.rankSub}>{m.count} transaksi</div>
                    </div>
                    <div className={s.rankValue}>{rpShort(m.revenue)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}

/* --------------------------------------------------------------- tabel -- */

function TabelProduk({
  baris,
  data,
  busy,
  onSimpan,
  onHapus,
  onTambah,
}: {
  baris: Item[];
  data: DataKatalog;
  busy: boolean;
  onSimpan: (b: Item) => void;
  onHapus: (b: Item) => void;
  onTambah: (b: Omit<Item, "id">) => void;
}) {
  const [draft, setDraft] = useState<Record<number, Item>>({});
  const penyediaPertama = data.providers.find((p) => p.category_slug === data.cats[0]?.slug);
  const kosong: Omit<Item, "id"> = {
    provider_id: penyediaPertama?.id ?? data.providers[0]?.id ?? 0,
    name: "",
    note: "",
    value: 0,
    price: 0,
    featured: false,
    card_label: "",
    sort: data.items.length + 1,
    active: true,
  };
  const [baru, setBaru] = useState<Omit<Item, "id">>(kosong);

  const ubah = (it: Item, k: keyof Item, v: unknown) =>
    setDraft((prev) => ({ ...prev, [it.id]: { ...(prev[it.id] ?? it), [k]: v } as Item }));
  const nilai = (it: Item) => draft[it.id] ?? it;

  const penyedia = (id: number) => data.providers.find((p) => p.id === id);
  const kategori = (id: number) => {
    const p = penyedia(id);
    return p ? data.cats.find((c) => c.slug === p.category_slug) : undefined;
  };
  const penyediaBaru = data.providers.filter(
    (p) => p.category_slug === kategori(baru.provider_id)?.slug
  );

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Produk</th>
            <th className={s.cellRight}>Nominal</th>
            <th className={s.cellRight}>Harga jual</th>
            <th>Beranda</th>
            <th>Label kartu</th>
            <th className={s.cellRight}>Urutan</th>
            <th>Status</th>
            <th className={s.cellRight}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((it) => {
            const b = nilai(it);
            const kotor = draft[it.id] !== undefined;
            const kat = kategori(it.provider_id);
            return (
              <tr key={it.id} style={{ cursor: "default" }}>
                <td>
                  <span className={s.cellStrong}>{kat?.name ?? "—"}</span>
                  <span className={s.cellHint}>{penyedia(it.provider_id)?.name ?? "—"}</span>
                </td>
                <td>
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    value={b.name}
                    onChange={(e) => ubah(it, "name", e.target.value)}
                  />
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    style={{ marginTop: 6, fontSize: 12 }}
                    placeholder="Keterangan (opsional)"
                    value={b.note}
                    onChange={(e) => ubah(it, "note", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    type="number"
                    value={b.value}
                    onChange={(e) => ubah(it, "value", Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    type="number"
                    value={b.price}
                    onChange={(e) => ubah(it, "price", Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    className={s.cellCheck}
                    type="checkbox"
                    title="Tampilkan sebagai kartu Produk Pilihan di beranda"
                    checked={b.featured}
                    onChange={(e) => ubah(it, "featured", e.target.checked)}
                  />
                </td>
                <td>
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    placeholder={b.featured ? "Contoh: Saldo DANA" : "—"}
                    disabled={!b.featured}
                    value={b.card_label}
                    onChange={(e) => ubah(it, "card_label", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    style={{ width: 76 }}
                    type="number"
                    value={b.sort}
                    onChange={(e) => ubah(it, "sort", Number(e.target.value))}
                  />
                </td>
                <td>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      className={s.cellCheck}
                      type="checkbox"
                      checked={b.active}
                      onChange={(e) => ubah(it, "active", e.target.checked)}
                    />
                    <Badge tone={b.active ? "ok" : "bad"}>{b.active ? "Aktif" : "Nonaktif"}</Badge>
                  </label>
                </td>
                <td className={s.cellRight} style={{ whiteSpace: "nowrap" }}>
                  <button
                    className={`${s.btn} ${s.btnSm} ${kotor ? s.btnPrimary : ""}`}
                    disabled={busy || !kotor}
                    onClick={() => onSimpan(b)}
                  >
                    Simpan
                  </button>{" "}
                  <button
                    className={`${s.btn} ${s.btnSm}`}
                    disabled={busy}
                    aria-label={`Hapus produk ${it.name}`}
                    onClick={() => onHapus(it)}
                  >
                    <Icon n="trash" />
                  </button>
                </td>
              </tr>
            );
          })}

          <tr style={{ cursor: "default" }}>
            <td>
              <select
                className={`${s.field} ${s.cellSelect}`}
                aria-label="Kategori produk baru"
                value={kategori(baru.provider_id)?.slug ?? ""}
                onChange={(e) => {
                  const p = data.providers.find((x) => x.category_slug === e.target.value);
                  setBaru({ ...baru, provider_id: p?.id ?? 0 });
                }}
              >
                {data.cats.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className={`${s.field} ${s.cellSelect}`}
                style={{ marginTop: 6 }}
                aria-label="Penyedia produk baru"
                value={baru.provider_id}
                onChange={(e) => setBaru({ ...baru, provider_id: Number(e.target.value) })}
              >
                {penyediaBaru.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                className={`${s.field} ${s.cellInput}`}
                placeholder="Nama produk baru"
                value={baru.name}
                onChange={(e) => setBaru({ ...baru, name: e.target.value })}
              />
              <input
                className={`${s.field} ${s.cellInput}`}
                style={{ marginTop: 6, fontSize: 12 }}
                placeholder="Keterangan (opsional)"
                value={baru.note}
                onChange={(e) => setBaru({ ...baru, note: e.target.value })}
              />
            </td>
            <td>
              <input
                className={`${s.field} ${s.cellNum}`}
                type="number"
                value={baru.value}
                onChange={(e) => setBaru({ ...baru, value: Number(e.target.value) })}
              />
            </td>
            <td>
              <input
                className={`${s.field} ${s.cellNum}`}
                type="number"
                value={baru.price}
                onChange={(e) => setBaru({ ...baru, price: Number(e.target.value) })}
              />
            </td>
            <td>
              <input
                className={s.cellCheck}
                type="checkbox"
                title="Tampilkan sebagai kartu Produk Pilihan di beranda"
                checked={baru.featured}
                onChange={(e) => setBaru({ ...baru, featured: e.target.checked })}
              />
            </td>
            <td>
              <input
                className={`${s.field} ${s.cellInput}`}
                placeholder={baru.featured ? "Contoh: Saldo DANA" : "—"}
                disabled={!baru.featured}
                value={baru.card_label}
                onChange={(e) => setBaru({ ...baru, card_label: e.target.value })}
              />
            </td>
            <td>
              <input
                className={`${s.field} ${s.cellNum}`}
                style={{ width: 76 }}
                type="number"
                value={baru.sort}
                onChange={(e) => setBaru({ ...baru, sort: Number(e.target.value) })}
              />
            </td>
            <td>
              <span style={{ color: "var(--fg-muted)", fontSize: 12.5 }}>Baris baru</span>
            </td>
            <td className={s.cellRight}>
              <button
                className={`${s.btn} ${s.btnSm}`}
                disabled={busy || !baru.name || !baru.provider_id}
                onClick={() => {
                  onTambah(baru);
                  setBaru({ ...kosong, sort: data.items.length + 2 });
                }}
              >
                <Icon n="check" /> Tambah
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {baris.length === 0 ? <Empty title="Tidak ada produk yang cocok dengan filter ini" /> : null}
    </div>
  );
}
