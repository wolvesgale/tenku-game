import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";
import { AVATARS } from "@/types";
import type { TrustLevel } from "@/types";

// ---------- クラス名マージ ----------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------- ID生成 ----------

const nanoidAlpha = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  21
);
export const generateId = () => nanoidAlpha();

/** 招待コード: 8文字英大文字数字（仕様書 §4.1 OB-001） */
const nanoidCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
export const generateInviteCode = () => nanoidCode();

// ---------- アバター ----------

export function getAvatar(id: number) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[5]; // デフォルト: 宇宙人
}

// ---------- 日時フォーマット ----------

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;
  return d.toLocaleDateString("ja-JP");
}

// ---------- トラストレベル ----------

export function getTrustBadgeClass(level: TrustLevel): string {
  const map: Record<TrustLevel, string> = {
    L1: "bg-gray-800 text-gray-400 border-gray-700",
    L2: "bg-blue-950 text-blue-400 border-blue-800",
    L3: "bg-violet-950 text-violet-400 border-violet-800",
  };
  return map[level];
}

// ---------- コンテンツフィルタ（仕様書 §4.3 DM-002 / SR-003） ----------

const BLOCKED_PATTERNS = [
  /https?:\/\//i,                                        // URL
  /\b\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/,             // 電話番号
  /LINE|Discord|Instagram|Twitter|TikTok|Telegram|Snapchat/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // メール
];

export function hasBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

export function getBlockReason(text: string): string {
  if (/https?:\/\//i.test(text)) return "外部リンクは送信できません";
  if (/\b\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(text))
    return "電話番号は送信できません";
  if (/LINE|Discord|Instagram|Twitter|TikTok|Telegram|Snapchat/i.test(text))
    return "外部サービスへの誘導は禁止されています";
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text))
    return "メールアドレスは送信できません";
  return "このコンテンツは送信できません";
}
