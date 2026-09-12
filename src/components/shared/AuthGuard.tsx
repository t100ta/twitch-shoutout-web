import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../../firebase";
import useStore from "../../store";
import { syncBotUserFromCurrentUser } from "../../utils";
export const AuthGuard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const { botUser, clearBotUser, setBotUser } = useStore();
  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const current = ++revision;
      setLoading(true);
      queryClient.clear(); clearBotUser();
      if (!user) { if (active) setLoading(false); return; }
      const result = await syncBotUserFromCurrentUser((value) => {
        if (active && current === revision) setBotUser(value);
      });
      if (active && !result.ok && result.reason === "RECONNECT_REQUIRED") setRestoreError(true);
      if (!active || current !== revision) return;
      if (!result.ok) {
        setRestoreError(true);
        await signOut(auth);
      }
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [queryClient, clearBotUser, setBotUser, navigate]);
  useEffect(() => { if (!loading && !botUser) navigate(restoreError ? "/?auth_error=reconnect_required" : "/", { replace: true }); }, [loading, botUser, navigate, restoreError]);
  if (loading || !botUser) return <p>認証を確認中</p>;
  return <Outlet key={botUser.id} />;
};
