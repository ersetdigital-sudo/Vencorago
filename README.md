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
dibaca di halaman Cek Status). Struktur record sama seperti versi asli:
`{ inv, prod, cat, no, name, pm, total, status, sn, time, paid }`.

## Yang belum diubah

- Nomor WhatsApp (`6281234567890`), email, alamat, dan link Instagram masih memakai data contoh
  dari versi asli.
- Nominal tagihan (PDAM, BPJS, internet, multifinance) masih statis; belum ada integrasi backend.
