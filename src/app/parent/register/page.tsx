"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Check } from "lucide-react";

export default function ParentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    agreedToTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreedToTerms) {
      setError("利用規約への同意が必要です");
      return;
    }
    if (form.password.length < 8) {
      setError("パスワードは8文字以上で設定してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nickname: form.nickname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/parent/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0F0F1A] flex flex-col">
      <header className="flex items-center px-5 py-4 border-b border-[#2A2A45]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">TENKU-GAME <span className="text-gray-500 font-normal">保護者</span></span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-950 border border-violet-800 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">保護者アカウント登録</h1>
            <p className="text-gray-500 text-sm">お子さまに安全な招待コードを発行できます</p>
          </div>

          {/* 説明カード */}
          <div className="glass-card rounded-2xl p-4 mb-6 space-y-2">
            {[
              "招待コードはお子さま1人につき1枚発行",
              "コードの有効期限は発行から72時間",
              "お子さまの活動はダッシュボードで確認可能",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-violet-950 border border-violet-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-violet-400" />
                </div>
                <p className="text-xs text-gray-400">{item}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                お名前（ニックネーム可）
              </label>
              <input
                type="text"
                required
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                maxLength={50}
                placeholder="山田 太郎"
                className="w-full px-4 py-3 glass-card text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-600 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 glass-card text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-600 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                パスワード（8文字以上）
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
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

            {/* 利用規約同意 */}
            <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:border-violet-800 transition-colors border border-[#2A2A45]">
              <div
                onClick={() => setForm({ ...form, agreedToTerms: !form.agreedToTerms })}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  form.agreedToTerms ? "bg-violet-600 border-violet-600" : "border-gray-600"
                }`}
              >
                {form.agreedToTerms && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">
                <Link href="/terms" className="text-violet-400 hover:underline">利用規約</Link>
                {" "}および{" "}
                <Link href="/privacy" className="text-violet-400 hover:underline">プライバシーポリシー</Link>
                に同意します。お子さまの安全な利用のために内容をご確認ください。
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.agreedToTerms}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "登録中..." : "保護者アカウントを作成"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            既にアカウントをお持ちの方は{" "}
            <Link href="/parent/login" className="text-violet-400 hover:text-violet-300">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
