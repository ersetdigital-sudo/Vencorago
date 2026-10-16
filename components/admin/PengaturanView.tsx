"use client";

import { useEffect, useRef, useState } from "react";
import s from "./admin.module.css";
import { Badge, Card, Icon, Skeleton } from "./ui";
import { fetchQris, type QrisState } from "@/lib/qris";

/* Pesan error dari kode route /api/qris — disampaikan apa adanya, termasuk
   langkah setup yang belum dijalankan (env / SQL bucket). */
const ERR: Record<string, string> = {
  "not-configured":
    "Supabase belum terhubung — isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local lalu restart server.",
  "no-pin": "ADMIN_PIN belum di-set di .env.local. Tentukan PIN dulu sebelum bisa ganti foto.",
  "bad-pin": "PIN salah.",
  "no-file": "Pilih file gambar dulu.",
  "empty": "File-nya kosong.",
  "too-big": "Ukuran file maksimal 5 MB.",
  "bad-type": "Format gambar harus PNG, JPG, atau WebP.",
  "no-bucket": "Bucket 'qris' belum ada — jalankan supabase/setup-qris.sql di SQL Editor Supabase.",
  "upload-failed": "Gagal unggah ke Storage Supabase. Cek koneksi project lalu coba lagi.",
  "remove-failed": "Gagal menghapus foto lama di Storage Supabase.",
};

const OK_REPLACE = "Foto QRIS diganti — foto lama otomatis terhapus dari Storage.";
const OK_REPLACE_PARTIAL =
  "Foto baru sudah aktif, tapi ada file lama yang gagal dihapus. Ganti foto sekali lagi untuk membersihkannya.";
const OK_REMOVE = "Foto QRIS dihapus. Checkout kembali memakai QR placeholder.";

type Msg = { ok: boolean; text: string };

export default function PengaturanView() {
  const [st, setSt] = useState<QrisState | null>(null);
  const [pin, setPin] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetchQris().then((r) => {
      if (alive) setSt(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function send(method: "POST" | "DELETE", fd?: FormData) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/qris", {
        method,
        headers: { "x-admin-pin": pin },
        body: fd,
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string | null;
        code?: string;
        cleanup?: string;
      };

      if (r.ok && j.ok) {
        if (method === "POST") {
          setSt({ configured: true, url: j.url ?? null, bucketOk: true });
          setFileName("");
          if (fileRef.current) fileRef.current.value = "";
          setMsg({ ok: true, text: j.cleanup === "partial" ? OK_REPLACE_PARTIAL : OK_REPLACE });
        } else {
          setSt({ configured: true, url: null, bucketOk: true });
          setMsg({ ok: true, text: OK_REMOVE });
        }
        return;
      }

      if (j.code === "not-configured") setSt({ configured: false, url: null });
      if (j.code === "no-bucket")
        setSt((p) => ({ configured: true, url: p?.url ?? null, bucketOk: false }));
      setMsg({ ok: false, text: ERR[j.code ?? ""] ?? `Permintaan gagal (HTTP ${r.status}).` });
    } catch {
      setMsg({ ok: false, text: "Jaringan bermasalah — coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  function upload() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    void send("POST", fd);
  }

  function remove() {
    if (!st?.url) return;
    if (!confirm("Hapus foto QRIS? Halaman bayar akan kembali memakai QR placeholder.")) return;
    void send("DELETE");
  }

  const ready = st !== null;
  const canWrite = !busy && Boolean(pin.trim());

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Pengaturan</h1>
          <p className={s.pageSub}>
            Foto QRIS untuk halaman bayar publik — tersimpan di Supabase Storage
          </p>
        </div>
        <div className={s.pageAction}>
          <Badge tone={st?.configured ? "ok" : "info"} dot>
            {st?.configured ? "Supabase aktif" : "Belum terhubung"}
          </Badge>
        </div>
      </div>

      <div className={`${s.grid} ${s.split8}`}>
        <Card title="Foto QRIS" note="bucket: qris">
          {!ready ? (
            <Skeleton w="100%" h={340} />
          ) : (
            <>
              <div className={s.qrisPreview}>
                {st.url ? (
                  <img
                    className={s.qrisImg}
                    src={st.url}
                    alt="Foto QRIS aktif"
                    width={320}
                    height={320}
                  />
                ) : (
                  <div className={s.empty}>
                    <Icon n="inbox" />
                    <b>Belum ada foto QRIS</b>
                    <p>Halaman bayar menampilkan QR placeholder sampai foto diunggah.</p>
                  </div>
                )}
              </div>

              <div className={s.qrisForm}>
                <label className={s.qrisLabel} htmlFor="qris-pin">
                  PIN admin
                </label>
                <input
                  id="qris-pin"
                  className={`${s.field} ${s.qrisPin}`}
                  type="password"
                  autoComplete="off"
                  placeholder="PIN dari .env.local (ADMIN_PIN)"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (msg) setMsg(null);
                  }}
                />

                <div className={s.qrisActions}>
                  <label className={`${s.btn} ${s.qrisPick}`} htmlFor="qris-file">
                    <Icon n="upload" />
                    Pilih gambar
                    <input
                      id="qris-file"
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setFileName(f ? `${f.name} · ${Math.round(f.size / 1024)} KB` : "");
                        setMsg(null);
                      }}
                    />
                  </label>
                  <button
                    className={`${s.btn} ${s.btnPrimary}`}
                    onClick={upload}
                    disabled={!canWrite || !fileName}
                  >
                    <Icon n="upload" />
                    Unggah &amp; ganti
                  </button>
                  <button className={s.btn} onClick={remove} disabled={!canWrite || !st.url}>
                    <Icon n="trash" />
                    Hapus foto
                  </button>
                </div>

                <span className={s.qrisFile}>{fileName || "Belum ada file dipilih"}</span>

                {msg ? (
                  <p className={`${s.qrisMsg} ${msg.ok ? s.qrisMsgOk : s.qrisMsgBad}`} role="status">
                    {msg.text}
                  </p>
                ) : null}

                <p className={s.qrisHint}>
                  Ganti foto = unggah baru ke bucket <b>qris</b>, lalu file lama ikut terhapus —
                  hanya satu QRIS yang tersimpan. Batas 5 MB, format PNG/JPG/WebP.
                </p>
              </div>
            </>
          )}
        </Card>

        <Card title="Koneksi" note="dicek di server">
          {!ready ? (
            <Skeleton w="100%" h={200} />
          ) : (
            <div className={s.qrisMeta}>
              <div className={s.qrisMetaRow}>
                <span>Supabase</span>
                <b>{st.configured ? "Terhubung" : "Belum dikonfigurasi"}</b>
              </div>
              <div className={s.qrisMetaRow}>
                <span>Storage bucket</span>
                <b>{st.bucketOk === false ? "Belum siap" : "qris · publik"}</b>
              </div>
              <div className={s.qrisMetaRow}>
                <span>Endpoint</span>
                <b className={s.num}>/api/qris</b>
              </div>
              <div className={s.qrisMetaRow}>
                <span>Foto aktif</span>
                <b>{st.url ? "1 file" : "0 file"}</b>
              </div>

              {!st.configured ? (
                <p className={s.qrisNote}>
                  Isi <b>NEXT_PUBLIC_SUPABASE_URL</b> dan <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> di{" "}
                  <b>.env.local</b>, jalankan <b>supabase/setup-qris.sql</b>, lalu restart server.
                </p>
              ) : null}
              {st.configured && st.bucketOk === false ? (
                <p className={s.qrisNote}>
                  Bucket belum bisa diakses — jalankan <b>supabase/setup-qris.sql</b> di SQL Editor
                  Supabase.
                </p>
              ) : null}

              <p className={s.qrisNote}>
                Upload dikunci PIN di server; kredensial Supabase tidak pernah masuk browser. Untuk
                produksi, tambahkan Supabase Auth (lihat README).
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
