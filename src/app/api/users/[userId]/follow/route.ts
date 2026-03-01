import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { follows, users, dmChannels } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

// フォローする
export async function POST(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    const followeeId = params.userId;
    if (followeeId === session.id) {
      return NextResponse.json({ error: "自分はフォローできません" }, { status: 400 });
    }

    // 相手が存在するか確認
    const [target] = await db.select().from(users).where(eq(users.id, followeeId)).limit(1);
    if (!target) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

    // フォロー登録（重複は無視）
    await db.insert(follows).values({
      followerId: session.id,
      followeeId,
    }).onConflictDoNothing();

    // 相互フォローか確認
    const [mutual] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followeeId), eq(follows.followeeId, session.id)))
      .limit(1);

    let dmChannelId: string | null = null;

    if (mutual) {
      // 相互フォロー成立 → DMチャンネルを自動作成（なければ）
      const [user1Id, user2Id] = [session.id, followeeId].sort();
      const existing = await db
        .select()
        .from(dmChannels)
        .where(and(eq(dmChannels.user1Id, user1Id), eq(dmChannels.user2Id, user2Id)))
        .limit(1);

      if (existing.length === 0) {
        dmChannelId = generateId();
        await db.insert(dmChannels).values({
          id: dmChannelId,
          user1Id,
          user2Id,
        });
      } else {
        dmChannelId = existing[0].id;
      }
    }

    return NextResponse.json({
      ok: true,
      mutual: !!mutual,
      dmChannelId,
    });
  } catch (err) {
    console.error("[POST follow]", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// アンフォロー
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

    await db
      .delete(follows)
      .where(and(eq(follows.followerId, session.id), eq(follows.followeeId, params.userId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE follow]", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
