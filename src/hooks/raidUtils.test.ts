import { describe, it, expect } from "vitest";
import {
  getRaidInfo,
  normalizeLoginName,
  shouldReuseClient,
  toIrcPassword,
} from "../utils/raidUtils";

describe("raidUtils", () => {
  it("getRaidInfo returns null when not raid", () => {
    const result = getRaidInfo("channel", { "msg-id": "sub" });
    expect(result).toBeNull();
  });

  it("getRaidInfo returns null when login missing", () => {
    const result = getRaidInfo("channel", { "msg-id": "raid" });
    expect(result).toBeNull();
  });

  it("getRaidInfo falls back to login tag when msg-param-login is missing", () => {
    const result = getRaidInfo("channel", {
      "msg-id": "raid",
      "login": "raider",
      "msg-param-displayName": "Raider Name",
    });
    expect(result).toEqual({
      channel: "channel",
      login: "raider",
      displayName: "Raider Name",
    });
  });

  it("getRaidInfo returns raid info with displayName fallback", () => {
    const result = getRaidInfo("channel", {
      "msg-id": "raid",
      "msg-param-login": "raider",
    });
    expect(result).toEqual({
      channel: "channel",
      login: "raider",
      displayName: "raider",
    });
  });

  it("getRaidInfo returns raid info with displayName", () => {
    const result = getRaidInfo("channel", {
      "msg-id": "raid",
      "msg-param-login": "raider",
      "msg-param-displayName": "Raider Name",
    });
    expect(result).toEqual({
      channel: "channel",
      login: "raider",
      displayName: "Raider Name",
    });
  });

  it("getRaidInfo normalizes raider login", () => {
    const result = getRaidInfo("channel", {
      "msg-id": "raid",
      "msg-param-login": "#Raider",
      "msg-param-displayName": "Raider Name",
    });
    expect(result).toEqual({
      channel: "channel",
      login: "raider",
      displayName: "Raider Name",
    });
  });

  it("shouldReuseClient returns true only when open and same channel", () => {
    expect(shouldReuseClient("OPEN", "a", "a")).toBe(true);
    expect(shouldReuseClient("CLOSED", "a", "a")).toBe(false);
    expect(shouldReuseClient("OPEN", "a", "b")).toBe(false);
  });

  it("toIrcPassword adds oauth prefix when missing", () => {
    expect(toIrcPassword("token")).toBe("oauth:token");
  });

  it("toIrcPassword keeps oauth prefix when already exists", () => {
    expect(toIrcPassword("oauth:token")).toBe("oauth:token");
  });

  it("normalizeLoginName removes hash and lowercases", () => {
    expect(normalizeLoginName(" #Tom_T100TA ")).toBe("tom_t100ta");
  });
});
