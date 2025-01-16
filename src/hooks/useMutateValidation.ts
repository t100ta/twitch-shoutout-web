import { useMutation } from "@tanstack/react-query";
import axios, { HttpStatusCode } from "axios";

export const useMutateValidation = () => {
  const executeValidation = useMutation({
    mutationFn: async (oauthToken: string) => {
      try {
        const { data, status } = await axios.get(
          `https://id.twitch.tv/oauth2/validate`,
          {
            headers: {
              Authorization: `OAuth ${oauthToken}`,
            },
          }
        );

        if (status != HttpStatusCode.Ok) {
          console.error(
            `Token is invalid. /oauth2/validate returned status code ${data.status}`
          );
          console.error(data.data);
          throw new Error("Token is invalid");
        }
        return data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Validation error:",
            error.response?.data || error.message
          );
          throw new Error("Failed to validate");
        } else {
          console.error("An unexpected error occurred:", error);
          throw new Error("An unexpected error occurred");
        }
      }
    },
  });
  return executeValidation;
};
