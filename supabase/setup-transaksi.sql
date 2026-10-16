-- ===========================================================================
-- VENCORAGO — tabel transaksi (Supabase Postgres)
-- Jalankan sekali di Supabase -> SQL Editor. Aman diulang (idempotent).
--
-- Kenapa RLS aktif tanpa satu pun policy?
--   Semua baca/tulis lewat route server Next.js `/api/tx` yang memakai
--   SUPABASE_SERVICE_ROLE_KEY (server-only). Service role melewati RLS,
--   sedangkan role `anon` / `authenticated` tidak punya policy sama sekali —
--   jadi publishable key tidak bisa membaca maupun menulis tabel ini.
--   JANGAN menambahkan policy `using (true)`: itu membuka seluruh order
--   (nomor tujuan, total) ke siapa pun yang memegang publishable key.
-- ===========================================================================

create table if not exists public.transactions (
  inv        text primary key,
  prod       text not null,
  cat        text not null,
  no         text not null,
  pm         text not null,
  total      bigint not null check (total > 0),
  status     text not null check (status in ('pending', 'success')),
  sn         text not null default '',
  time       timestamptz not null,
  paid       timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is
  'Order dari checkout publik VENCORAGO. Hanya diakses lewat /api/tx (service role).';

-- Dashboard membaca urut waktu terbaru.
create index if not exists transactions_time_idx on public.transactions (time desc);
-- Rekap per nomor tujuan (dipakai kalau nanti ada halaman pelanggan lagi).
create index if not exists transactions_no_idx on public.transactions (no);

alter table public.transactions enable row level security;
