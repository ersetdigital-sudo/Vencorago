import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";

export const metadata: Metadata = {
  title: "VENCORAGO — Top Up & Bayar Tagihan",
};

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/">) {
  const sp = await props.searchParams;
  return (
    <HomeView
      k={one(sp.k)}
      h={one(sp.h)}
      p={one(sp.p)}
      no={one(sp.no)}
    />
  );
}
