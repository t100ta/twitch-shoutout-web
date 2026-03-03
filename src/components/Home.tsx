import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import { replaceText } from "../utils";
import { Channel, User } from "../types";
import { Header } from "./shared/Header";
import { useQueryUsers } from "../hooks/useQueryUsers";
import { useQueryChannels } from "../hooks/useQueryChannels";
import { useQuerySettings } from "../hooks/useQuerySettings";
import { useRaidListener } from "../hooks/useRaidListener";
import { useRaidShoutout } from "../hooks/useRaidShoutout";
import { useBrowserSessionWarning } from "../hooks/useBrowserSessionWarning";
import {
  cautionTextStyle,
  shoutoutMessageStyle,
  userSettingItemStyle,
  warningBoxStyle,
} from "./Home.css";

export const Home = () => {
  const navigate = useNavigate();
  const { botUser, clearAppToken, clearBotUser } = useStore();
  const ACCESS_TOKEN = botUser?.accessToken as string;
  const { hasMultipleSessions } = useBrowserSessionWarning(
    (botUser?.id as string) || ""
  );
  const {
    data: userSettings,
    isLoading: isUserSettingsLoading,
    isError: isUserSettingsError,
  } = useQuerySettings(botUser?.id as string);

  const {
    targetDisplayName,
    targetLoginName,
    targetId,
    shoutoutMessage,
    isShoutoutCommandExecute,
  } = useMemo(() => {
    if (userSettings) {
      return {
        targetDisplayName: userSettings.targetChannelDisplayName,
        targetLoginName: userSettings.targetChannelLoginName,
        targetId: userSettings.targetChannelId,
        shoutoutMessage: userSettings.shoutoutMessage,
        isShoutoutCommandExecute: userSettings.isShoutoutCommandExecute,
      };
    }
    return {
      targetDisplayName: botUser?.displayName || "",
      targetLoginName: botUser?.loginName || "",
      targetId: botUser?.id || "",
      shoutoutMessage:
        "◆◆◆ Thanks for the raid! $displayname さん( https://www.twitch.tv/$loginname ). | $category -$title",
      isShoutoutCommandExecute: false,
    };
  }, [userSettings, botUser?.displayName, botUser?.loginName, botUser?.id]);

  const handleTokenInvalid = useCallback(() => {
    clearAppToken();
    clearBotUser();
  }, [clearAppToken, clearBotUser]);

  const { clientRef, raiderLoginName, isTokenInvalid } = useRaidListener({
    accessToken: ACCESS_TOKEN,
    targetLoginName,
    botUserLoginName: botUser?.loginName,
    onTokenInvalid: handleTokenInvalid,
  });

  const { data: raiderUsersData } = useQueryUsers(
    ACCESS_TOKEN,
    raiderLoginName
  );
  const raiderId = raiderUsersData ? raiderUsersData[0].id : null;
  const { data: raiderChannelsData } = useQueryChannels(
    ACCESS_TOKEN,
    raiderId as string
  );

  const shoutoutData = useMemo<{
    users: User[];
    channels: Channel[];
  } | null>(() => {
    if (!raiderUsersData || !raiderChannelsData) {
      return null;
    }
    return { users: raiderUsersData, channels: raiderChannelsData };
  }, [raiderUsersData, raiderChannelsData]);

  useRaidShoutout({
    clientRef,
    shoutoutData,
    targetLoginName,
    shoutoutMessage,
    isShoutoutCommandExecute,
    accessToken: ACCESS_TOKEN,
    targetId,
    botUserId: botUser?.id,
  });

  if (isUserSettingsLoading) {
    return <div>Loading...</div>;
  }
  if (isUserSettingsError) {
    return <div>Error</div>;
  }
  if (isTokenInvalid) {
    return (
      <div>
        <p>認証の有効期限が切れています。再ログインしてください。</p>
        <button onClick={() => navigate("/")}>ログインへ</button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <p>Twitch Shoutout Web</p>
      {hasMultipleSessions ? (
        <div className={warningBoxStyle}>
          同一ブラウザ内でこのアカウントのタブが複数開かれています。Shoutout処理が重複実行される可能性があるため、1タブにしてください。
          <p className={cautionTextStyle}>
            注意: この警告は同一ブラウザ内のタブのみ検知します。別ブラウザ・別端末での同時ログインは検知できません。
          </p>
        </div>
      ) : null}
      <img
        src={botUser?.icon}
        alt={botUser?.displayName || "Bot User"}
        loading="lazy"
      />
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
