export type Authorization = {
  clientId: string;
  login: string;
  scopes: Array<string>;
  userId: string;
  expiresIn: number;
};

export type User = {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: string;
  created_at: string;
};

export type Channel = {
  broadcaster_id: string;
  broadcaster: string;
  broadcaster_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  delay: number;
};

export type ShoutoutProperties = {
  displayName: string;
  name: string;
  game: string;
  title: string;
};

export type UserSettings = {
  targetChannelDisplayName: string;
  targetChannelId: string;
  shoutoutMessage: string;
  isShoutoutCommandExecute: boolean;
};
