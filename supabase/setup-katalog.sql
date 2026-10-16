-- ===========================================================================
-- VENCORAGO — katalog (kategori, penyedia, item, metode bayar, setelan)
-- Jalankan sekali di Supabase -> SQL Editor. Aman diulang (idempotent).
--
-- Kenapa RLS aktif dengan policy SELECT saja?
--   Katalog memang data publik: halaman /produk, beranda, dan /cara-bayar
--   membacanya. Jadi role `anon` / publishable key boleh SELECT. Tapi TIDAK ada
--   policy untuk insert/update/delete — menulis katalog hanya bisa lewat route
--   server `/api/catalog` yang memakai SUPABASE_SERVICE_ROLE_KEY dan wajib sesi
--   admin. Jadi publishable key tidak bisa mengubah harga orang lain.
--
-- Bentuk data sengaja "satu sumber untuk semua halaman": harga jual ada di
-- kolom price (bukan dihitung rumus di kode), jadi angka di halaman publik,
-- checkout, dan dashboard tidak bisa lagi menyimpang satu sama lain.
-- ===========================================================================

-- ---------------------------------------------------------------- kategori --
-- `kind` menentukan pola UI (lihat komentar di lib/catalog.ts):
--   nominal : pelanggan memilih nominal tetap  (pulsa, token, e-wallet)
--   paket   : pelanggan memilih paket berdurasi (paket data)
--   tagihan : pelanggan memasukkan ID pelanggan, nominal menyusul (PDAM, BPJS)
create table if not exists public.catalog_categories (
  slug           text primary key,
  name           text not null unique,
  icon           text not null default 'phone',
  description    text not null default '',
  tile_note      text not null default '',
  kind           text not null check (kind in ('nominal', 'paket', 'tagihan')),
  number_label   text not null default 'Nomor Tujuan',
  number_ph      text not null default '',
  number_min     int  not null default 8  check (number_min > 0),
  number_max     int  not null default 16 check (number_max >= number_min),
  provider_label text not null default 'Pilih Penyedia',
  item_label     text not null default 'Pilih Nominal',
  bill           jsonb not null default '{}'::jsonb,
  bill_sample    bigint check (bill_sample is null or bill_sample >= 0),
  sort           int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.catalog_categories is
  'Kategori produk VENCORAGO. Dibaca publik, ditulis hanya lewat /api/catalog (sesi admin).';
comment on column public.catalog_categories.bill_sample is
  'Contoh nominal tagihan untuk kategori kind=tagihan (dipakai beranda sebelum tagihan asli diketahui).';

-- --------------------------------------------------------------- penyedia --
create table if not exists public.catalog_providers (
  id            bigint generated always as identity primary key,
  category_slug text not null references public.catalog_categories (slug) on delete cascade,
  name          text not null,
  sort          int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (category_slug, name)
);

comment on table public.catalog_providers is
  'Operator / wilayah / penyedia di dalam satu kategori (Telkomsel, PDAM Jakarta, IndiHome, …).';

-- ------------------------------------------------------------------- item --
create table if not exists public.catalog_items (
  id         bigint generated always as identity primary key,
  provider_id bigint not null references public.catalog_providers (id) on delete cascade,
  name       text not null,
  note       text not null default '',
  value      bigint not null default 0 check (value >= 0),
  price      bigint not null default 0 check (price >= 0),
  featured   boolean not null default false,
  card_label text not null default '',
  sort       int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.catalog_items is
  'Produk jual: nominal / paket beserta harga jualnya. price adalah angka yang benar-benar dibayar pelanggan (sudah termasuk margin).';
comment on column public.catalog_items.card_label is
  'Label kartu "Produk Pilihan" di beranda. Kosong = tidak pernah ditampilkan di kartu.';

-- ----------------------------------------------------------- metode bayar --
create table if not exists public.payment_methods (
  code       text primary key,
  name       text not null unique,
  note       text not null default '',
  kind       text not null check (kind in ('qris', 'va', 'wallet')),
  fee        bigint not null default 0 check (fee >= 0),
  prefix     text not null default '',
  icon       text not null default 'card',
  sort       int not null default 0,
  active     boolean not null default true
);

comment on table public.payment_methods is
  'Metode pembayaran + biaya tambahan per metode. `prefix` dipakai menyusun nomor VA.';

-- ---------------------------------------------------------------- setelan --
create table if not exists public.catalog_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.catalog_settings is
  'Setelan katalog yang berlaku global: biaya admin, kategori default. Nilai disimpan sebagai jsonb.';

-- ------------------------------------------------------------------ index --
create index if not exists catalog_categories_sort_idx on public.catalog_categories (sort, name);
create index if not exists catalog_providers_cat_idx on public.catalog_providers (category_slug, sort, name);
create index if not exists catalog_items_provider_idx on public.catalog_items (provider_id, sort, id);
create index if not exists catalog_items_featured_idx on public.catalog_items (featured) where featured;
create index if not exists payment_methods_sort_idx on public.payment_methods (sort, name);

-- -------------------------------------------------------------------- RLS --
alter table public.catalog_categories enable row level security;
alter table public.catalog_providers  enable row level security;
alter table public.catalog_items      enable row level security;
alter table public.payment_methods    enable row level security;
alter table public.catalog_settings   enable row level security;

-- Katalog boleh dibaca siapa saja (data publik), tapi tidak boleh diubah.
-- `drop policy if exists` dulu supaya file ini bisa dijalankan berkali-kali.
drop policy if exists katalog_baca on public.catalog_categories;
create policy katalog_baca on public.catalog_categories for select to anon, authenticated using (true);

drop policy if exists katalog_baca on public.catalog_providers;
create policy katalog_baca on public.catalog_providers for select to anon, authenticated using (true);

drop policy if exists katalog_baca on public.catalog_items;
create policy katalog_baca on public.catalog_items for select to anon, authenticated using (true);

drop policy if exists katalog_baca on public.payment_methods;
create policy katalog_baca on public.payment_methods for select to anon, authenticated using (true);

drop policy if exists katalog_baca on public.catalog_settings;
create policy katalog_baca on public.catalog_settings for select to anon, authenticated using (true);

-- TIDAK ada policy insert/update/delete: perubahan katalog hanya lewat
-- /api/catalog (service role + sesi admin). Jangan menambahkan policy tulis
-- untuk `anon`, karena itu membuka harga & produk untuk diubah siapa pun.

grant select on public.catalog_categories, public.catalog_providers,
  public.catalog_items, public.payment_methods, public.catalog_settings
  to anon, authenticated;
