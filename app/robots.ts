import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/* robots.txt.

   Semua halaman publik dibuka; /admin dan /api ditutup karena bukan konten
   (dan /admin memang sudah noindex di layout-nya). Selain grup "*", crawler AI
   dicantumkan satu per satu: aturannya sama dengan "*", tapi daftar eksplisit
   ini membuat "boleh dikutip" jadi keputusan yang tercatat, bukan efek samping
   dari kebijakan umum — sekaligus tetap benar kalau grup "*" nanti dipersempit. */

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Google-CloudVertexBot",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "cohere-ai",
];

const TERTUTUP = ["/admin", "/admin/", "/api"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: TERTUTUP },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: TERTUTUP })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
