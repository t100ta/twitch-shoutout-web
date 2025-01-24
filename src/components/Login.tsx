import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AUTH_API_URI } from "../constants";
import useStore from "../store";
import { Contact } from "./shared/Contact";
import { signInWithTwitch } from "../utils";
import { auth } from "../firebase";
import logo from "../assets/logo.png";
import { logoStyle } from "./Logo.css";

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    appToken,
    setAppToken: setToken,
    clearAppToken: clearToken,
    botUser,
    setBotUser,
  } = useStore();

  useEffect(() => {
    const appTokenFromParams = searchParams.get("app_token");
    const token = appTokenFromParams || appToken;
    if (token) {
      (async () => {
        try {
          await signInWithTwitch(token, botUser, setBotUser);
          setToken(token);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          navigate("/home");
        } catch (error) {
          console.error("Firebase login error:", error);
          alert("ログインに失敗しました。");
          clearToken();
        }
      })();
    }
  }, [searchParams, navigate, auth, appToken, setToken, clearToken, botUser]);

  const handleLoginWithTwitch = () =>
    (window.location.href = `${AUTH_API_URI}/authWithTwitch`);
  return (
    <>
      <img src={logo} alt="logo" className={logoStyle} />
      <div>
        <p>Twitchアカウントと連携すると使えます。</p>
        <p>
          連携したアカウントのチャンネルに来るRaidを検知し、連携したアカウントでメッセージをチャットに投稿します。
        </p>
        <button onClick={handleLoginWithTwitch}>
          Twitchアカウントでログイン
        </button>
        <Contact />
      </div>
    </>
  );
};
