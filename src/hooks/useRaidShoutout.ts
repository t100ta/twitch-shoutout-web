import { useEffect, useRef, type MutableRefObject } from "react";
import { replaceText, wait } from "../utils";
import { Channel, User } from "../types";
import {
  ShoutoutUnavailableError,
  useMutateShoutout,
} from "./useMutateShoutout";
import { normalizeLoginName } from "../utils/raidUtils";

type ShoutoutData = {
  users: User[];
  channels: Channel[];
};

type Params = {
  clientRef: MutableRefObject<{
    say: (channel: string, message: string) => void;
  } | null>;
  shoutoutData: ShoutoutData | null;
  raidEventId: string;
  targetLoginName: string;
  shoutoutMessage: string;
  isShoutoutCommandExecute: boolean;
  accessToken: string;
  targetId: string;
  botUserId: string | undefined;
};

export const useRaidShoutout = ({
  clientRef,
  shoutoutData,
  raidEventId,
  targetLoginName,
  shoutoutMessage,
  isShoutoutCommandExecute,
  accessToken,
  targetId,
  botUserId,
}: Params) => {
  const processedRaidEventIdRef = useRef("");
  const shoutoutCommandExecute = useMutateShoutout();

  useEffect(() => {
    if (!raidEventId || processedRaidEventIdRef.current === raidEventId) {
      return;
    }
    if (!shoutoutData || !clientRef.current) {
      return;
    }
    const normalizedTargetLoginName = normalizeLoginName(targetLoginName);
    if (!normalizedTargetLoginName) {
      console.warn("Skip chat post because target login name is empty.");
      return;
    }
    const { users, channels } = shoutoutData;
    const user = users[0];
    const channel = channels[0];
    processedRaidEventIdRef.current = raidEventId;
    const loginNameForMessage = normalizeLoginName(
      channel.broadcaster_login || user?.login || channel.broadcaster || ""
    );
    if (!loginNameForMessage) {
      console.warn(
        "Could not resolve raider login name for message placeholders."
      );
    }
    const displayNameForMessage =
      channel.broadcaster_name || user?.display_name || user?.login || "(おなまえ)";

    clientRef.current?.say(
      normalizedTargetLoginName,
      replaceText(shoutoutMessage as string, {
        displayName: displayNameForMessage,
        name: loginNameForMessage || "(ユーザーID)",
        game: channel.game_name,
        title: channel.title,
      })
    );

    if (isShoutoutCommandExecute) {
      const executeShoutout = async () => {
        try {
          await wait(3 * 1000);
          const result = await shoutoutCommandExecute.mutateAsync({
            token: accessToken,
            fromBroadcasterId: targetId,
            toBroadcasterId: channel.broadcaster_id,
            moderatorId: botUserId as string,
          });
          console.log("Shoutout executed successfully:", result);
        } catch (error) {
          if (error instanceof ShoutoutUnavailableError) {
            console.warn("Skip shoutout:", error.message);
            return;
          }
          console.error("Failed to execute shoutout:", error);
        }
      };

      executeShoutout();
    }
  }, [
    shoutoutData,
    raidEventId,
    clientRef,
    targetLoginName,
    shoutoutMessage,
    isShoutoutCommandExecute,
    accessToken,
    targetId,
    botUserId,
    shoutoutCommandExecute,
  ]);
};
