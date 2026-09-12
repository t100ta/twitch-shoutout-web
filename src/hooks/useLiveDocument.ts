import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
export function useLiveDocument<T>(collection: string, uid: string | undefined) {
  const key = `${collection}/${uid}`;
  const [snapshot, setSnapshot] = useState<{ key: string; data: T | null; error: boolean }>();
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, collection, uid),
      (value) => setSnapshot({ key, data: value.exists() ? value.data() as T : null, error: false }),
      () => setSnapshot({ key, data: null, error: true }));
  }, [collection, uid, key]);
  return { data: snapshot?.key === key ? snapshot.data : null,
    error: snapshot?.key === key && snapshot.error, loading: !!uid && snapshot?.key !== key };
}
