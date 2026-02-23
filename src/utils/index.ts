import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase";
import { ShoutoutProperties } from "../types";
import type { BotUser } from "../store";

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
    $displayName: data.displayName,
    $loginname: data.name,
    $loginName: data.name,
    $category: data.game,
    $game: data.game,
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
  setBotUser: (user: BotUser) => void
) => {
  if (!appToken) {
    return { ok: false as const, reason: "APP_TOKEN_MISSING" as const };
  }

  try {
    await signInWithCustomToken(auth, appToken);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { ok: false as const, reason: "CURRENT_USER_MISSING" as const };
    }

    const idTokenResult = await currentUser.getIdTokenResult();
    const claims = idTokenResult.claims;
    const accessToken = claims.twitch_access_token;
    const id = claims.twitch_id;
    const displayName = claims.twitch_display_name;
    const loginName = claims.twitch_login_name;
    const icon = claims.twitch_icon;

    if (
      typeof accessToken !== "string" ||
      typeof id !== "string" ||
      typeof displayName !== "string" ||
      typeof loginName !== "string" ||
      typeof icon !== "string"
    ) {
      return { ok: false as const, reason: "CLAIMS_MISSING" as const };
    }

    setBotUser({
      accessToken,
      id,
      displayName,
      loginName,
      icon,
    });
    console.log("Twitch Login Name: ", loginName);
    return { ok: true as const };
  } catch (error) {
    console.error("Error signing in with Twitch: ", error);
    return { ok: false as const, reason: "SIGN_IN_FAILED" as const };
  }
};

export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
