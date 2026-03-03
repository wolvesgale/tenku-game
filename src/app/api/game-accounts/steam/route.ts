import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gameAccounts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import {
  isValidSteamId,
  getSteamProfile,
  getSteamGames,
  getTopRareAchievements,
} from "@/lib/steam";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    if (!process.env.STEAM_API_KEY) {
      return NextResponse.json({ error: "Steam APIキーが設定されていません" }, { status: 503 });
    }

    const { steamId } = await req.json();

    if (!steamId || !isValidSteamId(steamId)) {
      return NextResponse.json(
        { error: "有効なSteamID64を入力してください（17桁の数字）" },
        { status: 400 }
      );
    }

    const profile = await getSteamProfile(steamId);
    if (!profile) {
      return NextResponse.json({ error: "SteamIDが見つかりませんでした" }, { status: 404 });
    }

    if (profile.communityVisibilityState !== 3) {
      return NextResponse.json(
        { error: "Steamプロフィールを「公開」に設定してください" },
        { status: 400 }
      );
    }

    const gameData = await getSteamGames(steamId);
    const totalMinutes = gameData?.totalMinutes ?? 0;
    const games = gameData?.games ?? [];

    let rareAchievements: any[] = [];
    if (games.length > 0) {
      try {
        rareAchievements = await getTopRareAchievements(steamId, games, 10);
      } catch { /* 失敗しても連携は成功させる */ }
    }

    const existing = await db
      .select()
      .from(gameAccounts)
      .where(and(eq(gameAccounts.userId, session.id), eq(gameAccounts.platform, "steam")))
      .limit(1);

    if (existing.length > 0) {
      await db.update(gameAccounts).set({
        platformUserId: steamId,
        platformUsername: profile.nickname,
        platformAvatarUrl: profile.avatarUrl,
        totalPlaytimeMinutes: totalMinutes,
        achievementTotal: games.length,
        rareAchievements,
        lastSyncedAt: new Date(),
      }).where(and(eq(gameAccounts.userId, session.id), eq(gameAccounts.platform, "steam")));
    } else {
      await db.insert(gameAccounts).values({
        userId: session.id,
        platform: "steam",
        platformUserId: steamId,
        platformUsername: profile.nickname,
        platformAvatarUrl: profile.avatarUrl,
        totalPlaytimeMinutes: totalMinutes,
        achievementCount: 0,
        achievementTotal: games.length,
        rareAchievements,
        isPublic: true,
        lastSyncedAt: new Date(),
      });
    }

    return NextResponse.json({
      ok: true,
      account: {
        platform: "steam",
        platformUsername: profile.nickname,
        platformAvatarUrl: profile.avatarUrl,
        totalPlaytimeMinutes: totalMinutes,
        achievementTotal: games.length,
        rareAchievements,
      },
    });
  } catch (err) {
    console.error("[POST /api/game-accounts/steam]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    await db.delete(gameAccounts)
      .where(and(eq(gameAccounts.userId, session.id), eq(gameAccounts.platform, "steam")));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/game-accounts/steam]", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
