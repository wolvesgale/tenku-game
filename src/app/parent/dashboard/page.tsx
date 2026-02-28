import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import ParentDashboardClient from "./ParentDashboardClient";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  // 保護者セッション確認
  const token = cookies().get("tenku-parent-session")?.value;
  if (!token) redirect("/parent/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "parent") redirect("/parent/login");

  return <ParentDashboardClient parentId={session.id} parentNickname={session.nickname} />;
}
