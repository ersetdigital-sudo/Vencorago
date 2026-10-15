import type { Metadata } from "next";
import BantuanView from "@/components/bantuan/BantuanView";

export const metadata: Metadata = {
  title: "Pusat Bantuan — VENCORAGO",
};

export default function Page() {
  return <BantuanView />;
}
