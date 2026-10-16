"use client";

import { useState, type FormEvent } from "react";
import s from "./admin.module.css";
import { Icon } from "./ui";

const ERR: Record<string, string> = {
  "bad-password": "Password salah.",
  "bad-request": "Password tidak valid.",
  "too-many": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
  "not-configured": "ADMIN_PASSWORD / ADMIN_SESSION_SECRET belum di-set di environment.",
};

/** Hanya izinkan tujuan internal, supaya `?next=` tidak jadi open redirect. */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

export default function LoginView() {
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !pass) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (r.ok && j.ok) {
        /* Muat ulang penuh supaya cookie sesi langsung dipakai render server. */
        window.location.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
        return;
      }
      setErr(ERR[j.code ?? ""] ?? `Gagal masuk (HTTP ${r.status}).`);
    } catch {
      setErr("Jaringan bermasalah — coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.admin}>
      <div className={s.loginPage}>
        <form className={s.loginCard} onSubmit={submit}>
          <span className={s.loginMark} aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path
                d="M11 12l9 17 9-17"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="29" cy="12" r="3.2" fill="#a7f0e2" />
            </svg>
          </span>

          <h1 className={s.loginTitle}>Masuk admin</h1>
          <p className={s.loginNote}>
            Area ini hanya untuk pengelola. Masukkan password admin untuk membuka dashboard.
          </p>

          <label className={s.qrisLabel} htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className={s.field}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              if (err) setErr("");
            }}
          />

          {err ? (
            <p className={`${s.qrisMsg} ${s.qrisMsgBad}`} role="alert">
              {err}
            </p>
          ) : null}

          <button
            className={`${s.btn} ${s.btnPrimary} ${s.loginSubmit}`}
            type="submit"
            disabled={busy || !pass}
          >
            <Icon n={busy ? "clock" : "check"} />
            {busy ? "Memeriksa…" : "Masuk"}
          </button>

          <a className={s.loginBack} href="/">
            ← Kembali ke situs
          </a>
        </form>
      </div>
    </div>
  );
}
