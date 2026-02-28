"use client";

import { useState, useCallback } from "react";
import { Send, Flag, MessageCircle, RefreshCw } from "lucide-react";
import {
  cn,
  formatRelativeTime,
  getTrustBadgeClass,
  getAvatar,
  hasBlockedContent,
  getBlockReason,
} from "@/lib/utils";
import type { TrustLevel } from "@/types";
import { PRESET_EMOJIS } from "@/types";
import ReportModal from "@/components/rooms/ReportModal";

export interface PostData {
  id: string;
  content: string;
  reactionCount: number;
  replyCount: number;
  createdAt: string;
  userId: string;
  userNickname: string;
  userAvatarId: number;
  userTrustLevel: TrustLevel;
}

const MAX_CHARS = 500;

export default function RoomClient({
  gameSlug,
  gameId,
  initialPosts,
}: {
  gameSlug: string;
  gameId: number;
  initialPosts: PostData[];
}) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState<"new" | "popular">("new");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 投稿一覧を再取得
  const refreshPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${gameSlug}?sort=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } finally {
      setLoading(false);
    }
  }, [gameSlug, filter]);

  // フィルタ変更時に再取得
  async function handleFilterChange(f: "new" | "popular") {
    setFilter(f);
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${gameSlug}?sort=${f}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } finally {
      setLoading(false);
    }
  }

  // 投稿送信
  async function handlePost() {
    if (!content.trim() || submitting) return;
    setError("");

    // クライアントサイドのコンテンツフィルタ（L1向け）
    if (hasBlockedContent(content)) {
      setError(getBlockReason(content));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "投稿に失敗しました");
        return;
      }
      setContent("");
      // 新しい投稿を先頭に追加（APIから戻ってきたデータで補完）
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      } else {
        // fallback: 再取得
        await refreshPosts();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // リアクション送信
  async function handleReaction(postId: string, emoji: string) {
    await fetch(`/api/rooms/${gameSlug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, emoji }),
    });
    // ローカルでカウントを楽観的更新
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, reactionCount: p.reactionCount + 1 } : p
      )
    );
  }

  const sortedPosts =
    filter === "popular"
      ? [...posts].sort((a, b) => b.reactionCount - a.reactionCount)
      : posts;

  return (
    <>
      {/* フィルタ */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-[#2A2A45]">
        {(["new", "popular"] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
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
        <button
          onClick={refreshPosts}
          disabled={loading}
          className="ml-auto p-1.5 text-gray-700 hover:text-gray-400 transition-colors"
          title="更新"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* 投稿一覧 */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-40">
        {loading && posts.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 glass-card rounded-2xl animate-pulse h-28" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-500 text-sm">まだ投稿がありません</p>
            <p className="text-gray-700 text-xs mt-1">最初の投稿をしてみよう！</p>
          </div>
        )}

        {sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReport={() => setReportTarget(post.id)}
            onReaction={(emoji) => handleReaction(post.id, emoji)}
          />
        ))}
      </div>

      {/* 投稿フォーム */}
      <div className="sticky bottom-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-t border-[#2A2A45] px-4 py-3">
        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl mb-2">
            {error}
          </p>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError("");
              }}
              maxLength={MAX_CHARS}
              rows={2}
              placeholder="ゲームについて投稿しよう..."
              className="w-full px-3 py-2.5 glass-card text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-700 rounded-xl resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
              }}
            />
            <p
              className={cn(
                "text-xs mt-1 text-right",
                MAX_CHARS - content.length < 50 ? "text-orange-400" : "text-gray-700"
              )}
            >
              {MAX_CHARS - content.length}
            </p>
          </div>
          <button
            onClick={handlePost}
            disabled={!content.trim() || submitting}
            className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0 mb-6"
          >
            {submitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
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
  onReaction,
}: {
  post: PostData;
  onReport: () => void;
  onReaction: (emoji: string) => void;
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
              <span className="text-sm font-semibold text-white">
                {post.userNickname}
              </span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border font-bold",
                  getTrustBadgeClass(post.userTrustLevel)
                )}
              >
                {post.userTrustLevel}
              </span>
            </div>
            <span className="text-xs text-gray-600">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

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
                  onClick={() => {
                    onReaction(e);
                    setShowEmojis(false);
                  }}
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
