"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import s from "./admin.module.css";
import { Bars, Badge, Card, Empty, Icon, Kpi, LegendRow, Meter, Skeleton, StatusBadge, TableSkeleton } from "./ui";
import { dt, rp, rpShort, stat } from "./data";
import { byDay, downloadCsv, groupBy, statusSplit, summarize, toCsv } from "./metrics";
import { useTx } from "./useTx";

const PERIODS = [7, 14, 30];

export default function OverviewView() {
  const { tx, loading } = useTx();
  const [days, setDays] = useState(7);

  const sum = useMemo(() => summarize(tx), [tx]);
  const series = useMemo(() => (tx.length ? byDay(tx, days) : []), [tx, days]);
  const split = useMemo(() => statusSplit(tx), [tx]);
  const methods = useMemo(() => groupBy(tx, (t) => t.pm), [tx]);
  const cats = useMemo(() => groupBy(tx, (t) => t.cat), [tx]);
  const recent = useMemo(
    () => [...tx].sort((a, b) => b.time - a.time).slice(0, 8),
    [tx]
  );

  const exportSummary = () => {
    const csv = toCsv(
      ["tanggal", "pendapatan", "transaksi"],
      series.map((d) => [d.key, d.revenue, d.count])
    );
    downloadCsv(`vencorago-ringkasan-${days}h.csv`, csv);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Ringkasan</h1>
          <p className={s.pageSub}>
            {loading ? "Menyiapkan data…" : `${sum.count} transaksi dari perangkat ini`}
          </p>
        </div>
        <div className={s.pageAction}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={exportSummary} disabled={loading}>
            <Icon n="download" />
            Ekspor ringkasan
          </button>
        </div>
      </div>

      <div className={`${s.grid} ${s.g4}`}>
        {loading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton w="60%" h={10} />
                <div style={{ height: 10 }} />
                <Skeleton w="80%" h={22} />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <Kpi
                icon="banknote"
                label="Pendapatan"
                value={rp(sum.revenue)}
                foot={
                  <>
                    <Icon n="trend" />
                    {rpShort(sum.today)} hari ini · {sum.todayCount} transaksi
                  </>
                }
              />
            </Card>
            <Card>
              <Kpi
                icon="receipt"
                label="Transaksi"
                value={String(sum.count)}
                foot={`${sum.success} berhasil · ${sum.expired} gagal`}
              />
            </Card>
            <Card>
              <Kpi
                icon="check"
                label="Tingkat sukses"
                value={`${sum.successRate.toFixed(1)}%`}
                foot={`Rata-rata ${rp(sum.avg)} per transaksi`}
              />
            </Card>
            <Card>
              <Kpi
                icon="clock"
                label="Perlu tindakan"
                value={String(sum.pending)}
                foot={
                  sum.pending > 0 ? (
                    <Link href="/admin/transaksi?status=pending" style={{ color: "var(--primary)" }}>
                      Lihat yang menunggu →
                    </Link>
                  ) : (
                    "Tidak ada yang menunggu"
                  )
                }
              />
            </Card>
          </>
        )}
      </div>

      <div className={`${s.grid} ${s.split8}`}>
        <Card
          title="Pendapatan"
          note={loading ? undefined : `Total ${rp(series.reduce((a, b) => a + b.revenue, 0))}`}
          action={
            <div className={s.segmented} role="group" aria-label="Rentang hari">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  className={s.seg}
                  aria-pressed={p === days}
                  onClick={() => setDays(p)}
                >
                  {p} hari
                </button>
              ))}
            </div>
          }
        >
          {loading ? <Skeleton w="100%" h={168} /> : <Bars data={series} label={`Pendapatan ${days} hari terakhir`} />}
        </Card>

        <Card title="Status transaksi" note={loading ? undefined : `${sum.count} total`}>
          {loading ? (
            <Skeleton w="100%" h={120} />
          ) : sum.count === 0 ? (
            <Empty title="Belum ada transaksi">Transaksi yang masuk akan muncul di sini.</Empty>
          ) : (
            <>
              <div className={s.meter} style={{ marginBottom: "var(--sp-md)" }}>
                <div
                  className={s.meterFill}
                  style={{ width: `${sum.successRate}%`, background: "var(--primary)" }}
                />
              </div>
              <div className={s.legend}>
                {split.map((row) => (
                  <LegendRow
                    key={row.key}
                    swatch={
                      row.tone === "ok" ? "var(--ok-text)" : row.tone === "warn" ? "var(--warn-text)" : "var(--bad-text)"
                    }
                    label={row.label}
                    value={String(row.count)}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className={`${s.grid} ${s.split5}`}>
        <Card
          title="Transaksi terbaru"
          action={
            <Link className={`${s.btn} ${s.btnSm}`} href="/admin/transaksi">
              Lihat semua
              <Icon n="right" />
            </Link>
          }
        >
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : recent.length === 0 ? (
            <Empty title="Belum ada transaksi">Mulai satu transaksi dari situs, lalu kembali ke sini.</Empty>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Produk</th>
                    <th>Waktu</th>
                    <th className={s.cellRight}>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => {
                    const st = stat(t);
                    return (
                      <tr key={t.inv} style={{ cursor: "default" }}>
                        <td className={`${s.cellStrong} ${s.num}`}>{t.inv}</td>
                        <td>{t.prod}</td>
                        <td className={s.num}>{dt(t.time)}</td>
                        <td className={`${s.cellRight} ${s.num} ${s.cellStrong}`}>{rp(t.total)}</td>
                        <td>
                          <StatusBadge status={st} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className={`${s.grid}`}>
          <Card title="Metode pembayaran">
            {loading ? (
              <Skeleton w="100%" h={120} />
            ) : methods.length === 0 ? (
              <Empty title="Belum ada data" />
            ) : (
              <div className={s.rankList}>
                {methods.map((m) => (
                  <div className={s.rankRow} key={m.key}>
                    <div className={s.rankBody}>
                      <div className={s.rankTitle}>{m.key}</div>
                      <div className={s.rankSub}>{m.count} transaksi</div>
                      <div className={s.rankMeter}>
                        <Meter value={m.share} />
                      </div>
                    </div>
                    <div className={s.rankValue}>{rpShort(m.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Kategori teratas">
            {loading ? (
              <Skeleton w="100%" h={120} />
            ) : (
              <div className={s.rankList}>
                {cats.slice(0, 5).map((c, i) => (
                  <div className={s.rankRow} key={c.key}>
                    <span className={s.rankIdx}>{String(i + 1).padStart(2, "0")}</span>
                    <div className={s.rankBody}>
                      <div className={s.rankTitle}>{c.key}</div>
                      <div className={s.rankSub}>{c.count} transaksi · {c.share.toFixed(0)}%</div>
                    </div>
                    <div className={s.rankValue}>{rpShort(c.revenue)}</div>
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
