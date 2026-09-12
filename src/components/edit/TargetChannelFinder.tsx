import { useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { TwitchUser } from "../../types";
import useStore from "../../store";
type Props = {
  channelLoginName: string;
  channelDisplayName: string;
  setChannelLoginName: (value: string) => void;
  setChannelDisplayName: (value: string) => void;
  setId: (value: string) => void;
};
export const TargetChannelFinder = ({ channelLoginName, channelDisplayName, setChannelLoginName, setChannelDisplayName, setId }: Props) => {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const revision = useRef(0);
  const check = async () => {
    const login = channelLoginName.trim();
    if (!login) return;
    const version = ++revision.current;
    const uid = useStore.getState().botUser?.id;
    setPending(true); setError("");
    try {
      const result = await httpsCallable<{ login: string }, TwitchUser | null>(functions, "lookupTwitchUser")({ login });
      if (version !== revision.current || uid !== useStore.getState().botUser?.id) return;
      if (!result.data) { setError("チャンネルが見つかりませんでした。"); setId(""); setChannelDisplayName(""); return; }
      setId(result.data.id); setChannelLoginName(result.data.login); setChannelDisplayName(result.data.display_name);
    } catch { if (version === revision.current) setError("検索に失敗しました。再度お試しください。"); }
    finally { if (version === revision.current) setPending(false); }
  };
  return <>
    <h2>投稿先チャンネル</h2>
    <p>空欄の場合は自分のチャンネルを監視・投稿先にします。</p>
    <input placeholder="TwitchのログインID" value={channelLoginName} onBlur={() => void check()}
      onChange={(event) => { revision.current++; setPending(false); setId(""); setChannelDisplayName(""); setChannelLoginName(event.target.value); setError(""); }} />
    <button type="button" disabled={pending} onClick={() => void check()}>検索</button>
    <p>{pending ? "検索中" : channelDisplayName}</p>
    {error && <p role="alert">{error}</p>}
  </>;
};
