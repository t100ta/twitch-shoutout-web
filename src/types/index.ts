export type TwitchUser = { id: string; login: string; display_name: string; profile_image_url: string };
export type ShoutoutProperties = { displayName: string; name: string; game: string; title: string };
export type UserSettings = {
  targetChannelDisplayName: string;
  targetChannelLoginName: string;
  targetChannelId: string;
  shoutoutMessage: string;
  isShoutoutCommandExecute: boolean;
  automationEnabled?: boolean;
};
export type TwitchConnection = {
  status: "connected" | "syncing" | "error" | "reconnect_required";
  targetId?: string;
  subscriptionStatus?: string;
  errorCode?: string;
  errorDetail?: string;
  lastResult?: { status?: string; chatResult?: string; shoutoutResult?: string; dropReason?: string };
};
