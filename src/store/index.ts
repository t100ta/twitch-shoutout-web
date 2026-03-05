import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

type StoreState = UserSlice;
type SetStoreState = (
  partial:
    | Partial<StoreState>
    | ((state: StoreState) => Partial<StoreState>),
  replace?: false
) => void;

const createUserSlice = (set: SetStoreState): UserSlice => ({
  botUser: null,
  setBotUser: (state) => {
    set(() => ({ botUser: state }));
  },
  clearBotUser: () => {
    set(() => ({ botUser: null }));
  },
});

const useStore = create<UserSlice>()(
  devtools((set) => ({
    ...createUserSlice(set),
  }))
);

export default useStore;
