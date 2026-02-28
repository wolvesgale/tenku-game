import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { users, inviteCodes, gameInterests } from "@/lib/db/schema";
import { hashPassword, setSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  inviteCode:  z.string().length(8),
  nickname:    z.string().min(2).max(20),
  password:    z.string().min(8),
  avatarId:    z.number().int().min(1).max(12),
  isMinor:     z.literal(true),
  gameIds:     z.array(z.number().int().positive()).min(1).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "入力内容が正しくありません";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { inviteCode, nickname, password, avatarId, gameIds } = parsed.data;

    // 招待コード確認
    const [code] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, inviteCode))
      .limit(1);

    if (!code || code.usedByUserId || new Date() > code.expiresAt) {
      return NextResponse.json(
        { error: "無効または期限切れの招待コードです" },
        { status: 400 }
      );
    }

    // ニックネーム重複確認
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.nickname, nickname))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "このニックネームはすでに使われています" },
        { status: 409 }
      );
    }

    // ユーザー作成
    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      nickname,
      passwordHash,
      avatarId,
      isMinor: true,
      inviteCodeUsed: inviteCode,
      trustLevel: "L1",
      status: "active",
    });

    // ゲーム興味を登録
    await db.insert(gameInterests).values(
      gameIds.map((gameId) => ({ userId, gameId }))
    );

    // 招待コードを使用済みに
    await db
      .update(inviteCodes)
      .set({ usedByUserId: userId, usedAt: new Date() })
      .where(eq(inviteCodes.code, inviteCode));

    // セッション設定
    await setSession({
      id: userId,
      nickname,
      avatarId,
      trustLevel: "L1",
      role: "user",
    });

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
