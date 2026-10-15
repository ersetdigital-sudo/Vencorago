import type { Metadata } from "next";
import KontakView from "@/components/kontak/KontakView";

export const metadata: Metadata = {
  title: "Kontak — VENCORAGO",
};

export default function Page() {
  return <KontakView />;
}
