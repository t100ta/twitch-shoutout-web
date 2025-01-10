import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, doc, setDoc } from "firebase/firestore";
import { UserSettings } from "../types";
import { db } from "../firebase";

/**
 * keyはTwitch内部ID
 */
export const useMutateSettings = () => {
  const queryClient = useQueryClient();
  /**
   * 同名ドキュメントが存在している場合は、マージオプションがない限りそのまま上書き
   * https://firebase.google.com/docs/firestore/manage-data/add-data?hl=ja
   */
  const createSettingsMutation = useMutation({
    mutationFn: async (payload: { twitchId: string; data: UserSettings }) => {
      const settingsRef = collection(db, "settings");
      await setDoc(doc(settingsRef, payload.twitchId), payload.data);
      return payload;
    },
    onSuccess: (payload) => {
      const previousSettings = queryClient.getQueryData([
        "settings",
        payload.twitchId,
      ]);
      if (previousSettings) {
        queryClient.setQueryData(["settings", payload.twitchId], payload.data);
      }
    },
    onError: (err: any) => {
      console.log(err.response.data.message);
    },
  });
  return createSettingsMutation;
};
