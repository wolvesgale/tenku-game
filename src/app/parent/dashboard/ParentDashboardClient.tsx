"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, Plus, Copy, Check, Clock, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteCode {
  id: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt: string | null;
}

interface Props {
  parentId: string;
  parentNickname: string;
}

export default function ParentDashboardClient({ parentNickname }: Props) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/invite-codes");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setCodes(data.codes);
    } catch {
      setError("招待コードの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  async function generateCode() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/parent/invite-codes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodes((prev) => [data.code, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  async function copyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getExpiryStatus(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (diff <= 0) return { label: "期限切れ", color: "text-red-400" };
    if (hours < 1) return { label: `${mins}分後に期限切れ`, color: "text-orange-400" };
    return { label: `残り${hours}時間`, color: "text-green-400" };
  }

  const activeCodes = codes.filter((c) => !c.isUsed && new Date(c.expiresAt) > new Date());
  const usedOrExpiredCodes = codes.filter((c) => c.isUsed || new Date(c.expiresAt) <= new Date());

  return (
    <div className="min-h-dvh bg-[#0F0F1A]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">保護者ダッシュボード</span>
              <p className="text-xs text-gray-600">{parentNickname}</p>
            </div>
          </div>
          <form action="/api/parent/logout" method="POST">
            <button type="submit" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-950/20">
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* 招待コード発行ボタン */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-1">招待コードを発行</h2>
          <p className="text-xs text-gray-500 mb-4">
            発行したコードをお子さまに渡してください。有効期限は<strong className="text-gray-300">72時間</strong>です。
          </p>
          <button
            onClick={generateCode}
            disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />生成中...</>
            ) : (
              <><Plus className="w-4 h-4" />新しい招待コードを発行</>
            )}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* 有効な招待コード */}
        <section>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            有効なコード（{activeCodes.length}件）
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : activeCodes.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm">有効なコードがありません</p>
              <p className="text-gray-700 text-xs mt-1">上のボタンから発行してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCodes.map((code) => {
                const expiry = getExpiryStatus(code.expiresAt);
                return (
                  <div key={code.id} className="glass-card rounded-2xl p-4 border-violet-900/50 border">
                    <div className="flex items-center justify-between">
                      <div>
                        {/* コード表示 */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-2xl font-mono font-bold text-white tracking-[0.2em]">
                            {code.code}
                          </span>
                          <button
                            onClick={() => copyCode(code.code, code.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              copiedId === code.id
                                ? "bg-green-950 text-green-400"
                                : "bg-[#0F0F1A] text-gray-600 hover:text-violet-400"
                            )}
                            title="コピー"
                          >
                            {copiedId === code.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className={cn("w-3 h-3", expiry.color)} />
                          <span className={cn("text-xs", expiry.color)}>{expiry.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-1 rounded-full bg-green-950 text-green-400 border border-green-900 font-medium">
                          未使用
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 使用済み・期限切れ */}
        {usedOrExpiredCodes.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              使用済み・期限切れ（{usedOrExpiredCodes.length}件）
            </h3>
            <div className="space-y-2">
              {usedOrExpiredCodes.map((code) => (
                <div key={code.id} className="glass-card rounded-2xl p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-gray-500 tracking-[0.2em] line-through">
                      {code.code}
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-medium border",
                      code.isUsed
                        ? "bg-blue-950 text-blue-400 border-blue-900"
                        : "bg-gray-900 text-gray-600 border-gray-800"
                    )}>
                      {code.isUsed ? "使用済み" : "期限切れ"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 注意事項 */}
        <div className="glass-card rounded-2xl p-4 bg-amber-950/20 border-amber-900/40">
          <p className="text-xs text-amber-400 font-semibold mb-2">⚠️ 保護者の方へ</p>
          <ul className="text-xs text-amber-300/70 space-y-1.5 leading-relaxed">
            <li>• 招待コードは信頼できるお子さまにのみ渡してください</li>
            <li>• 第三者への転送はおやめください</li>
            <li>• お子さまのアカウント活動を定期的にご確認ください</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
            サービストップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
