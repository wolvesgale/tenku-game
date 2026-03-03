import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gameAccounts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { getSteamGames, getSteamAchievementSummary } from "@/lib/steam";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    const { platform } = await req.json();

    if (platform === "steam") {
      const [account] = await db
        .select()
        .from(gameAccounts)
        .where(and(eq(gameAccounts.userId, session.id), eq(gameAccounts.platform, "steam")))
        .limit(1);

      if (!account) return NextResponse.json({ error: "Steam未連携です" }, { status: 404 });

      // 最終同期から1時間以内はスキップ
      const lastSync = account.lastSyncedAt;
      if (lastSync && Date.now() - lastSync.getTime() < 60 * 60 * 1000) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message: "1時間以内に同期済みです",
        });
      }

      const gamesData = await getSteamGames(account.platformUserId);
      const achievements = await getSteamAchievementSummary(account.platformUserId);

      await db
        .update(gameAccounts)
        .set({
          totalPlaytimeMinutes: gamesData?.totalMinutes ?? account.totalPlaytimeMinutes,
          achievementCount: achievements.achievementCount,
          rareAchievements: achievements.rareAchievements,
          lastSyncedAt: new Date(),
        })
        .where(eq(gameAccounts.id, account.id));

      return NextResponse.json({ ok: true, skipped: false });
    }

    return NextResponse.json({ error: "未対応のプラットフォームです" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/game-accounts/sync]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
