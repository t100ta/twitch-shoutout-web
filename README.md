# Twitch Shoutout Web

設定したチャンネルへのRaidを検知し、OAuthで連携したユーザーとしてチャット投稿・任意のShoutoutを実行します。処理はFirebaseバックエンドで継続し、ブラウザを閉じてもログアウトしても止まりません。停止にはHomeの「自動処理を有効にする」をOFFにします。

## 画面と構成

- `/`: Twitch OAuthログイン。60秒有効の一度限りの `auth_code` をバックエンド `/exchange` で交換し、Firebase `signInWithCustomToken` を実行。
- `/home`: 稼働中・停止中・設定反映中・接続エラー・再連携必要を表示。全体ON/OFF、Twitch再連携、接続再試行、直近の投稿結果。
- `/edit`: 投稿先、テンプレート、Shoutoutスイッチ。保存完了後に遷移し、保存失敗時には編集内容を保持。

React 19、TypeScript、Vite、Zustand、TanStack Query、Firebase Auth/Firestore/Functionsを利用します。ブラウザにTwitch tokenを保持せず、Helix・IRC・token validationを直接呼びません。旧token claimを持つセッションはログアウトし、再連携を案内します。検索は認証済みcallable `lookupTwitchUser({ login })`、接続修復は `retryTwitchConnection()` を使います。検索結果・設定キャッシュはユーザー間で引き継ぎません。

Firebaseプロジェクト `shoutout-web-c8caa`、UID = Twitch User ID、`settings/{uid}` の対応は維持します。既存の5設定フィールドに `automationEnabled` を追加し、未存在はtrueです。設定はマージ保存し、既存データを初期化しません。投稿先未設定は本人のチャンネルです。連携状態は本人の `twitch_connections/{uid}` を購読します。

バックエンドのコード・Rules・OAuth/EventSubフロー・collections・Secret設定・deploy/migrationの詳細は、隣の [awt-cephalon README](../awt-cephalon/README.md) を参照してください。

## 開発

既存のmise、Node 24.13.1、pnpm 10.11.0を使用します。

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
mise run dev
mise run test
mise run lint
mise run build
```

環境変数（`.env.local` など）:

```dotenv
VITE_APP_URI=http://localhost:5000
VITE_AUTH_API_URI=http://localhost:5001/shoutout-web-c8caa/us-central1/authWithTwitch
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=shoutout-web-c8caa
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

本番では既存のアプリURL・認証API URLを使います。`VITE_TWITCH_CLIENT_ID` は不要になりました。Client SecretやEventSub Secretを `VITE_*` に設定しないでください。

バックエンド側でAuth/Functions/Firestore Emulatorを起動し、フロントは `mise run serve:dev` でHosting Emulatorを起動できます。localhostではAuth 9099、Functions 5001、Firestore 8080へ接続します。両側のproject IDを一致させてください。Viteで別ポートを使う場合はバックエンドの `APP_URI_LOCAL` を合わせます。

## テンプレート

| 変数 | 内容 |
|---|---|
| `$displayname` / `$displayName` | Raid元の表示名 |
| `$loginname` / `$loginName` | Raid元のlogin |
| `$category` / `$game` | カテゴリ |
| `$title` | 配信タイトル |

編集画面のプレビューは維持しています。実投稿では値を文字列として安全に挿入し、展開後500文字を超えた場合は末尾を省略して1投稿にします。category/title取得に失敗したときは空文字で投稿を続けます。

OAuthのscopeは `user:write:chat` と `moderator:manage:shoutouts`。ShoutoutスイッチON時のみ、チャット処理の3秒後にShoutoutを実行します。他チャンネルでのShoutoutは投稿アカウントにモデレーター権限が必要です。配信条件やcooldownによるskipと投稿拒否を状態に反映します。[Twitch Chat API](https://dev.twitch.tv/docs/api/reference/#send-chat-message)、[Shoutout API](https://dev.twitch.tv/docs/api/reference/#send-a-shoutout)


具体的な初回移行・通常更新のコマンドは、バックエンドの [デプロイ手順](../awt-cephalon/docs/DEPLOY.md) を参照してください。

## テスト・移行

Vitestでtokenなしの認証復元、旧セッションの再連携、状態表示、停止・再開、検索API、設定保存成功/失敗を検証します。Firebase/Twitchはmockし、CIから実Twitch APIを呼びません。CIではtest・lint・buildを実行します。Rules Emulatorテストはバックエンド側で実行します。

移行順は「既存設定バックアップ → 旧ブラウザ処理停止 → Rules/TTL → Functions → Hosting → 旧認可・セッション整理 → 新scopeで再連携 → ブラウザを閉じた実動確認」です。既存設定のデータ移動は不要です。旧ユーザーは再連携するまで自動投稿されません。

外部APIの成功直後に障害が起きた場合は結果不明となり、自動再送しません。停止直前に開始したAPIは取り消せません。複数タブでもバックエンドのジョブ単位で重複を防ぐため、旧複数タブ警告は削除しました。

開発者向け構成は [docs/agents/CONTEXT.md](docs/agents/CONTEXT.md)、作業指示は [AGENTS.md](AGENTS.md) を参照してください。セキュリティ対応ではDependabot Alertsを確認し、PR本文・コメントは日本語を基本にします。
