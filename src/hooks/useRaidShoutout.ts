import { useEffect, type MutableRefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { replaceText, wait } from "../utils";
import { Channel, User } from "../types";
import { useMutateShoutout } from "./useMutateShoutout";

type ShoutoutData = {
  users: User[];
  channels: Channel[];
};

type Params = {
  clientRef: MutableRefObject<{
    say: (channel: string, message: string) => void;
  } | null>;
  shoutoutData: ShoutoutData | null;
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
  targetLoginName,
  shoutoutMessage,
  isShoutoutCommandExecute,
  accessToken,
  targetId,
  botUserId,
}: Params) => {
  const queryClient = useQueryClient();
  const shoutoutCommandExecute = useMutateShoutout();

  useEffect(() => {
    if (!shoutoutData || !clientRef.current) {
      return;
    }
    const { users, channels } = shoutoutData;
    const user = users[0];
    const channel = channels[0];
    queryClient.invalidateQueries({
      queryKey: ["channel", user.id],
    });

    clientRef.current?.say(
      targetLoginName as string,
      replaceText(shoutoutMessage as string, {
        displayName: channel.broadcaster_name,
        name: channel.broadcaster,
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
          console.error("Failed to execute shoutout:", error);
        }
      };

      executeShoutout();
    }
  }, [
    shoutoutData,
    clientRef,
    queryClient,
    targetLoginName,
    shoutoutMessage,
    isShoutoutCommandExecute,
    accessToken,
    targetId,
    botUserId,
    shoutoutCommandExecute,
  ]);
};
