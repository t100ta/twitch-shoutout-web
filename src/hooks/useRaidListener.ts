import { useCallback, useEffect, useRef, useState } from "react";
import { ChatUserstate, Client } from "tmi.js";
import { TOKEN_INVALID_ERROR, useMutateValidation } from "./useMutateValidation";
import { getRaidInfo, shouldReuseClient, toIrcPassword } from "../utils/raidUtils";

type Params = {
  accessToken: string;
  targetLoginName: string;
  botUserLoginName?: string;
  onTokenInvalid: () => void;
};

export const useRaidListener = ({
  accessToken,
  targetLoginName,
  botUserLoginName,
  onTokenInvalid,
}: Params) => {
  const { mutateAsync: validateToken } = useMutateValidation();
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
      if (!accessToken || !targetLoginName || !botUserLoginName) {
        console.warn(
          "Skip Twitch chat connection because required credentials are missing.",
          {
            hasAccessToken: Boolean(accessToken),
            hasTargetLoginName: Boolean(targetLoginName),
            hasBotUserLoginName: Boolean(botUserLoginName),
          }
        );
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
        await validateToken(accessToken);
      } catch (error) {
        console.error("Twitch token validation failed:", error);
        if (
          !isDisposed &&
          error instanceof Error &&
          error.message === TOKEN_INVALID_ERROR
        ) {
          setIsTokenInvalid(true);
          onTokenInvalid();
          return;
        }
        console.warn(
          "Skip forced logout because validation failed for a non-auth reason."
        );
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
          username: botUserLoginName.toLowerCase(),
          password: toIrcPassword(accessToken),
        },
        channels: [targetLoginName],
        options: { skipUpdatingEmotesets: true },
      });
      const client = clientRef.current;
      currentChannelRef.current = targetLoginName;
      client
        .connect()
        .catch((error) =>
          console.error("Failed to connect Twitch chat client:", error)
        );
      // タグ（msg-param-*, display-name など）を IRC で有効化
      client.on("connected", (address, port) => {
        client.raw(
          "CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership"
        );
        handleConnected(address, port);
      });

      client.on("disconnected", handleDisconnected);
      client.on("notice", (_channel, msgid, message) => {
        console.warn("Twitch notice:", { msgid, message });
      });
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
    botUserLoginName,
    validateToken,
    isTokenInvalid,
    onTokenInvalid,
    handleConnected,
    handleDisconnected,
    handleUserNotice,
  ]);

  return { clientRef, raiderLoginName, isTokenInvalid };
};
