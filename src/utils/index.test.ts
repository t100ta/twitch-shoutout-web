import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithCustomToken = vi.hoisted(() => vi.fn());
const mockGetIdTokenResult = vi.hoisted(() => vi.fn());
const axiosPostMock = vi.hoisted(() => vi.fn());
const mockAuth: { currentUser: null | { getIdTokenResult: typeof mockGetIdTokenResult } } = vi.hoisted(() => ({
  currentUser: {
    getIdTokenResult: mockGetIdTokenResult,
  },
}));

vi.mock("../firebase", () => ({
  auth: mockAuth,
}));

vi.mock("firebase/auth", () => ({
  signInWithCustomToken: mockSignInWithCustomToken,
}));

vi.mock("axios", () => ({
  default: {
    post: axiosPostMock,
  },
}));

vi.mock("../constants", () => ({
  AUTH_API_URI: "https://auth.example.com",
}));

import {
  exchangeAuthCode,
  replaceText,
  signInWithTwitch,
  syncBotUserFromCurrentUser,
  wait,
} from "./index";
describe("replaceText", () => {
  it("replaces placeholders with default labels when data is missing", () => {
    const result = replaceText(
      "Hello $displayname $loginname $category $title"
    );
    expect(result).toBe(
      "Hello (おなまえ) (ユーザーID) (カテゴリ) (配信タイトル)"
    );
  });

  it("replaces placeholders with provided data", () => {
    const result = replaceText("Hi $displayname ($loginname)", {
      displayName: "Alice",
      name: "alice_id",
      game: "Game",
      title: "Stream",
    });
    expect(result).toBe("Hi Alice (alice_id)");
  });

  it("replaces multiple occurrences of the same placeholder", () => {
    const result = replaceText("$displayname - $displayname", {
      displayName: "Bob",
      name: "bob",
      game: "Game",
      title: "Title",
    });
    expect(result).toBe("Bob - Bob");
  });
});

describe("wait", () => {
  it("resolves after the given milliseconds", async () => {
    vi.useFakeTimers();
    const done = wait(1000);

    vi.advanceTimersByTime(1000);
    await expect(done).resolves.toBeUndefined();

    vi.useRealTimers();
  });
});

describe("signInWithTwitch", () => {
  beforeEach(() => {
    mockSignInWithCustomToken.mockReset();
    mockGetIdTokenResult.mockReset();
    axiosPostMock.mockReset();
    mockAuth.currentUser = {
      getIdTokenResult: mockGetIdTokenResult,
    };
  });

  it("returns false when custom token is empty", async () => {
    const setBotUser = vi.fn();
    const result = await signInWithTwitch("", setBotUser);
    expect(result).toEqual({ ok: false, reason: "CUSTOM_TOKEN_MISSING" });
    expect(setBotUser).not.toHaveBeenCalled();
  });

  it("signs in and sets bot user from claims", async () => {
    mockSignInWithCustomToken.mockResolvedValue(undefined);
    mockGetIdTokenResult.mockResolvedValue({
      claims: {
        twitch_access_token: "access",
        twitch_id: "twitch-id",
        twitch_display_name: "Display",
        twitch_login_name: "login",
        twitch_icon: "icon",
      },
    });

    const setBotUser = vi.fn();
    const result = await signInWithTwitch("token", setBotUser);

    expect(result).toEqual({ ok: true });
    expect(mockSignInWithCustomToken).toHaveBeenCalled();
    expect(setBotUser).toHaveBeenCalledWith({
      accessToken: "access",
      id: "twitch-id",
      displayName: "Display",
      loginName: "login",
      icon: "icon",
    });
  });

  it("handles sign-in errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignInWithCustomToken.mockRejectedValue(new Error("boom"));

    const setBotUser = vi.fn();
    const result = await signInWithTwitch("token", setBotUser);

    expect(result).toEqual({ ok: false, reason: "SIGN_IN_FAILED" });
    expect(setBotUser).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("returns failure when custom token sign-in succeeds but currentUser is missing", async () => {
    mockSignInWithCustomToken.mockResolvedValue(undefined);
    mockAuth.currentUser = null;

    const setBotUser = vi.fn();
    const result = await signInWithTwitch("token", setBotUser);

    expect(result).toEqual({ ok: false, reason: "CURRENT_USER_MISSING" });
    expect(setBotUser).not.toHaveBeenCalled();
  });

  it("returns failure when required claims are missing", async () => {
    mockSignInWithCustomToken.mockResolvedValue(undefined);
    mockGetIdTokenResult.mockResolvedValue({
      claims: {
        twitch_access_token: "access",
        twitch_id: "twitch-id",
      },
    });

    const setBotUser = vi.fn();
    const result = await signInWithTwitch("token", setBotUser);

    expect(result).toEqual({ ok: false, reason: "CLAIMS_MISSING" });
    expect(setBotUser).not.toHaveBeenCalled();
  });
});

describe("syncBotUserFromCurrentUser", () => {
  beforeEach(() => {
    mockGetIdTokenResult.mockReset();
    mockAuth.currentUser = {
      getIdTokenResult: mockGetIdTokenResult,
    };
  });

  it("returns failure when currentUser is missing", async () => {
    mockAuth.currentUser = null;
    const setBotUser = vi.fn();
    const result = await syncBotUserFromCurrentUser(setBotUser);
    expect(result).toEqual({ ok: false, reason: "CURRENT_USER_MISSING" });
    expect(setBotUser).not.toHaveBeenCalled();
  });
});

describe("exchangeAuthCode", () => {
  beforeEach(() => {
    axiosPostMock.mockReset();
  });

  it("calls exchange endpoint and returns custom token", async () => {
    axiosPostMock.mockResolvedValue({ data: { customToken: "firebase-token" } });
    await expect(exchangeAuthCode("auth-code")).resolves.toBe("firebase-token");
    expect(axiosPostMock).toHaveBeenCalledWith(
      "https://auth.example.com/exchange",
      { authCode: "auth-code" }
    );
  });

  it("throws when auth code is missing", async () => {
    await expect(exchangeAuthCode("")).rejects.toThrow("AUTH_CODE_MISSING");
  });
});
