"use client";

import { useMemo } from "react";
import s from "./admin.module.css";
import { Badge, Card, Empty, Icon, Meter, Skeleton } from "./ui";
import { rp, rpShort } from "./data";
import { downloadCsv, groupBy, toCsv } from "./metrics";
import { useTx } from "./useTx";

export default function ProdukView() {
  const { tx, loading } = useTx();

  const cats = useMemo(() => groupBy(tx, (t) => t.cat), [tx]);
  const prods = useMemo(() => groupBy(tx, (t) => t.prod, (t) => t.cat), [tx]);
  const methods = useMemo(() => groupBy(tx, (t) => t.pm), [tx]);

  const topRevenue = prods[0]?.revenue ?? 0;

  const exportCsv = () => {
    const csv = toCsv(
      ["produk", "kategori", "transaksi", "pendapatan", "porsi_persen"],
      prods.map((p) => [p.key, p.sub ?? "", p.count, p.revenue, p.share.toFixed(2)])
    );
    downloadCsv("vencorago-produk.csv", csv);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Produk</h1>
          <p className={s.pageSub}>
            {loading ? "Menyiapkan data…" : `${prods.length} produk · ${cats.length} kategori terjual`}
          </p>
        </div>
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={exportCsv} disabled={loading || prods.length === 0}>
            <Icon n="download" />
            Ekspor CSV
          </button>
        </div>
      </div>

      <div className={`${s.grid} ${s.split5}`}>
        <Card title="Produk terlaris" note="berdasarkan pendapatan berhasil">
          {loading ? (
            <Skeleton w="100%" h={240} />
          ) : prods.length === 0 ? (
            <Empty title="Belum ada produk terjual" />
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th className={s.cellRight}>Transaksi</th>
                    <th style={{ minWidth: 150 }}>Porsi</th>
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
                      <td>
                        <Meter value={topRevenue ? (p.revenue / topRevenue) * 100 : 0} />
                      </td>
                      <td className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>{rp(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className={s.grid}>
          <Card title="Kategori">
            {loading ? (
              <Skeleton w="100%" h={160} />
            ) : cats.length === 0 ? (
              <Empty title="Belum ada data" />
            ) : (
              <div className={s.rankList}>
                {cats.map((c) => (
                  <div className={s.rankRow} key={c.key}>
                    <div className={s.rankBody}>
                      <div className={s.rankTitle}>
                        {c.key}
                        <small>{c.count} transaksi</small>
                      </div>
                      <div className={s.rankMeter}>
                        <Meter value={c.share} />
                      </div>
                    </div>
                    <div className={s.rankValue}>{rpShort(c.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Metode pembayaran">
            {loading ? (
              <Skeleton w="100%" h={160} />
            ) : methods.length === 0 ? (
              <Empty title="Belum ada data" />
            ) : (
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
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
