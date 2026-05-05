import type { ChatUserstate } from "tmi.js";

declare module "tmi.js" {
  interface Events {
    /**
     * USERNOTICE イベント（msg-id=raid 含む）を受け取れるように
     */
    usernotice(
      msgid: string,
      channel: string,
      userstate: ChatUserstate,
      message: string
    ): void;
    raided(
      channel: string,
      username: string,
      viewers: number,
      userstate: ChatUserstate
    ): void;
  }
}

export {};
