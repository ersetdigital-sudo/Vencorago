"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon, Pager, StatusBadge, TableSkeleton } from "./ui";
import { dt, rp, stat, type Tx, type TxStatus } from "./data";
import { downloadCsv, toCsv } from "./metrics";
import { useTx } from "./useTx";

const STATUS_FILTERS: { key: "all" | TxStatus; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "success", label: "Berhasil" },
  { key: "pending", label: "Menunggu" },
  { key: "expired", label: "Gagal" },
];

const PERIODS: { key: number; label: string }[] = [
  { key: 7, label: "7 hari" },
  { key: 30, label: "30 hari" },
  { key: 0, label: "Semua" },
];

const PAGE_SIZE = 12;

export default function TransaksiView({
  q: initialQ = "",
  status: initialStatus = "all",
}: {
  q?: string;
  status?: string;
}) {
  const { tx, loading } = useTx();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<"all" | TxStatus>(
    (["all", "success", "pending", "expired"] as string[]).includes(initialStatus)
      ? (initialStatus as "all" | TxStatus)
      : "all"
  );
  const [period, setPeriod] = useState(30);
  const [page, setPage] = useState(1);
  const [openInv, setOpenInv] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!tx.length) return [];
    const qq = q.trim().toLowerCase();
    const cutoff = period ? Date.now() - period * 86400e3 : 0;
    return tx.filter((t) => {
      if (cutoff && t.time < cutoff) return false;
      if (status !== "all" && stat(t) !== status) return false;
      if (qq && !`${t.inv} ${t.prod} ${t.no} ${t.name} ${t.pm}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [tx, q, status, period]);

  const summary = useMemo(() => summarizeRows(rows), [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const exportCsv = () => {
    const csv = toCsv(
      ["invoice", "waktu", "produk", "kategori", "pelanggan", "nomor", "metode", "status", "total", "serial"],
      rows.map((t) => [
        t.inv,
        new Date(t.time).toISOString(),
        t.prod,
        t.cat,
        t.name,
        t.no,
        t.pm,
        stat(t),
        t.total,
        t.sn,
      ])
    );
    downloadCsv("vencorago-transaksi.csv", csv);
  };

  const filtered = status !== "all" || q.trim().length > 0 || period !== 30;

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Transaksi</h1>
          <p className={s.pageSub}>
            {loading ? "Menyiapkan data…" : `${rows.length} transaksi cocok · ${summary.pending} menunggu tindakan`}
          </p>
        </div>
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={exportCsv} disabled={loading || rows.length === 0}>
            <Icon n="download" />
            Ekspor CSV
          </button>
        </div>
      </div>

      <Card>
        <div className={s.toolbar}>
          <div className={s.toolbarSearch}>
            <Icon n="search" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cari invoice, nama, nomor, atau produk"
              aria-label="Cari transaksi"
            />
          </div>

          <div className={s.segmented} role="group" aria-label="Filter status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={s.seg}
                aria-pressed={status === f.key}
                onClick={() => {
                  setStatus(f.key);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={s.segmented} role="group" aria-label="Rentang hari">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={s.seg}
                aria-pressed={period === p.key}
                onClick={() => {
                  setPeriod(p.key);
                  setPage(1);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <span className={s.count}>
            {loading ? "—" : `${summary.success} berhasil · ${summary.expired} gagal`}
          </span>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : slice.length === 0 ? (
          <Empty title="Tidak ada transaksi yang cocok">
            {filtered
              ? "Coba ubah kata kunci, status, atau rentang harinya."
              : "Transaksi baru akan muncul di sini setelah dibuat dari situs."}
            {filtered ? (
              <>
                {" "}
                <button
                  className={`${s.btn} ${s.btnSm}`}
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setQ("");
                    setStatus("all");
                    setPeriod(30);
                    setPage(1);
                  }}
                >
                  Bersihkan filter
                </button>
              </>
            ) : null}
          </Empty>
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Waktu</th>
                    <th>Produk</th>
                    <th>Pelanggan</th>
                    <th>Metode</th>
                    <th className={s.cellRight}>Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {slice.map((t) => {
                    const st = stat(t);
                    const open = openInv === t.inv;
                    return (
                      <Fragment key={t.inv}>
                        <tr
                          key={t.inv}
                          className={open ? s.open : undefined}
                          onClick={() => setOpenInv(open ? null : t.inv)}
                        >
                          <td className={`${s.cellStrong} ${s.num}`}>{t.inv}</td>
                          <td className={s.num}>{dt(t.time)}</td>
                          <td>{t.prod}</td>
                          <td>
                            {t.name}
                            <br />
                            <span className={s.num} style={{ color: "var(--fg-muted)", fontSize: 11 }}>
                              {t.no}
                            </span>
                          </td>
                          <td>{t.pm}</td>
                          <td className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>{rp(t.total)}</td>
                          <td>
                            <StatusBadge status={st} />
                          </td>
                          <td className={s.cellRight}>
                            <button
                              className={s.iconBtn}
                              aria-expanded={open}
                              aria-label={open ? `Tutup detail ${t.inv}` : `Buka detail ${t.inv}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenInv(open ? null : t.inv);
                              }}
                            >
                              <Icon n={open ? "left" : "right"} />
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr key={t.inv + "-detail"} className={s.detailRow}>
                            <td colSpan={8}>
                              <div className={s.detail}>
                                <span className={s.detailItem}>
                                  <small>Invoice</small>
                                  <b className={s.num}>{t.inv}</b>
                                </span>
                                <span className={s.detailItem}>
                                  <small>Kategori</small>
                                  <b>{t.cat}</b>
                                </span>
                                <span className={s.detailItem}>
                                  <small>Serial / token</small>
                                  <b className={s.num}>{t.sn || "—"}</b>
                                </span>
                                <span className={s.detailItem}>
                                  <small>Dibayar</small>
                                  <b className={s.num}>{t.paid ? dt(t.paid) : "Belum"}</b>
                                </span>
                              </div>
                              <div className={s.detailActions}>
                                <Link className={`${s.btn} ${s.btnSm}`} href={`/status?inv=${t.inv}`}>
                                  <Icon n="external" />
                                  Cek di situs publik
                                </Link>
                                <Badge tone="accent">{t.pm}</Badge>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager
              page={current}
              pages={pages}
              total={rows.length}
              from={(current - 1) * PAGE_SIZE + 1}
              to={(current - 1) * PAGE_SIZE + slice.length}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />
          </>
        )}
      </Card>
    </>
  );
}

function summarizeRows(rows: Tx[]) {
  let success = 0;
  let pending = 0;
  let expired = 0;
  let revenue = 0;
  for (const t of rows) {
    const st = stat(t);
    if (st === "success") {
      success++;
      revenue += t.total;
    } else if (st === "pending") pending++;
    else expired++;
  }
  return { success, pending, expired, revenue };
}
