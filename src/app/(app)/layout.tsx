import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BottomNav from "@/components/layout/BottomNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh bg-[#0F0F1A] flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
