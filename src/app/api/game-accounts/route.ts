import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gameAccounts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    const accounts = await db
      .select()
      .from(gameAccounts)
      .where(eq(gameAccounts.userId, session.id));

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        platformUsername: a.platformUsername,
        platformAvatarUrl: a.platformAvatarUrl,
        totalPlaytimeMinutes: a.totalPlaytimeMinutes,
        achievementCount: a.achievementCount,
        achievementTotal: a.achievementTotal,
        rareAchievements: a.rareAchievements,
        isPublic: a.isPublic,
        lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/game-accounts]", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
