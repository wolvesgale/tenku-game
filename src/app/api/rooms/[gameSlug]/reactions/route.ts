import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomReactions, roomPosts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { PRESET_EMOJIS } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { gameSlug: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { postId, emoji } = await req.json();

    if (!postId || !emoji) {
      return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
    }

    // プリセット絵文字のみ許可
    if (!PRESET_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "使用できない絵文字です" }, { status: 400 });
    }

    // リアクション追加
    await db.insert(roomReactions).values({
      postId,
      userId: session.id,
      emoji,
    });

    // reactionCount をインクリメント
    await db
      .update(roomPosts)
      .set({ reactionCount: sql`${roomPosts.reactionCount} + 1` })
      .where(eq(roomPosts.id, postId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/rooms/[gameSlug]/reactions]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
