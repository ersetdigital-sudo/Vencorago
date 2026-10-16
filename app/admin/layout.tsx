import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import AdminShell from "@/components/admin/AdminShell";

/* Typography comes from the admin style package: Outfit for the UI,
   JetBrains Mono for data, identifiers and tabular figures. */
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Admin — VENCORAGO",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={`${outfit.variable} ${mono.variable}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
