import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "./Logo";

export type MenuItem = { label: string; href: string; on?: boolean };

export default function Header({
  s,
  menu,
  btnIcon,
}: {
  s: Record<string, string>;
  menu: MenuItem[];
  btnIcon?: ReactNode;
}) {
  return (
    <header>
      <div className={`${s.wrap} ${s.nav}`}>
        <Link className={s.logo} href="/">
          <Logo className={s.lm} lwClass={s.lw} />
        </Link>
        <nav className={s.menu}>
          {menu.map((m) => (
            <Link key={m.label} className={m.on ? s.on : undefined} href={m.href}>
              {m.label}
            </Link>
          ))}
        </nav>
        <a
          className={s.btn}
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noreferrer"
        >
          {btnIcon}
          Hubungi Kami
        </a>
      </div>
    </header>
  );
}
