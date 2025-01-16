import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { TWITCH_API_URI, TWITCH_CLIENT_ID } from "../constants";

export const useMutateShoutout = () => {
  const executeShoutout = useMutation({
    mutationFn: async (payload: {
      token: string;
      fromBroadcasterId: string;
      toBroadcasterId: string;
      moderatorId: string;
    }) => {
      try {
        const { data } = await axios.post(`${TWITCH_API_URI}/chat/shoutouts`, {
          headers: {
            Authorization: `Bearer ${payload.token}`,
            "Client-Id": TWITCH_CLIENT_ID,
          },
          params: {
            from_broadcaster_id: payload.fromBroadcasterId,
            to_broadcaster_id: payload.toBroadcasterId,
            moderator_id: payload.moderatorId,
          },
        });
        return data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Shoutout error:",
            error.response?.data || error.message
          );
          throw new Error("Failed to execute shoutout");
        } else {
          console.error("An unexpected error occurred:", error);
          throw new Error("An unexpected error occurred");
        }
      }
    },
  });

  return executeShoutout;
};
