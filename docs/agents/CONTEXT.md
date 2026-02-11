# Project Context

## Overview

Twitch の Raid 検知に反応して、対象チャンネルへメッセージ投稿＆任意で `/shoutout` 実行を行う Web アプリ。
フロントは Vite + React + TypeScript、認証と設定保存は Firebase（Auth + Firestore）。

## Core Features

- Twitch アカウント連携（Custom Token を使った Firebase Auth）
- Raid 検知（tmi.js / chat の USERNOTICE）
- シャウトアウト用メッセージ投稿
- 任意で `/shoutout` コマンドを自動実行
- ユーザーごとの設定保存（Firestore）

## Architecture

- **UI**: React 18, React Router
- **State**: Zustand
- **Data**: TanStack Query
- **Auth/DB**: Firebase Auth + Firestore
- **Twitch**: tmi.js + Twitch Helix API

## Key Routes

- `/` ログイン
- `/home` メイン画面
- `/edit` 設定編集

## Important Files

- `src/App.tsx`: ルーティング定義
- `src/components/Home.tsx`: Raid 検知・チャット投稿・/shoutout 実行
- `src/components/Login.tsx`: Twitch 連携
- `src/components/edit/Edit.tsx`: 設定編集
- `src/hooks/*`: API/Firestore の読み書き
- `src/store/index.ts`: Zustand ストア（トークン/ユーザー）
- `src/utils/index.ts`: 文字列置換、認証処理
- `src/firebase.ts`: Firebase 初期化

## Tokens / Env

`VITE_*` に Firebase と Twitch の設定が必要。

- `VITE_FIREBASE_*`
- `VITE_TWITCH_CLIENT_ID`
- `VITE_AUTH_API_URI`
- `VITE_APP_URI`

## Test Setup

- `vitest` で単体テスト
- `yarn test` / `yarn test:coverage`

## Workflow Notes

- セキュリティ対応は Dependabot Alerts を確認してから対応する
- PR本文/コメントは日本語を基本にする

## Recent Changes

- Security 対応: `vite`, `axios`, `tar`, `fast-xml-parser`, `form-data` などを更新
- Node LTS を `24.13.1` に更新（Volta）
- ビジネスロジック中心の単体テスト追加（utils/store/hooks）

## Notes

- `tmi.js` の raid 検知は `usernotice` 経由で実装
- Firebase/Auth の初期化はテストではモック必須
- `/shoutout` 自動実行は Twitch API の Shoutout エンドポイントを使用（`moderator:manage:shoutouts` が必要）
- 認証失敗時は `auth_error` クエリが付与されるため、ログイン画面でメッセージ表示
