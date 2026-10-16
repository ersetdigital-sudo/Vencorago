-- ===========================================================================
-- Setup foto QRIS (VENCORAGO)
-- Jalankan sekali di Supabase Dashboard > SQL Editor > New query > Run.
--
-- Apa yang dibuat:
--   1. bucket storage `qris` (public read — checkout publik ambil URL-nya)
--   2. kebijakan RLS storage.objects untuk role `anon`:
--      SELECT (baca), INSERT (unggah), UPDATE, DELETE di dalam bucket qris
--
-- Catatan keamanan: kebijakan ini sengaja mengizinkan role `anon` menulis di
-- bucket qris, karena unggah/hapus dikerjakan route server Next.js (/api/qris)
-- memakai key publishable, dan route itu hanya menerima sesi admin yang sah
-- (cookie dari /api/admin/login). Artinya proteksi login hanya berlaku di
-- aplikasi: siapa pun yang memegang key publishable masih bisa menulis
-- langsung ke Storage. Untuk produksi, pindahkan upload ke Supabase Auth dan
-- ubah policy jadi `to authenticated` — lihat README bagian Supabase.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qris',
  'qris',
  true,                 -- public: siapa pun boleh membaca URL gambar
  5242880,              -- batas 5 MB per file (sama dengan batas di /api/qris)
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS pada storage.objects sudah aktif bawaan Supabase, jadi tidak perlu
-- (dan tidak boleh) di-`alter table` — tabel itu milik role storage, bukan
-- role yang menjalankan skrip ini (error 42501 "must be owner of table objects").

-- Baca: foto QRIS ditampilkan publik di halaman bayar.
drop policy if exists "qris public read" on storage.objects;
create policy "qris public read"
  on storage.objects
  for select
  using (bucket_id = 'qris');

-- Unggah (insert) oleh anon dari aplikasi.
drop policy if exists "qris anon insert" on storage.objects;
create policy "qris anon insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'qris');

-- Update diperlukan supaya penggantian file (upsert) bisa bekerja.
drop policy if exists "qris anon update" on storage.objects;
create policy "qris anon update"
  on storage.objects
  for update
  to anon
  using (bucket_id = 'qris')
  with check (bucket_id = 'qris');

-- Hapus: dipakai saat admin ganti foto (file lama dihapus) atau hapus foto.
drop policy if exists "qris anon delete" on storage.objects;
create policy "qris anon delete"
  on storage.objects
  for delete
  to anon
  using (bucket_id = 'qris');
