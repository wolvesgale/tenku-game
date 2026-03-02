/**
 * テストアカウント作成スクリプト
 * 実行: npm run db:create-test
 * (.env.local の DATABASE_URL を自動読み込み)
 */
import { config } from "dotenv";
import { resolve } from "path";

// .env.local を自動読み込み
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { users, inviteCodes, parents, gameInterests, games } from "./schema";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL が未設定です (.env.local を確認してください)");
    process.exit(1);
  }

  const db = drizzle(neon(url) as any);
  console.log("🔌 DB接続OK\n");

  // 保護者
  const parentId = generateId();
  await db.insert(parents).values({
    id: parentId,
    email: "test-parent@tenku.dev",
    passwordHash: await bcrypt.hash("testpass123", 10),
    nickname: "テスト保護者",
  }).onConflictDoNothing();
  console.log("✅ 保護者アカウント作成");

  // 招待コード（有効期限1年）
  const codeId = generateId();
  await db.insert(inviteCodes).values({
    id: codeId,
    code: "TESTCODE",
    issuerParentId: parentId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }).onConflictDoNothing();
  console.log("✅ 招待コード: TESTCODE");

  // テストユーザー（L2）
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
  console.log("✅ ユーザー作成: テストユーザー (L2)");

  // 招待コードを使用済みに
  await db.update(inviteCodes)
    .set({ usedByUserId: userId, usedAt: new Date() })
    .where(eq(inviteCodes.code, "TESTCODE"));

  // ゲーム興味（上位3件）
  const topGames = await db.select({ id: games.id, slug: games.slug }).from(games).limit(3);
  for (const g of topGames) {
    await db.insert(gameInterests).values({ userId, gameId: g.id }).onConflictDoNothing();
  }
  console.log(`✅ ゲーム興味: ${topGames.map(g => g.slug).join(", ")}`);

  console.log("\n========================================");
  console.log("🎉 テストアカウント作成完了！");
  console.log("========================================");
  console.log("ニックネーム : テストユーザー");
  console.log("パスワード   : testpass123");
  console.log("トラスト     : L2");
  console.log("========================================");
  process.exit(0);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
