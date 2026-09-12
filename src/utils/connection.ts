import { TwitchConnection, UserSettings } from "../types";
export function connectionLabel(connection: TwitchConnection | null, settings: Partial<UserSettings> | null, uid: string) {
  if (!connection || connection.status === "reconnect_required") return "Twitchとの再連携が必要";
  if (settings?.automationEnabled === false) return "停止中";
  if (connection.status === "error") return "接続エラー";
  if (connection.status === "syncing" || connection.targetId !== (settings?.targetChannelId || uid)) return "設定反映中";
  return "稼働中";
}
export function resultLabel(result?: string) {
  const labels: Record<string, string> = { sent: "送信成功", dropped: "投稿拒否", unknown: "結果不明",
    skipped_disabled: "無効", skipped_empty: "本文なし", skipped_cooldown: "クールダウン中", skipped_condition: "配信条件未成立",
    skipped_settings: "設定により停止", permission_denied: "権限不足", unauthorized: "認証エラー", rate_limited: "投稿制限",
    reconnect_required: "再連携が必要", api_rejected: "APIが拒否", not_started: "未実行" };
  return result ? labels[result] || "処理エラー" : "未実行";
}
