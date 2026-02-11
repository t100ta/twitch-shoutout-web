# Twitch Shoutout Web

Twitch の Raid 検知に反応して、対象チャンネルへメッセージ投稿＆任意で `/shoutout` 実行を行う Web アプリです。

## Features

- Twitch アカウント連携（Firebase Custom Token）
- Raid 検知（tmi.js / chat の USERNOTICE）
- シャウトアウト用メッセージ投稿
- 任意で `/shoutout` を自動実行
- ユーザーごとの設定保存（Firestore）

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand（状態管理）
- TanStack Query（データ取得）
- Firebase Auth + Firestore
- tmi.js + Twitch Helix API

## Requirements

- Node.js 24 LTS（Volta で `24.13.1` 固定）
- Yarn 4.5.3

## Setup

1. 依存関係のインストール
   - `yarn install`
2. 環境変数の設定（`.env.local` など）

### Environment Variables

```
VITE_APP_URI=
VITE_AUTH_API_URI=
VITE_TWITCH_CLIENT_ID=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Development

- `yarn dev`  
  Vite 開発サーバ

- `yarn serve:dev`  
  `build:dev` → Firebase Hosting Emulator

## Testing

- `yarn test`  
  Vitest で単体テスト

- `yarn test:coverage`  
  カバレッジ計測

## Workflow

- セキュリティ対応は Dependabot Alerts を確認してから対応
- PR本文/コメントは日本語を基本にする

## Build

- `yarn build`

## Deploy

- `yarn deploy`  
  Firebase Hosting へデプロイ

## Project Docs

- Agent 向け前提: `docs/agents/CONTEXT.md`
- Agent ガイド: `AGENTS.md`

## Notes

- Raid 検知は tmi.js の `usernotice` を利用しています。
- テストでは Firebase 初期化のモックが必要です。
- `/shoutout` の自動実行は Twitch API の Shoutout エンドポイントを使用します（`moderator:manage:shoutouts` スコープが必要）。
- Shoutout は「配信中かつ視聴者がいる」「自分自身には送れない」「レート制限あり」などの制約があります。

## Shoutout Message Placeholders

以下のプレースホルダを `Shoutoutメッセージ` で利用できます。

- `$displayname` / `$displayName`: 表示名
- `$loginname` / `$loginName`: ログイン名
- `$category` / `$game`: カテゴリ名
- `$title`: 配信タイトル
