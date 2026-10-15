import type { ReactNode } from "react";
import s from "./admin.module.css";
import { LBL, rp, rpShort, type TxStatus } from "./data";

/* One authored icon family: 24px grid, 1.8 stroke, round caps/joins —
   the same vocabulary the public site uses. */
const SV = {
  gauge: (
    <>
      <path d="M12 14 16.5 9" />
      <circle cx="12" cy="14" r="1.1" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.4 3.4 0 0 1 0 6.6" />
      <path d="M18 20a6.6 6.6 0 0 0-2-4.7" />
    </>
  ),
  box: (
    <>
      <path d="M12 2.8 3.6 7.4v9.2L12 21.2l8.4-4.6V7.4z" />
      <path d="M3.6 7.4 12 12l8.4-4.6" />
      <path d="M12 12v9.2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1.4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3a1.6 1.6 0 0 0 1-1.5V1.4a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 3a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 9v.1a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </>
  ),
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9.5 4v16" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 20h16" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13h4l1.5 2.5h6L16.5 13h4" />
      <path d="M5.5 4.5h13l2 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18v-5z" />
    </>
  ),
  banknote: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  trend: <path d="M4 16.5 9.5 11l3.5 3.5L20 7.5" />,
};

export type IconName = keyof typeof SV;

export function Icon({ n, className }: { n: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {SV[n]}
    </svg>
  );
}

export function Badge({
  tone,
  children,
  dot = false,
}: {
  tone: "ok" | "warn" | "bad" | "info" | "accent";
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`${s.badge} ${s[tone]}`}>
      {dot ? <span className={s.badgeDot} /> : null}
      {children}
    </span>
  );
}

const TONE: Record<TxStatus, "ok" | "warn" | "bad"> = {
  success: "ok",
  pending: "warn",
  expired: "bad",
};
const TONE_ICON: Record<TxStatus, IconName> = {
  success: "check",
  pending: "clock",
  expired: "alert",
};

export function StatusBadge({ status }: { status: TxStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LBL[status]}
    </Badge>
  );
}

export function statusIcon(status: TxStatus): IconName {
  return TONE_ICON[status];
}

export function Card({
  title,
  note,
  action,
  children,
  className,
}: {
  title?: string;
  note?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${s.card} ${className ?? ""}`}>
      {title ? (
        <header className={s.cardHead}>
          <h2 className={s.cardTitle}>{title}</h2>
          {note ? <span className={s.cardNote}>{note}</span> : null}
          {action ? <div className={s.cardAction}>{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  foot,
  icon,
}: {
  label: string;
  value: string;
  foot?: ReactNode;
  icon: IconName;
}) {
  return (
    <div className={s.kpi}>
      <span className={s.kpiLabel}>
        <Icon n={icon} className={s.kpiIcon} />
        {label}
      </span>
      <span className={`${s.kpiValue} ${s.num}`}>{value}</span>
      {foot ? <span className={s.kpiFoot}>{foot}</span> : null}
    </div>
  );
}

export function Bars({
  data,
  label,
}: {
  data: { label: string; revenue: number; count: number }[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div>
      <div className={s.chart} role="img" aria-label={label}>
        {data.map((d) => (
          <div className={s.barCol} key={d.label} title={`${d.label}: ${rp(d.revenue)} · ${d.count} transaksi`}>
            <div className={s.barTrack}>
              <div className={s.barFill} style={{ height: `${Math.max((d.revenue / max) * 100, 1.5)}%` }} />
            </div>
            <span className={s.barLabel}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className={s.axis}>
        <span>0</span>
        <span>{rpShort(max)}</span>
      </div>
    </div>
  );
}

export function Meter({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" | "warn" | "bad" }) {
  const bg = tone === "accent" ? "var(--primary)" : `var(--${tone}-text)`;
  return (
    <div className={s.meter}>
      <div className={s.meterFill} style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: bg }} />
    </div>
  );
}

export function LegendRow({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div className={s.legendRow}>
      <span className={s.swatch} style={{ background: swatch }} />
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Skeleton({ w = "100%", h = 14 }: { w?: string; h?: number }) {
  return <div className={s.skeleton} style={{ width: w, height: h }} />;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={s.empty}>
      <Icon n="inbox" />
      <b>{title}</b>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Pager({
  page,
  pages,
  total,
  from,
  to,
  onPrev,
  onNext,
}: {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={s.pager}>
      <span className={s.pagerInfo}>
        {total === 0 ? "0" : `${from}–${to}`} / {total}
      </span>
      <div className={s.pagerBtns}>
        <button className={`${s.btn} ${s.btnSm}`} onClick={onPrev} disabled={page <= 1}>
          <Icon n="left" />
          Sebelumnya
        </button>
        <button className={`${s.btn} ${s.btnSm}`} onClick={onNext} disabled={page >= pages}>
          Berikutnya
          <Icon n="right" />
        </button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ cursor: "default" }}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c}>
                  <Skeleton w={c === 0 ? "90px" : c === cols - 1 ? "70px" : "120px"} h={12} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
