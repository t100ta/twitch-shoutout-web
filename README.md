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

- mise
- Node.js 24 LTS（`24.13.1` 固定）
- pnpm（`10.11.0`、`mise` で管理）
- Firebase CLI（グローバル導入）

## WSL2 Ubuntu: Volta -> mise migration

### Background

- 2025-11-14 に Volta 公式で「Volta はメンテナンスされておらず、`mise` への移行を推奨」と案内されています。
- 参照: https://github.com/volta-cli/volta/issues/2080

1. Volta を無効化/削除
   - `volta uninstall node yarn`
   - `volta setup --quiet` を実行済みなら、`~/.bashrc` や `~/.zshrc` の Volta 初期化行（`VOLTA_HOME` / `PATH`）を削除
2. mise をインストール
   - `curl https://mise.run | sh`
   - `echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc`
   - `exec "$SHELL"`
3. プロジェクトでツールを適用
   - `mise trust`
   - `mise install`
4. 確認
   - `node -v` が `v24.13.1`
   - `pnpm -v` が `10.11.0`

### Migrate global tools (optional)

Volta のグローバルパッケージは自動移行されないため、必要なものだけ `mise` 管理の Node 環境で再インストールします。

1. Volta 側の一覧を確認
   - `volta list all`
2. 必要な CLI を `mise` 有効状態で再インストール
   - `eval "$(~/.local/bin/mise activate bash)"`
   - `npm install -g @openai/codex firebase-tools`
3. 参照先が `mise` 側になっているか確認
   - `which codex firebase`
4. `codex` 利用中の注意
   - 会話履歴は `~/.codex/history.jsonl` と `~/.codex/state_5.sqlite` に保存されるため、インストール元（Volta/mise）を変えても履歴は維持される
   - ただし安全のため、先に `mise` 側で `@openai/codex` を導入し、`which codex` で参照先を確認してから Volta 側を外す

## Setup

1. 依存関係のインストール
   - `mise trust`
   - `mise install`
   - `pnpm install`
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

- `mise run dev`  
  Vite 開発サーバ

- `mise run serve:dev`  
  `build:dev` → Firebase Hosting Emulator

## Testing

- `mise run test`  
  Vitest で単体テスト

- `mise run test:coverage`  
  カバレッジ計測

## Workflow

- セキュリティ対応は Dependabot Alerts を確認してから対応
- PR本文/コメントは日本語を基本にする

## Build

- `mise run build`

## Deploy

- `mise run deploy`  
  Firebase Hosting へデプロイ

## Project Docs

- Agent 向け前提: `docs/agents/CONTEXT.md`
- Agent ガイド: `AGENTS.md`

## Notes

- Raid 検知は tmi.js の `usernotice` を利用しています。
- テストでは Firebase 初期化のモックが必要です。
- `/shoutout` の自動実行は Twitch API の Shoutout エンドポイントを使用します（`moderator:manage:shoutouts` スコープが必要）。
- Shoutout は「配信中かつ視聴者がいる」「自分自身には送れない」「レート制限あり」などの制約があります。
- 認証失敗時は `auth_error` が付与されるため、ログイン画面でメッセージ表示します。

## Shoutout Message Placeholders

以下のプレースホルダを `Shoutoutメッセージ` で利用できます。

- `$displayname` / `$displayName`: 表示名
- `$loginname` / `$loginName`: ログイン名
- `$category` / `$game`: カテゴリ名
- `$title`: 配信タイトル
