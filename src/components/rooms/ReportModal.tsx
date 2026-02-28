"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportTargetType, ReportReason } from "@/types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "suspicious_invite", label: "不審な誘い・連絡先要求" },
  { value: "inappropriate",     label: "不適切な発言・内容" },
  { value: "spam",              label: "スパム・繰り返し投稿" },
  { value: "other",             label: "その他" },
];

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          /* 送信完了 */
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-white mb-2">通報を受け付けました</h3>
            <p className="text-sm text-gray-500 mb-4">
              7日以内に対応結果をお知らせします。
              ご協力ありがとうございます。
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
          /* 通報フォーム */
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white">通報する</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              通報者の情報は完全に匿名で処理されます（仕様書 §4.5 SP-001）
            </p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors",
                    reason === r.value
                      ? "bg-violet-950 border-violet-700"
                      : "bg-[#0F0F1A] border-[#2A2A45] hover:border-[#3A3A5A]"
                  )}
                >
                  <div
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors",
                      reason === r.value
                        ? "bg-violet-600 border-violet-600"
                        : "border-gray-600"
                    )}
                  />
                  <span className="text-sm text-gray-300">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-gray-500 hover:text-white transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? "送信中..." : "通報する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
