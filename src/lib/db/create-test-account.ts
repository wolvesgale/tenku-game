/**
 * テストアカウント作成スクリプト
 * 実行: npm run db:create-test
 *
 * DATABASE_URLは.env.localから自動読み込み (tsx が処理)
 * または: DATABASE_URL="postgres://..." npm run db:create-test
 */

// @ts-nocheck
/* eslint-disable */

const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { eq } = require("drizzle-orm");
const { users, inviteCodes, parents, gameInterests, games } = require("./schema");
const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const fs = require("fs");
const path = require("path");

// .env.local を手動パース
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvLocal();

const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL が未設定です (.env.local を確認してください)");
    process.exit(1);
  }

  const db = drizzle(neon(url));
  console.log("🔌 DB接続OK\n");

  const parentId = generateId();
  await db.insert(parents).values({
    id: parentId,
    email: "test-parent@tenku.dev",
    passwordHash: await bcrypt.hash("testpass123", 10),
    nickname: "テスト保護者",
  }).onConflictDoNothing();
  console.log("✅ 保護者アカウント作成");

  const codeId = generateId();
  await db.insert(inviteCodes).values({
    id: codeId,
    code: "TESTCODE",
    issuerParentId: parentId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }).onConflictDoNothing();
  console.log("✅ 招待コード: TESTCODE");

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

  await db.update(inviteCodes)
    .set({ usedByUserId: userId, usedAt: new Date() })
    .where(eq(inviteCodes.code, "TESTCODE"));

  const topGames = await db.select({ id: games.id, slug: games.slug }).from(games).limit(3);
  for (const g of topGames) {
    await db.insert(gameInterests).values({ userId, gameId: g.id }).onConflictDoNothing();
  }
  console.log(`✅ ゲーム興味: ${topGames.map((g) => g.slug).join(", ")}`);

  console.log("\n========================================");
  console.log("🎉 テストアカウント作成完了！");
  console.log("========================================");
  console.log("ニックネーム : テストユーザー");
  console.log("パスワード   : testpass123");
  console.log("トラスト     : L2");
  console.log("========================================");
  process.exit(0);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
