import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatUserstate, Client } from "tmi.js";
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
import { shoutoutMessageStyle, userSettingItemStyle } from "./Home.css";

const RAID_TAGS = {
  msgId: "msg-id",
  login: "msg-param-login",
  displayName: "msg-param-displayName",
} as const;

// TODO tokenリフレッシュ入れたほうがいいかも https://dev.twitch.tv/docs/authentication/refresh-tokens/
export const Home = () => {
  const navigate = useNavigate();
  const { botUser } = useStore();
  const ACCESS_TOKEN = botUser?.accessToken as string;
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);
  const currentChannelRef = useRef<string | null>(null);
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
  const handleDisconnected = useCallback((reason: string) => {
    console.log("Disconnected from Twitch chat:", reason);
  }, []);
  // const handleRaided = useCallback(
  //   (channel: string, username: string, viewers: number, loginName: string) => {
  //     console.log(
  //       `Detected "raided"\nchannel: ${channel}\nusername: ${username}\nviewer: ${viewers}\nloginName: ${loginName}`
  //     );
  //     setRaiderLoginName(loginName);
  //   },
  //   []
  // );
  const handleUserNotice = useCallback(
    (channel: string, tags: ChatUserstate) => {
      if (tags[RAID_TAGS.msgId] !== "raid") {
        return;
      }

      const login = tags[RAID_TAGS.login]!;
      const displayName = tags[RAID_TAGS.displayName] || login;
      console.log(
        `Detected "raided"\nchannel: ${channel}\nusername: ${displayName}\nloginName: ${login}`
      );
      setRaiderLoginName(login);
    },
    []
  );

  useEffect(() => {
    if (!targetLoginName) {
      return;
    }
    if (
      clientRef.current &&
      clientRef.current.readyState() === "OPEN" &&
      currentChannelRef.current === targetLoginName
    ) {
      return;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      currentChannelRef.current = null;
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
    // client.on("raided", handleRaided);
    client.on("usernotice", handleUserNotice);

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
    // handleRaided,
    handleUserNotice,
    validate,
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
    targetLoginName,
    targetId,
    shoutoutMessage,
    isShoutoutCommandExecute,
    ACCESS_TOKEN,
    botUser?.id,
    shoutoutCommandExecute,
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
    botUser?.displayName,
    botUser?.loginName,
    botUser?.id,
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
      <p>Twitch Shoutout Web</p>
      <img src={botUser?.icon} />
      <p>
        ようこそ{" "}
        <span className={userSettingItemStyle}>{botUser?.displayName}</span>{" "}
        さん
      </p>
      <div>
        <p>投稿先チャンネル</p>
        <p className={userSettingItemStyle}>{targetDisplayName}</p>
        <p>{targetLoginName}</p>
      </div>
      <div>
        Shoutoutメッセージ
        <p className={`${userSettingItemStyle} ${shoutoutMessageStyle}`}>
          {replaceText(shoutoutMessage)}
        </p>
      </div>
      <div>
        <p>
          /shoutoutコマンドを自動実行
          {isShoutoutCommandExecute ? (
            <span className={userSettingItemStyle}>する</span>
          ) : (
            <span className={userSettingItemStyle}>しない</span>
          )}
        </p>
      </div>
      <button onClick={() => navigate("/edit")}>編集する</button>
    </>
  );
};
