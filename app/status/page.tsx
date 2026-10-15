import type { Metadata } from "next";
import StatusView from "@/components/status/StatusView";

export const metadata: Metadata = {
  title: "Cek Status Transaksi — VENCORAGO",
};

export default function Page() {
  return <StatusView />;
}
