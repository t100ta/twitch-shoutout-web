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
import { useMutateShoutout } from "./useMutateShoutout";
import { useMutateSettings } from "./useMutateSettings";

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

  it("useQueryUsers includes token in queryKeyHashFn", () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryUsers("token-a", "login");
    const hash = captured.queryKeyHashFn(["users", "login"]);
    expect(hash).toContain("token-a");
    expect(captured.enabled).toBe(true);
  });

  it("useQueryUsers queryFn returns data or null", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryUsers("token-a", "login");
    axiosGetMock.mockResolvedValue({ data: { data: [{ id: "1" }] } });
    await expect(captured.queryFn()).resolves.toEqual([{ id: "1" }]);

    axiosGetMock.mockResolvedValue({ data: { data: [] } });
    await expect(captured.queryFn()).resolves.toBeNull();
  });

  it("useQueryUsers queryFn throws on axios error", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryUsers("token-a", "login");

    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { status: 500 }, message: "x" });

    await expect(captured.queryFn()).rejects.toThrow("Twitch API error: 500");
  });

  it("useQueryUsers queryFn throws on unexpected error", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryUsers("token-a", "login");

    isAxiosErrorMock.mockReturnValue(false);
    axiosGetMock.mockRejectedValue(new Error("boom"));

    await expect(captured.queryFn()).rejects.toThrow(
      "An unexpected error occurred"
    );
  });

  it("useQueryChannels includes token in queryKeyHashFn", () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryChannels("token-b", "broadcaster-id");
    const hash = captured.queryKeyHashFn(["channels", "broadcaster-id"]);
    expect(hash).toContain("token-b");
    expect(captured.enabled).toBe(true);
  });

  it("useQueryChannels queryFn returns data or null", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQueryChannels("token-b", "broadcaster-id");
    axiosGetMock.mockResolvedValue({ data: { data: [{ id: "1" }] } });
    await expect(captured.queryFn()).resolves.toEqual([{ id: "1" }]);

    axiosGetMock.mockResolvedValue({ data: { data: [] } });
    await expect(captured.queryFn()).resolves.toBeNull();
  });

  it("useQueryChannels queryFn throws on axios error", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryChannels("token-b", "broadcaster-id");

    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { status: 401 }, message: "x" });

    await expect(captured.queryFn()).rejects.toThrow("Twitch API error: 401");
  });

  it("useQueryChannels queryFn throws on unexpected error", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQueryChannels("token-b", "broadcaster-id");

    isAxiosErrorMock.mockReturnValue(false);
    axiosGetMock.mockRejectedValue(new Error("boom"));

    await expect(captured.queryFn()).rejects.toThrow(
      "An unexpected error occurred"
    );
  });

  it("useQuerySettings sets enabled by twitchId", () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });

    useQuerySettings("");
    expect(captured.enabled).toBe(false);

    useQuerySettings("twitch-id");
    expect(captured.enabled).toBe(true);
  });

  it("useQuerySettings queryFn returns settings or null", async () => {
    let captured: any;
    useQueryMock.mockImplementation((options) => {
      captured = options;
      return { data: null };
    });
    useQuerySettings("twitch-id");

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ shoutoutMessage: "msg" }),
    });
    await expect(captured.queryFn()).resolves.toEqual({
      shoutoutMessage: "msg",
    });

    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
    await expect(captured.queryFn()).resolves.toBeNull();
  });

  it("useMutateValidation calls validate endpoint with token", async () => {
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    axiosGetMock.mockResolvedValue({ data: {}, status: 200 });

    const { mutationFn } = useMutateValidation();
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
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    axiosGetMock.mockResolvedValue({ data: {}, status: 500 });

    const { mutationFn } = useMutateValidation();
    await expect(mutationFn("oauth-token")).rejects.toThrow(
      "Token is invalid"
    );
  });

  it("useMutateValidation throws on axios error", async () => {
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    isAxiosErrorMock.mockReturnValue(true);
    axiosGetMock.mockRejectedValue({ response: { data: "bad" } });

    const { mutationFn } = useMutateValidation();
    await expect(mutationFn("oauth-token")).rejects.toThrow("Failed to validate");
  });

  it("useMutateShoutout posts to twitch API", async () => {
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    axiosPostMock.mockResolvedValue({ data: {} });

    const { mutationFn } = useMutateShoutout();
    await mutationFn({
      token: "token",
      fromBroadcasterId: "from",
      toBroadcasterId: "to",
      moderatorId: "mod",
    });

    expect(axiosPostMock).toHaveBeenCalledWith(
      "https://api.twitch.tv/helix/chat/shoutouts",
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

  it("useMutateShoutout throws on axios error", async () => {
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    isAxiosErrorMock.mockReturnValue(true);
    axiosPostMock.mockRejectedValue({ response: { data: "bad" } });

    const { mutationFn } = useMutateShoutout();
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
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
    isAxiosErrorMock.mockReturnValue(false);
    axiosPostMock.mockRejectedValue(new Error("boom"));

    const { mutationFn } = useMutateShoutout();
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
    useMutationMock.mockImplementation(({ mutationFn }) => ({ mutationFn }));
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

    const { mutationFn } = useMutateSettings();
    const payload = {
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

    let captured: any;
    useMutationMock.mockImplementation((options) => {
      captured = options;
      return options;
    });
    useMutateSettings();

    captured.onError(new Error("boom"));
    expect(consoleSpy).toHaveBeenCalledWith("boom");

    captured.onError("raw-error");
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

    let captured: any;
    useMutationMock.mockImplementation((options) => {
      captured = options;
      return options;
    });
    useMutateSettings();

    const payload = {
      twitchId: "123",
      data: {
        targetChannelDisplayName: "name",
        targetChannelLoginName: "login",
        targetChannelId: "id",
        shoutoutMessage: "msg",
        isShoutoutCommandExecute: true,
      },
    };

    captured.onSuccess(payload);
    expect(setQueryDataMock).not.toHaveBeenCalled();

    getQueryDataMock.mockReturnValue({ ok: true });
    captured.onSuccess(payload);
    expect(setQueryDataMock).toHaveBeenCalledWith(
      ["settings", "123"],
      payload.data
    );
  });
});
