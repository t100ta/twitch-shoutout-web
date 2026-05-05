import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { TWITCH_API_URI, TWITCH_CLIENT_ID } from "../constants";

export class ShoutoutUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShoutoutUnavailableError";
  }
}

export const useMutateShoutout = () => {
  const executeShoutout = useMutation({
    mutationFn: async (payload: {
      token: string;
      fromBroadcasterId: string;
      toBroadcasterId: string;
      moderatorId: string;
    }) => {
      try {
        const { data: streamsData } = await axios.get(
          `${TWITCH_API_URI}/streams`,
          {
            headers: {
              Authorization: `Bearer ${payload.token}`,
              "Client-Id": TWITCH_CLIENT_ID,
            },
            params: { user_id: payload.fromBroadcasterId },
          }
        );
        const stream = streamsData.data?.[0];
        if (!stream || stream.viewer_count < 1) {
          throw new ShoutoutUnavailableError(
            "The broadcaster must be live and have at least one viewer to execute a shoutout."
          );
        }

        const { data } = await axios.post(
          `${TWITCH_API_URI}/chat/shoutouts`,
          null,
          {
            headers: {
              Authorization: `Bearer ${payload.token}`,
              "Client-Id": TWITCH_CLIENT_ID,
            },
            params: {
              from_broadcaster_id: payload.fromBroadcasterId,
              to_broadcaster_id: payload.toBroadcasterId,
              moderator_id: payload.moderatorId,
            },
          }
        );
        return data;
      } catch (error: unknown) {
        if (error instanceof ShoutoutUnavailableError) {
          throw error;
        }
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
