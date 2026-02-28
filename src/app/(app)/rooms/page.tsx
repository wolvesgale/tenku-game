import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameInterests, roomPosts } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Search, ChevronRight, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { getAvatar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const session = await getSession();
  const avatar = getAvatar(session!.avatarId);

  const userInterests = await db
    .select({ gameId: gameInterests.gameId })
    .from(gameInterests)
    .where(eq(gameInterests.userId, session!.id));

  const joinedGameIds = new Set(userInterests.map((i) => i.gameId));

  const allGames = await db
    .select()
    .from(games)
    .where(eq(games.isActive, true))
    .orderBy(desc(games.playerCount));

  const postCounts = await db
    .select({ gameId: roomPosts.gameId, cnt: count() })
    .from(roomPosts)
    .groupBy(roomPosts.gameId);

  const postCountMap = new Map(postCounts.map((p) => [p.gameId, p.cnt]));

  const joined = allGames.filter((g) => joinedGameIds.has(g.id));
  const discover = allGames.filter((g) => !joinedGameIds.has(g.id));

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-white">TENKU-GAME</h1>
          </div>
          <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <span>{session?.nickname}</span>
            <div className="w-8 h-8 rounded-full bg-[#16162A] border border-[#2A2A45] flex items-center justify-center text-base">
              {avatar.emoji}
            </div>
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input type="text" placeholder="ゲームを検索..." className="w-full pl-9 pr-4 py-2.5 glass-card text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-700 rounded-xl" />
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {joined.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">参加中のルーム</h2>
            <div className="space-y-2">
              {joined.map((g) => <RoomCard key={g.id} game={g} postCount={postCountMap.get(g.id) ?? 0} joined />)}
            </div>
          </section>
        )}
        {discover.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              {joined.length > 0 ? "他のルームを探す" : "ゲームルーム一覧"}
            </h2>
            <div className="space-y-2">
              {discover.map((g) => <RoomCard key={g.id} game={g} postCount={postCountMap.get(g.id) ?? 0} joined={false} />)}
            </div>
          </section>
        )}
        {allGames.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-gray-500 text-sm">ゲームルームを準備中です</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ game, postCount, joined }: {
  game: { id: number; name: string; slug: string; iconEmoji: string; tags: string[]; playerCount: number };
  postCount: number;
  joined: boolean;
}) {
  return (
    <Link href={`/rooms/${game.slug}`} className="flex items-center gap-3 p-3.5 glass-card hover:border-violet-800 transition-all group rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-2xl flex-shrink-0">
        {game.iconEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm truncate">{game.name}</span>
          {joined && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-950 text-violet-400 border border-violet-800 flex-shrink-0">参加中</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-1.5">
          <span>💬 {postCount.toLocaleString()}件</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {game.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F0F1A] text-gray-600">{t}</span>
          ))}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
    </Link>
  );
}
