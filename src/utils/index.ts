import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase";
import { ShoutoutProperties } from "../types";
import { BotUser } from "../store";

type ShoutoutUser = {
  [key: string]: string;
};
export const replaceText = (text: string, data?: ShoutoutProperties) => {
  if (!data) {
    data = {
      displayName: "(おなまえ)",
      name: "(URL)",
      game: "(カテゴリ)",
      title: "(配信タイトル)",
    };
  }

  const sampleUser: ShoutoutUser = {
    $displayname: data.displayName,
    $loginname: data.name,
    $category: data.game,
    $title: data.title,
  };
  let replacedText: string = text;
  Object.keys(sampleUser).forEach((key) => {
    const regularExpression = new RegExp(`\\${key}`, "g");
    replacedText = replacedText.replace(regularExpression, sampleUser[key]);
  });
  return replacedText;
};

export const signInWithTwitch = async (
  appToken: string,
  botUser: BotUser | null,
  setBotUser: (user: BotUser) => void
) => {
  if (!appToken) {
    return false;
  }

  if (botUser === null) {
    try {
      await signInWithCustomToken(auth, appToken);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        const claims = idTokenResult.claims;
        setBotUser({
          accessToken: claims.twitch_access_token as string,
          id: claims.twitch_id as string,
          displayName: claims.twitch_display_name as string,
          loginName: claims.twitch_login_name as string,
          icon: claims.twitch_icon as string,
        });
        console.log("Twitch Login Name: ", claims.twitch_login_name);
      }
    } catch (error) {
      console.error("Error signing in with Twitch: ", error);
    }
  }
  return true;
};
