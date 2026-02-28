import Link from "next/link";
import { Shield, Gamepad2, Users, Lock, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-[#0F0F1A]">
      {/* 背景グロー */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* ヘッダー */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-[#2A2A45]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-wide">TENKU-GAME</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
          >
            参加する
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-5">
        {/* ヒーロー */}
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950 border border-violet-800 text-violet-300 text-xs font-medium mb-8">
            <Shield className="w-3 h-3" />
            13〜17歳のための安全な交流空間
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            ゲームで繋がる
            <br />
            <span className="gradient-text">安全な友達づくり</span>
          </h1>

          <p className="text-gray-500 mb-8 leading-relaxed">
            招待制・AI監視・段階的な信頼構築で
            <br />
            未成年が安心して交流できるコミュニティ
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30"
            >
              招待コードで参加する
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/parent/register"
              className="flex items-center justify-center gap-2 py-3.5 border border-[#2A2A45] hover:border-violet-800 text-gray-400 hover:text-white rounded-xl transition-all"
            >
              <Users className="w-4 h-4" />
              保護者として登録
            </Link>
          </div>
        </section>

        {/* 特徴 */}
        <section className="pb-12 space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card p-4 flex items-start gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.iconBg}`}
              >
                <f.Icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* トラストレベル */}
        <section className="pb-16">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 text-center">
              段階的な信頼システム
            </h2>
            <div className="space-y-2.5">
              {TRUST_LEVELS.map((t) => (
                <div key={t.name} className="flex items-start gap-3 p-3 rounded-xl bg-[#0F0F1A]">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border flex-shrink-0 mt-0.5 ${t.cls}`}>
                    {t.name}
                  </span>
                  <div>
                    <p className="text-sm text-white font-medium">{t.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#2A2A45] px-5 py-6 text-center">
        <p className="text-xs text-gray-700">
          © 2026 TENKU GAMES 株式会社 ·{" "}
          <Link href="/privacy" className="hover:text-gray-500 transition-colors">プライバシーポリシー</Link>
          {" · "}
          <Link href="/terms" className="hover:text-gray-500 transition-colors">利用規約</Link>
        </p>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    Icon: Shield,
    iconBg: "bg-violet-950",
    iconColor: "text-violet-400",
    title: "招待制で安心",
    desc: "保護者が発行する招待コードでのみ参加可能。悪意あるアクターの侵入を防ぎます。",
  },
  {
    Icon: Gamepad2,
    iconBg: "bg-cyan-950",
    iconColor: "text-cyan-400",
    title: "AIが24時間監視",
    desc: "全投稿・メッセージをAIがリアルタイム解析。危険なやりとりを自動検知・介入します。",
  },
  {
    Icon: Lock,
    iconBg: "bg-pink-950",
    iconColor: "text-pink-400",
    title: "個人情報ゼロ",
    desc: "氏名・学校名・住所は一切収集しません。ニックネームとアバターだけで交流できます。",
  },
];

const TRUST_LEVELS = [
  {
    name: "L1",
    label: "初期（登録直後）",
    desc: "テキストのみ。リンク・画像・連絡先は送れません。DM上限15通/時。",
    cls: "bg-gray-800 text-gray-400 border-gray-700",
  },
  {
    name: "L2",
    label: "信頼（3日以上・20回交流）",
    desc: "限定画像の送信が可能に。DM上限60通/時。",
    cls: "bg-blue-950 text-blue-400 border-blue-800",
  },
  {
    name: "L3",
    label: "認定（保護者・公的機関認証）",
    desc: "グループDM・動画送信が可能。認定バッジが表示されます。",
    cls: "bg-violet-950 text-violet-400 border-violet-800",
  },
];
