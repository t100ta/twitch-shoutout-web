import { getCookie, setCookie, removeCookie } from "typescript-cookie";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

const COOKIE_KEY = "auth_token";

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: "Strict" as const,
  path: "/",
  expires: 7,
};

type AuthSlice = {
  appToken: string;
  setAppToken: (token: string) => void;
  clearAppToken: () => void;
};
const createAuthSlice = (set: any): AuthSlice => ({
  appToken: getCookie(COOKIE_KEY) || "",
  setAppToken: (token) => {
    setCookie(COOKIE_KEY, token, COOKIE_OPTIONS);
    set({ appToken: token });
  },
  clearAppToken: () => {
    removeCookie(COOKIE_KEY, { path: "/" });
    set({ appToken: "" });
  },
});

export type BotUser = {
  accessToken: string;
  id: string;
  displayName: string;
  loginName: string;
  icon: string;
};

type UserSlice = {
  botUser: BotUser | null;
  setBotUser: (botUser: BotUser) => void;
  clearBotUser: () => void;
};
const createUserSlice = (set: any): UserSlice => ({
  botUser: null,
  setBotUser: (state) => {
    set(() => ({ botUser: state }));
  },
  clearBotUser: () => {
    set(() => ({
      botUser: {
        accessToken: "",
        id: "",
        displayName: "",
        loginName: "",
        icon: "",
      },
    }));
  },
});

const useStore = create<AuthSlice & UserSlice>()(
  devtools((set) => ({
    ...createAuthSlice(set),
    ...createUserSlice(set),
  }))
);

export default useStore;
