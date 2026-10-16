import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/* Gerbang /admin (Next 16: "proxy" adalah nama baru middleware).

   - /admin/login        : selalu boleh dibuka; kalau sudah login dialihkan ke /admin
   - /admin/* (lainnya)  : wajib sesi, kalau tidak dialihkan ke /admin/login?next=…
   - /api/qris           : GET tetap publik (checkout butuh URL foto),
                           POST/DELETE wajib sesi (401 tanpa sesi)

   Penjagaan sebenarnya tetap ada di layout admin (requireAdmin) dan di route
   /api/qris; proxy ini lapisan pertama supaya request ditolak lebih awal. */

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname === "/admin/login") {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }

  if (pathname.startsWith("/api/qris")) {
    if (req.method === "GET" || req.method === "HEAD") return NextResponse.next();
    if (!authed) {
      return NextResponse.json(
        { ok: false, code: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.next();
  }

  if (!authed) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/qris"],
};
