"use client";

import { useCallback, useEffect, useState } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon } from "./ui";
import { rp } from "./data";

/* Editor katalog. Semua perubahan lewat /api/catalog (server, sesi admin) dan
   setelah tersimpan cache halaman publik di-revalidate, jadi harga baru
   langsung tampil tanpa deploy ulang. */

type Kat = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tile_note: string;
  kind: string;
  number_label: string;
  number_ph: string;
  number_min: number;
  number_max: number;
  provider_label: string;
  item_label: string;
  bill: Record<string, string>;
  bill_sample: number | null;
  sort: number;
  active: boolean;
};

type Penyedia = { id: number; category_slug: string; name: string; sort: number; active: boolean };

type Item = {
  id: number;
  provider_id: number;
  name: string;
  note: string;
  value: number;
  price: number;
  featured: boolean;
  card_label: string;
  sort: number;
  active: boolean;
};

type Metode = {
  code: string;
  name: string;
  note: string;
  kind: string;
  fee: number;
  prefix: string;
  icon: string;
  sort: number;
  active: boolean;
};

type Setelan = { key: string; value: unknown };

type DataKatalog = {
  ok: boolean;
  code?: string;
  cats: Kat[];
  providers: Penyedia[];
  items: Item[];
  methods: Metode[];
  settings: Setelan[];
  icons: string[];
  kinds: string[];
  methodKinds: string[];
};

const label: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".04em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
  marginBottom: 4,
  display: "block",
};

function Kolom({
  teks,
  children,
  lebar = 150,
}: {
  teks: string;
  children: React.ReactNode;
  lebar?: number;
}) {
  return (
    <div style={{ minWidth: lebar, flex: "1 1 " + lebar + "px" }}>
      <span style={label}>{teks}</span>
      {children}
    </div>
  );
}

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
    async (
      entity: "category" | "provider" | "item" | "method" | "setting",
      op: "simpan" | "hapus",
      payload: Record<string, unknown>,
      sukses: string
    ) => {
      setBusy(true);
      setPesan("");
      try {
        const r = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity, op, data: payload }),
        });
        const j = (await r.json().catch(() => ({}))) as DataKatalog & { detail?: string };
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

  if (galat)
    return (
      <>
        <div className={s.pageHead}>
          <div>
            <h1 className={s.pageTitle}>Katalog</h1>
            <p className={s.pageSub}>{galat}</p>
          </div>
        </div>
      </>
    );

  if (!data)
    return (
      <>
        <div className={s.pageHead}>
          <div>
            <h1 className={s.pageTitle}>Katalog</h1>
            <p className={s.pageSub}>Menyiapkan data…</p>
          </div>
        </div>
      </>
    );

  const kat = data.cats.find((c) => c.slug === slug) ?? data.cats[0];
  const penyedia = kat ? data.providers.filter((p) => p.category_slug === kat.slug) : [];
  const aktif = penyedia.find((p) => p.id === providerId) ?? penyedia[0];
  const item = aktif ? data.items.filter((i) => i.provider_id === aktif.id) : [];

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Katalog</h1>
          <p className={s.pageSub}>
            {data.cats.length} kategori · {data.providers.length} penyedia · {data.items.length} produk ·{" "}
            {data.methods.length} metode bayar
          </p>
        </div>
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnSm}`} onClick={() => void muat()} disabled={busy}>
            <Icon n="trend" /> Muat ulang
          </button>
        </div>
      </div>

      {pesan ? (
        <Card>
          <p style={{ margin: 0, fontSize: 13 }}>{pesan}</p>
        </Card>
      ) : null}

      <div className={s.grid} style={{ gridTemplateColumns: "260px 1fr", alignItems: "start" }}>
        <Card title="Kategori" note={`${data.cats.length} total`}>
          <div className={s.rankList}>
            {data.cats.map((c) => (
              <div
                key={c.slug}
                className={s.rankRow}
                style={{
                  cursor: "pointer",
                  opacity: c.active ? 1 : 0.5,
                  background: c.slug === kat?.slug ? "var(--surface-hover)" : undefined,
                }}
                onClick={() => {
                  setSlug(c.slug);
                  setProviderId(null);
                }}
              >
                <div className={s.rankBody}>
                  <div className={s.rankTitle}>{c.name}</div>
                  <div className={s.rankSub}>
                    {c.kind}
                    {c.active ? "" : " · nonaktif"}
                  </div>
                </div>
              </div>
            ))}
            {data.cats.length === 0 ? <Empty title="Belum ada kategori" /> : null}
          </div>
          <div style={{ marginTop: "var(--sp-sm)", display: "flex", gap: 8 }}>
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
              <Icon n="check" /> Tambah
            </button>
            <button
              className={`${s.btn} ${s.btnSm}`}
              disabled={busy || !kat}
              onClick={() => {
                if (!kat) return;
                if (!confirm(`Hapus kategori "${kat.name}" beserta penyedia dan produknya?`)) return;
                void kirim("category", "hapus", { slug: kat.slug }, "Kategori dihapus.");
                setSlug("");
              }}
            >
              <Icon n="trash" /> Hapus
            </button>
          </div>
        </Card>

        <div className={s.grid}>
          {kat ? (
            <FormKategori
              key={kat.slug}
              kat={kat}
              icons={data.icons}
              kinds={data.kinds}
              busy={busy}
              onSimpan={(draft) =>
                void kirim("category", "simpan", draft, `Kategori "${draft.name}" disimpan.`)
              }
            />
          ) : null}

          {kat ? (
            <Card
              title="Penyedia"
              note="operator / wilayah / perusahaan"
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
                      {
                        category_slug: kat.slug,
                        name: nama,
                        sort: penyedia.length + 1,
                        active: true,
                      },
                      `Penyedia "${nama}" ditambahkan.`
                    );
                  }}
                >
                  <Icon n="check" /> Tambah
                </button>
              }
            >
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th className={s.cellRight}>Urutan</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penyedia.map((p) => (
                      <tr
                        key={p.id}
                        className={p.id === aktif?.id ? s.open : undefined}
                        onClick={() => setProviderId(p.id)}
                      >
                        <td className={s.cellStrong}>{p.name}</td>
                        <td className={`${s.cellRight} ${s.num}`}>{p.sort}</td>
                        <td>
                          <Badge tone={p.active ? "ok" : "bad"}>{p.active ? "Aktif" : "Nonaktif"}</Badge>
                        </td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button
                            className={`${s.btn} ${s.btnSm}`}
                            disabled={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              const nama = prompt("Nama baru:", p.name);
                              if (!nama) return;
                              void kirim(
                                "provider",
                                "simpan",
                                { ...p, name: nama },
                                `Penyedia diubah jadi "${nama}".`
                              );
                            }}
                          >
                            Ubah
                          </button>
                          <button
                            className={`${s.btn} ${s.btnSm}`}
                            disabled={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!confirm(`Hapus penyedia "${p.name}" beserta produknya?`)) return;
                              void kirim("provider", "hapus", { id: p.id }, "Penyedia dihapus.");
                              setProviderId(null);
                            }}
                          >
                            <Icon n="trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {penyedia.length === 0 ? <Empty title="Belum ada penyedia" /> : null}
            </Card>
          ) : null}

          {aktif ? (
            <TabelItem
              key={aktif.id}
              penyedia={aktif}
              items={item}
              busy={busy}
              onSimpan={(baris) =>
                void kirim(
                  "item",
                  "simpan",
                  { ...baris, provider_id: aktif.id },
                  `Produk "${baris.name}" disimpan.`
                )
              }
              onHapus={(baris) => {
                if (!confirm(`Hapus produk "${baris.name}"?`)) return;
                void kirim("item", "hapus", { id: baris.id }, "Produk dihapus.");
              }}
              onTambah={(itemBaru) =>
                void kirim("item", "simpan", { ...itemBaru, provider_id: aktif.id }, "Produk ditambahkan.")
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

          <Card title="Setelan global" note="dipakai semua halaman">
            <SetelanForm
              settings={data.settings}
              cats={data.cats}
              busy={busy}
              onSimpan={(key, value) =>
                void kirim("setting", "simpan", { key, value }, `Setelan "${key}" disimpan.`)
              }
            />
          </Card>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ kategori -- */

function FormKategori({
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

  return (
    <Card
      title={`Detail kategori — ${kat.name}`}
      note={kat.slug}
      action={
        <button className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`} disabled={busy} onClick={() => onSimpan(d)}>
          <Icon n="check" /> Simpan
        </button>
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Kolom teks="Nama (dipakai sebagai kategori transaksi)">
          <input className={s.field} value={d.name} onChange={(e) => set("name", e.target.value)} />
        </Kolom>
        <Kolom teks="Ikon" lebar={120}>
          <select className={s.field} value={d.icon} onChange={(e) => set("icon", e.target.value)}>
            {icons.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Kolom>
        <Kolom teks="Jenis" lebar={120}>
          <select className={s.field} value={d.kind} onChange={(e) => set("kind", e.target.value)}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Kolom>
        <Kolom teks="Urutan" lebar={90}>
          <input
            className={s.field}
            type="number"
            value={d.sort}
            onChange={(e) => set("sort", Number(e.target.value))}
          />
        </Kolom>
        <Kolom teks="Status" lebar={110}>
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", paddingTop: 6 }}>
            <input
              type="checkbox"
              checked={d.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            {d.active ? "Aktif" : "Nonaktif"}
          </label>
        </Kolom>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        <Kolom teks="Catatan kartu beranda" lebar={200}>
          <input className={s.field} value={d.tile_note} onChange={(e) => set("tile_note", e.target.value)} />
        </Kolom>
        <Kolom teks="Label nomor tujuan" lebar={200}>
          <input
            className={s.field}
            value={d.number_label}
            onChange={(e) => set("number_label", e.target.value)}
          />
        </Kolom>
        <Kolom teks="Placeholder" lebar={160}>
          <input className={s.field} value={d.number_ph} onChange={(e) => set("number_ph", e.target.value)} />
        </Kolom>
        <Kolom teks="Panjang min" lebar={90}>
          <input
            className={s.field}
            type="number"
            value={d.number_min}
            onChange={(e) => set("number_min", Number(e.target.value))}
          />
        </Kolom>
        <Kolom teks="Panjang maks" lebar={90}>
          <input
            className={s.field}
            type="number"
            value={d.number_max}
            onChange={(e) => set("number_max", Number(e.target.value))}
          />
        </Kolom>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        <Kolom teks="Judul pilihan penyedia" lebar={200}>
          <input
            className={s.field}
            value={d.provider_label}
            onChange={(e) => set("provider_label", e.target.value)}
          />
        </Kolom>
        <Kolom teks="Judul pilihan produk" lebar={200}>
          <input className={s.field} value={d.item_label} onChange={(e) => set("item_label", e.target.value)} />
        </Kolom>
        <Kolom teks="Contoh nominal tagihan (kosongkan bila bukan tagihan)" lebar={240}>
          <input
            className={s.field}
            type="number"
            value={d.bill_sample ?? ""}
            onChange={(e) => set("bill_sample", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Kolom>
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={label}>Info tagihan (satu baris per keterangan: Nama = Nilai)</span>
        <textarea
          className={s.field}
          rows={3}
          value={Object.entries(d.bill ?? {})
            .map(([a, b]) => `${a} = ${b}`)
            .join("\n")}
          onChange={(e) => {
            const bill: Record<string, string> = {};
            for (const baris of e.target.value.split("\n")) {
              const i = baris.indexOf("=");
              if (i < 0) continue;
              const k = baris.slice(0, i).trim();
              if (k) bill[k] = baris.slice(i + 1).trim();
            }
            set("bill", bill);
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={label}>Deskripsi halaman produk</span>
        <textarea
          className={s.field}
          rows={2}
          value={d.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- produk -- */

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
  const ubah = (baris: Item, k: keyof Item, v: unknown) =>
    setDraft((prev) => ({ ...prev, [baris.id]: { ...(prev[baris.id] ?? baris), [k]: v } as Item }));
  const baris = (it: Item) => draft[it.id] ?? it;

  return (
    <Card
      title={`Produk & harga — ${penyedia.name}`}
      note={`${items.length} produk · harga di kolom "Harga jual" adalah yang dibayar pelanggan`}
    >
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Keterangan</th>
              <th className={s.cellRight}>Nominal</th>
              <th className={s.cellRight}>Harga jual</th>
              <th>Unggulan</th>
              <th>Label kartu</th>
              <th className={s.cellRight}>Urut</th>
              <th>Aktif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const b = baris(it);
              const kotor = draft[it.id] !== undefined;
              return (
                <tr key={it.id}>
                  <td style={{ minWidth: 160 }}>
                    <input className={s.field} value={b.name} onChange={(e) => ubah(it, "name", e.target.value)} />
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <input className={s.field} value={b.note} onChange={(e) => ubah(it, "note", e.target.value)} />
                  </td>
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 110 }}
                      type="number"
                      value={b.value}
                      onChange={(e) => ubah(it, "value", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 110 }}
                      type="number"
                      value={b.price}
                      onChange={(e) => ubah(it, "price", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={b.featured}
                      onChange={(e) => ubah(it, "featured", e.target.checked)}
                    />
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <input
                      className={s.field}
                      value={b.card_label}
                      disabled={!b.featured}
                      onChange={(e) => ubah(it, "card_label", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 70 }}
                      type="number"
                      value={b.sort}
                      onChange={(e) => ubah(it, "sort", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input type="checkbox" checked={b.active} onChange={(e) => ubah(it, "active", e.target.checked)} />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      className={`${s.btn} ${s.btnSm} ${kotor ? s.btnPrimary : ""}`}
                      disabled={busy || !kotor}
                      onClick={() => onSimpan(b)}
                    >
                      Simpan
                    </button>
                    <button className={`${s.btn} ${s.btnSm}`} disabled={busy} onClick={() => onHapus(it)}>
                      <Icon n="trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>
                <input
                  className={s.field}
                  placeholder="Nama produk baru"
                  value={baru.name}
                  onChange={(e) => setBaru({ ...baru, name: e.target.value })}
                />
              </td>
              <td>
                <input
                  className={s.field}
                  placeholder="Keterangan"
                  value={baru.note}
                  onChange={(e) => setBaru({ ...baru, note: e.target.value })}
                />
              </td>
              <td>
                <input
                  className={`${s.field} ${s.num}`}
                  style={{ width: 110 }}
                  type="number"
                  value={baru.value}
                  onChange={(e) => setBaru({ ...baru, value: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  className={`${s.field} ${s.num}`}
                  style={{ width: 110 }}
                  type="number"
                  value={baru.price}
                  onChange={(e) => setBaru({ ...baru, price: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={baru.featured}
                  onChange={(e) => setBaru({ ...baru, featured: e.target.checked })}
                />
              </td>
              <td>
                <input
                  className={s.field}
                  placeholder="Label kartu beranda"
                  value={baru.card_label}
                  disabled={!baru.featured}
                  onChange={(e) => setBaru({ ...baru, card_label: e.target.value })}
                />
              </td>
              <td>
                <input
                  className={`${s.field} ${s.num}`}
                  style={{ width: 70 }}
                  type="number"
                  value={baru.sort}
                  onChange={(e) => setBaru({ ...baru, sort: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={baru.active}
                  onChange={(e) => setBaru({ ...baru, active: e.target.checked })}
                />
              </td>
              <td>
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
    </Card>
  );
}

/* -------------------------------------------------------------- metode -- */

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
  const [draft, setDraft] = useState<Record<string, Metode>>({});
  const [baru, setBaru] = useState<Metode>({
    code: "",
    name: "",
    note: "",
    kind: "va",
    fee: 0,
    prefix: "",
    icon: "card",
    sort: methods.length + 1,
    active: true,
  });
  const ubah = (m: Metode, k: keyof Metode, v: unknown) =>
    setDraft((prev) => ({ ...prev, [m.code]: { ...(prev[m.code] ?? m), [k]: v } as Metode }));
  const baris = (m: Metode) => draft[m.code] ?? m;

  const sel = (
    <select
      className={s.field}
      value={baru.kind}
      onChange={(e) => setBaru({ ...baru, kind: e.target.value })}
    >
      {methodKinds.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  );

  return (
    <Card
      title="Metode pembayaran"
      note="biaya di sini yang ditambahkan ke total di checkout"
      action={
        <button
          className={`${s.btn} ${s.btnSm}`}
          disabled={busy || !baru.name}
          onClick={() => {
            onSimpan(baru);
            setBaru({ ...baru, code: "", name: "", note: "", fee: 0, prefix: "" });
          }}
        >
          <Icon n="check" /> Tambah
        </button>
      }
    >
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Catatan</th>
              <th>Jenis</th>
              <th className={s.cellRight}>Biaya</th>
              <th>Awalan VA</th>
              <th>Ikon</th>
              <th className={s.cellRight}>Urut</th>
              <th>Aktif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => {
              const b = baris(m);
              const kotor = draft[m.code] !== undefined;
              return (
                <tr key={m.code}>
                  <td style={{ minWidth: 170 }}>
                    <input className={s.field} value={b.name} onChange={(e) => ubah(m, "name", e.target.value)} />
                  </td>
                  <td style={{ minWidth: 150 }}>
                    <input className={s.field} value={b.note} onChange={(e) => ubah(m, "note", e.target.value)} />
                  </td>
                  <td>
                    <select
                      className={s.field}
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
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 100 }}
                      type="number"
                      value={b.fee}
                      onChange={(e) => ubah(m, "fee", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 90 }}
                      value={b.prefix}
                      onChange={(e) => ubah(m, "prefix", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={s.field}
                      style={{ width: 90 }}
                      value={b.icon}
                      onChange={(e) => ubah(m, "icon", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`${s.field} ${s.num}`}
                      style={{ width: 70 }}
                      type="number"
                      value={b.sort}
                      onChange={(e) => ubah(m, "sort", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={b.active}
                      onChange={(e) => ubah(m, "active", e.target.checked)}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      className={`${s.btn} ${s.btnSm} ${kotor ? s.btnPrimary : ""}`}
                      disabled={busy || !kotor}
                      onClick={() => onSimpan(b)}
                    >
                      Simpan
                    </button>
                    <button className={`${s.btn} ${s.btnSm}`} disabled={busy} onClick={() => onHapus(m)}>
                      <Icon n="trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>
                <input
                  className={s.field}
                  placeholder="Nama metode baru"
                  value={baru.name}
                  onChange={(e) => setBaru({ ...baru, name: e.target.value })}
                />
              </td>
              <td>
                <input
                  className={s.field}
                  placeholder="Catatan"
                  value={baru.note}
                  onChange={(e) => setBaru({ ...baru, note: e.target.value })}
                />
              </td>
              <td>{sel}</td>
              <td>
                <input
                  className={`${s.field} ${s.num}`}
                  style={{ width: 100 }}
                  type="number"
                  value={baru.fee}
                  onChange={(e) => setBaru({ ...baru, fee: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  className={`${s.field} ${s.num}`}
                  style={{ width: 90 }}
                  value={baru.prefix}
                  onChange={(e) => setBaru({ ...baru, prefix: e.target.value })}
                />
              </td>
              <td>
                <input
                  className={s.field}
                  style={{ width: 90 }}
                  value={baru.icon}
                  onChange={(e) => setBaru({ ...baru, icon: e.target.value })}
                />
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 10 }}>
        Biaya QRIS/DANA di proyek ini contohnya {rp(0)} (gratis) dan Virtual Account {rp(2500)} — ubah
        angkanya di tabel ini, total di halaman publik ikut berubah.
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
  const ambil = (key: string) => settings.find((s) => s.key === key)?.value;
  const [biaya, setBiaya] = useState(String(ambil("admin_fee") ?? 0));
  const [def, setDef] = useState(String(ambil("default_category") ?? ""));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <Kolom teks="Biaya admin (Rp)" lebar={160}>
        <input className={s.field} type="number" value={biaya} onChange={(e) => setBiaya(e.target.value)} />
      </Kolom>
      <Kolom teks="Kategori default" lebar={200}>
        <select className={s.field} value={def} onChange={(e) => setDef(e.target.value)}>
          {cats.map((c) => (
            <option key={c.slug} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </Kolom>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
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
      </div>
    </div>
  );
}
