import { stat, type Tx } from "./data";

export type Summary = {
  revenue: number;
  count: number;
  success: number;
  pending: number;
  expired: number;
  successRate: number;
  avg: number;
  today: number;
  todayCount: number;
};

export function summarize(tx: Tx[]): Summary {
  const s: Summary = {
    revenue: 0,
    count: tx.length,
    success: 0,
    pending: 0,
    expired: 0,
    successRate: 0,
    avg: 0,
    today: 0,
    todayCount: 0,
  };
  // Guarded so nothing time-dependent runs while the route is prerendered
  // (no data yet). Next 16 errors on synchronous IO during prerender.
  if (tx.length === 0) return s;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  for (const t of tx) {
    const st = stat(t);
    if (st === "success") {
      s.success++;
      s.revenue += t.total;
      if (t.time >= startOfDay.getTime()) {
        s.today += t.total;
        s.todayCount++;
      }
    } else if (st === "pending") s.pending++;
    else s.expired++;
  }
  s.successRate = s.count ? (s.success / s.count) * 100 : 0;
  s.avg = s.success ? s.revenue / s.success : 0;
  return s;
}

export type DayBucket = { key: string; label: string; revenue: number; count: number };

export function byDay(tx: Tx[], days: number): DayBucket[] {
  const out: DayBucket[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400e3);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      revenue: 0,
      count: 0,
    });
  }
  const idx = new Map(out.map((b, i) => [b.key, i]));
  for (const t of tx) {
    if (stat(t) !== "success") continue;
    const key = new Date(t.time).toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i === undefined) continue;
    out[i].revenue += t.total;
    out[i].count++;
  }
  return out;
}

export type Row = { key: string; label: string; sub?: string; count: number; revenue: number; share: number };

export function groupBy(
  tx: Tx[],
  keyOf: (t: Tx) => string,
  labelOf?: (t: Tx) => string,
  limit = 0
): Row[] {
  const map = new Map<string, Row>();
  let totalRevenue = 0;
  for (const t of tx) {
    if (stat(t) !== "success") continue;
    const k = keyOf(t);
    const row = map.get(k) ?? { key: k, label: labelOf ? labelOf(t) : k, count: 0, revenue: 0, share: 0 };
    row.count++;
    row.revenue += t.total;
    totalRevenue += t.total;
    map.set(k, row);
  }
  const rows = [...map.values()].sort((a, b) => b.revenue - a.revenue);
  for (const r of rows) r.share = totalRevenue ? (r.revenue / totalRevenue) * 100 : 0;
  return limit ? rows.slice(0, limit) : rows;
}

export function statusSplit(tx: Tx[]) {
  const s = summarize(tx);
  return [
    { key: "success", label: "Berhasil", count: s.success, tone: "ok" as const },
    { key: "pending", label: "Menunggu", count: s.pending, tone: "warn" as const },
    { key: "expired", label: "Gagal / kedaluwarsa", count: s.expired, tone: "bad" as const },
  ];
}

export function toCsv(headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
