import { describe, it, expect, vi, beforeEach } from "vitest";

const useQueryMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());

const axiosGetMock = vi.hoisted(() => vi.fn());
const axiosPostMock = vi.hoisted(() => vi.fn());
const isAxiosErrorMock = vi.hoisted(() => vi.fn());

const getDocMock = vi.hoisted(() => vi.fn());
const setDocMock = vi.hoisted(() => vi.fn());
const collectionMock = vi.hoisted(() => vi.fn());
const docMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock("axios", () => ({
  default: {
    get: axiosGetMock,
    post: axiosPostMock,
    isAxiosError: isAxiosErrorMock,
  },
  HttpStatusCode: {
    Ok: 200,
    Unauthorized: 401,
  },
  isAxiosError: isAxiosErrorMock,
}));

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  getDoc: getDocMock,
  setDoc: setDocMock,
  collection: collectionMock,
  doc: docMock,
}));

import { useQueryUsers } from "./useQueryUsers";
import { useQueryChannels } from "./useQueryChannels";
import { useQuerySettings } from "./useQuerySettings";
import { useMutateValidation } from "./useMutateValidation";
import {
  ShoutoutUnavailableError,
  useMutateShoutout,
} from "./useMutateShoutout";
import { useMutateSettings } from "./useMutateSettings";
import {
  TOKEN_INVALID_ERROR,
  VALIDATION_FAILED_ERROR,
} from "./useMutateValidation";
import type { Channel, UserSettings } from "../types";

type QueryCapture<TData> = {
  queryKey: string[];
  enabled: boolean;
  queryFn: () => Promise<TData | null>;
};

type ValidationMutationCapture = {
  mutationFn: (oauthToken: string) => Promise<unknown>;
};

type ShoutoutPayload = {
  token: string;
  fromBroadcasterId: string;
  toBroadcasterId: string;
  moderatorId: string;
};

type ShoutoutMutationCapture = {
  mutationFn: (payload: ShoutoutPayload) => Promise<unknown>;
};

type SettingsPayload = {
  twitchId: string;
  data: UserSettings;
};

type SettingsMutationCapture = {
  mutationFn: (payload: SettingsPayload) => Promise<SettingsPayload>;
  onError: (error: unknown) => void;
  onSuccess: (payload: SettingsPayload) => void;
};

const expectCaptured = <T,>(captured: T | undefined): T => {
  expect(captured).toBeDefined();
  return captured as T;
};

describe("hooks", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    useQueryClientMock.mockReset();
    axiosGetMock.mockReset();
    axiosPostMock.mockReset();
    isAxiosErrorMock.mockReset();
    getDocMock.mockReset();
    setDocMock.mockReset();
    collectionMock.mockReset();
    docMock.mockReset();
  });

  it("useQueryUsers does not include token in queryKey", () => {
    let captured: QueryCapture<{ id: string }[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryUsers("token-a", "login");
    const query = expectCaptured(captured);
    expect(query.queryKey).toEqual(["users", "login"]);
    expect(query.enabled).toBe(true);
  });

  it("useQueryUsers queryFn returns data or null", async () => {
    let captured: QueryCapture<{ id: string }[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryUsers("token-a", "login");
    const query = expectCaptured(captured);
    axiosGetMock.mockResolvedValue({ data: { data: [{ id: "1" }] } });
    await expect(query.queryFn()).resolves.toEqual([{ id: "1" }]);

    axiosGetMock.mockResolvedValue({ data: { data: [] } });
    await expect(query.queryFn()).resolves.toBeNull();
  });

  it("useQueryUsers queryFn throws on axios error", async () => {
    let captured: QueryCapture<{ id: string }[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryUsers("token-a", "login");
    const query = expectCaptured(captured);

    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { status: 500 }, message: "x" });

    await expect(query.queryFn()).rejects.toThrow("Twitch API error: 500");
  });

  it("useQueryUsers queryFn throws on unexpected error", async () => {
    let captured: QueryCapture<{ id: string }[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryUsers("token-a", "login");
    const query = expectCaptured(captured);

    isAxiosErrorMock.mockReturnValue(false);
    axiosGetMock.mockRejectedValue(new Error("boom"));

    await expect(query.queryFn()).rejects.toThrow(
      "An unexpected error occurred"
    );
  });

  it("useQueryChannels does not include token in queryKey", () => {
    let captured: QueryCapture<Channel[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryChannels("token-b", "broadcaster-id");
    const query = expectCaptured(captured);
    expect(query.queryKey).toEqual(["channels", "broadcaster-id"]);
    expect(query.enabled).toBe(true);
  });

  it("useQueryChannels queryFn returns data or null", async () => {
    let captured: QueryCapture<{ id: string }[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryChannels("token-b", "broadcaster-id");
    const query = expectCaptured(captured);
    axiosGetMock.mockResolvedValue({ data: { data: [{ id: "1" }] } });
    await expect(query.queryFn()).resolves.toEqual([{ id: "1" }]);

    axiosGetMock.mockResolvedValue({ data: { data: [] } });
    await expect(query.queryFn()).resolves.toBeNull();
  });

  it("useQueryChannels queryFn throws on axios error", async () => {
    let captured: QueryCapture<Channel[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryChannels("token-b", "broadcaster-id");
    const query = expectCaptured(captured);

    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { status: 401 }, message: "x" });

    await expect(query.queryFn()).rejects.toThrow("Twitch API error: 401");
  });

  it("useQueryChannels queryFn throws on unexpected error", async () => {
    let captured: QueryCapture<Channel[]> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryChannels("token-b", "broadcaster-id");
    const query = expectCaptured(captured);

    isAxiosErrorMock.mockReturnValue(false);
    axiosGetMock.mockRejectedValue(new Error("boom"));

    await expect(query.queryFn()).rejects.toThrow(
      "An unexpected error occurred"
    );
  });

  it("useQuerySettings sets enabled by twitchId", () => {
    let captured: QueryCapture<UserSettings> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQuerySettings("");
    expect(expectCaptured(captured).enabled).toBe(false);

    useQuerySettings("twitch-id");
    expect(expectCaptured(captured).enabled).toBe(true);
  });

  it("useQuerySettings queryFn returns settings or null", async () => {
    let captured: QueryCapture<UserSettings> | undefined;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQuerySettings("twitch-id");
    const query = expectCaptured(captured);

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ shoutoutMessage: "msg" }),
    });
    await expect(query.queryFn()).resolves.toEqual({
      shoutoutMessage: "msg",
    });

    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
    await expect(query.queryFn()).resolves.toBeNull();
  });

  it("useMutateValidation calls validate endpoint with token", async () => {
    let captured: ValidationMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    axiosGetMock.mockResolvedValue({ data: {}, status: 200 });

    useMutateValidation();
    const { mutationFn } = expectCaptured(captured);
    await mutationFn("oauth-token");

    expect(axiosGetMock).toHaveBeenCalledWith(
      "https://id.twitch.tv/oauth2/validate",
      {
        headers: {
          Authorization: "OAuth oauth-token",
        },
      }
    );
  });

  it("useMutateValidation throws on non-200 status", async () => {
    let captured: ValidationMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    axiosGetMock.mockResolvedValue({ data: {}, status: 500 });

    useMutateValidation();
    const { mutationFn } = expectCaptured(captured);
    await expect(mutationFn("oauth-token")).rejects.toThrow(
      VALIDATION_FAILED_ERROR
    );
  });

  it("useMutateValidation throws on axios error", async () => {
    let captured: ValidationMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { status: 401, data: "bad" } });

    useMutateValidation();
    const { mutationFn } = expectCaptured(captured);
    await expect(mutationFn("oauth-token")).rejects.toThrow(TOKEN_INVALID_ERROR);
  });

  it("useMutateShoutout posts to twitch API", async () => {
    let captured: ShoutoutMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    axiosGetMock.mockResolvedValue({ data: { data: [{ viewer_count: 1 }] } });
    axiosPostMock.mockResolvedValue({ data: {} });

    useMutateShoutout();
    const { mutationFn } = expectCaptured(captured);
    await mutationFn({
      token: "token",
      fromBroadcasterId: "from",
      toBroadcasterId: "to",
      moderatorId: "mod",
    });

    expect(axiosGetMock).toHaveBeenCalledWith(
      "https://api.twitch.tv/helix/streams",
      {
        headers: {
          Authorization: "Bearer token",
          "Client-Id": expect.any(String),
        },
        params: { user_id: "from" },
      }
    );
    expect(axiosPostMock).toHaveBeenCalledWith(
      "https://api.twitch.tv/helix/chat/shoutouts",
      null,
      {
        headers: {
          Authorization: "Bearer token",
          "Client-Id": expect.any(String),
        },
        params: {
          from_broadcaster_id: "from",
          to_broadcaster_id: "to",
          moderator_id: "mod",
        },
      }
    );
  });

  it("useMutateShoutout skips post when broadcaster is offline", async () => {
    let captured: ShoutoutMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    axiosGetMock.mockResolvedValue({ data: { data: [] } });

    useMutateShoutout();
    const { mutationFn } = expectCaptured(captured);
    await expect(
      mutationFn({
        token: "token",
        fromBroadcasterId: "from",
        toBroadcasterId: "to",
        moderatorId: "mod",
      })
    ).rejects.toThrow(ShoutoutUnavailableError);
    expect(axiosPostMock).not.toHaveBeenCalled();
  });

  it("useMutateShoutout throws on axios error", async () => {
    let captured: ShoutoutMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockResolvedValue({ data: { data: [{ viewer_count: 1 }] } });
    axiosPostMock.mockRejectedValue({ response: { data: "bad" } });

    useMutateShoutout();
    const { mutationFn } = expectCaptured(captured);
    await expect(
      mutationFn({
        token: "token",
        fromBroadcasterId: "from",
        toBroadcasterId: "to",
        moderatorId: "mod",
      })
    ).rejects.toThrow("Failed to execute shoutout");
  });

  it("useMutateShoutout throws on unexpected error", async () => {
    let captured: ShoutoutMutationCapture | undefined;
    useMutationMock.mockImplementation(({ mutationFn }) => {
      captured = { mutationFn };
      return { mutationFn };
    });
    isAxiosErrorMock.mockReturnValue(false);
    axiosGetMock.mockResolvedValue({ data: { data: [{ viewer_count: 1 }] } });
    axiosPostMock.mockRejectedValue(new Error("boom"));

    useMutateShoutout();
    const { mutationFn } = expectCaptured(captured);
    await expect(
      mutationFn({
        token: "token",
        fromBroadcasterId: "from",
        toBroadcasterId: "to",
        moderatorId: "mod",
      })
    ).rejects.toThrow("An unexpected error occurred");
  });

  it("useMutateSettings writes settings to firestore", async () => {
    let captured: SettingsMutationCapture | undefined;
    useMutationMock.mockImplementation((options) => {
      captured = {
        mutationFn: options.mutationFn,
        onError: options.onError ?? (() => {}),
        onSuccess: options.onSuccess ?? (() => {}),
      };
      return options;
    });
    const setQueryDataMock = vi.fn();
    const getQueryDataMock = vi.fn().mockReturnValue({ ok: true });
    useQueryClientMock.mockReturnValue({
      getQueryData: getQueryDataMock,
      setQueryData: setQueryDataMock,
    });

    const settingsRef = { id: "settings" };
    const docRef = { id: "doc" };
    collectionMock.mockReturnValue(settingsRef);
    docMock.mockReturnValue(docRef);

    useMutateSettings();
    const { mutationFn } = expectCaptured(captured);
    const payload: SettingsPayload = {
      twitchId: "123",
      data: {
        targetChannelDisplayName: "name",
        targetChannelLoginName: "login",
        targetChannelId: "id",
        shoutoutMessage: "msg",
        isShoutoutCommandExecute: true,
      },
    };

    await mutationFn(payload);
    expect(setDocMock).toHaveBeenCalledWith(docRef, payload.data);
  });

  it("useMutateSettings logs errors in onError", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    let captured: SettingsMutationCapture | undefined;
    useMutationMock.mockImplementation((options) => {
      captured = {
        mutationFn: options.mutationFn,
        onError: options.onError ?? (() => {}),
        onSuccess: options.onSuccess ?? (() => {}),
      };
      return options;
    });
    useMutateSettings();

    expectCaptured(captured).onError(new Error("boom"));
    expect(consoleSpy).toHaveBeenCalledWith("boom");

    expectCaptured(captured).onError("raw-error");
    expect(consoleSpy).toHaveBeenCalledWith("raw-error");

    consoleSpy.mockRestore();
  });

  it("useMutateSettings onSuccess updates cache only when previous settings exist", () => {
    const setQueryDataMock = vi.fn();
    const getQueryDataMock = vi.fn().mockReturnValue(null);
    useQueryClientMock.mockReturnValue({
      getQueryData: getQueryDataMock,
      setQueryData: setQueryDataMock,
    });

    let captured: SettingsMutationCapture | undefined;
    useMutationMock.mockImplementation((options) => {
      captured = {
        mutationFn: options.mutationFn,
        onError: options.onError ?? (() => {}),
        onSuccess: options.onSuccess ?? (() => {}),
      };
      return options;
    });
    useMutateSettings();

    const payload: SettingsPayload = {
      twitchId: "123",
      data: {
        targetChannelDisplayName: "name",
        targetChannelLoginName: "login",
        targetChannelId: "id",
        shoutoutMessage: "msg",
        isShoutoutCommandExecute: true,
      },
    };

    expectCaptured(captured).onSuccess(payload);
    expect(setQueryDataMock).not.toHaveBeenCalled();

    getQueryDataMock.mockReturnValue({ ok: true });
    expectCaptured(captured).onSuccess(payload);
    expect(setQueryDataMock).toHaveBeenCalledWith(
      ["settings", "123"],
      payload.data
    );
  });
});
