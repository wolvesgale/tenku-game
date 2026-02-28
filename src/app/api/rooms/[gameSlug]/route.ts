import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomPosts, users, games } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { gameSlug: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "new";
    const cursor = searchParams.get("cursor"); // ページネーション用（将来）

    // ゲーム取得
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.slug, params.gameSlug))
      .limit(1);

    if (!game) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }

    // 投稿一覧取得
    const rawPosts = await db
      .select({
        id: roomPosts.id,
        content: roomPosts.content,
        reactionCount: roomPosts.reactionCount,
        replyCount: roomPosts.replyCount,
        createdAt: roomPosts.createdAt,
        userId: users.id,
        userNickname: users.nickname,
        userAvatarId: users.avatarId,
        userTrustLevel: users.trustLevel,
      })
      .from(roomPosts)
      .innerJoin(users, eq(roomPosts.userId, users.id))
      .where(eq(roomPosts.gameId, game.id) && isNull(roomPosts.deletedAt))
      .orderBy(desc(roomPosts.createdAt))
      .limit(50);

    const posts = rawPosts.map((p) => ({
      id: p.id,
      content: p.content,
      reactionCount: p.reactionCount,
      replyCount: p.replyCount,
      createdAt: p.createdAt.toISOString(),
      userId: p.userId,
      userNickname: p.userNickname,
      userAvatarId: p.userAvatarId,
      userTrustLevel: p.userTrustLevel,
    }));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[GET /api/rooms/[gameSlug]]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
