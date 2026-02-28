# TENKU-GAME

未成年向け安全ゲーム交流プラットフォーム（雛形 v0.1）

## 概要

仕様書 v1.0 に基づき構築した Next.js 14 の雛形です。

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes（一体型） |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | JWT (jose) + bcryptjs |
| Deploy | Vercel |

## セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数
cp .env.example .env.local
# DATABASE_URL, JWT_SECRET を設定

# 3. DBスキーマ適用
npm run db:push

# 4. 開発サーバー
npm run dev
```

## ディレクトリ構造

```
src/
├── app/
│   ├── page.tsx                     ← ランディング
│   ├── (auth)/
│   │   ├── login/                   ← ログイン
│   │   └── register/                ← 3ステップ登録
│   ├── (app)/                       ← 認証必須
│   │   ├── rooms/                   ← ルーム一覧・個別
│   │   ├── dm/                      ← DMリスト
│   │   ├── notifications/           ← 通知
│   │   └── profile/                 ← プロフィール
│   └── api/
│       ├── auth/{login,logout,register}/
│       ├── invite-codes/verify/
│       ├── rooms/
│       └── reports/
├── components/
│   ├── layout/BottomNav.tsx
│   └── rooms/ReportModal.tsx
├── lib/
│   ├── db/{index,schema}.ts
│   ├── auth/index.ts
│   └── utils/index.ts
└── types/index.ts
```

## 実装済み（雛形）

- [x] ランディングページ
- [x] 招待コード認証 → プロフィール設定 → ゲーム選択（3ステップ登録）
- [x] JWT セッション管理
- [x] DBスキーマ（仕様書§5.1 全エンティティ）
- [x] ルーム一覧・個別ルーム（モックデータ）
- [x] DMリスト（モックデータ）
- [x] プロフィール + トラストスコア進捗
- [x] ワンタップ通報モーダル
- [x] コンテンツフィルタ（L1: リンク・電話・連絡先ブロック）
- [x] ボトムナビ

## 次フェーズで実装予定

- [ ] ルーム投稿をDB接続（GET/POST）
- [ ] フォロー / 相互フォロー
- [ ] DM チャンネル作成・メッセージ送受信（AES-256-GCM）
- [ ] トラストスコア自動計算ジョブ
- [ ] AI モデレーション（Python FastAPI 連携）
- [ ] 保護者ダッシュボード
- [ ] 管理者バックオフィス
- [ ] プッシュ通知（FCM）

## 環境変数

| 変数 | 内容 |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL 接続 URL |
| `JWT_SECRET` | JWT 署名シークレット（32 文字以上推奨） |
| `NEXT_PUBLIC_APP_URL` | アプリ公開 URL |

---

© 2026 TENKU GAMES 株式会社
