"use client";

import { useEffect, useState } from "react";
import { readLocal, type Tx } from "./data";

/**
 * Sumber data dashboard: tabel `transactions` di Supabase lewat `/api/tx`
 * (butuh sesi admin). Order yang masih tersimpan di perangkat ini — sisa dari
 * masa sebelum Supabase dipakai, atau kiriman yang gagal karena jaringan —
 * dikirim sekali saat dashboard pertama kali dibuka.
 */
const MIGRATED = "vcr_tx_migrated";

async function migrateLocalOnce() {
  try {
    if (localStorage.getItem(MIGRATED) === "1") return;
    for (const t of readLocal()) {
      await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      }).catch(() => null);
    }
    localStorage.setItem(MIGRATED, "1");
  } catch {
    /* localStorage bisa diblokir — migrasi hanya upaya terbaik. */
  }
}

export function useTx() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      await migrateLocalOnce();
      try {
        const r = await fetch("/api/tx");
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; rows?: Tx[]; code?: string };
        if (!alive) return;
        if (r.ok && j.ok) setTx(j.rows ?? []);
        else
          setError(
            j.code === "not-configured"
              ? "SUPABASE_SERVICE_ROLE_KEY belum di-set — dashboard belum bisa membaca order."
              : "Gagal memuat transaksi dari Supabase."
          );
      } catch {
        if (alive) setError("Jaringan bermasalah — transaksi tidak bisa dimuat.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { tx, loading, error };
}
