import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, follows, gameInterests, games } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    const [user] = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        avatarId: users.avatarId,
        trustLevel: users.trustLevel,
        aiScore: users.aiScore,
        activeStreak: users.activeStreak,
        interactionCount: users.interactionCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

    // フォロワー数・フォロー数
    const [followerCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followeeId, params.userId));

    const [followingCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, params.userId));

    // 自分がフォローしているか
    const [isFollowing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, session.id), eq(follows.followeeId, params.userId)))
      .limit(1);

    // 相手が自分をフォローしているか
    const [isFollowedBy] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, params.userId), eq(follows.followeeId, session.id)))
      .limit(1);

    // ゲーム興味
    const interests = await db
      .select({ id: games.id, name: games.name, slug: games.slug, iconEmoji: games.iconEmoji })
      .from(gameInterests)
      .innerJoin(games, eq(gameInterests.gameId, games.id))
      .where(eq(gameInterests.userId, params.userId));

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        followerCount: followerCount.count,
        followingCount: followingCount.count,
        isFollowing: !!isFollowing,
        isFollowedBy: !!isFollowedBy,
        isMutual: !!isFollowing && !!isFollowedBy,
        games: interests,
      },
    });
  } catch (err) {
    console.error("[GET /api/users/[userId]]", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
