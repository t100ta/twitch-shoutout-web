import { useEffect, useRef, useState } from "react";
import { useQueryUsers } from "../../hooks/useQueryUsers";

type Props = {
  accessToken: string;
  channelName: string;
  setChannelName: React.Dispatch<React.SetStateAction<string>>;
  setId: React.Dispatch<React.SetStateAction<string>>;
};

export const TargetChannelFinder = (props: Props) => {
  const { data: usersResponse, refetch } = useQueryUsers(
    props.accessToken,
    props.channelName
  );
  const text = useRef("");
  const [imgUrl, setImgUrl] = useState("");
  // const [loginName, setLoginName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const checkExistence = async () => {
    if (!props.channelName) {
      return;
    }
    await refetch();
  };
  useEffect(() => {
    if (!props.channelName) {
      return;
    }
    if (!usersResponse || !Object.keys(usersResponse).length) {
      setImgUrl("");
      // setLoginName("");
      setDisplayName("");
      text.current = "Twitchで検索したけど見つからなかった...";
      return;
    }
    const targetUser = usersResponse[0];
    setImgUrl(targetUser.profile_image_url);
    props.setChannelName(targetUser.login);
    // setLoginName(targetUser.login);
    setDisplayName(targetUser.display_name);
    props.setId(targetUser.id);
    text.current = "";
  }, [usersResponse]);
  return (
    <>
      <h2>投稿先チャンネル</h2>

      <input
        placeholder="ID (https://www.twitch.tv/ 以降の部分)"
        value={props.channelName}
        onChange={(event) => props.setChannelName(event.target.value)}
        onBlur={() => checkExistence()}
      ></input>
      <img src={imgUrl} alt={props.channelName} title={displayName} />
      <p>{displayName}</p>
      <span>{text.current}</span>
    </>
  );
};
