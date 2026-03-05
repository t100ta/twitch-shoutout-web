import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import useStore from "../../store";
import { syncBotUserFromCurrentUser } from "../../utils";

export const AuthGuard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { clearBotUser, setBotUser } = useStore();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearBotUser();
        setIsLoading(false);
        return;
      }

      const syncResult = await syncBotUserFromCurrentUser(setBotUser);
      if (!syncResult.ok) {
        console.error("Auth restore error:", syncResult.reason);
        clearBotUser();
        await signOut(auth);
      }

      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [clearBotUser, setBotUser]);

  useEffect(() => {
    if (!getAuth().currentUser && !isLoading) {
      navigate("/");
    }
  }, [navigate, isLoading]);

  if (isLoading) {
    return <div>Auth Checking...</div>;
  }

  return <Outlet />;
};
