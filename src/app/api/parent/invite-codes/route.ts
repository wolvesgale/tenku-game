import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";
import { verifyToken } from "@/lib/auth";
import { generateId, generateInviteCode } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// 保護者セッション取得ヘルパー
async function getParentSession() {
  const token = cookies().get("tenku-parent-session")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "parent") return null;
  return session;
}

// GET: 自分が発行した招待コード一覧
export async function GET() {
  try {
    const session = await getParentSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const codes = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.issuerParentId, session.id))
      .orderBy(desc(inviteCodes.createdAt));

    return NextResponse.json({
      codes: codes.map((c) => ({
        id: c.id,
        code: c.code,
        expiresAt: c.expiresAt.toISOString(),
        isUsed: !!c.usedByUserId,
        usedAt: c.usedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/parent/invite-codes]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// POST: 招待コード新規発行（72時間有効）
export async function POST() {
  try {
    const session = await getParentSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const id = generateId();
    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72時間後

    await db.insert(inviteCodes).values({
      id,
      code,
      issuerParentId: session.id,
      expiresAt,
    });

    return NextResponse.json({
      code: {
        id,
        code,
        expiresAt: expiresAt.toISOString(),
        isUsed: false,
        usedAt: null,
      },
    });
  } catch (err) {
    console.error("[POST /api/parent/invite-codes]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
