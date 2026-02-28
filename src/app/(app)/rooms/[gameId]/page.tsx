import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import RoomClient from "./RoomClient";

// ゲームマスタ（TODO: DB取得）
const GAME_MAP: Record<string, { name: string; emoji: string }> = {
  minecraft:  { name: "マインクラフト",     emoji: "⛏️" },
  fortnite:   { name: "フォートナイト",     emoji: "🔫" },
  genshin:    { name: "原神",               emoji: "⚔️" },
  splatoon:   { name: "スプラトゥーン3",   emoji: "🦑" },
  pokemon:    { name: "ポケモンSV",          emoji: "🎮" },
  mhw:        { name: "モンスターハンター", emoji: "🐉" },
};

export default function RoomPage({ params }: { params: { gameId: string } }) {
  const game = GAME_MAP[params.gameId] ?? { name: params.gameId, emoji: "🎮" };

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
          <span className="text-2xl">{game.emoji}</span>
          <div>
            <h1 className="font-bold text-white text-sm">{game.name}</h1>
            <p className="text-xs text-gray-600">🟢 オンライン</p>
          </div>
        </div>
      </div>

      {/* クライアントコンポーネント（投稿一覧・投稿フォーム） */}
      <RoomClient gameSlug={params.gameId} />
    </div>
  );
}
