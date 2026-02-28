import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomPosts, games } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId, hasBlockedContent, getBlockReason } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  gameSlug: z.string(),
  content:  z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const { gameSlug, content } = parsed.data;

    // L1ユーザーはコンテンツフィルタ（SR-003）
    if (session.trustLevel === "L1" && hasBlockedContent(content)) {
      return NextResponse.json(
        { error: getBlockReason(content) },
        { status: 400 }
      );
    }

    // ゲームID取得
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.slug, gameSlug))
      .limit(1);

    if (!game) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }

    // AI スコア（TODO: Python AI サービス呼び出しに置き換え）
    const aiScore = 90;
    const aiRiskLevel = "safe" as const;

    const id = generateId();
    await db.insert(roomPosts).values({
      id,
      userId: session.id,
      gameId: game.id,
      content,
      aiScore,
      aiRiskLevel,
      isFlagged: false,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[POST /api/rooms]", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
