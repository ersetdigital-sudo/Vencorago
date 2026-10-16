"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon, InputUang, Pager } from "./ui";
import { rp, rpShort } from "./data";
import { downloadCsv, groupBy, toCsv } from "./metrics";
import { useTx } from "./useTx";
import { alasanTidakTampil, type DataKatalog, type Entitas, type Item, type Penyedia } from "./katalog";

/* Halaman Produk: satu-satunya tempat mengatur produk yang dijual.

   Produknya hidup di tabel `catalog_items` Supabase (128 baris) — bukan di
   tabel transaksi. Karena itu halaman ini membaca katalog lewat /api/catalog
   (sesi admin, service role), bukan /api/tx. Bentuk katalognya sendiri
   (kategori, penyedia, metode bayar) diatur di /admin/katalog.

   Alurnya cuma dua bagian:
   - "Kartu Produk Pilihan di beranda" = produk yang benar-benar dirender
     beranda, urutannya sama seperti beranda, satu sakelar per baris.
   - "Semua produk" = satu daftar seluruh produk + pencarian/filter, dan satu
     panel detail berisi semua field. Ubah harga = buka produk, ubah, Simpan —
     bukan lagi tabel 9 kolom dengan input di setiap sel.
   - Angka penjualan per produk ikut di bawah, tapi hanya muncul kalau sudah
     ada transaksi — biar halaman ini tidak pernah tampil seolah kosong.

   Setiap perubahan lewat /api/catalog dan cache tag `katalog` di-revalidate,
   jadi beranda ikut berubah tanpa deploy ulang. */

const PAGE_SIZE = 12;

const FILTER = [
  { v: "semua", label: "Semua" },
  { v: "aktif", label: "Aktif" },
  { v: "nonaktif", label: "Nonaktif" },
  { v: "beranda", label: "Tampil di beranda" },
] as const;

type Filter = (typeof FILTER)[number]["v"];

type Pesan = { ok: boolean; text: string };

/** Produk baru: id 0 = belum ada di database, /api/catalog yang membuatnya. */
function produkKosong(providerId: number, sort: number): Item {
  return {
    id: 0,
    provider_id: providerId,
    name: "",
    note: "",
    value: 0,
    price: 0,
    featured: false,
    card_label: "",
    sort,
    active: true,
  };
}

export default function ProdukView() {
  const [data, setData] = useState<DataKatalog | null>(null);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState<Pesan | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<{ id: number | null } | null>(null);
  const [panelKotor, setPanelKotor] = useState(false);
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
            ? "Supabase belum di-set di server ini — produk tidak bisa dibuka."
            : j.code === "unauthorized"
              ? "Sesi admin sudah berakhir. Muat ulang halaman lalu masuk lagi."
              : "Produk tidak bisa dimuat dari Supabase. Coba muat ulang."
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
    async (
      entity: Entitas,
      op: "simpan" | "hapus",
      payload: Record<string, unknown>,
      sukses: string
    ): Promise<boolean> => {
      setBusy(true);
      setPesan(null);
      try {
        const r = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity, op, data: payload }),
        });
        const j = (await r.json().catch(() => ({}))) as DataKatalog;
        if (r.ok && j.ok) {
          setData(j);
          setPesan({ ok: true, text: sukses + " Beranda sudah memakai data ini." });
          return true;
        }
        setPesan({
          ok: false,
          text: `Gagal menyimpan (${j.code ?? r.status})${j.detail ? ": " + j.detail : ""}`,
        });
        return false;
      } catch {
        setPesan({ ok: false, text: "Gagal menyimpan: jaringan bermasalah." });
        return false;
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
        <a className={`${s.btn} ${s.btnSm}`} href="/admin/katalog">
          <Icon n="inbox" /> Kategori & metode
        </a>
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
  const terhalang = diBeranda.filter((it) =>
    alasanTidakTampil(it, penyediaDari(it.provider_id), katItem(it))
  );
  const tampil = diBeranda.length - terhalang.length;

  const cari = q.trim().toLowerCase();
  const cocok = (it: Item) => {
    const p = penyediaDari(it.provider_id);
    if (slug && p?.category_slug !== slug) return false;
    if (filter === "aktif" && !it.active) return false;
    if (filter === "nonaktif" && it.active) return false;
    if (filter === "beranda" && !it.featured) return false;
    if (!cari) return true;
    return [it.name, it.note, it.card_label, p?.name ?? "", katItem(it)?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(cari);
  };
  const baris = data.items.filter(cocok).sort(urut);

  const halaman = Math.max(1, Math.ceil(baris.length / PAGE_SIZE));
  const ini = Math.min(page, halaman);
  const potong = baris.slice((ini - 1) * PAGE_SIZE, ini * PAGE_SIZE);

  const itemPanel = panel && panel.id !== null ? data.items.find((i) => i.id === panel.id) : null;
  const panelTerbuka = panel !== null && (panel.id === null || itemPanel !== undefined);

  const bukaPanel = (id: number | null) => {
    if (panelKotor && !confirm("Perubahan di panel belum disimpan. Buang?")) return;
    setPanelKotor(false);
    setPanel({ id });
  };
  const tutupPanel = () => {
    if (panelKotor && !confirm("Perubahan di panel belum disimpan. Buang?")) return;
    setPanelKotor(false);
    setPanel(null);
  };

  return (
    <>
      {kepala(`${data.items.length} produk · ${tampil} tampil di beranda`)}
      {pesan ? (
        <div className={s.pesanBar} role="status">
          <Badge tone={pesan.ok ? "ok" : "bad"}>{pesan.ok ? "Tersimpan" : "Gagal"}</Badge>
          <span>{pesan.text}</span>
        </div>
      ) : null}

      <Card title="Kartu Produk Pilihan di beranda" note={`${tampil} tampil · ${diBeranda.length} dipilih`}>
        {diBeranda.length === 0 ? (
          <Empty title="Belum ada produk yang tampil di beranda">
            Buka salah satu produk di bawah, lalu nyalakan “Tampil di beranda”.
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
                      {!it.card_label ? (
                        <span className={s.listHint}>label: pakai nama produk</span>
                      ) : null}
                    </div>
                    <div className={s.rankSub}>
                      {katItem(it)?.name ?? "—"} · {penyediaDari(it.provider_id)?.name ?? "—"} · {rp(it.price)}
                    </div>
                    {kenapa ? (
                      <div className={s.rankSub}>
                        <Badge tone="warn">{kenapa} — belum muncul di beranda</Badge>
                        {!it.active ? (
                          <button
                            className={`${s.btn} ${s.btnSm}`}
                            style={{ marginLeft: 8 }}
                            disabled={busy}
                            onClick={() =>
                              void kirim("item", "simpan", { ...it, active: true }, `“${it.name}” diaktifkan.`)
                            }
                          >
                            <Icon n="check" /> Aktifkan
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className={s.listRight}>
                    <Switch
                      checked
                      disabled={busy}
                      label="Tampil"
                      title="Matikan untuk melepas produk ini dari beranda"
                      onChange={() =>
                        void kirim(
                          "item",
                          "simpan",
                          { ...it, featured: false },
                          `“${it.name}” dilepas dari beranda.`
                        )
                      }
                    />
                    <button className={`${s.btn} ${s.btnSm}`} onClick={() => bukaPanel(it.id)}>
                      Ubah
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className={panelTerbuka ? s.panelWrap : undefined}>
        <Card title="Semua produk" note={`${baris.length} dari ${data.items.length} produk`}>
          <div className={s.toolbar}>
            <div className={s.toolbarSearch}>
              <Icon n="search" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama produk, penyedia, atau kategori"
                aria-label="Cari produk"
              />
            </div>

            <select
              className={`${s.field} ${s.toolbarSelect}`}
              value={slug}
              aria-label="Filter kategori"
              onChange={(e) => {
                setSlug(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua kategori</option>
              {data.cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className={s.segmented} role="group" aria-label="Filter status produk">
              {FILTER.map((f) => (
                <button
                  key={f.v}
                  className={s.seg}
                  aria-pressed={filter === f.v}
                  onClick={() => {
                    setFilter(f.v);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              className={`${s.btn} ${s.btnPrimary} ${s.btnSm} ${s.toolbarEnd}`}
              onClick={() => bukaPanel(null)}
            >
              <Icon n="check" /> Produk baru
            </button>
          </div>

          <div className={s.list}>
            {potong.map((it) => {
              const kat = katItem(it);
              return (
                <button className={s.listRow} key={it.id} onClick={() => bukaPanel(it.id)}>
                  <span className={s.listBody}>
                    <span className={s.listTitle}>
                      {it.name}
                      {!it.active ? <Badge tone="bad">Nonaktif</Badge> : null}
                      {it.featured ? <Badge tone="accent">Tampil di beranda</Badge> : null}
                    </span>
                    <span className={s.listSub}>
                      {kat?.name ?? "—"} · {penyediaDari(it.provider_id)?.name ?? "—"} ·{" "}
                      <b className={s.num}>{rp(it.price)}</b>
                      {kat?.kind === "nominal" ? ` · nominal ${rp(it.value)}` : ""}
                      {it.note ? ` · ${it.note}` : ""}
                    </span>
                  </span>
                  <span className={s.listAction}>
                    Ubah
                    <Icon n="right" />
                  </span>
                </button>
              );
            })}
          </div>

          {baris.length === 0 ? <Empty title="Tidak ada produk yang cocok dengan filter ini" /> : null}

          {baris.length > PAGE_SIZE ? (
            <Pager
              page={ini}
              pages={halaman}
              total={baris.length}
              from={(ini - 1) * PAGE_SIZE + 1}
              to={Math.min(ini * PAGE_SIZE, baris.length)}
              onPrev={() => setPage(Math.max(1, ini - 1))}
              onNext={() => setPage(Math.min(halaman, ini + 1))}
            />
          ) : null}
        </Card>

        {panelTerbuka ? (
          <PanelProduk
            key={panel.id ?? "baru"}
            data={data}
            item={itemPanel ?? null}
            busy={busy}
            onKotor={setPanelKotor}
            onTutup={tutupPanel}
            onSimpan={async (draft) => {
              const ok = await kirim(
                "item",
                "simpan",
                { ...draft },
                itemPanel ? `Produk “${draft.name}” disimpan.` : `Produk “${draft.name}” ditambahkan.`
              );
              if (ok) {
                setPanelKotor(false);
                setPanel(null);
              }
              return ok;
            }}
            onHapus={(draft) => {
              if (!confirm(`Hapus produk “${draft.name}”?`)) return;
              void kirim("item", "hapus", { id: draft.id }, `Produk “${draft.name}” dihapus.`);
              setPanelKotor(false);
              setPanel(null);
            }}
          />
        ) : null}
      </div>

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
              <table className={`${s.table} ${s.tableStack}`}>
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
                      <td data-label="Produk">
                        <span className={s.rankIdx} style={{ marginRight: 8 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={s.cellStrong}>{p.key}</span>
                      </td>
                      <td data-label="Kategori">
                        <Badge tone="info">{p.label}</Badge>
                      </td>
                      <td data-label="Transaksi" className={`${s.cellRight} ${s.num}`}>
                        {p.count}
                      </td>
                      <td data-label="Pendapatan" className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>
                        {rp(p.revenue)}
                      </td>
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

/* --------------------------------------------------------------- sakelar -- */

/** Sakelar on/off: checkbox asli (tetap bisa di-Tab) dengan tampilan track+thumb. */
function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <label className={s.switch} title={title}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={s.switchTrack} aria-hidden="true" />
      <span className={s.switchText}>{label}</span>
    </label>
  );
}

/* ----------------------------------------------------------------- panel -- */

/** Detail satu produk: semua field ada di sini, satu tombol Simpan untuk semuanya. */
function PanelProduk({
  data,
  item,
  busy,
  onSimpan,
  onHapus,
  onTutup,
  onKotor,
}: {
  data: DataKatalog;
  item: Item | null;
  busy: boolean;
  onSimpan: (draft: Item) => Promise<boolean>;
  onHapus: (draft: Item) => void;
  onTutup: () => void;
  onKotor: (kotor: boolean) => void;
}) {
  const awal = useMemo<Item>(
    () =>
      item ??
      produkKosong(
        data.providers.find((p) => p.category_slug === data.cats[0]?.slug)?.id ??
          data.providers[0]?.id ??
          0,
        data.items.length + 1
      ),
    [item, data]
  );
  const [draft, setDraft] = useState<Item>(awal);
  const kotor = JSON.stringify(draft) !== JSON.stringify(awal);

  useEffect(() => {
    onKotor(kotor);
  }, [kotor, onKotor]);

  const penyedia = data.providers.find((p) => p.id === draft.provider_id);
  const kat = data.cats.find((c) => c.slug === penyedia?.category_slug) ?? data.cats[0];
  const penyediaKat = data.providers.filter((p) => p.category_slug === kat?.slug);
  const siap = draft.name.trim() !== "" && draft.provider_id > 0;

  const simpan = async () => {
    /* Label kartu diisi dari nama produk kalau dibiarkan kosong, jadi yang
       tersimpan selalu nilai eksplisit — tidak perlu diisi ulang kalau produk
       dilepas lalu diunggulkan lagi. Panelnya ditutup oleh pemanggil setelah
       simpan berhasil, supaya penutupan itu tidak kena pemeriksaan
       "belum disimpan" (isinya memang masih dianggap berubah sampai data
       barunya masuk). */
    const bersih: Item = {
      ...draft,
      card_label: draft.card_label || (draft.featured ? draft.name : ""),
    };
    await onSimpan(bersih);
  };

  const Baris = ({ label, children }: { label: string; children: ReactNode }) => (
    <tr>
      <td>{label}</td>
      <td>{children}</td>
    </tr>
  );

  return (
    <>
      <div className={s.sheetScrim} onClick={onTutup} aria-hidden="true" />
      <aside className={s.panelCard} aria-label={item ? `Ubah ${item.name}` : "Produk baru"}>
        <header className={s.panelHead}>
          <div>
            <h2 className={s.cardTitle}>{item ? item.name : "Produk baru"}</h2>
            <span className={s.cardNote}>
              {item ? `${kat?.name ?? "—"} · ${penyedia?.name ?? "—"}` : "Belum disimpan"}
            </span>
          </div>
          <button className={s.iconBtn} onClick={onTutup} aria-label="Tutup panel" title="Tutup">
            <Icon n="x" />
          </button>
        </header>

        <div className={s.panelBody}>
          <table className={`${s.table} ${s.prop}`}>
            <tbody>
              <Baris label="Kategori">
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  value={kat?.slug ?? ""}
                  onChange={(e) => {
                    const p = data.providers.find((x) => x.category_slug === e.target.value);
                    setDraft({ ...draft, provider_id: p?.id ?? 0 });
                  }}
                >
                  {data.cats.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Baris>

              <Baris label="Penyedia">
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  value={draft.provider_id}
                  onChange={(e) => setDraft({ ...draft, provider_id: Number(e.target.value) })}
                >
                  {penyediaKat.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Baris>

              <Baris label="Nama produk">
                <input
                  className={s.field}
                  value={draft.name}
                  placeholder="Contoh: Pulsa Telkomsel 10.000"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Baris>

              <Baris label="Keterangan">
                <input
                  className={s.field}
                  value={draft.note}
                  placeholder="Opsional"
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                />
              </Baris>

              <Baris label="Nominal">
                <InputUang
                  className={`${s.field} ${s.cellNum}`}
                  value={draft.value}
                  onChange={(v) => setDraft({ ...draft, value: v })}
                />
                <span className={s.cellHint}>
                  {kat?.kind === "tagihan"
                    ? "Jumlah tagihannya dalam rupiah; harga jual diisi 0."
                    : "Nominal rupiah yang dipilih pelanggan."}
                </span>
              </Baris>

              <Baris label="Harga jual">
                <InputUang
                  className={`${s.field} ${s.cellNum}`}
                  value={draft.price}
                  onChange={(v) => setDraft({ ...draft, price: v })}
                />
                <span className={s.cellHint}>
                  Rupiah yang dibayar pelanggan, belum termasuk biaya admin.
                </span>
              </Baris>

              <Baris label="Urutan">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  style={{ width: 110 }}
                  type="number"
                  value={draft.sort}
                  onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                />
                <span className={s.cellHint}>Menentukan urutan tampil di beranda.</span>
              </Baris>

              <Baris label="Status">
                <Switch
                  checked={draft.active}
                  label={draft.active ? "Aktif dijual" : "Tidak dijual"}
                  onChange={(v) => setDraft({ ...draft, active: v })}
                />
              </Baris>

              <Baris label="Tampil di beranda">
                <Switch
                  checked={draft.featured}
                  label={draft.featured ? "Tampil" : "Tidak tampil"}
                  onChange={(v) => setDraft({ ...draft, featured: v })}
                />
                <span className={s.cellHint}>Muncul sebagai kartu Produk Pilihan di beranda.</span>
              </Baris>

              <Baris label="Label kartu">
                <input
                  className={s.field}
                  disabled={!draft.featured}
                  placeholder={draft.name || "Nama produk"}
                  value={draft.card_label}
                  onChange={(e) => setDraft({ ...draft, card_label: e.target.value })}
                />
                <span className={s.cellHint}>Kosongkan untuk memakai nama produk.</span>
              </Baris>
            </tbody>
          </table>

          {!siap ? (
            <p className={s.panelHint}>
              <Icon n="alert" /> Nama produk dan penyedia wajib diisi sebelum bisa disimpan.
            </p>
          ) : null}
        </div>

        <div className={s.panelFoot}>
          <button className={`${s.btn} ${s.btnPrimary}`} disabled={busy || !siap} onClick={() => void simpan()}>
            <Icon n="check" /> Simpan
          </button>
          <button className={s.btn} disabled={busy} onClick={onTutup}>
            Batal
          </button>
          {item ? (
            <button className={`${s.btn} ${s.panelHapus}`} disabled={busy} onClick={() => onHapus(draft)}>
              <Icon n="trash" /> Hapus
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
