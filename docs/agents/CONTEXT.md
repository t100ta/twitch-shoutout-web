# Project Context

## 構成

Twitch Raidへのチャット投稿・Shoutoutは、隣の `awt-cephalon` にあるFirebase Functions第2世代で実行する。フロントはReact 19 / Vite / TypeScript / Zustand / TanStack Query / Firebase Auth・Firestore・Functions。IRC、tmi.js、ブラウザからのHelix/token validationは廃止した。

Firebaseプロジェクトは `shoutout-web-c8caa`、Firebase UID = Twitch User ID。既存 `/settings/{uid}` は移動しない。設定5フィールドを保持し、任意の `automationEnabled`（未存在true）を追加。停止・再開はHomeから行い、ログアウト・ブラウザ終了では自動処理を停止しない。投稿先とRaid監視先は同じ（未設定なら本人）、投稿者はOAuth連携ユーザー。

## 重要ファイル

- `src/components/Home.tsx`: 自動処理ON/OFF、連携状態と直近結果、再連携・再試行。
- `src/components/Login.tsx`, `src/utils/index.ts`: auth_code交換、Firebase Custom Token認証、tokenなしclaims復元。旧 `twitch_access_token` claimがあればsignOutして再連携。
- `src/components/shared/AuthGuard.tsx`: ユーザー切替時に状態・Queryキャッシュをクリア。
- `src/components/edit/Edit.tsx`: 初回設定取得を待ってフォーム作成、保存完了後のみ遷移。
- `src/components/edit/TargetChannelFinder.tsx`: callable `lookupTwitchUser`。未解決のチャンネルIDを保存しない。検索応答はログインユーザー/入力世代を照合。
- `src/hooks/useLiveDocument.ts`: UIDごとのFirestore購読。Homeはsettingsとtwitch_connectionsを読む。
- `src/hooks/useMutateSettings.ts`: merge保存。既存設定を消さない。
- `src/firebase.ts`: localhostはAuth 9099 / Functions 5001 / Firestore 8080。

## 認証・バックエンド

`/authWithTwitch` → state cookie → `/callback` → credential保存 → 60秒一度限りauth_code → `/exchange` → `signInWithCustomToken`。BotUserにaccessTokenを追加しない。OAuth scopeは `user:write:chat moderator:manage:shoutouts`。SecretはバックエンドSecret Managerへ置き、VITE変数に入れない。

バックエンドはApp Access Tokenで共有 `channel.raid` v1 subscriptionを同期し、HMAC検証後の通知を受信記録・ジョブとして原子的に保存する。ジョブ取得後は重複実行を避け、外部投稿結果が不明なときは再送しない。User Access Token refreshは401後のみ・API再実行1回まで。毎時検証と再認可競合をFirestore lease/世代で制御する。

Rulesは本人settingsの読み書き、本人twitch_connectionsの読み取りのみ許可。credential/eventsub/messages/jobs/auth_codesはserver-only。詳しいschema、TTL、Secret、公開Webhook、移行手順はバックエンドREADME。

## 開発・検証

miseのNode 24.13.1とpnpm 10.11.0を維持する。環境変数は `VITE_FIREBASE_*`, `VITE_AUTH_API_URI`, `VITE_APP_URI`。`VITE_TWITCH_CLIENT_ID` は不要。

`mise run test` / `mise run lint` / `mise run build`。VitestはNode環境が既定、画面テストはjsdom + Testing Library。Firebaseの初期化と外部APIはmockする。バックエンドは別途test/lint/buildとJava 21のRules Emulatorテストを行う。CIから実Twitch APIを呼ばない。

セキュリティ対応はDependabot Alertsを確認してから対応。PR本文/コメントは日本語を基本にする。
