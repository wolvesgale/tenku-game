import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  varchar,
  pgEnum,
  serial,
  json,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const trustLevelEnum = pgEnum("trust_level", ["L1", "L2", "L3"]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "banned",
  "suspended",
  "pending",
]);

export const aiRiskLevelEnum = pgEnum("ai_risk_level", [
  "safe",
  "low",
  "medium",
  "high",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "post",
  "dm_message",
  "user",
]);

export const adminActionEnum = pgEnum("admin_action", [
  "ban",
  "unban",
  "warn",
  "suspend",
  "delete_post",
  "resolve_report",
  "dismiss_report",
  "update_trust",
  "system_setting",
]);

// ---------- Tables ----------

/**
 * 保護者アカウント（招待コード発行者）
 * 仕様書 §4.1 OB-001
 */
export const parents = pgTable("parents", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 招待コード
 * 仕様書 §5.1 InviteCode
 * - 8文字英数字、有効期限72時間、1コード1アカウント
 */
export const inviteCodes = pgTable("invite_codes", {
  id: text("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  issuerParentId: text("issuer_parent_id")
    .notNull()
    .references(() => parents.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedByUserId: text("used_by_user_id"), // 使用後に埋める
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * ユーザー
 * 仕様書 §5.1 User
 * - 氏名・学校名等の個人情報は保持しない（SR-001）
 * - is_minor フラグのみ保持
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nickname: varchar("nickname", { length: 20 }).notNull().unique(),
  avatarId: integer("avatar_id").notNull().default(1),
  passwordHash: text("password_hash").notNull(),
  trustLevel: trustLevelEnum("trust_level").notNull().default("L1"),
  status: userStatusEnum("status").notNull().default("active"),
  inviteCodeUsed: text("invite_code_used").notNull(),
  // 個人情報は持たない。フラグのみ（SR-001）
  isMinor: boolean("is_minor").notNull().default(true),
  schoolType: varchar("school_type", { length: 20 }), // "middle"|"high"|"other"
  // AI・トラスト計算用
  aiScore: integer("ai_score").notNull().default(100),
  activeStreak: integer("active_streak").notNull().default(0),
  interactionCount: integer("interaction_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
});

/**
 * ゲームマスタ
 * 仕様書 §1.4 リリース時30タイトル以上
 */
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  iconEmoji: varchar("icon_emoji", { length: 10 }).notNull().default("🎮"),
  tags: text("tags").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  playerCount: integer("player_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * ユーザーのゲーム興味
 * 仕様書 §5.1 GameInterest - 1ユーザー最大10件
 */
export const gameInterests = pgTable("game_interests", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

/**
 * ルーム投稿
 * 仕様書 §5.1 RoomPost / §4.2 RM-002
 * - 論理削除（deleted_at）
 * - AI監視対象
 */
export const roomPosts = pgTable("room_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  content: text("content").notNull(),
  aiScore: integer("ai_score"),
  aiRiskLevel: aiRiskLevelEnum("ai_risk_level").default("safe"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  reactionCount: integer("reaction_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // 論理削除
});

/**
 * ルームリプライ
 * 仕様書 §4.2 RM-003
 */
export const roomReplies = pgTable("room_replies", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => roomPosts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  aiRiskLevel: aiRiskLevelEnum("ai_risk_level").default("safe"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * リアクション（プリセット絵文字6種）
 * 仕様書 §4.2 RM-003
 */
export const roomReactions = pgTable("room_reactions", {
  id: serial("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => roomPosts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * フォロー関係
 * 仕様書 §5.1 Follow - 相互フォロー成立でDM解放
 */
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followeeId: text("followee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * DMチャンネル
 * 仕様書 §4.3 DM-001 - 相互フォロー後に自動生成
 */
export const dmChannels = pgTable("dm_channels", {
  id: text("id").primaryKey(),
  user1Id: text("user1_id")
    .notNull()
    .references(() => users.id),
  user2Id: text("user2_id")
    .notNull()
    .references(() => users.id),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

/**
 * DMメッセージ
 * 仕様書 §5.1 DMMessage
 * - AES-256-GCM暗号化保存（SR-006）
 * - L1: リンク・電話番号・外部連絡先ブロック（SR-003）
 */
export const dmMessages = pgTable("dm_messages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => dmChannels.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  contentEncrypted: text("content_encrypted").notNull(), // AES-256-GCM
  contentIv: text("content_iv").notNull(),               // 初期化ベクトル
  aiScore: integer("ai_score"),
  aiRiskLevel: aiRiskLevelEnum("ai_risk_level").default("safe"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockReason: text("block_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * トラストイベント（スコア変動ログ）
 * 仕様書 §5.1 TrustEvent
 */
export const trustEvents = pgTable("trust_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  scoreDelta: integer("score_delta").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 通報
 * 仕様書 §5.1 Report / §4.5 SP-001
 * - evidence_ref: S3キー（暗号化エビデンス）
 */
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: varchar("reason", { length: 50 }).notNull(),
  evidenceRef: text("evidence_ref"),
  status: reportStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 監査ログ（削除・改ざん不可）
 * 仕様書 §5.1 AuditLog / §5.2 永久保持
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  action: adminActionEnum("action").notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: text("target_id"),
  beforeState: json("before_state"),
  afterState: json("after_state"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * システム設定（動的変更可）
 * 仕様書 §4.6 AD-005
 */
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
