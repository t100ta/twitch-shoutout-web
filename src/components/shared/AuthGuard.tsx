import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import useStore from "../../store";
import { signInWithTwitch } from "../../utils";

export const AuthGuard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {
    appToken,
    clearAppToken: clearToken,
    clearBotUser,
    setBotUser,
  } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!getAuth().currentUser && appToken) {
        const signInResult = await signInWithTwitch(appToken, setBotUser);
        if (!signInResult.ok) {
          console.error("Cookie Login Error", signInResult.reason);
          clearToken();
          clearBotUser();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [appToken, clearToken, clearBotUser, setBotUser]);

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
