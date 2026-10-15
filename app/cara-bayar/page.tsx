import type { Metadata } from "next";
import CaraBayarView from "@/components/cara-bayar/CaraBayarView";

export const instant = false;

export const metadata: Metadata = {
  title: "Cara Bayar — VENCORAGO",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/cara-bayar">) {
  const sp = await props.searchParams;
  return <CaraBayarView m={one(sp.m)} />;
}
