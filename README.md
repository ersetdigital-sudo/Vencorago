# VENCORAGO

Next.js (App Router, TypeScript) port of the original static VENCORAGO site — top up & bill payment.
Tampilan (font, warna, ukuran, layout) sengaja dibuat identik dengan versi HTML aslinya.

## Menjalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

## Halaman

| Route         | Sumber asli                      | Catatan query                                        |
| ------------- | -------------------------------- | ---------------------------------------------------- |
| `/`           | `original/index.html`            | `?k=&h=&p=&no=` — detail pesanan dari halaman Produk |
| `/produk`     | `original/produk/index.html`     | `?k=` kategori produk                                |
| `/status`     | `original/status/index.html`     | `?inv=` nomor invoice                                |
| `/cara-bayar` | `original/cara-bayar/index.html` | `?m=` metode (QRIS / VA / DANA)                       |
| `/bantuan`    | `original/bantuan/index.html`    | —                                                    |
| `/kontak`     | `original/kontak/index.html`     | —                                                    |

`original/` berisi HTML asli (tidak diubah) untuk pembanding. Folder `fonts/` di root dipakai oleh
file-file asli itu; salinan yang dipakai aplikasi Next ada di `public/fonts/`.

## Struktur

```
app/
  layout.tsx            # <html lang="id">, metadata title, import globals.css
  globals.css           # variabel warna, reset, @font-face, import Tailwind Preflight
  page.tsx              # /           (server: metadata + searchParams -> HomeView)
  produk/page.tsx       # /produk     (+ components/produk/data.ts untuk generateMetadata)
  status/page.tsx       # /status
  cara-bayar/page.tsx   # /cara-bayar
  bantuan/page.tsx      # /bantuan
  kontak/page.tsx       # /kontak
components/
  Header.tsx, Logo.tsx  # dipakai ulang semua halaman
  home/                 # HomeView.tsx (wizard 4 langkah) + home.module.css
  produk/  status/  cara-bayar/  bantuan/  kontak/
```

## Mobile (app shell)

Di layar ≤900px tampilan sengaja dibikin terasa seperti app native. Semua perubahan ini hanya aktif
di dalam `@media (max-width: 900px)` (blok "mobile app shell" di akhir tiap `*.module.css`), jadi
desktop tidak tersentuh:

- **Bottom tab bar** (`components/MobileTabBar.tsx`) — 5 tab (Beranda, Produk, Cara Bayar, Cek
  Status, Bantuan) dengan ikon, status aktif, dan feedback tekan; tinggi tiap tab 50px. Sebelumnya
  di mobile menu navigasi malah hilang total (`.menu` di-`display:none`), jadi ini mengisi yang
  memang kosong. Kontak tidak masuk tab bar (muat 6 tab terlalu sempit) dan tetap bisa diakses dari
  footer serta halaman Bantuan.
- **App-bar** — header jadi sticky + blur + `env(safe-area-inset-top)`; tab bar memakai
  `env(safe-area-inset-bottom)` supaya tidak ketutup home indicator.
- **Sentuhan** — target sentuh ≥44px, `-webkit-tap-highlight-color: transparent`.
- **Anti-zoom iOS** — `input`/`select`/`textarea` dipaksa 16px di mobile; di bawah itu iOS Safari
  auto-zoom saat fokus dan layout jadi geser. `maximum-scale=1` sengaja **tidak** dipakai karena
  mematikan pinch-to-zoom untuk semua orang.
- **Alur dirapikan** — di beranda panel transaksi dinaikkan ke atas daftar kategori
  (`aside { order: -1 }`) supaya CTA-nya tidak terkubur. Di halaman Produk, field nomor ditaruh
  paling atas ("Nomor Tujuan") sebelum pilihan operator/nominal, ringkasan (Produk/Harga/Biaya
  admin/Total) di bawah picker, lalu bar sticky berisi total + "Lanjut Bayar" di area jempol —
  ini satu-satunya tombol CTA yang kelihatan di mobile.
- **Ikon** — `app/icon.svg` (brand mark: kotak teal gradien + huruf V + titik emas) dan
  `app/apple-icon.png` 180x180 full-bleed untuk iOS. Next memasang link-nya otomatis dari
  metadata file convention, jadi tidak perlu set `metadata.icons` manual.
- `viewport` metadata menambahkan `viewport-fit=cover` dan `theme-color`.
- Perbaikan tak sengaja: sebelumnya `.hero`/`.main` memakai shorthand `padding` sehingga padding
  samping dari `.wrap` hilang dan teks hero nempel ke tepi layar di mobile. Di mobile sekarang
  diberi padding samping eksplisit.

Cara cepat cek desktop masih utuh: bandingkan sidik jari DOM (posisi, ukuran, font-family,
font-size, weight, warna teks, background tiap elemen) versi Next dengan `original/`. Hasilnya harus
nol selain elemen internal Next sendiri (wrapper 0×0 dan `<next-route-announcer>`).

## Admin dashboard

Route `/admin` — console operasional untuk memantau performa transaksi.

Halaman: `/admin` (ringkasan, KPI, grafik 7/14/30 hari), `/admin/transaksi` (ledger + filter status +
pencarian + paginasi + detail baris), `/admin/pelanggan` (agregat per nomor tujuan), `/admin/produk`
(per kategori, produk, metode bayar). Setiap halaman punya ekspor CSV.

**Sumber datanya.** Proyek ini belum punya backend: transaksi ditulis client-side ke
`localStorage.vcr_tx`. Dashboard jadi menampilkan transaksi asli perangkat ini digabung dataset demo
deterministik (seed tetap, jadi angkanya stabil), dan bagian demo dilabeli jelas di UI. Angka di
dashboard bukan data bisnis nyata sampai ada API + database.

**Desainnya diambil dari NeedMCP**, bukan dikarang sendiri:

- **Struktur** — DNA `ablepro-dna`: sidebar rail 58px + panel 190px dengan satu baris aktif, sticky
  utility strip (breadcrumb + search + bell + cluster akun), kanvas kartu rata (max 1600px, padding
  24, gap 24/16/12), KPI unit, ledger table, segmented period toggle, linear progress track. Di
  mobile shell-nya runtuh jadi bottom bar dengan item, urutan, dan active state yang sama.
- **Kulit** — dark-first teal: void slate-teal `#0B1416`, aksen teal `#2FBFAE` yang selaras
  dengan teal brand situs publik, panel kaca (blur 24px), Outfit untuk UI + JetBrains Mono untuk
  angka/ID, radius 6/10/12/16, elevation level-1, glow hanya di elemen aktif.
- Semua tokennya di-scope di `.admin` (`components/admin/admin.module.css`), jadi situs publik tidak
  tersentuh — sudah diverifikasi ulang dengan sidik jari DOM setelah pengerjaan admin.
- Konflik aturan yang diselesaikan sadar: radius kartu 16px + padding 20px (Style pegang nilai
  token, DNA pegang rhythm); glass/blur dari style memang wajib walau craft floor biasanya menolak
  blur dekoratif; scrollbar sengaja **tidak** di-custom karena playbook `operate` menolak
  reinvent affordance standar (text selection + focus ring tetap diwarnai dari palet).
- State NeedMCP disimpan di `.needmcp/state.json` supaya sesi berikutnya memakai DNA/style yang sama.

### Login admin

`/admin` tidak lagi terbuka untuk umum: semua halaman di bawahnya butuh sesi, dan yang belum masuk
dialihkan ke `/admin/login` (halaman form password, `robots: noindex`).

| Lapisan | Berkas | Peran |
| ------- | ------ | ----- |
| Proxy | `proxy.ts` | jalur cepat: `/admin/*` tanpa sesi → redirect ke `/admin/login?next=…`; `POST`/`DELETE /api/qris` → `401`. `GET /api/qris` tetap publik karena checkout butuh URL foto. |
| Layout | `app/admin/(dasbor)/layout.tsx` + `lib/admin-guard.ts` | pemeriksaan otoritatif tiap request (`requireAdmin()`) — tetap berlaku walau proxy dilewati. Karena membaca cookie, layout ini memakai `export const instant = false`. |
| API | `app/api/qris/route.ts` | aksi tulis (unggah/ganti/hapus foto) wajib sesi |
| Login/logout | `app/api/admin/login` · `app/api/admin/logout` | verifikasi password (timing-safe) → cookie `vcr_admin` httpOnly, SameSite=Lax, 8 jam, `Secure` di https; keluar = cookie dihapus |

Sesi adalah cookie bertanda tangan HMAC-SHA256 (`lib/admin-session.ts`, memakai Web Crypto supaya
aman dipakai dari proxy maupun route handler) yang hanya berisi masa berlaku — tidak ada database
sesi. Konsekuensinya, sadar dan disengaja:

- Satu password bersama (`ADMIN_PASSWORD`) untuk semua operator — belum ada identitas per user.
- Mengganti `ADMIN_SESSION_SECRET` langsung membatalkan semua sesi yang beredar.
- Kalau `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` kosong, sistem **gagal-tertutup**: login membalas
  `not-configured` dan tidak ada sesi yang diterima.
- Pembatasan percobaan login (10 per 5 menit) bersifat best-effort di memori proses; di serverless
  hanya berlaku per instance.

Halaman dashboard dipindah ke route group `app/admin/(dasbor)/` supaya `/admin/login` bisa memakai
layout font yang sama tanpa ikut terkunci.

## Integrasi Supabase (foto QRIS)

Foto QRIS disimpan di **Supabase Storage** (bucket `qris`), jadi admin bisa mengganti gambar QR
dari `/admin/pengaturan` tanpa menyentuh kode — dan foto lama otomatis terhapus saat diganti.

### Setup (sekali saja)

1. Buat/buka project di [supabase.com](https://supabase.com) → **SQL Editor** → jalankan file
   [`supabase/setup-qris.sql`](supabase/setup-qris.sql) (membuat bucket `qris` + kebijakan RLS).
2. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dari
     **Project Settings → API**: pakai key **publishable** (atau key **anon / public** lama).
     Jangan pernah memakai **secret / service_role** — key itu melewati RLS.
   - `ADMIN_PASSWORD` — password untuk masuk ke `/admin`.
   - `ADMIN_SESSION_SECRET` — kunci tanda tangan cookie sesi admin. Buat acak:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Restart `npm run dev`, lalu masuk lewat `/admin/login`.

Tanpa env di langkah 2, semua endpoint membalas `not-configured` dan situs tetap memakai QR
placeholder seperti sebelumnya (tidak ada error di UI).

### Cara kerja

| Bagian | Peran |
| ------ | ----- |
| `app/api/qris/route.ts` | `GET` = foto aktif (publik, dipakai checkout); `POST` = unggah pengganti; `DELETE` = hapus. Aksi tulis hanya untuk sesi admin yang sah, jadi tidak bisa dipanggil dari luar. |
| `lib/qris.ts` | helper client `fetchQris()` — hanya menerima URL publik. |
| `components/admin/PengaturanView.tsx` | UI admin: preview, ganti, hapus foto (di balik login). |
| `components/home/HomeView.tsx` | kotak **Scan QRIS** di langkah bayar memakai foto dari Storage; kalau belum ada foto, tetap `QrSvg` placeholder. |

**Anti-numpuk:** setiap unggahan memakai nama file `qris-<timestamp>.<ext>` (URL selalu baru,
aman dari cache CDN), lalu **semua file lain dihapus** — jadi di bucket selalu ada maksimal satu
foto QRIS. Upload dulu → hapus lama, supaya tidak ada jeda tanpa QRIS. Kalau proses hapus gagal,
foto baru tetap aktif dan sisa file dibersihkan otomatis di unggahan berikutnya (UI memberi
peringatan).

**Batasan keamanan (penting):** lewat aplikasi, aksi tulis sudah wajib sesi admin. Tapi kebijakan
storage masih mengizinkan role `anon` menulis di bucket `qris` — artinya siapa pun yang memegang
publishable key bisa menulis langsung ke Storage dan melewati login. Ini cukup untuk
demo/prototype, **bukan** keamanan produksi; untuk produksi pindahkan upload ke Supabase Auth
(policy `to authenticated`) atau kerjakan upload di server dengan key `service_role`.

### Verifikasi manual setelah setup

1. Buka `/admin` tanpa login → harus dialihkan ke `/admin/login`; masukkan `ADMIN_PASSWORD`.
2. `/admin/pengaturan` → kartu Koneksi menampilkan **Terhubung** + `qris · publik`.
3. Pilih gambar PNG/JPG/WebP (≤5 MB), klik **Unggah & ganti** → muncul pesan sukses;
   cek isi bucket di Supabase → hanya tersisa 1 file.
3. Buka `/` → pilih produk → **Bayar Sekarang** dengan metode QRIS → kotak scan menampilkan foto
   yang baru diunggah (bukan placeholder).
4. Ganti foto sekali lagi → file sebelumnya hilang dari bucket, tampilan ikut berganti.
5. **Hapus foto** → checkout kembali menampilkan QR placeholder.

## Catatan penting supaya tampilan tetap sama persis (desktop)

Hal-hal berikut **bukan** pilihan gaya, tapi syarat agar rendering sama dengan versi asli —
jangan diubah tanpa mengecek ulang tampilannya.

1. **Font.** File TTF asli disalin ke `public/fonts/` dan dideklarasikan dengan `@font-face` yang
   sama di `app/globals.css`. Nama family tetap `Inter` dan `DM Serif Display` supaya semua
   shorthand asli (`font: 600 14px Inter`, `font-family: Inter`) tetap berlaku. Karena itu
   `next/font/local` **tidak** dipakai — modul itu mengganti nama family menjadi nama ber-hash
   sehingga shorthand tersebut tidak akan cocok.

2. **Tailwind Preflight.** Halaman asli memuat runtime Tailwind di browser, dan yang berpengaruh
   hanyalah Preflight-nya (base reset yang di-_layer_): `html{line-height:1.5}`,
   `code,kbd,samp,pre{font-family:ui-monospace,…}`, `h1..h6{font-size:inherit;font-weight:inherit}`,
   `small{font-size:80%}`, `svg{display:block}`, dan seterusnya. `app/globals.css` meng-import
   `tailwindcss/preflight.css` ke dalam `@layer base`, sementara `.module.css` tiap halaman berada
   di luar layer sehingga tetap menang saat konflik — persis seperti aslinya.
   `@tailwindcss/postcss` (lihat `postcss.config.mjs`) wajib ada untuk menyelesaikan fungsi
   `--theme()` milik Tailwind. Tanpa itu deklarasinya invalid dan dibuang browser (mis. `<code>`
   jatuh ke Inter, bukan monospace). Jadi `tailwindcss` dan `@tailwindcss/postcss` hanya dipakai
   untuk Preflight — tidak ada utility class di proyek ini.

3. **CSS per halaman memakai CSS Module dengan pembungkus `.pg`.** Semua selector asli
   (`h1`, `header`, `footer`, `.card`, …) diberi prefix `.pg ` sehingga ikut ter-scope dan tidak
   bocor antar route (Next tidak melepas stylesheet saat berpindah route). Nama `@keyframes` juga
   dibuat unik per file (`vcrHomeFade`, `vcrSpin`, `vcrStatusFade`, `vcrGuideFade`, `vcrPulse`).

4. **Query param dibaca di server, bukan `useSearchParams`.** `/`, `/produk`, dan `/cara-bayar`
   meneruskan `searchParams` dari server component sebagai props, supaya HTML pertama sudah sesuai
   parameter (tidak ada kedipan). Karena Cache Components aktif, akses `searchParams` harus berada
   di dalam Suspense, jadi route tersebut memakai `export const instant = false`.
   `/status` justru membaca `?inv=` di client karena datanya berasal dari `localStorage`.

## Data transaksi

Riwayat transaksi disimpan di `localStorage` dengan key `vcr_tx` (ditulis di halaman beranda,
dibaca di halaman Cek Status dan dashboard admin). Struktur record sama seperti versi asli:
`{ inv, prod, cat, no, name, pm, total, status, sn, time, paid }`.

`total` memakai satu rumus yang sama di tiga tempat — checkout beranda (`totalOf()` di
`components/home/HomeView.tsx`), ringkasan halaman `/produk`, dan data demo admin
(`components/admin/data.ts`):

```
total = nominal + margin produk + biaya admin Rp 1.500 + biaya metode (kalau ada)
```

Margin produk mengikuti `N()` di `components/produk/data.ts`: Rp 1.000 untuk nominal di bawah
Rp 20.000, Rp 500 sisanya. Kategori tagihan (PDAM, BPJS, Internet & TV, Multifinance) tidak kena
margin karena angka yang dibayar adalah tagihannya. Halaman `/produk` belum bisa menampilkan biaya
metode (metode dipilih di checkout beranda), jadi totalnya sama persis dengan checkout hanya untuk
metode tanpa biaya tambahan — QRIS dan DANA.

## Yang belum diubah

- Nomor WhatsApp (`6281234567890`), email, alamat, dan link Instagram masih memakai data contoh
  dari versi asli.
- Nominal tagihan (PDAM, BPJS, internet, multifinance) masih statis; belum ada integrasi backend.
- **Tangga nominal** (pulsa, top up e-wallet, token PLN) adalah daftar placeholder tingkat aplikasi
  di `components/produk/data.ts` (`NOMINAL_PULSA`, `NOMINAL_TOPUP`, `NOMINAL_TOKEN`) — bukan hasil
  verifikasi supplier. Tidak ada SKU, product ID, harga modal, atau harga promo di proyek ini. Saat
  feed supplier tersedia, ganti konstantanya; jangan menambah nominal langsung di dalam `ops`
  supaya katalog tetap satu sumber antara halaman produk dan quick-pick beranda.
