import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { UserSettings } from "../types";

// 内部IDで管理する
export const useQuerySettings = (twitchId: string) => {
  const getSettings = async () => {
    const docRef = doc(db, "settings", twitchId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      console.error("No Settings document");
      return null;
    }
  };
  return useQuery({
    queryKey: ["settings", twitchId],
    queryFn: getSettings,
    enabled: !!twitchId,
    gcTime: 1000 * 60 * 5,
  });
};
