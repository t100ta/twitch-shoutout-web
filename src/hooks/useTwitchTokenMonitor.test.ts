import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mutateAsyncMock = vi.hoisted(() => vi.fn());
const reactHarness = vi.hoisted(() => {
  type Cleanup = () => void;
  type Effect = () => void | Cleanup;
  type EffectEntry = {
    index: number;
    effect: Effect;
  };
  type MemoEntry = {
    value: unknown;
    deps: unknown[] | undefined;
  };

  let hookValues: unknown[] = [];
  let hookCursor = 0;
  let effectCursor = 0;
  let effectDeps: Array<unknown[] | undefined> = [];
  let effectCleanups: Array<Cleanup | undefined> = [];
  let pendingEffects: EffectEntry[] = [];

  const areDepsEqual = (
    previousDeps: unknown[] | undefined,
    nextDeps: unknown[] | undefined
  ) => {
    if (!previousDeps || !nextDeps || previousDeps.length !== nextDeps.length) {
      return false;
    }
    return previousDeps.every((dep, index) => Object.is(dep, nextDeps[index]));
  };

  const cleanup = () => {
    effectCleanups.forEach((effectCleanup) => effectCleanup?.());
    effectCleanups = [];
    pendingEffects = [];
  };

  return {
    reset: () => {
      cleanup();
      hookValues = [];
      hookCursor = 0;
      effectCursor = 0;
      effectDeps = [];
    },
    beginRender: () => {
      hookCursor = 0;
      effectCursor = 0;
    },
    cleanup,
    runEffects: () => {
      const effectsToRun = pendingEffects;
      pendingEffects = [];
      effectsToRun.forEach(({ index, effect }) => {
        effectCleanups[index]?.();
        const effectCleanup = effect();
        effectCleanups[index] =
          typeof effectCleanup === "function" ? effectCleanup : undefined;
      });
    },
    useCallback: (callback: unknown, deps: unknown[] | undefined) => {
      const index = hookCursor;
      hookCursor += 1;
      const previous = hookValues[index] as MemoEntry | undefined;
      if (!previous || !areDepsEqual(previous.deps, deps)) {
        hookValues[index] = { value: callback, deps };
      }
      return (hookValues[index] as MemoEntry).value;
    },
    useEffect: (effect: Effect, deps: unknown[] | undefined) => {
      const index = effectCursor;
      effectCursor += 1;
      if (!areDepsEqual(effectDeps[index], deps)) {
        effectDeps[index] = deps;
        pendingEffects.push({ index, effect });
      }
    },
    useRef: <T,>(initialValue: T) => {
      const index = hookCursor;
      hookCursor += 1;
      if (!hookValues[index]) {
        hookValues[index] = { current: initialValue };
      }
      return hookValues[index];
    },
    useState: <T,>(initialValue: T) => {
      const index = hookCursor;
      hookCursor += 1;
      if (hookValues[index] === undefined) {
        hookValues[index] = initialValue;
      }
      const setState = (nextValue: T | ((previousValue: T) => T)) => {
        hookValues[index] =
          typeof nextValue === "function"
            ? (nextValue as (previousValue: T) => T)(hookValues[index] as T)
            : nextValue;
      };
      return [hookValues[index], setState];
    },
  };
});

vi.mock("react", () => ({
  useCallback: reactHarness.useCallback,
  useEffect: reactHarness.useEffect,
  useRef: reactHarness.useRef,
  useState: reactHarness.useState,
}));

vi.mock("./useMutateValidation", () => ({
  TOKEN_INVALID_ERROR: "TOKEN_INVALID",
  useMutateValidation: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}));

import {
  TWITCH_TOKEN_VALIDATION_INTERVAL_MS,
  useTwitchTokenMonitor,
} from "./useTwitchTokenMonitor";

const validateResponse = (expiresIn: number) => ({
  client_id: "client-id",
  login: "login",
  scopes: ["chat:read"],
  user_id: "user-id",
  expires_in: expiresIn,
});

const useRenderMonitor = (accessToken = "token") => {
  reactHarness.beginRender();
  const result = useTwitchTokenMonitor(accessToken);
  reactHarness.runEffects();
  return result;
};

const settleValidation = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("useTwitchTokenMonitor", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
    vi.useFakeTimers();
    vi.setSystemTime(0);
    mutateAsyncMock.mockReset();
    reactHarness.reset();
  });

  afterEach(() => {
    reactHarness.cleanup();
    vi.useRealTimers();
  });

  it("validates token on mount", () => {
    mutateAsyncMock.mockResolvedValue(validateResponse(3600));

    useRenderMonitor("oauth-token");

    expect(mutateAsyncMock).toHaveBeenCalledWith("oauth-token");
  });

  it("updates expiresAt and remainingMs after successful validation", async () => {
    mutateAsyncMock.mockResolvedValue(validateResponse(3600));

    useRenderMonitor();
    await settleValidation();
    const result = useRenderMonitor();

    expect(result.expiresAt).toBe(3600 * 1000);
    expect(result.remainingMs).toBe(3600 * 1000);
    expect(result.lastValidatedAt).toBe(0);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.isTokenInvalid).toBe(false);
  });

  it("marks token as expiring soon when expires_in is 15 minutes or less", async () => {
    mutateAsyncMock.mockResolvedValue(validateResponse(900));

    useRenderMonitor();
    await settleValidation();
    const result = useRenderMonitor();

    expect(result.remainingMs).toBe(900 * 1000);
    expect(result.isExpiringSoon).toBe(true);
  });

  it("marks token invalid on 401 and does not retry indefinitely", async () => {
    mutateAsyncMock.mockRejectedValue(new Error("TOKEN_INVALID"));

    useRenderMonitor();
    await settleValidation();
    const result = useRenderMonitor();

    expect(result.isTokenInvalid).toBe(true);
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("validates token again after one hour", async () => {
    mutateAsyncMock
      .mockResolvedValueOnce(validateResponse(7200))
      .mockResolvedValueOnce(validateResponse(3600));

    useRenderMonitor();
    await settleValidation();
    useRenderMonitor();

    await vi.advanceTimersByTimeAsync(TWITCH_TOKEN_VALIDATION_INTERVAL_MS);
    await settleValidation();
    const result = useRenderMonitor();

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(result.lastValidatedAt).toBe(TWITCH_TOKEN_VALIDATION_INTERVAL_MS);
    expect(result.expiresAt).toBe(
      TWITCH_TOKEN_VALIDATION_INTERVAL_MS + 3600 * 1000
    );
  });
});
