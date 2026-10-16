import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-session";

/* Keluar: hapus cookie sesi. Selalu boleh dipanggil (tanpa sesi pun tidak apa),
   supaya admin yang sesinya kedaluwarsa tetap bisa membersihkan cookie-nya. */

export async function POST(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  const secure = proto ? proto.split(",")[0].trim() === "https" : req.nextUrl.protocol === "https:";

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
          secure ? "; Secure" : ""
        }`,
      },
    }
  );
}
