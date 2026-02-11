import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithCustomToken = vi.hoisted(() => vi.fn());
const mockGetIdTokenResult = vi.hoisted(() => vi.fn());

vi.mock("../firebase", () => ({
  auth: {
    currentUser: {
      getIdTokenResult: mockGetIdTokenResult,
    },
  },
}));

vi.mock("firebase/auth", () => ({
  signInWithCustomToken: mockSignInWithCustomToken,
}));

import { replaceText, wait, signInWithTwitch } from "./index";

describe("replaceText", () => {
  it("replaces placeholders with default labels when data is missing", () => {
    const result = replaceText(
      "Hello $displayname $loginname $category $title"
    );
    expect(result).toBe(
      "Hello (おなまえ) (URL) (カテゴリ) (配信タイトル)"
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
  });

  it("returns false when appToken is empty", async () => {
    const setBotUser = vi.fn();
    const result = await signInWithTwitch("", null, setBotUser);
    expect(result).toBe(false);
    expect(setBotUser).not.toHaveBeenCalled();
  });

  it("skips firebase sign-in when botUser already exists", async () => {
    const setBotUser = vi.fn();
    const result = await signInWithTwitch("token", {
      accessToken: "token",
      id: "1",
      displayName: "name",
      loginName: "login",
      icon: "icon",
    }, setBotUser);

    expect(result).toBe(true);
    expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
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
    const result = await signInWithTwitch("token", null, setBotUser);

    expect(result).toBe(true);
    expect(mockSignInWithCustomToken).toHaveBeenCalled();
    expect(setBotUser).toHaveBeenCalledWith({
      accessToken: "access",
      id: "twitch-id",
      displayName: "Display",
      loginName: "login",
      icon: "icon",
    });
  });
});
