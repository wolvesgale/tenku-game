"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Trophy, Gamepad2, Loader2, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RareAchievement {
  name: string;
  description: string;
  iconUrl: string;
  percent: number;
  unlockedAt?: string;
}

interface GameAccount {
  id: number;
  platform: string;
  platformUsername: string;
  platformAvatarUrl: string;
  totalPlaytimeMinutes: number;
  achievementCount: number;
  achievementTotal: number;
  rareAchievements: RareAchievement[];
  isPublic: boolean;
  lastSyncedAt: string | null;
}

const PLATFORMS = [
  {
    id: "steam",
    name: "Steam",
    icon: "🖥️",
    color: "from-blue-950/60 to-[#16162A]",
    border: "border-blue-800",
    badge: "bg-blue-900 text-blue-300",
    available: true,
    description: "実績・プレイ時間・所有ゲームを連携",
    helpUrl: "https://store.steampowered.com/account/",
    helpText: "SteamID64の調べ方: Steamアカウント設定ページで確認できます",
  },
  {
    id: "psn",
    name: "PlayStation",
    icon: "🎮",
    color: "from-indigo-950/60 to-[#16162A]",
    border: "border-indigo-800",
    available: false,
    description: "トロフィー連携（近日対応予定）",
  },
  {
    id: "xbox",
    name: "Xbox",
    icon: "🟢",
    color: "from-green-950/40 to-[#16162A]",
    border: "border-green-900",
    available: false,
    description: "実績・Gamerscore連携（近日対応予定）",
  },
];

export default function GameAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [steamInput, setSteamInput] = useState("");
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState("");
  const [showSteamForm, setShowSteamForm] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/game-accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const steamAccount = accounts.find((a) => a.platform === "steam");

  function formatPlaytime(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}分`;
    if (hours < 1000) return `${hours}時間`;
    return `${(hours / 1000).toFixed(1)}k時間`;
  }

  async function handleSteamConnect() {
    if (!steamInput.trim() || steamLoading) return;
    setSteamLoading(true);
    setSteamError("");

    const res = await fetch("/api/game-accounts/steam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId: steamInput.trim() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSteamError(data.error ?? "連携に失敗しました");
    } else {
      setToast(`✅ ${data.account.platformUsername} として連携しました！`);
      setTimeout(() => setToast(""), 3000);
      setShowSteamForm(false);
      setSteamInput("");
      const refreshed = await fetch("/api/game-accounts").then((r) => r.json());
      setAccounts(refreshed.accounts ?? []);
    }
    setSteamLoading(false);
  }

  async function handleSteamDisconnect() {
    if (!confirm("Steam連携を解除しますか？")) return;
    await fetch("/api/game-accounts/steam", { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.platform !== "steam"));
    setToast("Steam連携を解除しました");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-[#16162A] text-gray-500 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-white text-sm">ゲームアカウント連携</h1>
          <p className="text-xs text-gray-600">実績・プレイ時間をプロフィールに表示</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 pb-24">

        {/* 連携済み Steam カード */}
        {steamAccount && (
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-blue-950/40 to-[#16162A] border border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {steamAccount.platformAvatarUrl ? (
                  <img src={steamAccount.platformAvatarUrl} alt="" className="w-12 h-12 rounded-xl" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-2xl">🖥️</div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{steamAccount.platformUsername}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-semibold">Steam ✓</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {steamAccount.lastSyncedAt
                      ? `最終同期: ${new Date(steamAccount.lastSyncedAt).toLocaleDateString("ja-JP")}`
                      : "未同期"}
                  </p>
                </div>
              </div>
              <button onClick={handleSteamDisconnect} className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-all" title="連携解除">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-[#0F0F1A]/60 rounded-xl">
                <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{formatPlaytime(steamAccount.totalPlaytimeMinutes ?? 0)}</p>
                <p className="text-xs text-gray-600">総プレイ</p>
              </div>
              <div className="text-center p-3 bg-[#0F0F1A]/60 rounded-xl">
                <Gamepad2 className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{steamAccount.achievementTotal ?? 0}</p>
                <p className="text-xs text-gray-600">所有ゲーム</p>
              </div>
              <div className="text-center p-3 bg-[#0F0F1A]/60 rounded-xl">
                <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{(steamAccount.rareAchievements ?? []).length}</p>
                <p className="text-xs text-gray-600">レア実績</p>
              </div>
            </div>

            {(steamAccount.rareAchievements ?? []).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500" /> レア実績（取得率低い順）
                </p>
                <div className="space-y-2">
                  {(steamAccount.rareAchievements ?? []).slice(0, 5).map((ach, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-[#0F0F1A]/60 rounded-xl">
                      {ach.iconUrl ? (
                        <img src={ach.iconUrl} alt="" className="w-8 h-8 rounded-lg" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-yellow-900/40 flex items-center justify-center text-sm">🏆</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{ach.name}</p>
                        <p className="text-xs text-gray-600 truncate">{ach.description}</p>
                      </div>
                      <span className="text-xs text-yellow-400 font-bold whitespace-nowrap">{ach.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 未連携プラットフォーム */}
        {PLATFORMS.map((platform) => {
          if (platform.id === "steam" && steamAccount) return null;
          return (
            <div key={platform.id} className={cn("glass-card rounded-2xl p-5 bg-gradient-to-br border", platform.color, platform.border)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0F0F1A]/60 flex items-center justify-center text-2xl">{platform.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{platform.name}</span>
                    {platform.available
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-semibold">対応中</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">近日対応</span>
                    }
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{platform.description}</p>
                </div>
              </div>

              {platform.id === "steam" && (
                <>
                  {!showSteamForm ? (
                    <button onClick={() => setShowSteamForm(true)} className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors">
                      Steamを連携する
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">SteamID64（17桁の数字）</label>
                        <input
                          type="text"
                          value={steamInput}
                          onChange={(e) => { setSteamInput(e.target.value); setSteamError(""); }}
                          placeholder="例: 76561198012345678"
                          className="w-full px-3 py-2.5 glass-card text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-700 rounded-xl"
                          maxLength={17}
                        />
                      </div>
                      {steamError && (
                        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl">{steamError}</p>
                      )}
                      <a href={platform.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-3 h-3" />{platform.helpText}
                      </a>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowSteamForm(false); setSteamError(""); }} className="flex-1 py-2.5 rounded-xl bg-[#16162A] border border-[#2A2A45] text-gray-400 text-sm hover:border-gray-600 transition-colors">
                          キャンセル
                        </button>
                        <button
                          onClick={handleSteamConnect}
                          disabled={steamLoading || steamInput.length !== 17}
                          className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {steamLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {steamLoading ? "連携中..." : "連携する"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!platform.available && (
                <button
                  onClick={() => { setToast(`🚧 ${platform.name}連携は近日対応予定です`); setTimeout(() => setToast(""), 2500); }}
                  className="w-full py-2.5 rounded-xl bg-[#16162A] border border-[#2A2A45] text-gray-500 text-sm cursor-not-allowed"
                >
                  近日対応予定
                </button>
              )}
            </div>
          );
        })}

        <div className="p-4 glass-card rounded-2xl">
          <p className="text-xs text-gray-500 leading-relaxed">
            ゲームデータの連携はプロフィールに表示され、同じゲームを遊ぶ仲間を見つけやすくなります。
            公開設定をオフにすることで非表示にも対応予定です。
          </p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-3 bg-[#16162A] border border-[#2A2A45] text-gray-200 text-sm rounded-2xl shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
