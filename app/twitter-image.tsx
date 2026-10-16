import { OG_ALT, OG_SIZE, ogImage } from "@/lib/og-image";

/* Kartu Twitter/X — sama dengan kartu OG, didefinisikan sekali di lib/og-image.tsx. */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogImage();
}
