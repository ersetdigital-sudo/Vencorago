import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-guard";

/* Sesi dibaca per request, jadi halaman di grup ini tidak ikut di-prerender
   (Cache Components: pembacaan cookie tidak boleh masuk static shell). */
export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
