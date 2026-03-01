/**
 * テストアカウント作成スクリプト
 * 実行: npm run db:create-test
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { users, inviteCodes, parents, gameInterests, games } from "./schema";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("❌ DATABASE_URL未設定"); process.exit(1); }
  const db = drizzle(neon(url) as any);

  // 保護者
  const parentId = generateId();
  await db.insert(parents).values({
    id: parentId,
    email: "test-parent@tenku.dev",
    passwordHash: await bcrypt.hash("testpass123", 10),
    nickname: "テスト保護者",
  }).onConflictDoNothing();

  // 招待コード（有効期限1年）
  const codeId = generateId();
  await db.insert(inviteCodes).values({
    id: codeId,
    code: "TESTCODE",
    issuerParentId: parentId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }).onConflictDoNothing();

  // テストユーザー L2
  const userId = generateId();
  await db.insert(users).values({
    id: userId,
    nickname: "テストユーザー",
    avatarId: 6,
    passwordHash: await bcrypt.hash("testpass123", 10),
    trustLevel: "L2",
    status: "active",
    inviteCodeUsed: "TESTCODE",
    isMinor: true,
    schoolType: "high",
  }).onConflictDoNothing();

  await db.update(inviteCodes)
    .set({ usedByUserId: userId, usedAt: new Date() })
    .where(eq(inviteCodes.code, "TESTCODE"));

  // ゲーム興味（上位3件）
  const topGames = await db.select({ id: games.id, slug: games.slug }).from(games).limit(3);
  for (const g of topGames) {
    await db.insert(gameInterests).values({ userId, gameId: g.id }).onConflictDoNothing();
  }

  console.log("========================================");
  console.log("🎉 テストアカウント作成完了");
  console.log("========================================");
  console.log("ニックネーム : テストユーザー");
  console.log("パスワード   : testpass123");
  console.log("トラスト     : L2");
  console.log("========================================");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
