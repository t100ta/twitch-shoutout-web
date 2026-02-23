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
    let isDisposed = false;

    const setupClient = async () => {
      if (isTokenInvalid) {
        return;
      }
      if (!accessToken || !targetLoginName || !botUserDisplayName) {
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

      try {
        await validate.mutateAsync(accessToken);
      } catch (error) {
        console.error("Twitch token validation failed:", error);
        if (!isDisposed) {
          setIsTokenInvalid(true);
          onTokenInvalid();
        }
        return;
      }

      if (isDisposed) {
        return;
      }

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
    };

    setupClient();

    return () => {
      isDisposed = true;
      if (clientRef.current?.readyState() === "OPEN") {
        clientRef.current.disconnect();
      }
      clientRef.current = null;
      currentChannelRef.current = null;
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
