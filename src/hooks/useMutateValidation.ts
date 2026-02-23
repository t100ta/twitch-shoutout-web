import { useMutation } from "@tanstack/react-query";
import axios, { HttpStatusCode } from "axios";

export const TOKEN_INVALID_ERROR = "TOKEN_INVALID";
export const VALIDATION_FAILED_ERROR = "VALIDATION_FAILED";
export const UNEXPECTED_VALIDATION_ERROR = "UNEXPECTED_VALIDATION_ERROR";

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

        if (status === HttpStatusCode.Unauthorized) {
          console.error(
            `Token is invalid. /oauth2/validate returned status code ${status}`
          );
          throw new Error(TOKEN_INVALID_ERROR);
        }
        if (status != HttpStatusCode.Ok) {
          console.error(
            `Token validation failed. /oauth2/validate returned status code ${status}`
          );
          console.error(data);
          throw new Error(VALIDATION_FAILED_ERROR);
        }
        return data;
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.message === TOKEN_INVALID_ERROR ||
            error.message === VALIDATION_FAILED_ERROR ||
            error.message === UNEXPECTED_VALIDATION_ERROR)
        ) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          if (error.response?.status === HttpStatusCode.Unauthorized) {
            throw new Error(TOKEN_INVALID_ERROR);
          }
          console.error(
            "Validation error:",
            error.response?.data || error.message
          );
          throw new Error(VALIDATION_FAILED_ERROR);
        } else {
          console.error("An unexpected error occurred:", error);
          throw new Error(UNEXPECTED_VALIDATION_ERROR);
        }
      }
    },
  });
  return executeValidation;
};
