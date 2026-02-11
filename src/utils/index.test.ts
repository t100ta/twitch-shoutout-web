import { describe, it, expect, vi } from "vitest";

vi.mock("../firebase", () => ({
  auth: {},
}));

vi.mock("firebase/auth", () => ({
  signInWithCustomToken: vi.fn(),
}));

import { replaceText, wait } from "./index";

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
