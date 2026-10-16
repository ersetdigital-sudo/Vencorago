"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Logo from "../Logo";
import s from "./admin.module.css";
import { Icon, type IconName } from "./ui";
import { useTx } from "./useTx";
import { stat } from "./data";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Ringkasan", icon: "gauge" },
  { href: "/admin/transaksi", label: "Transaksi", icon: "receipt" },
  { href: "/admin/produk", label: "Produk", icon: "box" },
  { href: "/admin/katalog", label: "Katalog", icon: "inbox" },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: "settings" },
];

const isActive = (href: string, pathname: string) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");
  const { tx } = useTx();

  const current = NAV.find((n) => isActive(n.href, pathname)) ?? NAV[0];
  const needAttention = tx.filter((t) => stat(t) === "pending").length;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className={`${s.admin} ${collapsed ? s.collapsed : ""}`}>
      <div className={s.shell}>
        <nav className={s.panel} id="menu-admin" aria-label="Menu admin">
          <Link className={s.panelBrand} href="/admin">
            <Logo className={s.brandMark} lwClass={s.brandWord} />
          </Link>

          <span className={s.panelGroup}>Operasional</span>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={s.panelRow}
              aria-current={isActive(n.href, pathname) ? "page" : undefined}
            >
              <Icon n={n.icon} />
              {n.label}
            </Link>
          ))}
          <span className={s.panelGroup}>Situs</span>
          <Link className={s.panelRow} href="/">
            <Icon n="external" />
            Lihat situs
          </Link>
          <Link className={s.panelRow} href="/status">
            <Icon n="receipt" />
            Cek status publik
          </Link>
        </nav>

        <div className={s.content}>
          <header className={s.strip}>
            <button
              className={`${s.iconBtn} ${s.menuBtn}`}
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-controls="menu-admin"
              aria-label={collapsed ? "Tampilkan menu" : "Sembunyikan menu"}
              title={collapsed ? "Tampilkan menu" : "Sembunyikan menu"}
            >
              <Icon n="panel" />
            </button>
            <nav className={s.crumbs} aria-label="Breadcrumb">
              <span>Admin</span>
              <span className={s.crumbSep}>/</span>
              <b>{current.label}</b>
            </nav>

            <form
              className={s.stripSearch}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const v = q.trim();
                router.push(v ? `/admin/transaksi?q=${encodeURIComponent(v)}` : "/admin/transaksi");
              }}
            >
              <Icon n="search" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari invoice, produk, atau nomor"
                aria-label="Cari transaksi"
              />
            </form>

            <Link
              className={s.iconBtn}
              href="/admin/transaksi?status=pending"
              title="Transaksi menunggu pembayaran"
              aria-label={`Transaksi menunggu: ${needAttention}`}
            >
              <Icon n="bell" />
              {needAttention > 0 ? <span className={s.dot}>{needAttention > 99 ? "99+" : needAttention}</span> : null}
            </Link>

            <Link className={s.account} href="/" title="Buka situs publik">
              <span className={s.avatar} aria-hidden="true">
                AD
              </span>
              <span className={s.accountName}>Admin</span>
              <Icon n="external" />
            </Link>

            <button
              className={s.iconBtn}
              onClick={logout}
              title="Keluar dari admin"
              aria-label="Keluar dari admin"
            >
              <Icon n="logout" />
            </button>
          </header>

          <main className={s.canvas}>{children}</main>
        </div>
      </div>

      <nav className={s.bottomNav} aria-label="Navigasi admin (mobile)">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={s.bottomItem}
            aria-current={isActive(n.href, pathname) ? "page" : undefined}
          >
            <Icon n={n.icon} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
