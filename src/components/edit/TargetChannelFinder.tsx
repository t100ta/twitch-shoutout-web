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

export const TargetChannelFinder = (props: Props) => {
  const { data: usersResponse, refetch } = useQueryUsers(
    props.accessToken,
    props.channelLoginName
  );
  const text = useRef("");
  const [imgUrl, setImgUrl] = useState("");

  const checkExistence = async () => {
    if (!props.channelLoginName) {
      return;
    }
    await refetch();
  };
  useEffect(() => {
    if (!props.channelLoginName) {
      return;
    }
    if (!usersResponse || !Object.keys(usersResponse).length) {
      setImgUrl("");
      props.setChannelDisplayName("");
      text.current = "Twitchで検索したけど見つからなかった...";
      return;
    }
    const targetUser = usersResponse[0];
    setImgUrl(targetUser.profile_image_url);
    props.setChannelLoginName(targetUser.login);
    props.setChannelDisplayName(targetUser.display_name);
    props.setId(targetUser.id);
    text.current = "";
  }, [usersResponse]);
  return (
    <>
      <h2>投稿先チャンネル</h2>

      <input
        placeholder="ID (https://www.twitch.tv/ 以降の部分)"
        value={props.channelLoginName}
        onChange={(event) => props.setChannelLoginName(event.target.value)}
        onBlur={() => checkExistence()}
      ></input>
      <img
        src={imgUrl}
        alt={props.channelLoginName}
        title={props.channelDisplayName}
      />
      <p>{props.channelDisplayName}</p>
      <span>{text.current}</span>
    </>
  );
};
