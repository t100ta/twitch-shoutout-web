import { describe, it, expect, vi, beforeEach } from "vitest";

const useQueryMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());

const axiosGetMock = vi.hoisted(() => vi.fn());
const axiosPostMock = vi.hoisted(() => vi.fn());

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
    isAxiosError: () => false,
  },
  HttpStatusCode: {
    Ok: 200,
  },
  isAxiosError: () => false,
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
});
