import type { Metadata } from "next";
import LoginView from "@/components/admin/LoginView";

export const metadata: Metadata = {
  title: "Masuk admin — VENCORAGO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LoginView />;
}
