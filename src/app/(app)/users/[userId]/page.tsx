"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, Users } from "lucide-react";
import { cn, getAvatar, getTrustBadgeClass } from "@/lib/utils";

interface UserProfile {
  id: string;
  nickname: string;
  avatarId: number;
  trustLevel: "L1" | "L2" | "L3";
  aiScore: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  games: { id: number; name: string; slug: string; iconEmoji: string }[];
  createdAt: string;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => setProfile(d.user))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleFollow() {
    if (!profile || followLoading) return;
    setFollowLoading(true);

    const method = profile.isFollowing ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${userId}/follow`, { method });
    const data = await res.json();

    if (res.ok) {
      setProfile((prev) => {
        if (!prev) return prev;
        const nowFollowing = !prev.isFollowing;
        const isMutual = nowFollowing && prev.isFollowedBy;
        return {
          ...prev,
          isFollowing: nowFollowing,
          isMutual,
          followerCount: prev.followerCount + (nowFollowing ? 1 : -1),
        };
      });

      if (data.mutual) {
        setToast("🎉 相互フォロー成立！DMが使えるようになりました");
        setTimeout(() => setToast(""), 3000);
      }
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="h-32 glass-card rounded-2xl animate-pulse" />
        <div className="h-24 glass-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">ユーザーが見つかりませんでした</p>
      </div>
    );
  }

  const avatar = getAvatar(profile.avatarId);
  const joinDate = new Date(profile.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric", month: "long",
  });

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-[#16162A] text-gray-500 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-white">{profile.nickname}</span>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* プロフィールカード */}
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-violet-950/30 to-[#16162A]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-3xl">
                {avatar.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{profile.nickname}</h2>
                  <span className={cn("text-xs px-2 py-0.5 rounded-md border font-bold", getTrustBadgeClass(profile.trustLevel))}>
                    {profile.trustLevel}
                  </span>
                </div>
                {profile.isFollowedBy && !profile.isMutual && (
                  <span className="text-xs text-violet-400 bg-violet-950/50 px-2 py-0.5 rounded-full border border-violet-800">
                    あなたをフォロー中
                  </span>
                )}
                {profile.isMutual && (
                  <span className="text-xs text-green-400 bg-green-950/50 px-2 py-0.5 rounded-full border border-green-800">
                    相互フォロー
                  </span>
                )}
                <p className="text-xs text-gray-600 mt-1">{joinDate}から参加</p>
              </div>
            </div>

            {/* フォローボタン */}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                profile.isFollowing
                  ? "bg-[#16162A] border border-[#2A2A45] text-gray-400 hover:border-red-800 hover:text-red-400"
                  : "bg-violet-600 hover:bg-violet-500 text-white",
                followLoading && "opacity-50"
              )}
            >
              {profile.isFollowing ? (
                <><UserCheck className="w-4 h-4" /> フォロー中</>
              ) : (
                <><UserPlus className="w-4 h-4" /> フォロー</>
              )}
            </button>
          </div>

          {/* フォロー数 */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-[#2A2A45]">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{profile.followingCount}</p>
              <p className="text-xs text-gray-600">フォロー</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{profile.followerCount}</p>
              <p className="text-xs text-gray-600">フォロワー</p>
            </div>
          </div>
        </div>

        {/* DM ボタン（相互フォロー時のみ） */}
        {profile.isMutual && (
          <button
            onClick={() => router.push("/dm")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-950/40 border border-green-800 text-green-400 text-sm font-semibold hover:bg-green-950/70 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            DMを送る
          </button>
        )}

        {/* 好きなゲーム */}
        {profile.games.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-white text-sm">好きなゲーム</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.games.map((g) => (
                <span key={g.id} className="flex items-center gap-1 px-3 py-1.5 glass-card rounded-xl text-xs text-gray-300">
                  <span>{g.iconEmoji}</span>
                  <span>{g.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 相互フォロートースト */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-3 bg-green-900 border border-green-700 text-green-300 text-sm rounded-2xl shadow-xl z-50 whitespace-nowrap animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
