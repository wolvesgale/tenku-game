/**
 * ゲームマスタシードスクリプト
 * 実行: npx tsx src/lib/db/seed-games.ts
 *
 * 仕様書 §1.4 リリース時30タイトル以上
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { games } from "./schema";

const GAMES = [
  // ─── サバイバル・建築 ───
  { name: "マインクラフト",         slug: "minecraft",       iconEmoji: "⛏️", tags: ["建築", "サバイバル", "マルチ"] },
  { name: "テラリア",               slug: "terraria",        iconEmoji: "🌿", tags: ["建築", "サバイバル", "探索"] },
  { name: "ARK: Survival",          slug: "ark",             iconEmoji: "🦕", tags: ["サバイバル", "恐竜", "マルチ"] },
  { name: "Rust",                   slug: "rust",            iconEmoji: "🔧", tags: ["サバイバル", "PvP", "マルチ"] },

  // ─── バトルロイヤル・シューター ───
  { name: "フォートナイト",         slug: "fortnite",        iconEmoji: "🔫", tags: ["バトロワ", "シューター", "マルチ"] },
  { name: "Apex Legends",           slug: "apex",            iconEmoji: "🎯", tags: ["バトロワ", "シューター", "マルチ"] },
  { name: "ヴァロラント",           slug: "valorant",        iconEmoji: "💥", tags: ["タクティカル", "シューター"] },
  { name: "スプラトゥーン3",        slug: "splatoon3",       iconEmoji: "🦑", tags: ["シューター", "チーム", "任天堂"] },
  { name: "PUBG",                   slug: "pubg",            iconEmoji: "🪖", tags: ["バトロワ", "シューター"] },
  { name: "CoD: Warzone",           slug: "warzone",         iconEmoji: "☠️", tags: ["バトロワ", "シューター"] },

  // ─── RPG・アクション ───
  { name: "原神",                   slug: "genshin",         iconEmoji: "⚔️", tags: ["RPG", "アクション", "オープンワールド"] },
  { name: "ポケモンSV",             slug: "pokemon-sv",      iconEmoji: "🎮", tags: ["RPG", "コレクション", "任天堂"] },
  { name: "モンスターハンターワイルズ", slug: "mhwilds",     iconEmoji: "🐉", tags: ["アクション", "協力", "狩りゲー"] },
  { name: "ゼルダの伝説 TotK",      slug: "zelda-totk",      iconEmoji: "🗡️", tags: ["アクション", "RPG", "任天堂"] },
  { name: "エルデンリング",         slug: "elden-ring",      iconEmoji: "💀", tags: ["RPG", "アクション", "高難易度"] },
  { name: "ブルーアーカイブ",       slug: "bluearchive",     iconEmoji: "📚", tags: ["RPG", "学園", "ガチャ"] },
  { name: "ウマ娘",                 slug: "umamusume",       iconEmoji: "🐴", tags: ["育成", "レース", "ガチャ"] },
  { name: "FGO",                    slug: "fgo",             iconEmoji: "🏹", tags: ["RPG", "ガチャ", "ストーリー"] },

  // ─── スポーツ・レース ───
  { name: "FIFA 25",                slug: "fifa25",          iconEmoji: "⚽", tags: ["スポーツ", "サッカー", "マルチ"] },
  { name: "マリオカート8DX",        slug: "mk8dx",           iconEmoji: "🏎️", tags: ["レース", "マルチ", "任天堂"] },
  { name: "NBA 2K25",               slug: "nba2k25",         iconEmoji: "🏀", tags: ["スポーツ", "バスケ", "マルチ"] },

  // ─── 生活・のんびり ───
  { name: "あつまれ どうぶつの森",  slug: "acnh",            iconEmoji: "🌿", tags: ["生活", "のんびり", "任天堂"] },
  { name: "Stardew Valley",         slug: "stardew",         iconEmoji: "🌾", tags: ["農業", "のんびり", "RPG"] },
  { name: "星のカービィ",           slug: "kirby",           iconEmoji: "⭐", tags: ["アクション", "のんびり", "任天堂"] },

  // ─── 音楽・リズム ───
  { name: "プロジェクトセカイ",     slug: "proseka",         iconEmoji: "🎵", tags: ["音楽", "リズム", "ガチャ"] },
  { name: "太鼓の達人",             slug: "taiko",           iconEmoji: "🥁", tags: ["音楽", "リズム"] },
  { name: "CHUNITHM",               slug: "chunithm",        iconEmoji: "🎶", tags: ["音楽", "リズム", "アーケード"] },

  // ─── MOBA・対戦 ───
  { name: "リーグ・オブ・レジェンド", slug: "lol",           iconEmoji: "🏆", tags: ["MOBA", "チーム", "対戦"] },
  { name: "スマブラSP",             slug: "smash",           iconEmoji: "👊", tags: ["格闘", "対戦", "任天堂"] },
  { name: "ハースストーン",         slug: "hearthstone",     iconEmoji: "🃏", tags: ["カード", "対戦", "ストラテジー"] },
] as const;

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL が設定されていません");
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = drizzle(neon(url) as any);

  console.log(`🌱 ${GAMES.length}タイトルのゲームデータをシードします...`);

  let inserted = 0;
  let skipped = 0;

  for (const game of GAMES) {
    try {
      await db
        .insert(games)
        .values({
          name: game.name,
          slug: game.slug,
          iconEmoji: game.iconEmoji,
          tags: [...game.tags],
          isActive: true,
          playerCount: 0,
        })
        .onConflictDoNothing(); // slug重複はスキップ
      inserted++;
      console.log(`  ✅ ${game.name}`);
    } catch {
      skipped++;
      console.log(`  ⏭️  ${game.name} (スキップ)`);
    }
  }

  console.log(`\n🎉 完了: ${inserted}件追加, ${skipped}件スキップ`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ シードエラー:", err);
  process.exit(1);
});
