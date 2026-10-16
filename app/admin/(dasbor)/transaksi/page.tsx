import TransaksiView from "@/components/admin/TransaksiView";

export const instant = false;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? ""));

export default async function Page(props: PageProps<"/admin/transaksi">) {
  const sp = await props.searchParams;
  const q = one(sp.q);
  const status = one(sp.status);
  return <TransaksiView key={`${q}|${status}`} q={q} status={status} />;
}
