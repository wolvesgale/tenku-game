import { getSession } from "@/lib/auth";
import { MessageSquare, Lock } from "lucide-react";
import Link from "next/link";
import { getAvatar, formatRelativeTime, getTrustBadgeClass } from "@/lib/utils";
import type { TrustLevel } from "@/types";

// TODO: DBから取得
const MOCK_CHANNELS = [
  {
    id: "ch1",
    other: { nickname: "ゲーマー忍者", avatarId: 5, trustLevel: "L2" as TrustLevel },
    lastMessage: "今度一緒にやろうよ！",
    lastMessageAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    unreadCount: 2,
  },
  {
    id: "ch2",
    other: { nickname: "星の子メイ", avatarId: 11, trustLevel: "L1" as TrustLevel },
    lastMessage: "ありがとう、助かりました！",
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    unreadCount: 0,
  },
];

export default async function DmPage() {
  const session = await getSession();

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-4">
        <h1 className="font-bold text-white text-lg">メッセージ</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          相互フォローするとDMができます
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* L1注意バナー */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-900/60">
          <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300 leading-relaxed">
            <span className="font-semibold">L1レベル：</span>
            リンク・画像・連絡先は送れません。15通/時の制限があります。
            交流を重ねてL2になると機能が拡張されます。
          </p>
        </div>

        {MOCK_CHANNELS.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-violet-400" />
            </div>
            <p className="font-semibold text-white mb-1">まだメッセージがありません</p>
            <p className="text-sm text-gray-600 mb-4">ルームで投稿して友達をフォローしよう</p>
            <Link
              href="/rooms"
              className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              ルームを見る
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_CHANNELS.map((ch) => {
              const avatar = getAvatar(ch.other.avatarId);
              return (
                <Link
                  key={ch.id}
                  href={`/dm/${ch.id}`}
                  className="flex items-center gap-3 p-3.5 glass-card hover:border-violet-800 rounded-2xl transition-all"
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-xl">
                      {avatar.emoji}
                    </div>
                    {ch.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {ch.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                          {ch.other.nickname}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold flex-shrink-0 ${getTrustBadgeClass(ch.other.trustLevel)}`}>
                          {ch.other.trustLevel}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        {formatRelativeTime(ch.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{ch.lastMessage}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
