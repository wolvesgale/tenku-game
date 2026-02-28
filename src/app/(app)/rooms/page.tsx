import { getSession } from "@/lib/auth";
import { Search, ChevronRight, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { getAvatar } from "@/lib/utils";

// TODO: DBから取得（現在はシード用モックデータ）
const MOCK_ROOMS = [
  { id: 1, slug: "minecraft",  name: "マインクラフト",     emoji: "⛏️", tags: ["建築", "サバイバル"], online: 128, posts: 1204, joined: true  },
  { id: 2, slug: "fortnite",   name: "フォートナイト",     emoji: "🔫", tags: ["バトロワ"],          online: 89,  posts: 873,  joined: true  },
  { id: 3, slug: "genshin",    name: "原神",               emoji: "⚔️", tags: ["RPG", "アクション"], online: 201, posts: 3421, joined: false },
  { id: 4, slug: "splatoon",   name: "スプラトゥーン3",   emoji: "🦑", tags: ["シューター"],        online: 156, posts: 2109, joined: true  },
  { id: 5, slug: "pokemon",    name: "ポケモンSV",          emoji: "🎮", tags: ["RPG"],               online: 312, posts: 5632, joined: false },
  { id: 6, slug: "mhw",        name: "モンスターハンター", emoji: "🐉", tags: ["アクション", "協力"], online: 67,  posts: 892,  joined: false },
];

export default async function RoomsPage() {
  const session = await getSession();
  const avatar = getAvatar(session!.avatarId);

  const joined = MOCK_ROOMS.filter((r) => r.joined);
  const discover = MOCK_ROOMS.filter((r) => !r.joined);

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-white">TENKU-GAME</h1>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <span>{session?.nickname}</span>
            <div className="w-8 h-8 rounded-full bg-[#16162A] border border-[#2A2A45] flex items-center justify-center text-base">
              {avatar.emoji}
            </div>
          </Link>
        </div>

        {/* 検索バー（UI Only） */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="ゲームを検索..."
            className="w-full pl-9 pr-4 py-2.5 glass-card text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-700 rounded-xl"
          />
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* 参加中 */}
        <section>
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            参加中のルーム
          </h2>
          <div className="space-y-2">
            {joined.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
        </section>

        {/* 探す */}
        <section>
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            他のルームを探す
          </h2>
          <div className="space-y-2">
            {discover.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: typeof MOCK_ROOMS[number] }) {
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="flex items-center gap-3 p-3.5 glass-card hover:border-violet-800 transition-all group rounded-2xl"
    >
      <div className="w-12 h-12 rounded-xl bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-2xl flex-shrink-0">
        {room.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm truncate">{room.name}</span>
          {room.joined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-950 text-violet-400 border border-violet-800 flex-shrink-0">
              参加中
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>🟢 {room.online}人</span>
          <span>💬 {room.posts.toLocaleString()}</span>
        </div>
        <div className="flex gap-1 mt-1.5">
          {room.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F0F1A] text-gray-600">
              {t}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
    </Link>
  );
}
