import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME } from "@/lib/seo";

/* ============================================================================
   Gambar kartu 1200×630 untuk Open Graph dan Twitter.

   Dipakai app/opengraph-image.tsx dan app/twitter-image.tsx, jadi satu
   definisi tampilan untuk kedua kartu. Warnanya dari brand yang sama dengan
   ikon aplikasi (teal gelap + aksen teal + titik emas), dan hurufnya memakai
   TTF asli di public/fonts — bukan font bawaan ImageResponse — supaya kartunya
   tidak terlihat seperti template.
   ========================================================================== */

const KATEGORI = [
  "Pulsa",
  "Paket Data",
  "Token PLN",
  "E-Wallet",
  "PDAM",
  "BPJS Kesehatan",
  "Internet & TV",
  "Angsuran",
];

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `${SITE_NAME} — Top Up & Bayar Tagihan`;

export async function ogImage() {
  const [inter, serif] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/inter_24pt-semibold.ttf")),
    readFile(join(process.cwd(), "public/fonts/dmserifdisplay-regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #071b1a 0%, #0f5f5c 100%)",
          color: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 28,
              background: "linear-gradient(135deg, #1a7a72 0%, #0b4744 100%)",
              fontSize: 56,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            V
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 600, letterSpacing: -1 }}>
              vencorago<span style={{ color: "#e4c9a2" }}>.</span>
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "#bfe6e2" }}>
              Top Up &amp; Bayar Tagihan
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 950 }}>
          {KATEGORI.map((k) => (
            <div
              key={k}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid rgba(191, 230, 226, 0.35)",
                color: "#e8f6f4",
                fontSize: 26,
              }}
            >
              {k}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 40, fontFamily: "DM Serif Display" }}>
              Proses otomatis, cek status kapan saja.
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#bfe6e2" }}>www.vencorago.com</div>
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#e4c9a2",
            }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: inter, style: "normal", weight: 600 },
        { name: "DM Serif Display", data: serif, style: "normal", weight: 400 },
      ],
    }
  );
}
