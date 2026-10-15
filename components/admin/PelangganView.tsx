"use client";

import { useMemo, useState } from "react";
import s from "./admin.module.css";
import { Card, Empty, Icon, Meter, Pager, TableSkeleton } from "./ui";
import { dt, rp, rpShort, stat } from "./data";
import { downloadCsv, toCsv } from "./metrics";
import { useTx } from "./useTx";

const PAGE_SIZE = 12;

export default function PelangganView() {
  const { tx, loading } = useTx();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    if (!tx.length) return [];
    const map = new Map<string, { no: string; name: string; count: number; revenue: number; last: number }>();
    let total = 0;
    for (const t of tx) {
      if (stat(t) !== "success") continue;
      const row = map.get(t.no) ?? { no: t.no, name: t.name, count: 0, revenue: 0, last: 0 };
      row.count++;
      row.revenue += t.total;
      total += t.total;
      if (t.time > row.last) {
        row.last = t.time;
        row.name = t.name;
      }
      map.set(t.no, row);
    }
    const out = [...map.values()].sort((a, b) => b.revenue - a.revenue);
    return out.map((r) => ({ ...r, share: total ? (r.revenue / total) * 100 : 0 }));
  }, [tx]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => `${r.name} ${r.no}`.toLowerCase().includes(qq));
  }, [rows, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const topRevenue = rows[0]?.revenue ?? 0;

  const exportCsv = () => {
    const csv = toCsv(
      ["nama", "nomor", "transaksi", "total_belanja", "porsi_persen", "terakhir"],
      filtered.map((r) => [r.name, r.no, r.count, r.revenue, r.share.toFixed(2), new Date(r.last).toISOString()])
    );
    downloadCsv("vencorago-pelanggan.csv", csv);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Pelanggan</h1>
          <p className={s.pageSub}>
            {loading ? "Menyiapkan data…" : `${rows.length} nomor unik · diurutkan dari total belanja`}
          </p>
        </div>
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={exportCsv} disabled={loading || filtered.length === 0}>
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
              placeholder="Cari nama atau nomor pelanggan"
              aria-label="Cari pelanggan"
            />
          </div>
          <span className={s.count}>{loading ? "—" : `${filtered.length} pelanggan`}</span>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : slice.length === 0 ? (
          <Empty title="Belum ada pelanggan">
            Pelanggan muncul setelah ada transaksi berhasil. Datanya diambil dari nomor tujuan tiap transaksi.
          </Empty>
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th className={s.cellRight}>Transaksi</th>
                    <th className={s.cellRight}>Total belanja</th>
                    <th>Porsi</th>
                    <th>Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r) => (
                    <tr key={r.no} style={{ cursor: "default" }}>
                      <td>
                        <span className={s.cellStrong}>{r.name}</span>
                        <br />
                        <span className={s.num} style={{ color: "var(--fg-muted)", fontSize: 11 }}>
                          {r.no}
                        </span>
                      </td>
                      <td className={`${s.cellRight} ${s.num}`}>{r.count}</td>
                      <td className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>{rp(r.revenue)}</td>
                      <td style={{ minWidth: 140 }}>
                        <Meter value={topRevenue ? (r.revenue / topRevenue) * 100 : 0} />
                        <span className={s.num} style={{ color: "var(--fg-muted)", fontSize: 10 }}>
                          {r.share.toFixed(1)}% dari pendapatan
                        </span>
                      </td>
                      <td className={s.num}>{dt(r.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={current}
              pages={pages}
              total={filtered.length}
              from={(current - 1) * PAGE_SIZE + 1}
              to={(current - 1) * PAGE_SIZE + slice.length}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />
          </>
        )}
      </Card>

      {!loading && rows.length > 0 ? (
        <Card title="Konsentrasi" note="seberapa bergantung pendapatan pada pelanggan teratas">
          <div className={s.legend}>
            <div className={s.legendRow}>
              <span className={s.swatch} style={{ background: "var(--primary)" }} />
              <span>Top 1 ({rows[0].name})</span>
              <span>{rows[0].share.toFixed(1)}%</span>
            </div>
            <div className={s.legendRow}>
              <span className={s.swatch} style={{ background: "var(--primary-muted)" }} />
              <span>Top 5</span>
              <span>{rows.slice(0, 5).reduce((a, b) => a + b.share, 0).toFixed(1)}%</span>
            </div>
            <div className={s.legendRow}>
              <span className={s.swatch} style={{ background: "var(--fg-muted)" }} />
              <span>Rata-rata belanja</span>
              <span>{rpShort(rows.reduce((a, b) => a + b.revenue, 0) / rows.length)}</span>
            </div>
          </div>
        </Card>
      ) : null}
    </>
  );
}
