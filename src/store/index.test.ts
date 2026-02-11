import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetCookie = vi.hoisted(() => vi.fn());
const mockSetCookie = vi.hoisted(() => vi.fn());
const mockRemoveCookie = vi.hoisted(() => vi.fn());

vi.mock("typescript-cookie", () => ({
  getCookie: mockGetCookie,
  setCookie: mockSetCookie,
  removeCookie: mockRemoveCookie,
}));

const loadStore = async (cookieValue: string) => {
  mockGetCookie.mockReturnValue(cookieValue);
  const { default: useStore } = await import("./index");
  return useStore;
};

describe("store", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetCookie.mockReset();
    mockSetCookie.mockReset();
    mockRemoveCookie.mockReset();
  });

  it("initializes appToken from cookie", async () => {
    const useStore = await loadStore("cookie-token");
    expect(useStore.getState().appToken).toBe("cookie-token");
  });

  it("setAppToken updates state and writes cookie", async () => {
    const useStore = await loadStore("");
    useStore.getState().setAppToken("new-token");

    expect(useStore.getState().appToken).toBe("new-token");
    expect(mockSetCookie).toHaveBeenCalledWith(
      "auth_token",
      "new-token",
      expect.objectContaining({ path: "/", sameSite: "Strict", secure: true })
    );
  });

  it("clearAppToken clears state and removes cookie", async () => {
    const useStore = await loadStore("cookie-token");
    useStore.getState().clearAppToken();

    expect(useStore.getState().appToken).toBe("");
    expect(mockRemoveCookie).toHaveBeenCalledWith("auth_token", { path: "/" });
  });

  it("setBotUser and clearBotUser update botUser", async () => {
    const useStore = await loadStore("");
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
    expect(useStore.getState().botUser).toEqual({
      accessToken: "",
      id: "",
      displayName: "",
      loginName: "",
      icon: "",
    });
  });
});
