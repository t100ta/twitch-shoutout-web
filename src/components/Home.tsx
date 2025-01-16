import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "tmi.js";
import { useQueryClient } from "@tanstack/react-query";
import useStore from "../store";
import { replaceText, wait } from "../utils";
import { Channel, User } from "../types";
import { Header } from "./shared/Header";
import { useQueryUsers } from "../hooks/useQueryUsers";
import { useQueryChannels } from "../hooks/useQueryChannels";
import { useMutateShoutout } from "../hooks/useMutateShoutout";
import { useQuerySettings } from "../hooks/useQuerySettings";
import { useMutateValidation } from "../hooks/useMutateValidation";

// TODO tokenリフレッシュ入れたほうがいいかも https://dev.twitch.tv/docs/authentication/refresh-tokens/
export const Home = () => {
  const navigate = useNavigate();
  const { botUser } = useStore();
  const ACCESS_TOKEN = botUser?.accessToken as string;
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);
  const [targetDisplayName, setTargetDisplayName] = useState("");
  const [targetLoginName, setTargetLoginName] = useState("");
  const [targetId, setTargetId] = useState("");
  const [shoutoutMessage, setShoutoutMessage] = useState("");
  const [isShoutoutCommandExecute, setIsShoutoutCommandExecute] =
    useState(false);
  const [raiderLoginName, setRaiderLoginName] = useState("");
  const [shoutoutData, setShoutoutData] = useState<{
    users: User[];
    channels: Channel[];
  } | null>(null);
  const { data: raiderUsersData } = useQueryUsers(
    ACCESS_TOKEN,
    raiderLoginName
  );
  const raiderId = raiderUsersData ? raiderUsersData[0].id : null;
  const { data: raiderChannelsData } = useQueryChannels(
    ACCESS_TOKEN,
    raiderId as string
  );
  const {
    data: userSettings,
    isLoading: isUserSettingsLoading,
    isError: isUserSettingsError,
    isSuccess: isUserSettingsSuccess,
  } = useQuerySettings(botUser?.id as string);

  const validate = useMutateValidation();
  const shoutoutCommandExecute = useMutateShoutout();

  const handleConnected = useCallback((address: string, port: number) => {
    console.log(`Connected! : ${address}:${port}`);
  }, []);
  const handleDisconnected = useCallback((reason: any) => {
    console.log("Disconnected from Twitch chat:", reason);
  }, []);
  const handleRaided = useCallback(
    (channel: string, username: string, viewers: number, loginName: string) => {
      console.log(
        `Detected "raided"\nchannel: ${channel}\nusername: ${username}\nviewer: ${viewers}\nloginName: ${loginName}`
      );
      setRaiderLoginName(loginName);
    },
    []
  );

  useEffect(() => {
    if (
      !targetLoginName ||
      (clientRef.current && clientRef.current.readyState() === "OPEN")
    ) {
      return;
    }
    // TODO エラー時に再ログインを促す処理が欲しい
    validate.mutate(ACCESS_TOKEN);
    clientRef.current = new Client({
      connection: {
        reconnect: true,
        secure: true,
      },
      identity: {
        username: botUser?.displayName,
        password: `${ACCESS_TOKEN}`,
      },
      channels: [targetLoginName],
      options: { skipUpdatingEmotesets: true },
    });
    const client = clientRef.current;
    client.connect().catch(console.error);
    client.on("connected", handleConnected);
    client.on("disconnected", handleDisconnected);
    client.on("raided", handleRaided);

    return () => {
      if (client.readyState() === "OPEN") {
        client.disconnect();
      }
      clientRef.current = null;
    };
  }, [
    botUser,
    ACCESS_TOKEN,
    targetLoginName,
    handleConnected,
    handleDisconnected,
    handleRaided,
  ]);

  useEffect(() => {
    if (raiderUsersData && raiderChannelsData) {
      setShoutoutData({ users: raiderUsersData, channels: raiderChannelsData });
    }
  }, [raiderUsersData, raiderChannelsData]);

  useEffect(() => {
    if (!shoutoutData || !clientRef.current) {
      return;
    }
    const { users, channels } = shoutoutData;
    const user = users[0];
    const channel = channels[0];
    queryClient.invalidateQueries({
      queryKey: ["channel", user.id],
    });

    clientRef.current?.say(
      targetLoginName as string,
      replaceText(shoutoutMessage as string, {
        displayName: channel.broadcaster_name,
        name: channel.broadcaster,
        game: channel.game_name,
        title: channel.title,
      })
    );

    if (isShoutoutCommandExecute) {
      const executeShoutout = async () => {
        try {
          await wait(3 * 1000);
          const result = await shoutoutCommandExecute.mutateAsync({
            token: ACCESS_TOKEN,
            fromBroadcasterId: targetId,
            toBroadcasterId: channel.broadcaster_id,
            moderatorId: botUser?.id as string,
          });
          console.log("Shoutout executed successfully:", result);
        } catch (error) {
          console.error("Failed to execute shoutout:", error);
        }
      };

      executeShoutout();
    }
  }, [
    shoutoutData,
    queryClient,
    targetDisplayName,
    targetId,
    shoutoutMessage,
    isShoutoutCommandExecute,
    ACCESS_TOKEN,
  ]);

  useEffect(() => {
    if (!isUserSettingsSuccess) {
      return;
    }
    if (userSettings) {
      setTargetDisplayName(userSettings.targetChannelDisplayName);
      setTargetLoginName(userSettings.targetChannelLoginName);
      setTargetId(userSettings.targetChannelId);
      setShoutoutMessage(userSettings.shoutoutMessage);
      setIsShoutoutCommandExecute(userSettings.isShoutoutCommandExecute);
    } else {
      setTargetDisplayName(botUser?.displayName as string);
      setTargetLoginName(botUser?.loginName as string);
      setTargetId(botUser?.id as string);
      setShoutoutMessage(
        "◆◆◆ Thanks for the raid! $displayname さん( https://www.twitch.tv/$loginname ). | $category -$title"
      );
      setIsShoutoutCommandExecute(false);
    }
  }, [
    isUserSettingsSuccess,
    userSettings,
    setTargetDisplayName,
    setTargetDisplayName,
    setShoutoutData,
    setIsShoutoutCommandExecute,
  ]);

  if (isUserSettingsLoading) {
    return <div>Loading...</div>;
  }
  if (isUserSettingsError) {
    return <div>Error</div>;
  }

  return (
    <>
      <Header />
      <p>Twitch Auto Shoutout Bot</p>
      <img src={botUser?.icon} />
      <h2>ようこそ{botUser?.displayName}さん</h2>
      <div>
        投稿先チャンネル
        <h2>{targetDisplayName}</h2>
        <h3>{targetLoginName}</h3>
      </div>
      <div>
        Shoutoutメッセージ
        <h2>{replaceText(shoutoutMessage)}</h2>
      </div>
      <div>
        <h2>
          /shoutoutコマンドを自動実行
          {isShoutoutCommandExecute ? <span>する</span> : <span>しない</span>}
        </h2>
      </div>
      <button onClick={() => navigate("/edit")}>編集する</button>
    </>
  );
};
