import { useMutation } from "@tanstack/react-query";
import axios, { HttpStatusCode } from "axios";

export const useMutateValidation = () => {
  const executeValidation = useMutation({
    mutationFn: async (oauthToken: string) => {
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
      }
      return data;
    },
  });
  return executeValidation;
};
