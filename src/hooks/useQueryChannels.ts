import axios from "axios";
import { Channel } from "../types";
import { useQuery } from "@tanstack/react-query";
import { TWITCH_API_URI, TWITCH_CLIENT_ID } from "../constants";

export const useQueryChannels = (token: string, broadcasterId: string) => {
  const getChannels = async () => {
    try {
      const { data } = await axios.get(`${TWITCH_API_URI}/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": TWITCH_CLIENT_ID,
        },
        params: { broadcaster_id: broadcasterId },
      });
      return data.data.length > 0 ? data.data : null;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios error fetching user:",
          error.response?.data || error.message
        );
        throw new Error(
          `Twitch API error: ${error.response?.status || "Network Error"}`
        );
      } else {
        console.error("An unexpected error occurred:", error);
        throw new Error("An unexpected error occurred");
      }
    }
  };
  return useQuery<Channel[]>({
    queryKey: ["channels", broadcasterId],
    queryFn: getChannels,
    enabled: !!broadcasterId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 2,
    queryKeyHashFn: (queryKey) => {
      return JSON.stringify(queryKey) + token;
    },
  });
};
