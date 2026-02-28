"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, ChevronRight, ChevronLeft, Check, Eye, EyeOff } from "lucide-react";
import { AVATARS } from "@/types";
import { cn } from "@/lib/utils";

type Step = "invite" | "profile" | "games";

interface FormData {
  inviteCode: string;
  nickname: string;
  password: string;
  avatarId: number;
  isMinorConfirmed: boolean;
  gameIds: number[];
}

// リリース時30タイトル想定のうち代表12件（仕様書 §1.4）
const GAMES = [
  { id: 1,  name: "マインクラフト",     emoji: "⛏️", tags: ["建築", "サバイバル"] },
  { id: 2,  name: "フォートナイト",     emoji: "🔫", tags: ["バトロワ", "シューター"] },
  { id: 3,  name: "原神",             emoji: "⚔️", tags: ["RPG", "アクション"] },
  { id: 4,  name: "スプラトゥーン3",   emoji: "🦑", tags: ["シューター", "チーム"] },
  { id: 5,  name: "ポケモンSV",        emoji: "🎮", tags: ["RPG", "コレクション"] },
  { id: 6,  name: "モンスターハンター", emoji: "🐉", tags: ["アクション", "協力"] },
  { id: 7,  name: "Apex Legends",      emoji: "🎯", tags: ["バトロワ", "シューター"] },
  { id: 8,  name: "あつ森",            emoji: "🌿", tags: ["生活", "のんびり"] },
  { id: 9,  name: "ヴァロラント",       emoji: "💥", tags: ["タクティカル"] },
  { id: 10, name: "ウマ娘",            emoji: "🐴", tags: ["育成", "レース"] },
  { id: 11, name: "プロセカ",           emoji: "🎵", tags: ["音楽", "リズム"] },
  { id: 12, name: "ブルアカ",           emoji: "📚", tags: ["RPG", "学園"] },
];

const STEPS: Step[] = ["invite", "profile", "games"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("invite");
  const [form, setForm] = useState<FormData>({
    inviteCode: "",
    nickname: "",
    password: "",
    avatarId: 6,       // デフォルト: 宇宙人
    isMinorConfirmed: false,
    gameIds: [],
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  // ---- ステップ1: 招待コード確認 ----
  async function verifyInviteCode() {
    if (form.inviteCode.length !== 8) {
      setError("招待コードは8文字です");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invite-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "無効な招待コードです");
    } finally {
      setLoading(false);
    }
  }

  // ---- ステップ2: プロフィール確認 ----
  function validateProfile() {
    if (form.nickname.length < 2 || form.nickname.length > 20) {
      setError("ニックネームは2〜20文字です");
      return;
    }
    if (form.password.length < 8) {
      setError("パスワードは8文字以上です");
      return;
    }
    if (!form.isMinorConfirmed) {
      setError("13〜17歳であることを確認してください");
      return;
    }
    setError("");
    setStep("games");
  }

  // ---- ステップ3: 登録送信 ----
  async function submitRegister() {
    if (form.gameIds.length === 0) {
      setError("ゲームを1つ以上選択してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: form.inviteCode,
          nickname: form.nickname,
          password: form.password,
          avatarId: form.avatarId,
          isMinor: form.isMinorConfirmed,
          gameIds: form.gameIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/rooms");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(id: number) {
    if (form.gameIds.includes(id)) {
      setForm({ ...form, gameIds: form.gameIds.filter((g) => g !== id) });
    } else if (form.gameIds.length < 10) {
      setForm({ ...form, gameIds: [...form.gameIds, id] });
    }
  }

  return (
    <div className="min-h-dvh bg-[#0F0F1A] flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A45]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">TENKU-GAME</span>
        </Link>
        <span className="text-xs text-gray-600">ステップ {stepIdx + 1} / 3</span>
      </header>

      {/* プログレスバー */}
      <div className="h-0.5 bg-[#2A2A45]">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${((stepIdx + 1) / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 px-5 py-8 max-w-sm mx-auto w-full">

        {/* ===== STEP 1: 招待コード ===== */}
        {step === "invite" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">招待コードを入力</h1>
              <p className="text-sm text-gray-500">
                保護者から受け取った8文字のコードを入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">招待コード</label>
              <input
                type="text"
                value={form.inviteCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inviteCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  })
                }
                maxLength={8}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 glass-card text-white text-center text-xl font-mono tracking-[0.3em] placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-600 rounded-xl"
              />
              <p className="text-xs text-gray-700 mt-2 text-right">{form.inviteCode.length}/8</p>
            </div>

            {error && <ErrorBox message={error} />}

            <button
              onClick={verifyInviteCode}
              disabled={loading || form.inviteCode.length !== 8}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "確認中..." : (<>次へ <ChevronRight className="w-4 h-4" /></>)}
            </button>

            <p className="text-center text-sm text-gray-600">
              招待コードは{" "}
              <Link href="/parent/register" className="text-violet-400 hover:text-violet-300">
                保護者アカウント
              </Link>
              {" "}から発行できます
            </p>
          </div>
        )}

        {/* ===== STEP 2: プロフィール ===== */}
        {step === "profile" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">プロフィール設定</h1>
              <p className="text-sm text-gray-500">個人情報は一切不要です</p>
            </div>

            {/* アバター選択（12種） */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                アバターを選ぶ
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setForm({ ...form, avatarId: a.id })}
                    title={a.name}
                    className={cn(
                      "aspect-square rounded-xl text-2xl flex items-center justify-center transition-all",
                      form.avatarId === a.id
                        ? "bg-violet-600 scale-110 ring-2 ring-violet-400"
                        : "bg-[#16162A] hover:bg-[#1E1E38]"
                    )}
                  >
                    {a.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* ニックネーム */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                ニックネーム（2〜20文字）
              </label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                maxLength={20}
                placeholder="ゲーマー名を入力"
                className="w-full px-4 py-3 glass-card text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-600 rounded-xl"
              />
              <p className="text-xs text-gray-700 mt-1 text-right">{form.nickname.length}/20</p>
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                パスワード（8文字以上）
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 glass-card text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-600 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 年齢確認チェック（仕様書 §4.1 OB-003） */}
            <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:border-violet-700 transition-colors border border-[#2A2A45]">
              <div
                onClick={() => setForm({ ...form, isMinorConfirmed: !form.isMinorConfirmed })}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  form.isMinorConfirmed
                    ? "bg-violet-600 border-violet-600"
                    : "border-gray-600"
                )}
              >
                {form.isMinorConfirmed && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-300">
                私は <strong className="text-white">13〜17歳</strong> であることを確認します
              </span>
            </label>

            {error && <ErrorBox message={error} />}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("invite"); setError(""); }}
                className="px-4 py-3.5 glass-card rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                戻る
              </button>
              <button
                onClick={validateProfile}
                className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                次へ <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: ゲーム選択 ===== */}
        {step === "games" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">好きなゲームを選ぼう</h1>
              <p className="text-sm text-gray-500">1〜10個まで選択できます（後から変更可）</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GAMES.map((g) => {
                const selected = form.gameIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGame(g.id)}
                    className={cn(
                      "p-3 rounded-xl text-left border transition-all",
                      selected
                        ? "bg-violet-950 border-violet-700 ring-1 ring-violet-600"
                        : "bg-[#16162A] border-[#2A2A45] hover:border-[#3A3A5A]"
                    )}
                  >
                    <div className="text-xl mb-1">{g.emoji}</div>
                    <div className="text-sm font-medium text-white truncate">{g.name}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {g.tags.slice(0, 1).map((t) => (
                        <span key={t} className="text-[10px] text-gray-600 bg-[#0F0F1A] px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-600 text-center">
              {form.gameIds.length} / 10 個選択中
            </p>

            {error && <ErrorBox message={error} />}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("profile"); setError(""); }}
                className="px-4 py-3.5 glass-card rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                戻る
              </button>
              <button
                onClick={submitRegister}
                disabled={loading || form.gameIds.length === 0}
                className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? "登録中..." : "ゲームを始める 🎮"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl">
      {message}
    </p>
  );
}
