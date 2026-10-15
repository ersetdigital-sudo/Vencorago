"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./MobileTabBar.module.css";

const TABS = [
  {
    href: "/",
    label: "Beranda",
    icon: (
      <>
        <path d="M3 10.6 12 3.4l9 7.2" />
        <path d="M5.6 9.6v11h12.8v-11" />
        <path d="M9.9 20.6v-5.4h4.2v5.4" />
      </>
    ),
  },
  {
    href: "/produk",
    label: "Produk",
    icon: (
      <>
        <path d="M12 2.8 3.6 7.4v9.2L12 21.2l8.4-4.6V7.4z" />
        <path d="M3.6 7.4 12 12l8.4-4.6" />
        <path d="M12 12v9.2" />
      </>
    ),
  },
  {
    href: "/cara-bayar",
    label: "Cara Bayar",
    icon: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
      </>
    ),
  },
  {
    href: "/status",
    label: "Cek Status",
    icon: (
      <>
        <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    href: "/bantuan",
    label: "Bantuan",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.4v.4" />
        <path d="M12 16.8h.01" />
      </>
    ),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  // the admin area has its own navigation shell
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={s.bar} aria-label="Navigasi utama">
      {TABS.map((t) => {
        const on = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`${s.tab} ${on ? s.on : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <span className={s.ico}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {t.icon}
              </svg>
            </span>
            <span className={s.lbl}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
