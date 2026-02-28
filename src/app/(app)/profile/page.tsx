import { getSession } from "@/lib/auth";
import { Shield, MessageCircle, Star, LogOut } from "lucide-react";
import Link from "next/link";
import { getAvatar, getTrustBadgeClass, cn } from "@/lib/utils";
import { TRUST_L2_REQUIREMENTS } from "@/types";

export default async function ProfilePage() {
  const session = await getSession();
  const avatar = getAvatar(session!.avatarId);

  // TODO: DBから取得（現在はモック）
  const stats = {
    aiScore: 85,
    activeStreak: 2,
    interactionCount: 14,
    noReports: true,
  };

  const l2Progress = {
    activeStreak: { current: stats.activeStreak, required: TRUST_L2_REQUIREMENTS.activeStreak },
    interactions:  { current: stats.interactionCount, required: TRUST_L2_REQUIREMENTS.interactions },
    aiScore:       { current: stats.aiScore, required: TRUST_L2_REQUIREMENTS.minAiScore },
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-4">
        <h1 className="font-bold text-white text-lg">プロフィール</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* プロフィールカード */}
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-violet-950/30 to-[#16162A]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-3xl">
              {avatar.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{session?.nickname}</h2>
                <span className={cn("text-xs px-2 py-0.5 rounded-md border font-bold", getTrustBadgeClass(session!.trustLevel))}>
                  {session?.trustLevel}
                </span>
              </div>
              <p className="text-sm text-gray-500">TENKU-GAMEメンバー</p>
            </div>
          </div>
        </div>

        {/* トラストスコア */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">トラストスコア</h3>
          </div>

          {session?.trustLevel === "L1" && (
            <>
              <p className="text-xs text-gray-500 mb-4">
                以下の条件をすべて満たすとL2に上がります
              </p>
              <div className="space-y-3">
                <ProgressItem
                  label="アクティブ日数"
                  current={l2Progress.activeStreak.current}
                  required={l2Progress.activeStreak.required}
                  unit="日"
                />
                <ProgressItem
                  label="交流回数"
                  current={l2Progress.interactions.current}
                  required={l2Progress.interactions.required}
                  unit="回"
                />
                <ProgressItem
                  label="AIスコア（70点以上）"
                  current={l2Progress.aiScore.current}
                  required={l2Progress.aiScore.required}
                  unit="点"
                />
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-400">通報履歴なし</span>
                  <span className={cn("text-xs font-semibold", stats.noReports ? "text-green-400" : "text-red-400")}>
                    {stats.noReports ? "✅ クリア" : "❌ 未達成"}
                  </span>
                </div>
              </div>
            </>
          )}

          {session?.trustLevel === "L2" && (
            <div className="text-center py-3">
              <p className="text-blue-400 font-semibold mb-1">信頼レベルL2</p>
              <p className="text-xs text-gray-500">
                L3（認定）は保護者認証または公的機関連携が必要です
              </p>
            </div>
          )}

          {session?.trustLevel === "L3" && (
            <div className="text-center py-3">
              <p className="text-violet-400 font-semibold mb-1">認定レベルL3</p>
              <p className="text-xs text-gray-500">
                最高信頼レベルです。グループDM・動画送信が利用可能です。
              </p>
            </div>
          )}
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: "交流", value: `${stats.interactionCount}回` },
            { icon: Star,          label: "AIスコア", value: `${stats.aiScore}点` },
            { icon: Shield,        label: "通報なし", value: "✅" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card rounded-xl p-3.5 text-center">
              <Icon className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
              <p className="font-bold text-white text-base">{value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ログアウト */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full py-3 glass-card rounded-xl text-gray-500 hover:text-red-400 hover:border-red-900/50 text-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  current,
  required,
  unit,
}: {
  label: string;
  current: number;
  required: number;
  unit: string;
}) {
  const pct = Math.min((current / required) * 100, 100);
  const met = current >= required;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className={cn("font-semibold", met ? "text-green-400" : "text-gray-300")}>
          {met ? "✅ クリア" : `${current} / ${required}${unit}`}
        </span>
      </div>
      <div className="h-1.5 bg-[#0F0F1A] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", met ? "bg-green-500" : "bg-violet-600")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
