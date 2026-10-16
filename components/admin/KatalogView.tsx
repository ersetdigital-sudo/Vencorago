"use client";

import { useCallback, useEffect, useState } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon } from "./ui";
import type { DataKatalog, Entitas, Item, Kat, Metode, Penyedia, Setelan } from "./katalog";

/* Editor katalog.

   Semua bagian disajikan sebagai tabel dengan kolom yang sama seperti halaman
   admin lain (Transaksi/Produk), supaya datanya terbaca sebaris-sebaris:
   - Kategori, Penyedia, Produk & harga, Metode bayar  → tabel data + input
     langsung di sel.
   - Detail kategori & Setelan global                   → tabel properti
     (label kolom kiri, kontrol kolom kanan).

   Setiap perubahan lewat /api/catalog (server, sesi admin) dan cache halaman
   publik di-revalidate, jadi harga baru langsung terpakai tanpa deploy ulang. */

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

/** Keterangan tagihan yang disimpan sebagai objek: ditampilkan "Nama = Nilai" per baris. */
const billKeTeks = (bill: Record<string, string> | null) =>
  Object.entries(bill ?? {})
    .map(([a, b]) => `${a} = ${b}`)
    .join("\n");

const teksKeBill = (teks: string) => {
  const bill: Record<string, string> = {};
  for (const baris of teks.split("\n")) {
    const i = baris.indexOf("=");
    if (i < 0) continue;
    const k = baris.slice(0, i).trim();
    if (k) bill[k] = baris.slice(i + 1).trim();
  }
  return bill;
};

export default function KatalogView() {
  const [data, setData] = useState<DataKatalog | null>(null);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState("");
  const [providerId, setProviderId] = useState<number | null>(null);

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
            ? "SUPABASE_SERVICE_ROLE_KEY belum di-set — katalog tidak bisa dibuka."
            : j.code === "unauthorized"
              ? "Sesi admin sudah berakhir. Muat ulang halaman lalu masuk lagi."
              : "Gagal memuat katalog dari Supabase."
        );
      }
    } catch {
      setGalat("Jaringan bermasalah — katalog tidak bisa dimuat.");
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
          setPesan(sukses + " Halaman publik sudah memakai data ini.");
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

  const kepala = (sub: string) => (
    <div className={s.pageHead}>
      <div>
        <h1 className={s.pageTitle}>Katalog</h1>
        <p className={s.pageSub}>{sub}</p>
      </div>
      {data ? (
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnSm}`} onClick={() => void muat()} disabled={busy}>
            <Icon n="trend" /> Muat ulang
          </button>
        </div>
      ) : null}
    </div>
  );

  if (galat) return kepala(galat);
  if (!data) return kepala("Menyiapkan data…");

  const kat = data.cats.find((c) => c.slug === slug) ?? data.cats[0];
  const penyedia = kat ? data.providers.filter((p) => p.category_slug === kat.slug) : [];
  const aktif = penyedia.find((p) => p.id === providerId) ?? penyedia[0];
  const item = aktif ? data.items.filter((i) => i.provider_id === aktif.id) : [];

  return (
    <>
      {kepala(
        `${data.cats.length} kategori · ${data.providers.length} penyedia · ${data.items.length} produk · ${data.methods.length} metode bayar`
      )}

      {pesan ? (
        <Card>
          <p style={{ margin: 0, fontSize: 13 }}>{pesan}</p>
        </Card>
      ) : null}

      <div className={s.grid}>
        <Card
          title="Kategori"
          note={`${data.cats.length} baris · klik baris untuk membuka detail & penyedianya`}
          action={
            <button
              className={`${s.btn} ${s.btnSm}`}
              disabled={busy}
              onClick={() =>
                void kirim(
                  "category",
                  "simpan",
                  {
                    name: "Kategori Baru " + (data.cats.length + 1),
                    icon: data.icons[0],
                    kind: "nominal",
                    number_label: "Nomor Tujuan",
                    number_min: 8,
                    number_max: 16,
                    provider_label: "Pilih Penyedia",
                    item_label: "Pilih Nominal",
                    sort: data.cats.length + 1,
                    active: false,
                  },
                  "Kategori baru dibuat (status nonaktif)."
                )
              }
            >
              <Icon n="check" /> Tambah kategori
            </button>
          }
        >
          <TabelKategori
            cats={data.cats}
            kinds={data.kinds}
            terpilih={kat?.slug ?? ""}
            busy={busy}
            onPilih={(slugBaru) => {
              setSlug(slugBaru);
              setProviderId(null);
            }}
            onSimpan={(draft) => void kirim("category", "simpan", draft, `Kategori "${draft.name}" disimpan.`)}
            onHapus={(draft) => {
              if (!confirm(`Hapus kategori "${draft.name}" beserta penyedia dan produknya?`)) return;
              void kirim("category", "hapus", { slug: draft.slug }, "Kategori dihapus.");
              setSlug("");
            }}
          />
        </Card>

        {kat ? (
          <DetailKategori
            key={kat.slug}
            kat={kat}
            icons={data.icons}
            kinds={data.kinds}
            busy={busy}
            onSimpan={(draft) => void kirim("category", "simpan", draft, `Detail "${draft.name}" disimpan.`)}
          />
        ) : null}

        {kat ? (
          <Card
            title={`Penyedia — ${kat.name}`}
            note={`${penyedia.length} baris · penyedia yang dipilih menentukan daftar produk di bawah`}
            action={
              <button
                className={`${s.btn} ${s.btnSm}`}
                disabled={busy}
                onClick={() => {
                  const nama = prompt("Nama penyedia baru:");
                  if (!nama) return;
                  void kirim(
                    "provider",
                    "simpan",
                    { category_slug: kat.slug, name: nama, sort: penyedia.length + 1, active: true },
                    `Penyedia "${nama}" ditambahkan.`
                  );
                }}
              >
                <Icon n="check" /> Tambah penyedia
              </button>
            }
          >
            <TabelPenyedia
              penyedia={penyedia}
              terpilih={aktif?.id ?? 0}
              busy={busy}
              onPilih={setProviderId}
              onSimpan={(draft) => void kirim("provider", "simpan", draft, `Penyedia "${draft.name}" disimpan.`)}
              onHapus={(draft) => {
                if (!confirm(`Hapus penyedia "${draft.name}" beserta produknya?`)) return;
                void kirim("provider", "hapus", { id: draft.id }, "Penyedia dihapus.");
                setProviderId(null);
              }}
              onTambah={(draft) => void kirim("provider", "simpan", draft, `Penyedia "${draft.name}" ditambahkan.`)}
            />
          </Card>
        ) : null}

        {aktif ? (
          <TabelItem
            key={aktif.id}
            penyedia={aktif}
            items={item}
            busy={busy}
            onSimpan={(baris) =>
              void kirim("item", "simpan", { ...baris, provider_id: aktif.id }, `Produk "${baris.name}" disimpan.`)
            }
            onHapus={(baris) => {
              if (!confirm(`Hapus produk "${baris.name}"?`)) return;
              void kirim("item", "hapus", { id: baris.id }, "Produk dihapus.");
            }}
            onTambah={(baris) =>
              void kirim("item", "simpan", { ...baris, provider_id: aktif.id }, "Produk ditambahkan.")
            }
          />
        ) : null}

        <TabelMetode
          methods={data.methods}
          methodKinds={data.methodKinds}
          busy={busy}
          onSimpan={(m) => void kirim("method", "simpan", m, `Metode "${m.name}" disimpan.`)}
          onHapus={(m) => {
            if (!confirm(`Hapus metode "${m.name}"?`)) return;
            void kirim("method", "hapus", { code: m.code }, "Metode dihapus.");
          }}
        />

        <SetelanForm
          settings={data.settings}
          cats={data.cats}
          busy={busy}
          onSimpan={(key, value) => void kirim("setting", "simpan", { key, value }, `Setelan "${key}" disimpan.`)}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------- kategori -- */

function TabelKategori({
  cats,
  kinds,
  terpilih,
  busy,
  onPilih,
  onSimpan,
  onHapus,
}: {
  cats: Kat[];
  kinds: string[];
  terpilih: string;
  busy: boolean;
  onPilih: (slug: string) => void;
  onSimpan: (draft: Kat) => void;
  onHapus: (draft: Kat) => void;
}) {
  const [draft, setDraft] = useState<Record<string, Kat>>({});
  const ubah = (k: Kat, kunci: keyof Kat, v: unknown) =>
    setDraft((prev) => ({ ...prev, [k.slug]: { ...(prev[k.slug] ?? k), [kunci]: v } as Kat }));
  const baris = (k: Kat) => draft[k.slug] ?? k;

  return (
    <div className={s.tableWrap}>
      <table className={`${s.table} ${s.tableStack}`}>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Jenis</th>
            <th>Catatan kartu beranda</th>
            <th className={s.cellRight}>Urutan</th>
            <th>Status</th>
            <th className={s.cellRight}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((k) => {
            const b = baris(k);
            const kotor = draft[k.slug] !== undefined;
            return (
              <tr
                key={k.slug}
                className={k.slug === terpilih ? s.open : undefined}
                onClick={() => onPilih(k.slug)}
              >
                <td data-label="Kategori">
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    value={b.name}
                    onChange={(e) => ubah(k, "name", e.target.value)}
                  />
                </td>
                <td data-label="Jenis">
                  <select
                    className={`${s.field} ${s.cellSelect}`}
                    value={b.kind}
                    onChange={(e) => ubah(k, "kind", e.target.value)}
                  >
                    {kinds.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Catatan kartu">
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    value={b.tile_note}
                    onChange={(e) => ubah(k, "tile_note", e.target.value)}
                  />
                </td>
                <td data-label="Urutan">
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    type="number"
                    value={b.sort}
                    onChange={(e) => ubah(k, "sort", Number(e.target.value))}
                  />
                </td>
                <td data-label="Status">
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      className={s.cellCheck}
                      type="checkbox"
                      checked={b.active}
                      onChange={(e) => ubah(k, "active", e.target.checked)}
                    />
                    <Badge tone={b.active ? "ok" : "bad"}>{b.active ? "Aktif" : "Nonaktif"}</Badge>
                  </label>
                </td>
                <td className={s.cellRight} data-label="Aksi" style={{ whiteSpace: "nowrap" }}>
                  <button
                    className={`${s.btn} ${s.btnSm} ${kotor ? s.btnPrimary : ""}`}
                    disabled={busy || !kotor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimpan(b);
                    }}
                  >
                    Simpan
                  </button>{" "}
                  <button
                    className={`${s.btn} ${s.btnSm}`}
                    disabled={busy}
                    aria-label={`Hapus kategori ${k.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onHapus(k);
                    }}
                  >
                    <Icon n="trash" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cats.length === 0 ? <Empty title="Belum ada kategori" /> : null}
    </div>
  );
}

/* --------------------------------------------------------- detail kategori -- */

function DetailKategori({
  kat,
  icons,
  kinds,
  busy,
  onSimpan,
}: {
  kat: Kat;
  icons: string[];
  kinds: string[];
  busy: boolean;
  onSimpan: (draft: Kat) => void;
}) {
  const [d, setD] = useState<Kat>({ ...kat, bill: kat.bill ?? {} });
  const set = <K extends keyof Kat>(k: K, v: Kat[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const isTagihan = d.kind === "tagihan";

  return (
    <Card
      title={`Detail kategori — ${kat.name}`}
      note="label & aturan yang dipakai halaman publik"
      action={
        <button
          className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}
          disabled={busy}
          onClick={() => onSimpan(d)}
        >
          <Icon n="check" /> Simpan detail
        </button>
      }
    >
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.prop}`}>
          <tbody>
            <tr>
              <td>Ikon &amp; jenis</td>
              <td style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  style={{ width: 200 }}
                  value={d.icon}
                  onChange={(e) => set("icon", e.target.value)}
                >
                  {icons.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  style={{ width: 200 }}
                  value={d.kind}
                  onChange={(e) => set("kind", e.target.value)}
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>Deskripsi halaman produk</td>
              <td>
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 0 }}
                  value={d.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Judul pilihan penyedia</td>
              <td>
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 0, maxWidth: 420 }}
                  value={d.provider_label}
                  onChange={(e) => set("provider_label", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Judul pilihan produk</td>
              <td>
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 0, maxWidth: 420 }}
                  value={d.item_label}
                  onChange={(e) => set("item_label", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Label nomor tujuan</td>
              <td style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 0, width: 260 }}
                  value={d.number_label}
                  onChange={(e) => set("number_label", e.target.value)}
                />
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 0, width: 200 }}
                  placeholder="Contoh: 08xxxxxxxxxx"
                  value={d.number_ph}
                  onChange={(e) => set("number_ph", e.target.value)}
                />
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg-muted)", fontSize: 12.5 }}>
                  panjang
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    style={{ width: 76 }}
                    type="number"
                    value={d.number_min}
                    onChange={(e) => set("number_min", Number(e.target.value))}
                  />
                  –
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    style={{ width: 76 }}
                    type="number"
                    value={d.number_max}
                    onChange={(e) => set("number_max", Number(e.target.value))}
                  />
                  digit
                </span>
              </td>
            </tr>
            <tr>
              <td>Contoh tagihan</td>
              <td>
                <input
                  className={`${s.field} ${s.cellNum}`}
                  disabled={!isTagihan}
                  value={d.bill_sample ?? ""}
                  onChange={(e) => set("bill_sample", e.target.value === "" ? null : Number(e.target.value))}
                />
                <span className={s.cellHint}>
                  {isTagihan
                    ? "Dipakai beranda sebagai gambaran tagihan sebelum tagihan asli diketahui."
                    : "Hanya untuk kategori bertipe tagihan."}
                </span>
              </td>
            </tr>
            <tr>
              <td>Info tagihan</td>
              <td>
                <textarea
                  className={`${s.field} ${s.cellInput}`}
                  style={{ height: "auto", minHeight: 68, paddingTop: 8, paddingBottom: 8 }}
                  rows={3}
                  disabled={!isTagihan}
                  placeholder={"Contoh tagihan = Rp 87.500\nJatuh tempo = Tanggal 20 setiap bulan"}
                  value={billKeTeks(d.bill)}
                  onChange={(e) => set("bill", teksKeBill(e.target.value))}
                />
                <span className={s.cellHint}>Satu keterangan per baris, format: Nama = Nilai.</span>
              </td>
            </tr>
            <tr>
              <td>Urutan</td>
              <td>
                <input
                  className={`${s.field} ${s.cellNum}`}
                  type="number"
                  value={d.sort}
                  onChange={(e) => set("sort", Number(e.target.value))}
                />
                <span className={s.cellHint}>
                  Nama kategori ({d.name}) juga jadi label kategori di tabel transaksi; slug tetap{" "}
                  <b>{kat.slug}</b>.
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- penyedia -- */

function TabelPenyedia({
  penyedia,
  terpilih,
  busy,
  onPilih,
  onSimpan,
  onHapus,
  onTambah,
}: {
  penyedia: Penyedia[];
  terpilih: number;
  busy: boolean;
  onPilih: (id: number) => void;
  onSimpan: (draft: Penyedia) => void;
  onHapus: (draft: Penyedia) => void;
  onTambah: (draft: Omit<Penyedia, "id">) => void;
}) {
  const kosong: Omit<Penyedia, "id"> = {
    category_slug: penyedia[0]?.category_slug ?? "",
    name: "",
    sort: penyedia.length + 1,
    active: true,
  };
  const [draft, setDraft] = useState<Record<number, Penyedia>>({});
  const [baru, setBaru] = useState<Omit<Penyedia, "id">>(kosong);
  const ubah = (p: Penyedia, k: keyof Penyedia, v: unknown) =>
    setDraft((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] ?? p), [k]: v } as Penyedia }));
  const baris = (p: Penyedia) => draft[p.id] ?? p;

  return (
    <div className={s.tableWrap}>
      <table className={`${s.table} ${s.tableStack}`}>
        <thead>
          <tr>
            <th>Nama penyedia</th>
            <th className={s.cellRight}>Urutan</th>
            <th>Status</th>
            <th className={s.cellRight}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {penyedia.map((p) => {
            const b = baris(p);
            const kotor = draft[p.id] !== undefined;
            return (
              <tr
                key={p.id}
                className={p.id === terpilih ? s.open : undefined}
                onClick={() => onPilih(p.id)}
              >
                <td data-label="Nama penyedia">
                  <input
                    className={`${s.field} ${s.cellInput}`}
                    value={b.name}
                    onChange={(e) => ubah(p, "name", e.target.value)}
                  />
                </td>
                <td data-label="Urutan">
                  <input
                    className={`${s.field} ${s.cellNum}`}
                    type="number"
                    value={b.sort}
                    onChange={(e) => ubah(p, "sort", Number(e.target.value))}
                  />
                </td>
                <td data-label="Status">
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      className={s.cellCheck}
                      type="checkbox"
                      checked={b.active}
                      onChange={(e) => ubah(p, "active", e.target.checked)}
                    />
                    <Badge tone={b.active ? "ok" : "bad"}>{b.active ? "Aktif" : "Nonaktif"}</Badge>
                  </label>
                </td>
                <td className={s.cellRight} data-label="Aksi" style={{ whiteSpace: "nowrap" }}>
                  <button
                    className={`${s.btn} ${s.btnSm} ${kotor ? s.btnPrimary : ""}`}
                    disabled={busy || !kotor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimpan(b);
                    }}
                  >
                    Simpan
                  </button>{" "}
                  <button
                    className={`${s.btn} ${s.btnSm}`}
                    disabled={busy}
                    aria-label={`Hapus penyedia ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onHapus(p);
                    }}
                  >
                    <Icon n="trash" />
                  </button>
                </td>
              </tr>
            );
          })}
          <tr style={{ cursor: "default" }}>
            <td data-label="Nama penyedia">
              <input
                className={`${s.field} ${s.cellInput}`}
                placeholder="Nama penyedia baru"
                value={baru.name}
                onChange={(e) => setBaru({ ...baru, name: e.target.value })}
              />
            </td>
            <td data-label="Urutan">
              <input
                className={`${s.field} ${s.cellNum}`}
                type="number"
                value={baru.sort}
                onChange={(e) => setBaru({ ...baru, sort: Number(e.target.value) })}
              />
            </td>
            <td data-label="Status">
              <span style={{ color: "var(--fg-muted)", fontSize: 12.5 }}>Baris baru</span>
            </td>
            <td className={s.cellRight} data-label="Aksi">
              <button
                className={`${s.btn} ${s.btnSm}`}
                disabled={busy || !baru.name}
                onClick={() => {
                  onTambah(baru);
                  setBaru({ ...kosong, sort: penyedia.length + 2 });
                }}
              >
                <Icon n="check" /> Tambah
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {penyedia.length === 0 ? <Empty title="Belum ada penyedia" /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- produk -- */

function TabelItem({
  penyedia,
  items,
  busy,
  onSimpan,
  onHapus,
  onTambah,
}: {
  penyedia: Penyedia;
  items: Item[];
  busy: boolean;
  onSimpan: (baris: Item) => void;
  onHapus: (baris: Item) => void;
  onTambah: (baris: Omit<Item, "id">) => void;
}) {
  const kosong: Omit<Item, "id"> = {
    provider_id: penyedia.id,
    name: "",
    note: "",
    value: 0,
    price: 0,
    featured: false,
    card_label: "",
    sort: items.length + 1,
    active: true,
  };
  const [draft, setDraft] = useState<Record<number, Item>>({});
  const [baru, setBaru] = useState<Omit<Item, "id">>(kosong);
  const ubah = (it: Item, k: keyof Item, v: unknown) =>
    setDraft((prev) => ({ ...prev, [it.id]: { ...(prev[it.id] ?? it), [k]: v } as Item }));
  const baris = (it: Item) => draft[it.id] ?? it;

  return (
    <Card
      title={`Produk & harga — ${penyedia.name}`}
      note={`${items.length} baris · "Harga jual" adalah angka yang dibayar pelanggan`}
    >
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.tableStack}`}>
          <thead>
            <tr>
              <th>Nama produk</th>
              <th>Keterangan</th>
              <th className={s.cellRight}>Nominal</th>
              <th className={s.cellRight}>Harga jual</th>
              <th>Kartu beranda</th>
              <th>Label kartu</th>
              <th className={s.cellRight}>Urutan</th>
              <th>Status</th>
              <th className={s.cellRight}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const b = baris(it);
              const kotor = draft[it.id] !== undefined;
              return (
                <tr key={it.id} style={{ cursor: "default" }}>
                  <td data-label="Nama produk">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      value={b.name}
                      onChange={(e) => ubah(it, "name", e.target.value)}
                    />
                  </td>
                  <td data-label="Keterangan">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      value={b.note}
                      onChange={(e) => ubah(it, "note", e.target.value)}
                    />
                  </td>
                  <td data-label="Nominal">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      type="number"
                      value={b.value}
                      onChange={(e) => ubah(it, "value", Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Harga jual">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      type="number"
                      value={b.price}
                      onChange={(e) => ubah(it, "price", Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Kartu beranda">
                    <input
                      className={s.cellCheck}
                      type="checkbox"
                      title="Tampilkan sebagai kartu Produk Pilihan di beranda"
                      checked={b.featured}
                      onChange={(e) => ubah(it, "featured", e.target.checked)}
                    />
                  </td>
                  <td data-label="Label kartu">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      placeholder={b.featured ? "Contoh: Saldo DANA" : "—"}
                      disabled={!b.featured}
                      value={b.card_label}
                      onChange={(e) => ubah(it, "card_label", e.target.value)}
                    />
                  </td>
                  <td data-label="Urutan">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      style={{ width: 76 }}
                      type="number"
                      value={b.sort}
                      onChange={(e) => ubah(it, "sort", Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Status">
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
                  <td className={s.cellRight} data-label="Aksi" style={{ whiteSpace: "nowrap" }}>
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
              <td data-label="Nama produk">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  placeholder="Nama produk baru"
                  value={baru.name}
                  onChange={(e) => setBaru({ ...baru, name: e.target.value })}
                />
              </td>
              <td data-label="Keterangan">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  placeholder="Keterangan"
                  value={baru.note}
                  onChange={(e) => setBaru({ ...baru, note: e.target.value })}
                />
              </td>
              <td data-label="Nominal">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  type="number"
                  value={baru.value}
                  onChange={(e) => setBaru({ ...baru, value: Number(e.target.value) })}
                />
              </td>
              <td data-label="Harga jual">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  type="number"
                  value={baru.price}
                  onChange={(e) => setBaru({ ...baru, price: Number(e.target.value) })}
                />
              </td>
              <td data-label="Kartu beranda">
                <input
                  className={s.cellCheck}
                  type="checkbox"
                  checked={baru.featured}
                  onChange={(e) => setBaru({ ...baru, featured: e.target.checked })}
                />
              </td>
              <td data-label="Label kartu">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  placeholder="Label kartu beranda"
                  disabled={!baru.featured}
                  value={baru.card_label}
                  onChange={(e) => setBaru({ ...baru, card_label: e.target.value })}
                />
              </td>
              <td data-label="Urutan">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  style={{ width: 76 }}
                  type="number"
                  value={baru.sort}
                  onChange={(e) => setBaru({ ...baru, sort: Number(e.target.value) })}
                />
              </td>
              <td data-label="Status">
                <span style={{ color: "var(--fg-muted)", fontSize: 12.5 }}>Baris baru</span>
              </td>
              <td className={s.cellRight} data-label="Aksi">
                <button
                  className={`${s.btn} ${s.btnSm}`}
                  disabled={busy || !baru.name}
                  onClick={() => {
                    onTambah(baru);
                    setBaru({ ...kosong, sort: items.length + 2 });
                  }}
                >
                  <Icon n="check" /> Tambah
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <Empty title="Belum ada produk" /> : null}
    </Card>
  );
}

/* --------------------------------------------------------------- metode -- */

function TabelMetode({
  methods,
  methodKinds,
  busy,
  onSimpan,
  onHapus,
}: {
  methods: Metode[];
  methodKinds: string[];
  busy: boolean;
  onSimpan: (m: Metode) => void;
  onHapus: (m: Metode) => void;
}) {
  const kosong: Metode = {
    code: "",
    name: "",
    note: "",
    kind: "va",
    fee: 0,
    prefix: "",
    icon: "card",
    sort: methods.length + 1,
    active: true,
  };
  const [draft, setDraft] = useState<Record<string, Metode>>({});
  const [baru, setBaru] = useState<Metode>(kosong);
  const ubah = (m: Metode, k: keyof Metode, v: unknown) =>
    setDraft((prev) => ({ ...prev, [m.code]: { ...(prev[m.code] ?? m), [k]: v } as Metode }));
  const baris = (m: Metode) => draft[m.code] ?? m;

  return (
    <Card
      title="Metode pembayaran"
      note="biaya di kolom ini yang ditambahkan ke total di checkout"
      action={
        <button
          className={`${s.btn} ${s.btnSm}`}
          disabled={busy || !baru.name}
          onClick={() => {
            onSimpan(baru);
            setBaru({ ...kosong, sort: methods.length + 2 });
          }}
        >
          <Icon n="check" /> Tambah metode
        </button>
      }
    >
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.tableStack}`}>
          <thead>
            <tr>
              <th>Nama metode</th>
              <th>Catatan di checkout</th>
              <th>Jenis</th>
              <th className={s.cellRight}>Biaya</th>
              <th>Awalan VA</th>
              <th>Ikon</th>
              <th className={s.cellRight}>Urutan</th>
              <th>Status</th>
              <th className={s.cellRight}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => {
              const b = baris(m);
              const kotor = draft[m.code] !== undefined;
              return (
                <tr key={m.code} style={{ cursor: "default" }}>
                  <td data-label="Nama metode">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      value={b.name}
                      onChange={(e) => ubah(m, "name", e.target.value)}
                    />
                  </td>
                  <td data-label="Catatan di checkout">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      value={b.note}
                      onChange={(e) => ubah(m, "note", e.target.value)}
                    />
                  </td>
                  <td data-label="Jenis">
                    <select
                      className={`${s.field} ${s.cellSelect}`}
                      value={b.kind}
                      onChange={(e) => ubah(m, "kind", e.target.value)}
                    >
                      {methodKinds.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Biaya">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      type="number"
                      value={b.fee}
                      onChange={(e) => ubah(m, "fee", Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Awalan VA">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      style={{ width: 88 }}
                      value={b.prefix}
                      onChange={(e) => ubah(m, "prefix", e.target.value)}
                    />
                  </td>
                  <td data-label="Ikon">
                    <input
                      className={`${s.field} ${s.cellInput}`}
                      style={{ minWidth: 88, width: 88 }}
                      value={b.icon}
                      onChange={(e) => ubah(m, "icon", e.target.value)}
                    />
                  </td>
                  <td data-label="Urutan">
                    <input
                      className={`${s.field} ${s.cellNum}`}
                      style={{ width: 76 }}
                      type="number"
                      value={b.sort}
                      onChange={(e) => ubah(m, "sort", Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Status">
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <input
                        className={s.cellCheck}
                        type="checkbox"
                        checked={b.active}
                        onChange={(e) => ubah(m, "active", e.target.checked)}
                      />
                      <Badge tone={b.active ? "ok" : "bad"}>{b.active ? "Aktif" : "Nonaktif"}</Badge>
                    </label>
                  </td>
                  <td className={s.cellRight} data-label="Aksi" style={{ whiteSpace: "nowrap" }}>
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
                      aria-label={`Hapus metode ${m.name}`}
                      onClick={() => onHapus(m)}
                    >
                      <Icon n="trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr style={{ cursor: "default" }}>
              <td data-label="Nama metode">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  placeholder="Nama metode baru"
                  value={baru.name}
                  onChange={(e) => setBaru({ ...baru, name: e.target.value })}
                />
              </td>
              <td data-label="Catatan di checkout">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  placeholder="Catatan"
                  value={baru.note}
                  onChange={(e) => setBaru({ ...baru, note: e.target.value })}
                />
              </td>
              <td data-label="Jenis">
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  value={baru.kind}
                  onChange={(e) => setBaru({ ...baru, kind: e.target.value })}
                >
                  {methodKinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </td>
              <td data-label="Biaya">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  type="number"
                  value={baru.fee}
                  onChange={(e) => setBaru({ ...baru, fee: Number(e.target.value) })}
                />
              </td>
              <td data-label="Awalan VA">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  style={{ width: 88 }}
                  value={baru.prefix}
                  onChange={(e) => setBaru({ ...baru, prefix: e.target.value })}
                />
              </td>
              <td data-label="Ikon">
                <input
                  className={`${s.field} ${s.cellInput}`}
                  style={{ minWidth: 88, width: 88 }}
                  value={baru.icon}
                  onChange={(e) => setBaru({ ...baru, icon: e.target.value })}
                />
              </td>
              <td data-label="Urutan">
                <input
                  className={`${s.field} ${s.cellNum}`}
                  style={{ width: 76 }}
                  type="number"
                  value={baru.sort}
                  onChange={(e) => setBaru({ ...baru, sort: Number(e.target.value) })}
                />
              </td>
              <td data-label="Status">
                <span style={{ color: "var(--fg-muted)", fontSize: 12.5 }}>Baris baru</span>
              </td>
              <td className={s.cellRight} data-label="Aksi">
                <button
                  className={`${s.btn} ${s.btnSm}`}
                  disabled={busy || !baru.name}
                  onClick={() => {
                    onSimpan(baru);
                    setBaru({ ...kosong, sort: methods.length + 2 });
                  }}
                >
                  <Icon n="check" /> Tambah
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 12 }}>
        Contoh isi: QRIS tanpa biaya, Virtual Account {rp(2500)}. Angka di kolom Biaya langsung
        menambah total pembayaran di halaman publik.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------- setelan -- */

function SetelanForm({
  settings,
  cats,
  busy,
  onSimpan,
}: {
  settings: Setelan[];
  cats: Kat[];
  busy: boolean;
  onSimpan: (key: string, value: unknown) => void;
}) {
  const ambil = (key: string) => settings.find((x) => x.key === key)?.value;
  const [biaya, setBiaya] = useState(String(ambil("admin_fee") ?? 0));
  const [def, setDef] = useState(String(ambil("default_category") ?? ""));

  return (
    <Card
      title="Setelan global"
      note="berlaku untuk semua kategori dan metode"
      action={
        <button
          className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}
          disabled={busy}
          onClick={() => {
            onSimpan("admin_fee", Number(biaya) || 0);
            onSimpan("default_category", def);
          }}
        >
          <Icon n="check" /> Simpan setelan
        </button>
      }
    >
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.prop}`}>
          <tbody>
            <tr>
              <td>Biaya admin (Rp)</td>
              <td>
                <input
                  className={`${s.field} ${s.cellNum}`}
                  type="number"
                  value={biaya}
                  onChange={(e) => setBiaya(e.target.value)}
                />
                <span className={s.cellHint}>Ditambahkan ke setiap transaksi.</span>
              </td>
            </tr>
            <tr>
              <td>Kategori default</td>
              <td>
                <select
                  className={`${s.field} ${s.cellSelect}`}
                  style={{ width: 260 }}
                  value={def}
                  onChange={(e) => setDef(e.target.value)}
                >
                  {cats.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className={s.cellHint}>
                  Dipakai kalau halaman produk dibuka tanpa pilihan kategori.
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
