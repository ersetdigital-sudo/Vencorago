-- ===========================================================================
-- VENCORAGO — seed katalog awal
-- Dijalankan sekali setelah supabase/setup-katalog.sql. Aman diulang: kalau
-- tabel kategori sudah berisi data, seluruh seed dilewati.
--
-- Isinya persis katalog statis yang dulu ada di components/produk/data.ts
-- (kategori, penyedia, nominal + harga jual, metode bayar, setelan global).
-- Setelah ini, tidak ada lagi daftar produk di dalam kode: semuanya di sini.
-- ===========================================================================

do $seed$
begin
  if exists (select 1 from public.catalog_categories) then
    raise notice 'katalog sudah terisi — seed dilewati';
    return;
  end if;

  insert into public.catalog_categories
    (slug, name, icon, description, tile_note, kind, number_label, number_ph,
     number_min, number_max, provider_label, item_label, bill, bill_sample, sort)
  values
  ('pulsa', 'Pulsa', 'phone', 'Isi pulsa semua operator, masuk dalam hitungan detik.', 'Pulsa semua operator', 'nominal', 'Nomor HP', '08xxxxxxxxxx', 10, 13, 'Pilih Operator', 'Pilih Nominal Pulsa', '{}'::jsonb, null, 1),
  ('paket-data', 'Paket Data', 'wifi', 'Kuota internet hemat untuk semua operator.', 'Internet lebih hemat', 'paket', 'Nomor HP', '08xxxxxxxxxx', 10, 13, 'Pilih Operator', 'Pilih Paket Data', '{}'::jsonb, null, 2),
  ('token-pln', 'Token PLN', 'zap', 'Beli token listrik prabayar, token langsung tampil setelah bayar.', 'Listrik prabayar', 'nominal', 'Nomor Meter / ID Pelanggan', '11 atau 12 digit', 11, 12, 'Pilih Layanan', 'Pilih Nominal Token', '{}'::jsonb, null, 3),
  ('e-wallet', 'E-Wallet', 'wallet', 'Isi saldo dompet digital dengan mudah dan cepat.', 'DANA, OVO, GoPay', 'nominal', 'Nomor HP terdaftar', '08xxxxxxxxxx', 10, 13, 'Pilih Dompet Digital', 'Pilih nominal top up', '{}'::jsonb, null, 4),
  ('pdam', 'PDAM', 'drop', 'Bayar tagihan air PDAM di berbagai daerah.', 'Tagihan air daerah', 'tagihan', 'ID Pelanggan PDAM', 'Nomor pelanggan', 8, 12, 'Pilih Wilayah PDAM', '', '{"Contoh tagihan":"Rp 87.500","Jatuh tempo":"Tanggal 20 setiap bulan"}'::jsonb, 87500, 5),
  ('bpjs-kesehatan', 'BPJS Kesehatan', 'shield', 'Bayar iuran BPJS Kesehatan untuk seluruh anggota keluarga.', 'Bayar lebih mudah', 'tagihan', 'Nomor VA Keluarga', '8888xxxxxxxxxxx', 11, 16, 'Pilih Layanan', '', '{"Kelas 1":"Rp 150.000 / orang","Kelas 2":"Rp 100.000 / orang","Kelas 3":"Rp 42.000 / orang","Bayar sampai":"12 bulan sekaligus"}'::jsonb, 150000, 6),
  ('internet-tv', 'Internet & TV', 'tv', 'Bayar tagihan internet rumah dan TV berbayar.', 'IndiHome, First, dll', 'tagihan', 'Nomor Pelanggan', 'ID pelanggan', 8, 16, 'Pilih Penyedia', '', '{"Contoh tagihan":"Rp 385.000","Cek tagihan":"Otomatis setelah input"}'::jsonb, 385000, 7),
  ('multifinance', 'Multifinance', 'bank', 'Bayar angsuran kendaraan dan pinjaman.', 'Angsuran kendaraan', 'tagihan', 'Nomor Kontrak', 'Nomor kontrak', 8, 16, 'Pilih Perusahaan Pembiayaan', '', '{"Contoh angsuran":"Rp 1.250.000","Konfirmasi":"Real-time ke leasing"}'::jsonb, 1250000, 8);

  insert into public.catalog_providers (category_slug, name, sort) values
  ('pulsa', 'Telkomsel', 1),
  ('pulsa', 'Indosat', 2),
  ('pulsa', 'XL', 3),
  ('pulsa', 'Tri', 4),
  ('pulsa', 'Smartfren', 5),
  ('paket-data', 'Telkomsel', 1),
  ('paket-data', 'Indosat', 2),
  ('paket-data', 'XL', 3),
  ('token-pln', 'PLN Prabayar', 1),
  ('e-wallet', 'DANA', 1),
  ('e-wallet', 'OVO', 2),
  ('e-wallet', 'GoPay', 3),
  ('e-wallet', 'ShopeePay', 4),
  ('pdam', 'PDAM Jakarta', 1),
  ('pdam', 'PDAM Surabaya', 2),
  ('pdam', 'PDAM Bandung', 3),
  ('pdam', 'PDAM Medan', 4),
  ('bpjs-kesehatan', 'BPJS Kesehatan', 1),
  ('internet-tv', 'IndiHome', 1),
  ('internet-tv', 'First Media', 2),
  ('internet-tv', 'MyRepublic', 3),
  ('internet-tv', 'Biznet', 4),
  ('multifinance', 'Adira Finance', 1),
  ('multifinance', 'FIF', 2),
  ('multifinance', 'BAF', 3),
  ('multifinance', 'WOM Finance', 4);

  insert into public.catalog_items
    (provider_id, name, note, value, price, featured, card_label, sort)
  select p.id, v.name, v.note, v.value, v.price, v.featured, v.card_label, v.sort
  from (values
  ('pulsa', 'Telkomsel', 'Rp 5.000', 'Masuk instan ke nomor tujuan', 5000, 6000, false, '', 1),
  ('pulsa', 'Telkomsel', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 2),
  ('pulsa', 'Telkomsel', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 3),
  ('pulsa', 'Telkomsel', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 4),
  ('pulsa', 'Telkomsel', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, true, 'Pulsa Telkomsel', 5),
  ('pulsa', 'Telkomsel', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 6),
  ('pulsa', 'Telkomsel', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 7),
  ('pulsa', 'Telkomsel', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 8),
  ('pulsa', 'Telkomsel', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 9),
  ('pulsa', 'Telkomsel', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 10),
  ('pulsa', 'Indosat', 'Rp 5.000', 'Masuk instan ke nomor tujuan', 5000, 6000, false, '', 1),
  ('pulsa', 'Indosat', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 2),
  ('pulsa', 'Indosat', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 3),
  ('pulsa', 'Indosat', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 4),
  ('pulsa', 'Indosat', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 5),
  ('pulsa', 'Indosat', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 6),
  ('pulsa', 'Indosat', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 7),
  ('pulsa', 'Indosat', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 8),
  ('pulsa', 'Indosat', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 9),
  ('pulsa', 'Indosat', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 10),
  ('pulsa', 'XL', 'Rp 5.000', 'Masuk instan ke nomor tujuan', 5000, 6000, false, '', 1),
  ('pulsa', 'XL', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 2),
  ('pulsa', 'XL', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 3),
  ('pulsa', 'XL', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 4),
  ('pulsa', 'XL', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 5),
  ('pulsa', 'XL', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 6),
  ('pulsa', 'XL', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 7),
  ('pulsa', 'XL', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 8),
  ('pulsa', 'XL', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 9),
  ('pulsa', 'XL', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 10),
  ('pulsa', 'Tri', 'Rp 5.000', 'Masuk instan ke nomor tujuan', 5000, 6000, false, '', 1),
  ('pulsa', 'Tri', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 2),
  ('pulsa', 'Tri', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 3),
  ('pulsa', 'Tri', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 4),
  ('pulsa', 'Tri', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 5),
  ('pulsa', 'Tri', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 6),
  ('pulsa', 'Tri', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 7),
  ('pulsa', 'Tri', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 8),
  ('pulsa', 'Tri', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 9),
  ('pulsa', 'Tri', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 10),
  ('pulsa', 'Smartfren', 'Rp 5.000', 'Masuk instan ke nomor tujuan', 5000, 6000, false, '', 1),
  ('pulsa', 'Smartfren', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 2),
  ('pulsa', 'Smartfren', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 3),
  ('pulsa', 'Smartfren', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 4),
  ('pulsa', 'Smartfren', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 5),
  ('pulsa', 'Smartfren', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 6),
  ('pulsa', 'Smartfren', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 7),
  ('pulsa', 'Smartfren', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 8),
  ('pulsa', 'Smartfren', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 9),
  ('pulsa', 'Smartfren', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 10),
  ('paket-data', 'Telkomsel', 'Kuota 7 GB', '30 hari, semua jaringan', 50000, 51000, false, '', 1),
  ('paket-data', 'Telkomsel', 'Kuota 15 GB', '30 hari + 2 GB malam', 85000, 86000, false, '', 2),
  ('paket-data', 'Telkomsel', 'Kuota 30 GB', '30 hari, 4G/5G', 130000, 131000, false, '', 3),
  ('paket-data', 'Indosat', 'Freedom 9 GB', '30 hari', 45000, 46000, false, '', 1),
  ('paket-data', 'Indosat', 'Freedom 20 GB', '30 hari', 80000, 81000, false, '', 2),
  ('paket-data', 'Indosat', 'Freedom Unlimited', '30 hari, FUP harian', 100000, 101000, false, '', 3),
  ('paket-data', 'XL', 'Xtra Combo 10 GB', '30 hari + nelpon', 60000, 61000, false, '', 1),
  ('paket-data', 'XL', 'Xtra Combo 25 GB', '30 hari + nelpon', 110000, 111000, false, '', 2),
  ('token-pln', 'PLN Prabayar', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 1),
  ('token-pln', 'PLN Prabayar', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, true, 'Token PLN', 2),
  ('token-pln', 'PLN Prabayar', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 3),
  ('token-pln', 'PLN Prabayar', 'Rp 200.000', 'Masuk instan ke nomor tujuan', 200000, 200500, false, '', 4),
  ('token-pln', 'PLN Prabayar', 'Rp 500.000', 'Masuk instan ke nomor tujuan', 500000, 500500, false, '', 5),
  ('token-pln', 'PLN Prabayar', 'Rp 1.000.000', 'Masuk instan ke nomor tujuan', 1000000, 1000500, false, '', 6),
  ('e-wallet', 'DANA', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 1),
  ('e-wallet', 'DANA', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 2),
  ('e-wallet', 'DANA', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 3),
  ('e-wallet', 'DANA', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 4),
  ('e-wallet', 'DANA', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 5),
  ('e-wallet', 'DANA', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 6),
  ('e-wallet', 'DANA', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 7),
  ('e-wallet', 'DANA', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 8),
  ('e-wallet', 'DANA', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, true, 'Saldo DANA', 9),
  ('e-wallet', 'DANA', 'Rp 150.000', 'Masuk instan ke nomor tujuan', 150000, 150500, false, '', 10),
  ('e-wallet', 'DANA', 'Rp 200.000', 'Masuk instan ke nomor tujuan', 200000, 200500, false, '', 11),
  ('e-wallet', 'DANA', 'Rp 250.000', 'Masuk instan ke nomor tujuan', 250000, 250500, false, '', 12),
  ('e-wallet', 'DANA', 'Rp 300.000', 'Masuk instan ke nomor tujuan', 300000, 300500, false, '', 13),
  ('e-wallet', 'DANA', 'Rp 400.000', 'Masuk instan ke nomor tujuan', 400000, 400500, false, '', 14),
  ('e-wallet', 'DANA', 'Rp 500.000', 'Masuk instan ke nomor tujuan', 500000, 500500, false, '', 15),
  ('e-wallet', 'DANA', 'Rp 1.000.000', 'Masuk instan ke nomor tujuan', 1000000, 1000500, false, '', 16),
  ('e-wallet', 'OVO', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 1),
  ('e-wallet', 'OVO', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 2),
  ('e-wallet', 'OVO', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 3),
  ('e-wallet', 'OVO', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 4),
  ('e-wallet', 'OVO', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 5),
  ('e-wallet', 'OVO', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 6),
  ('e-wallet', 'OVO', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 7),
  ('e-wallet', 'OVO', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 8),
  ('e-wallet', 'OVO', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 9),
  ('e-wallet', 'OVO', 'Rp 150.000', 'Masuk instan ke nomor tujuan', 150000, 150500, false, '', 10),
  ('e-wallet', 'OVO', 'Rp 200.000', 'Masuk instan ke nomor tujuan', 200000, 200500, true, 'Saldo OVO', 11),
  ('e-wallet', 'OVO', 'Rp 250.000', 'Masuk instan ke nomor tujuan', 250000, 250500, false, '', 12),
  ('e-wallet', 'OVO', 'Rp 300.000', 'Masuk instan ke nomor tujuan', 300000, 300500, false, '', 13),
  ('e-wallet', 'OVO', 'Rp 400.000', 'Masuk instan ke nomor tujuan', 400000, 400500, false, '', 14),
  ('e-wallet', 'OVO', 'Rp 500.000', 'Masuk instan ke nomor tujuan', 500000, 500500, false, '', 15),
  ('e-wallet', 'OVO', 'Rp 1.000.000', 'Masuk instan ke nomor tujuan', 1000000, 1000500, false, '', 16),
  ('e-wallet', 'GoPay', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 1),
  ('e-wallet', 'GoPay', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 2),
  ('e-wallet', 'GoPay', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 3),
  ('e-wallet', 'GoPay', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 4),
  ('e-wallet', 'GoPay', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 5),
  ('e-wallet', 'GoPay', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 6),
  ('e-wallet', 'GoPay', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 7),
  ('e-wallet', 'GoPay', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 8),
  ('e-wallet', 'GoPay', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 9),
  ('e-wallet', 'GoPay', 'Rp 150.000', 'Masuk instan ke nomor tujuan', 150000, 150500, false, '', 10),
  ('e-wallet', 'GoPay', 'Rp 200.000', 'Masuk instan ke nomor tujuan', 200000, 200500, false, '', 11),
  ('e-wallet', 'GoPay', 'Rp 250.000', 'Masuk instan ke nomor tujuan', 250000, 250500, false, '', 12),
  ('e-wallet', 'GoPay', 'Rp 300.000', 'Masuk instan ke nomor tujuan', 300000, 300500, false, '', 13),
  ('e-wallet', 'GoPay', 'Rp 400.000', 'Masuk instan ke nomor tujuan', 400000, 400500, false, '', 14),
  ('e-wallet', 'GoPay', 'Rp 500.000', 'Masuk instan ke nomor tujuan', 500000, 500500, false, '', 15),
  ('e-wallet', 'GoPay', 'Rp 1.000.000', 'Masuk instan ke nomor tujuan', 1000000, 1000500, false, '', 16),
  ('e-wallet', 'ShopeePay', 'Rp 10.000', 'Masuk instan ke nomor tujuan', 10000, 11000, false, '', 1),
  ('e-wallet', 'ShopeePay', 'Rp 15.000', 'Masuk instan ke nomor tujuan', 15000, 16000, false, '', 2),
  ('e-wallet', 'ShopeePay', 'Rp 20.000', 'Masuk instan ke nomor tujuan', 20000, 20500, false, '', 3),
  ('e-wallet', 'ShopeePay', 'Rp 25.000', 'Masuk instan ke nomor tujuan', 25000, 25500, false, '', 4),
  ('e-wallet', 'ShopeePay', 'Rp 30.000', 'Masuk instan ke nomor tujuan', 30000, 30500, false, '', 5),
  ('e-wallet', 'ShopeePay', 'Rp 40.000', 'Masuk instan ke nomor tujuan', 40000, 40500, false, '', 6),
  ('e-wallet', 'ShopeePay', 'Rp 50.000', 'Masuk instan ke nomor tujuan', 50000, 50500, false, '', 7),
  ('e-wallet', 'ShopeePay', 'Rp 75.000', 'Masuk instan ke nomor tujuan', 75000, 75500, false, '', 8),
  ('e-wallet', 'ShopeePay', 'Rp 100.000', 'Masuk instan ke nomor tujuan', 100000, 100500, false, '', 9),
  ('e-wallet', 'ShopeePay', 'Rp 150.000', 'Masuk instan ke nomor tujuan', 150000, 150500, false, '', 10),
  ('e-wallet', 'ShopeePay', 'Rp 200.000', 'Masuk instan ke nomor tujuan', 200000, 200500, false, '', 11),
  ('e-wallet', 'ShopeePay', 'Rp 250.000', 'Masuk instan ke nomor tujuan', 250000, 250500, false, '', 12),
  ('e-wallet', 'ShopeePay', 'Rp 300.000', 'Masuk instan ke nomor tujuan', 300000, 300500, false, '', 13),
  ('e-wallet', 'ShopeePay', 'Rp 400.000', 'Masuk instan ke nomor tujuan', 400000, 400500, false, '', 14),
  ('e-wallet', 'ShopeePay', 'Rp 500.000', 'Masuk instan ke nomor tujuan', 500000, 500500, false, '', 15),
  ('e-wallet', 'ShopeePay', 'Rp 1.000.000', 'Masuk instan ke nomor tujuan', 1000000, 1000500, false, '', 16)
  ) as v(category_slug, provider_name, name, note, value, price, featured, card_label, sort)
  join public.catalog_providers p
    on p.category_slug = v.category_slug and p.name = v.provider_name;

  insert into public.payment_methods (code, name, note, kind, fee, prefix, icon, sort) values
  ('QRIS', 'QRIS', 'Semua e-wallet & m-banking', 'qris', 0, '', 'qr', 1),
  ('VA_BCA', 'Virtual Account BCA', 'Cek otomatis', 'va', 2500, '8808', 'card', 2),
  ('VA_MANDIRI', 'Virtual Account Mandiri', 'Cek otomatis', 'va', 2500, '8808', 'card', 3),
  ('DANA', 'DANA', 'Bayar langsung', 'wallet', 0, '', 'wallet', 4);

  insert into public.catalog_settings (key, value) values
  ('admin_fee', '1500'::jsonb),
  ('default_category', '"Pulsa"'::jsonb);
end
$seed$;
