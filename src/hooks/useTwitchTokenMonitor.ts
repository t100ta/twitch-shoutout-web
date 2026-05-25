import { useCallback, useEffect, useRef, useState } from "react";
import type { Authorization } from "../types";
import { TOKEN_INVALID_ERROR, useMutateValidation } from "./useMutateValidation";

export const TWITCH_TOKEN_VALIDATION_INTERVAL_MS = 60 * 60 * 1000;
export const TWITCH_TOKEN_EXPIRING_SOON_THRESHOLD_MS = 15 * 60 * 1000;

type TokenTiming = {
  remainingMs: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
};

export type TwitchTokenMonitorState = {
  expiresAt: number | null;
  remainingMs: number | null;
  isExpiringSoon: boolean;
  isTokenInvalid: boolean;
  lastValidatedAt: number | null;
};

export const getTwitchTokenTiming = (
  expiresAt: number | null,
  now = Date.now()
): TokenTiming => {
  if (expiresAt === null) {
    return {
      remainingMs: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const remainingMs = Math.max(expiresAt - now, 0);
  return {
    remainingMs,
    isExpiringSoon:
      remainingMs > 0 &&
      remainingMs <= TWITCH_TOKEN_EXPIRING_SOON_THRESHOLD_MS,
    isExpired: remainingMs <= 0,
  };
};

export const useTwitchTokenMonitor = (
  accessToken: string
): TwitchTokenMonitorState => {
  const { mutateAsync: validateToken } = useMutateValidation();
  const validateTokenRef = useRef(validateToken);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [hasTokenInvalidError, setHasTokenInvalidError] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<number | null>(null);

  const timing = getTwitchTokenTiming(expiresAt, nowMs);
  const isTokenInvalid = hasTokenInvalidError || timing.isExpired;

  useEffect(() => {
    validateTokenRef.current = validateToken;
  }, [validateToken]);

  useEffect(() => {
    setExpiresAt(null);
    setNowMs(Date.now());
    setHasTokenInvalidError(false);
    setLastValidatedAt(null);
  }, [accessToken]);

  const runValidation = useCallback(async () => {
    if (!accessToken || isTokenInvalid) {
      return;
    }

    try {
      const authorization = (await validateTokenRef.current(
        accessToken
      )) as Authorization;
      const validatedAt = Date.now();
      setExpiresAt(validatedAt + authorization.expires_in * 1000);
      setNowMs(validatedAt);
      setLastValidatedAt(validatedAt);
      setHasTokenInvalidError(false);
    } catch (error) {
      if (error instanceof Error && error.message === TOKEN_INVALID_ERROR) {
        setHasTokenInvalidError(true);
        return;
      }
      console.warn("Skip token invalid state because validation failed:", error);
    }
  }, [accessToken, isTokenInvalid]);

  useEffect(() => {
    if (!accessToken || isTokenInvalid) {
      return;
    }

    void runValidation();
    const intervalId = window.setInterval(
      () => void runValidation(),
      TWITCH_TOKEN_VALIDATION_INTERVAL_MS
    );

    return () => window.clearInterval(intervalId);
  }, [accessToken, isTokenInvalid, runValidation]);

  useEffect(() => {
    if (expiresAt === null || hasTokenInvalidError) {
      return;
    }

    const now = Date.now();
    const remainingMs = expiresAt - now;
    setNowMs(now);

    if (remainingMs <= 0) {
      setHasTokenInvalidError(true);
      return;
    }

    const timeoutIds: number[] = [];
    const expiringSoonInMs =
      remainingMs - TWITCH_TOKEN_EXPIRING_SOON_THRESHOLD_MS;
    if (expiringSoonInMs > 0) {
      timeoutIds.push(
        window.setTimeout(() => setNowMs(Date.now()), expiringSoonInMs)
      );
    }
    timeoutIds.push(
      window.setTimeout(() => {
        setNowMs(Date.now());
        setHasTokenInvalidError(true);
      }, remainingMs)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [expiresAt, hasTokenInvalidError]);

  const latestTiming = getTwitchTokenTiming(expiresAt, nowMs);
  return {
    expiresAt,
    remainingMs: latestTiming.remainingMs,
    isExpiringSoon: latestTiming.isExpiringSoon,
    isTokenInvalid: hasTokenInvalidError || latestTiming.isExpired,
    lastValidatedAt,
  };
};
