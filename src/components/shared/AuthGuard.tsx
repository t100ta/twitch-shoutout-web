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
    botUser,
    setBotUser,
  } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!getAuth().currentUser && appToken) {
        try {
          await signInWithTwitch(appToken, botUser, setBotUser);
        } catch (error) {
          console.error("Cookie Login Error", error);
          clearToken();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [appToken, clearToken]);

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
