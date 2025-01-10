import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { User } from "../types";
import { TWITCH_API_URI, TWITCH_CLIENT_ID } from "../constants/path";

export const useQueryUsers = (token: string, loginName: string) => {
  const getUsers = async () => {
    try {
      const { data } = await axios.get(`${TWITCH_API_URI}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": TWITCH_CLIENT_ID,
        },
        params: { login: loginName },
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
  return useQuery<User[]>({
    queryKey: ["users", loginName],
    queryFn: getUsers,
    enabled: !!loginName,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryKeyHashFn: (queryKey) => {
      return JSON.stringify(queryKey) + token;
    },
  });
};
