import { ChatUserstate } from "tmi.js";

const RAID_TAGS = {
  msgId: "msg-id",
  login: "msg-param-login",
  displayName: "msg-param-displayName",
} as const;

export type RaidInfo = {
  channel: string;
  login: string;
  displayName: string;
};

export const getRaidInfo = (
  channel: string,
  tags: ChatUserstate
): RaidInfo | null => {
  if (tags[RAID_TAGS.msgId] !== "raid") {
    return null;
  }

  const login = tags[RAID_TAGS.login] ?? tags["login"];
  if (!login) {
    return null;
  }
  if (!tags[RAID_TAGS.login]) {
    console.warn("msg-param-login missing in raid usernotice, falling back to login tag", { channel, tags });
  }
  const displayName = tags[RAID_TAGS.displayName] || login;
  return { channel, login: normalizeLoginName(login), displayName };
};

export const shouldReuseClient = (
  readyState: string | null,
  currentChannel: string | null,
  targetChannel: string
) => readyState === "OPEN" && currentChannel === targetChannel;

export const toIrcPassword = (accessToken: string) => {
  if (accessToken.startsWith("oauth:")) {
    return accessToken;
  }
  return `oauth:${accessToken}`;
};

export const normalizeLoginName = (loginName: string) =>
  loginName.trim().replace(/^#/, "").toLowerCase();
