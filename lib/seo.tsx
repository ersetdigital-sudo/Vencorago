import type { Metadata } from "next";
import type { Cat, Catalog } from "@/lib/catalog";

/* ============================================================================
   Metadata + data terstruktur (JSON-LD) halaman publik.

   Domain kanonis: www.vencorago.com (SITE_URL). Semua URL absolut — canonical,
   Open Graph, dan JSON-LD — dibangun dari sini, jadi pindah domain cukup ubah
   satu konstanta.

   Halaman yang memakai query (`?k=`, `?m=`, `?inv=`) di-canonical ke bentuk
   yang layak diindeks: satu URL per kategori, bukan per kombinasi parameter.
   Tanpa itu crawler melihat ratusan halaman kembar, karena satu kategori bisa
   dibuka dengan `op`/`h` apa saja (lihat catatan yang sama di README).
   ========================================================================== */

export const SITE_URL = "https://www.vencorago.com";
export const SITE_NAME = "VENCORAGO";
export const SITE_DESCRIPTION =
  "Top up pulsa, paket data, token PLN, dan e-wallet, serta bayar tagihan PDAM, BPJS, internet, dan angsuran. Proses otomatis 24 jam dan status bisa dicek.";

/** Kartu 1200×630 dari app/opengraph-image.tsx — dipakai og:image semua halaman. */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — Top Up & Bayar Tagihan` };

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

/** URL absolut dari path internal ("/produk" → "https://www.vencorago.com/produk"). */
export function abs(path: string) {
  if (path.startsWith("http")) return path;
  return SITE_URL + (path.startsWith("/") ? path : "/" + path);
}

/** URL kanonis satu kategori produk. `k` memakai nama kategori, sama seperti ?k= di halaman. */
export const kategoriPath = (cat: Cat) => `/produk?k=${encodeURIComponent(cat.n)}`;

/** Deskripsi unik per kategori: penyedia yang tersedia + harga termurah di katalog. */
export function kategoriDescription(cat: Cat, catalog: Catalog) {
  const penyedia = Object.keys(cat.ops);
  const semua = penyedia.flatMap((p) => cat.ops[p].map((it) => it.p)).filter((p) => p > 0);
  const murah = semua.length ? ` Harga mulai ${rp(Math.min(...semua))}.` : "";
  const daftar =
    penyedia.length > 1
      ? `${penyedia.slice(0, 4).join(", ")}${penyedia.length > 4 ? ", dll" : ""}`
      : (penyedia[0] ?? cat.n);
  return `${cat.n} di VENCORAGO: ${daftar}.${murah} Proses otomatis 24 jam, bayar lewat QRIS, Virtual Account, atau DANA.`;
}

/* ------------------------------------------------------------- metadata -- */

/**
 * Metadata satu halaman: title, description, canonical, dan Open Graph yang
 * isinya sama — supaya preview di mesin pencari maupun di aplikasi chat tidak
 * pernah beda dari yang dilihat pengunjung.
 *
 * Kartu OG-nya ditulis eksplisit: begitu sebuah halaman menyetel `openGraph`,
 * seluruh nilai openGraph warisan layout (termasuk gambar dari file convention)
 * ikut tergantikan, jadi tanpa ini halaman selain beranda tampil tanpa gambar.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "id_ID",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/twitter-image", width: 1200, height: 630, alt: OG_IMAGE.alt }],
    },
  };
}

/* -------------------------------------------------------------- JSON-LD -- */

/** Satu tag <script type="application/ld+json">; `data` boleh satu objek atau array. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const ORG_ID = SITE_URL + "/#organization";
export const SITE_ID = SITE_URL + "/#website";

/** Entitas bisnis. Tanpa alamat/telepon: datanya di situs masih contoh (lihat README). */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: abs("/icon.svg") },
    description:
      "Layanan top up pulsa, paket data, token listrik, dan e-wallet serta pembayaran tagihan bulanan di Indonesia.",
    areaServed: { "@type": "Country", name: "Indonesia" },
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    alternateName: "VENCORAGO — Top Up & Bayar Tagihan",
    url: SITE_URL,
    inLanguage: "id-ID",
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORG_ID },
  };
}

/** Remah roti: Beranda → halaman (→ kategori). URL-nya absolut dan sudah kanonis. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Beranda", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/** FAQ dari pertanyaan-jawaban yang benar-benar tampil di halaman. */
export function faqLd(qa: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** Langkah berurutan (HowTo) untuk panduan cara bayar. `steps` = [judul, isi]. */
export function howToLd({
  name,
  description,
  path,
  steps,
}: {
  name: string;
  description: string;
  path: string;
  steps: [string, string][];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url: abs(path),
    inLanguage: "id-ID",
    step: steps.map(([judul, isi], i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: judul,
      text: isi,
    })),
  };
}

/**
 * Layanan satu kategori, lengkap dengan harga yang sedang berlaku dari
 * katalog. Yang dimasukkan hanya penyedia yang benar-benar dirender di grid
 * halaman itu — struktur data harus sama dengan yang dilihat pengunjung, jadi
 * harga penyedia lain tidak ditulis di sini. Kategori tagihan tidak diberi
 * Offer sama sekali: harga produknya nol karena yang dibayar adalah tagihannya.
 */
export function serviceLd(cat: Cat, catalog: Catalog, penyedia: string) {
  const offers = (cat.ops[penyedia] ?? [])
    .filter((it) => it.p > 0)
    .map((it) => ({
      "@type": "Offer",
      name: `${it.n} — ${penyedia}`,
      price: it.p,
      priceCurrency: "IDR",
      url: abs(kategoriPath(cat)),
      availability: "https://schema.org/InStock",
      seller: { "@id": ORG_ID },
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": abs(kategoriPath(cat)) + "#layanan",
    name: `${cat.n} — ${SITE_NAME}`,
    serviceType: cat.n,
    description: kategoriDescription(cat, catalog),
    url: abs(kategoriPath(cat)),
    inLanguage: "id-ID",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Indonesia" },
    ...(offers.length
      ? {
          offers: {
            "@type": "OfferCatalog",
            name: `Daftar harga ${cat.n} — ${penyedia}`,
            numberOfItems: offers.length,
            itemListElement: offers,
          },
        }
      : {}),
  };
}

/** Daftar layanan yang tersedia di beranda — supaya AI tahu cakupannya. */
export function layananLd(cats: Cat[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Layanan VENCORAGO",
    numberOfItems: cats.length,
    itemListElement: cats.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.n,
      description: c.d,
      url: abs(kategoriPath(c)),
    })),
  };
}
