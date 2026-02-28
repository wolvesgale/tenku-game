"use client";

import { useState } from "react";
import { Send, Flag, MessageCircle } from "lucide-react";
import { cn, formatRelativeTime, getTrustBadgeClass, getAvatar } from "@/lib/utils";
import type { TrustLevel } from "@/types";
import { PRESET_EMOJIS } from "@/types";
import ReportModal from "@/components/rooms/ReportModal";

// モック投稿（TODO: API取得に置き換え）
const MOCK_POSTS = [
  {
    id: "p1",
    userId: "u1",
    userNickname: "ゲーマー忍者",
    userAvatarId: 5,
    userTrustLevel: "L2" as TrustLevel,
    content: "ネザーの要塞を見つけたー！攻略法知ってる人教えて😊",
    reactionCount: 12,
    replyCount: 3,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: "p2",
    userId: "u2",
    userNickname: "星の子メイ",
    userAvatarId: 11,
    userTrustLevel: "L1" as TrustLevel,
    content: "ダイヤモンド、地下何段目くらいを掘ればいい？初心者です",
    reactionCount: 5,
    replyCount: 7,
    createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: "p3",
    userId: "u3",
    userNickname: "ドラゴン太郎",
    userAvatarId: 1,
    userTrustLevel: "L3" as TrustLevel,
    content: "今週末スカイブロックでマルチプレイしたい人いる？気軽に返信してね",
    reactionCount: 24,
    replyCount: 11,
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
];

const MAX_CHARS = 500;

export default function RoomClient({ gameSlug }: { gameSlug: string }) {
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState<"new" | "popular">("new");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePost() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, content }),
      });
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* フィルタ */}
      <div className="flex gap-1 px-4 py-3 border-b border-[#2A2A45]">
        {(["new", "popular"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === f
                ? "bg-violet-950 text-violet-300 border border-violet-800"
                : "text-gray-600 hover:text-gray-400"
            )}
          >
            {f === "new" ? "新着順" : "注目順"}
          </button>
        ))}
      </div>

      {/* 投稿一覧 */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {MOCK_POSTS.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReport={() => setReportTarget(post.id)}
          />
        ))}
      </div>

      {/* 投稿フォーム */}
      <div className="sticky bottom-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-t border-[#2A2A45] px-4 py-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              rows={2}
              placeholder="ゲームについて投稿しよう..."
              className="w-full px-3 py-2.5 glass-card text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-700 rounded-xl resize-none scrollbar-thin"
            />
            <p className={cn("text-xs mt-1 text-right", MAX_CHARS - content.length < 50 ? "text-orange-400" : "text-gray-700")}>
              {MAX_CHARS - content.length}
            </p>
          </div>
          <button
            onClick={handlePost}
            disabled={!content.trim() || submitting}
            className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 通報モーダル */}
      {reportTarget && (
        <ReportModal
          targetType="post"
          targetId={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </>
  );
}

function PostCard({
  post,
  onReport,
}: {
  post: typeof MOCK_POSTS[number];
  onReport: () => void;
}) {
  const [showEmojis, setShowEmojis] = useState(false);
  const avatar = getAvatar(post.userAvatarId);

  return (
    <div className="p-4 glass-card rounded-2xl group">
      {/* ユーザー情報 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-lg">
            {avatar.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{post.userNickname}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-bold", getTrustBadgeClass(post.userTrustLevel))}>
                {post.userTrustLevel}
              </span>
            </div>
            <span className="text-xs text-gray-600">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>

        {/* 通報ボタン（ホバーで表示） */}
        <button
          onClick={onReport}
          className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
          title="通報する"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 本文 */}
      <p className="text-sm text-gray-300 leading-relaxed mb-3">{post.content}</p>

      {/* リアクション・リプライ */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 glass-card rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            😊 {post.reactionCount}
          </button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1.5 p-2 rounded-xl bg-[#16162A] border border-[#2A2A45] shadow-xl z-10">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setShowEmojis(false)}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 glass-card rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.replyCount}
        </button>
      </div>
    </div>
  );
}
