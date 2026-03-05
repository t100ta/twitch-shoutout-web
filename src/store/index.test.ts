import { describe, it, expect, vi, beforeEach } from "vitest";

const loadStore = async () => {
  const { default: useStore } = await import("./index");
  return useStore;
};

describe("store", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("initializes botUser as null", async () => {
    const useStore = await loadStore();
    expect(useStore.getState().botUser).toBeNull();
  });

  it("setBotUser and clearBotUser update botUser", async () => {
    const useStore = await loadStore();
    useStore.getState().setBotUser({
      accessToken: "access",
      id: "id",
      displayName: "display",
      loginName: "login",
      icon: "icon",
    });

    expect(useStore.getState().botUser).toEqual({
      accessToken: "access",
      id: "id",
      displayName: "display",
      loginName: "login",
      icon: "icon",
    });

    useStore.getState().clearBotUser();
    expect(useStore.getState().botUser).toBeNull();
  });
});
