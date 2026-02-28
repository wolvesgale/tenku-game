import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { games, roomPosts, users } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import RoomClient from "./RoomClient";
import type { PostData } from "./RoomClient";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: { gameId: string };
}) {
  // DBからゲーム情報を取得
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.slug, params.gameId))
    .limit(1);

  if (!game) notFound();

  // 初期投稿20件をSSRで取得
  const rawPosts = await db
    .select({
      id: roomPosts.id,
      content: roomPosts.content,
      reactionCount: roomPosts.reactionCount,
      replyCount: roomPosts.replyCount,
      createdAt: roomPosts.createdAt,
      aiRiskLevel: roomPosts.aiRiskLevel,
      userId: users.id,
      userNickname: users.nickname,
      userAvatarId: users.avatarId,
      userTrustLevel: users.trustLevel,
    })
    .from(roomPosts)
    .innerJoin(users, eq(roomPosts.userId, users.id))
    .where(eq(roomPosts.gameId, game.id) && isNull(roomPosts.deletedAt))
    .orderBy(desc(roomPosts.createdAt))
    .limit(20);

  const initialPosts: PostData[] = rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    reactionCount: p.reactionCount,
    replyCount: p.replyCount,
    createdAt: p.createdAt.toISOString(),
    userId: p.userId,
    userNickname: p.userNickname,
    userAvatarId: p.userAvatarId,
    userTrustLevel: p.userTrustLevel as "L1" | "L2" | "L3",
  }));

  return (
    <div className="max-w-lg mx-auto flex flex-col">
      {/* ヘッダー */}
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/rooms"
            className="p-2 -ml-2 rounded-xl hover:bg-[#16162A] text-gray-500 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-2xl">{game.iconEmoji}</span>
          <div>
            <h1 className="font-bold text-white text-sm">{game.name}</h1>
            <p className="text-xs text-gray-600">
              💬 {game.playerCount.toLocaleString()}人がプレイ中
            </p>
          </div>
        </div>
      </div>

      <RoomClient
        gameSlug={params.gameId}
        gameId={game.id}
        initialPosts={initialPosts}
      />
    </div>
  );
}
