"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function ParentLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/parent/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
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

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-950 border border-violet-800 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">保護者ログイン</h1>
            <p className="text-gray-500 text-sm">お子さまへの招待コードを管理できます</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                パスワード
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

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{" "}
              <Link href="/parent/register" className="text-violet-400 hover:text-violet-300">
                新規登録
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              お子さまの登録は{" "}
              <Link href="/register" className="text-violet-400 hover:text-violet-300">
                こちら
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
