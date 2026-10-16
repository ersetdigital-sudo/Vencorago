import type { Metadata, Viewport } from "next";
import MobileTabBar from "@/components/MobileTabBar";
import {
  JsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  organizationLd,
  websiteLd,
} from "@/lib/seo";
import "./globals.css";

/* Metadata dasar untuk semua halaman publik.

   canonical sengaja TIDAK di-set di sini: nilainya diwarisi anak rute, jadi
   halaman seperti /status akan mengaku beralamat "/" kalau ditulis di layout.
   Setiap halaman menentukan canonical-nya sendiri lewat pageMetadata().

   /admin menimpa robots jadi noindex di app/admin/layout.tsx. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VENCORAGO — Top Up & Bayar Tagihan",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "shopping",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    url: "/",
    title: "VENCORAGO — Top Up & Bayar Tagihan",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "VENCORAGO — Top Up & Bayar Tagihan",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f5f5c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>
        {children}
        <MobileTabBar />
        {/* Entitas bisnis dan situs: satu definisi untuk seluruh halaman,
            dirujuk balik oleh schema lain lewat "@id". */}
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
