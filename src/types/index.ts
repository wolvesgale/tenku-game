// ==========================================
// 仕様書 §5.1 主要エンティティ対応の型定義
// ==========================================

export type TrustLevel = "L1" | "L2" | "L3";
export type UserStatus = "active" | "banned" | "suspended" | "pending";
export type AiRiskLevel = "safe" | "low" | "medium" | "high";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ReportTargetType = "post" | "dm_message" | "user";
export type ReportReason =
  | "suspicious_invite"
  | "inappropriate"
  | "spam"
  | "other";

// セッション型（JWT payload）
export interface SessionUser {
  id: string;
  nickname: string;
  avatarId: number;
  trustLevel: TrustLevel;
  role: "user" | "parent" | "admin";
}

// ユーザー（公開プロフィール）
export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: number;
  trustLevel: TrustLevel;
  status: UserStatus;
  createdAt: string;
}

// ゲーム
export interface Game {
  id: number;
  name: string;
  slug: string;
  iconEmoji: string;
  tags: string[];
  playerCount: number;
  isActive: boolean;
}

// ルーム投稿
export interface RoomPost {
  id: string;
  userId: string;
  userNickname: string;
  userAvatarId: number;
  userTrustLevel: TrustLevel;
  gameId: number;
  content: string;
  aiRiskLevel: AiRiskLevel;
  isFlagged: boolean;
  reactionCount: number;
  replyCount: number;
  createdAt: string;
}

// DMチャンネル
export interface DmChannel {
  id: string;
  otherUser: UserProfile;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

// DMメッセージ（復号済み）
export interface DmMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderNickname: string;
  senderAvatarId: number;
  content: string;
  aiRiskLevel: AiRiskLevel;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
}

// トラストスコア状態
export interface TrustStatus {
  level: TrustLevel;
  aiScore: number;
  activeStreak: number;
  interactionCount: number;
  /** L2解除条件の進捗 */
  l2Progress: {
    activeStreak: { current: number; required: number };
    interactions: { current: number; required: number };
    aiScore: { current: number; required: number };
    noReports: boolean;
  };
}

// 招待コード
export interface InviteCode {
  id: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt: string | null;
}

// ==========================================
// 定数（仕様書 §4.3 トラストスコア）
// ==========================================

export const TRUST_L2_REQUIREMENTS = {
  activeStreak: 3,   // アクティブ3日以上
  interactions: 20,  // 交流20回以上
  minAiScore: 70,    // AIスコア緑
} as const;

export const DM_RATE_LIMITS: Record<TrustLevel, number> = {
  L1: 15,        // 15通/時
  L2: 60,        // 60通/時
  L3: Infinity,  // 無制限
};

// プリセット絵文字6種（仕様書 §4.2 RM-003）
export const PRESET_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎮"] as const;
export type PresetEmoji = (typeof PRESET_EMOJIS)[number];

// アバター12種（仕様書 §4.1 OB-003）
export const AVATARS = [
  { id: 1,  name: "ドラゴン",     emoji: "🐉" },
  { id: 2,  name: "フェニックス", emoji: "🔥" },
  { id: 3,  name: "ユニコーン",   emoji: "🦄" },
  { id: 4,  name: "ロボット",     emoji: "🤖" },
  { id: 5,  name: "忍者",         emoji: "🥷" },
  { id: 6,  name: "宇宙人",       emoji: "👾" },
  { id: 7,  name: "魔法使い",     emoji: "🧙" },
  { id: 8,  name: "騎士",         emoji: "⚔️" },
  { id: 9,  name: "海賊",         emoji: "🏴‍☠️" },
  { id: 10, name: "オオカミ",     emoji: "🐺" },
  { id: 11, name: "星の子",       emoji: "⭐" },
  { id: 12, name: "雷神",         emoji: "⚡" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];
