import { OG_ALT, OG_SIZE, ogImage } from "@/lib/og-image";

/* Kartu OG 1200×630 untuk semua halaman publik (diwarisi dari segmen root).
   Gambarnya dibuat di lib/og-image.tsx supaya sama persis dengan kartu Twitter. */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogImage();
}
