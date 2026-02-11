import { useEffect, useRef, useState } from "react";
import { useQueryUsers } from "../../hooks/useQueryUsers";

type Props = {
  accessToken: string;
  channelLoginName: string;
  channelDisplayName: string;
  setChannelLoginName: React.Dispatch<React.SetStateAction<string>>;
  setChannelDisplayName: React.Dispatch<React.SetStateAction<string>>;
  setId: React.Dispatch<React.SetStateAction<string>>;
};

export const TargetChannelFinder = ({
  accessToken,
  channelLoginName,
  channelDisplayName,
  setChannelLoginName,
  setChannelDisplayName,
  setId,
}: Props) => {
  const { data: usersResponse, refetch } = useQueryUsers(
    accessToken,
    channelLoginName
  );
  const text = useRef("");
  const [imgUrl, setImgUrl] = useState("");

  const checkExistence = async () => {
    if (!channelLoginName) {
      return;
    }
    await refetch();
  };
  useEffect(() => {
    if (!channelLoginName) {
      return;
    }
    if (!usersResponse || !Object.keys(usersResponse).length) {
      setImgUrl("");
      setChannelDisplayName("");
      text.current = "Twitchで検索したけど見つからなかった...";
      return;
    }
    const targetUser = usersResponse[0];
    setImgUrl(targetUser.profile_image_url);
    setChannelLoginName(targetUser.login);
    setChannelDisplayName(targetUser.display_name);
    setId(targetUser.id);
    text.current = "";
  }, [
    usersResponse,
    channelLoginName,
    setChannelDisplayName,
    setChannelLoginName,
    setId,
  ]);
  return (
    <>
      <h2>投稿先チャンネル</h2>

      <input
        placeholder="ID (https://www.twitch.tv/ 以降の部分)"
        value={channelLoginName}
        onChange={(event) => setChannelLoginName(event.target.value)}
        onBlur={() => checkExistence()}
      ></input>
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={channelLoginName}
          title={channelDisplayName}
          loading="lazy"
        />
      ) : null}
      <p>{channelDisplayName}</p>
      <span>{text.current}</span>
    </>
  );
};
