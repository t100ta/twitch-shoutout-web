import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { Header } from "./shared/Header";
import useStore from "../store";
import { functions } from "../firebase";
import { AUTH_API_URI } from "../constants";
import { useLiveDocument } from "../hooks/useLiveDocument";
import { useMutateSettings } from "../hooks/useMutateSettings";
import { TwitchConnection, UserSettings } from "../types";
import { replaceText } from "../utils";
import { connectionLabel, resultLabel } from "../utils/connection";
export const Home = () => {
  const user = useStore((s) => s.botUser);
  const settings = useLiveDocument<UserSettings>("settings", user?.id);
  const connection = useLiveDocument<TwitchConnection>("twitch_connections", user?.id);
  const mutation = useMutateSettings();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  if (!user) return null;
  const s = settings.data;
  const toggle = async () => {
    setError("");
    try { await mutation.mutateAsync({ twitchId: user.id, data: { automationEnabled: s?.automationEnabled === false } }); }
    catch { setError("保存に失敗しました。再度お試しください。"); }
  };
  const retry = async () => {
    setRetrying(true); setError("");
    try { await httpsCallable(functions, "retryTwitchConnection")(); }
    catch { setError("接続に失敗しました。しばらくして再試行してください。"); }
    finally { setRetrying(false); }
  };
  return <>
    <Header />
    <h1>Twitch Shoutout Web</h1>
    <p>ようこそ {user.displayName} さん</p>
    <p role="status">{settings.loading || connection.loading ? "読み込み中" : settings.error || connection.error ? "接続エラー" : connectionLabel(connection.data, s, user.id)}</p>
    {connection.data?.status === "error" && connection.data.errorCode ? <p role="alert">接続エラーコード: {connection.data.errorCode}</p> : null}
    {connection.data?.status === "error" && connection.data.errorDetail ? <p role="alert">Twitchの応答: {connection.data.errorDetail}</p> : null}
    <p>自動処理はブラウザを閉じても、ログアウトしても続きます。停止するにはスイッチをOFFにしてください。</p>
    <label><input type="checkbox" checked={s?.automationEnabled !== false} disabled={mutation.isPending || settings.loading || settings.error}
      onChange={() => void toggle()} />自動処理を有効にする</label>
    <p><button onClick={() => { window.location.href = `${AUTH_API_URI}/authWithTwitch`; }}>Twitchと再連携</button>{" "}
      <button disabled={retrying} onClick={() => void retry()}>接続を再試行</button></p>
    {error && <p role="alert">{error}</p>}
    <p>投稿先・Raid監視先: {s?.targetChannelDisplayName || user.displayName} ({s?.targetChannelLoginName || user.loginName})</p>
    <p>投稿アカウント: {user.displayName}</p>
    <p>Shoutoutメッセージ: {replaceText(s?.shoutoutMessage || "")}</p>
    <p>/shoutoutを自動実行: {s?.isShoutoutCommandExecute ? "する" : "しない"}</p>
    {connection.data?.lastResult && <p>直近の処理: {connection.data.lastResult.status === "unknown" ? "結果不明（自動再送しません）" :
      `チャット: ${resultLabel(connection.data.lastResult.chatResult)} / Shoutout: ${resultLabel(connection.data.lastResult.shoutoutResult)}`}</p>}
    <button onClick={() => navigate("/edit")}>編集する</button>
  </>;
};
