import { useCallback, useEffect, useRef, useState } from "react";
import { ChatUserstate, Client } from "tmi.js";
import { useMutateValidation } from "./useMutateValidation";
import { getRaidInfo, shouldReuseClient } from "../utils/raidUtils";

type Params = {
  accessToken: string;
  targetLoginName: string;
  botUserDisplayName?: string;
  onTokenInvalid: () => void;
};

export const useRaidListener = ({
  accessToken,
  targetLoginName,
  botUserDisplayName,
  onTokenInvalid,
}: Params) => {
  const validate = useMutateValidation();
  const clientRef = useRef<Client | null>(null);
  const currentChannelRef = useRef<string | null>(null);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [raiderLoginName, setRaiderLoginName] = useState("");

  const handleConnected = useCallback((address: string, port: number) => {
    console.log(`Connected! : ${address}:${port}`);
  }, []);
  const handleDisconnected = useCallback((reason: string) => {
    console.log("Disconnected from Twitch chat:", reason);
  }, []);
  const handleUserNotice = useCallback(
    (channel: string, tags: ChatUserstate) => {
      const raidInfo = getRaidInfo(channel, tags);
      if (!raidInfo) {
        return;
      }
      console.log(
        `Detected "raided"\nchannel: ${raidInfo.channel}\nusername: ${raidInfo.displayName}\nloginName: ${raidInfo.login}`
      );
      setRaiderLoginName(raidInfo.login);
    },
    []
  );

  useEffect(() => {
    if (isTokenInvalid) {
      return;
    }
    if (!targetLoginName) {
      return;
    }
    if (
      clientRef.current &&
      shouldReuseClient(
        clientRef.current.readyState(),
        currentChannelRef.current,
        targetLoginName
      )
    ) {
      return;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      currentChannelRef.current = null;
    }
    validate.mutate(accessToken, {
      onError: () => {
        setIsTokenInvalid(true);
        onTokenInvalid();
      },
    });
    clientRef.current = new Client({
      connection: {
        reconnect: true,
        secure: true,
      },
      identity: {
        username: botUserDisplayName,
        password: `${accessToken}`,
      },
      channels: [targetLoginName],
      options: { skipUpdatingEmotesets: true },
    });
    const client = clientRef.current;
    currentChannelRef.current = targetLoginName;
    client.connect().catch(console.error);
    // タグ（msg-param-*, display-name など）を IRC で有効化
    client.on("connected", (address, port) => {
      client.raw(
        "CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership"
      );
      handleConnected(address, port);
    });

    client.on("disconnected", handleDisconnected);
    client.on("usernotice", handleUserNotice);

    return () => {
      if (client.readyState() === "OPEN") {
        client.disconnect();
      }
      clientRef.current = null;
    };
  }, [
    accessToken,
    targetLoginName,
    botUserDisplayName,
    validate,
    isTokenInvalid,
    onTokenInvalid,
    handleConnected,
    handleDisconnected,
    handleUserNotice,
  ]);

  return { clientRef, raiderLoginName, isTokenInvalid };
};
