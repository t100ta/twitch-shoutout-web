import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { AUTH_API_URI } from "../constants";
import useStore from "../store";
import { Contact } from "./shared/Contact";
import { exchangeAuthCode, signInWithTwitch } from "../utils";
import logo from "../assets/logo.png";
import { logoStyle } from "./Logo.css";

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const { clearBotUser, setBotUser } = useStore();

  const authErrorText = useMemo(() => {
    const authError = searchParams.get("auth_error");
    if (!authError) {
      return "";
    }
    switch (authError) {
      case "invalid_request":
        return "認証リクエストが不正です。再度お試しください。";
      case "invalid_state":
        return "認証状態が不一致です。再度お試しください。";
      case "auth_failed":
        return "認証に失敗しました。再度お試しください。";
      default:
        return `認証エラーが発生しました（${authError}）。`;
    }
  }, [searchParams]);

  useEffect(() => {
    if (authErrorText) {
      setAuthErrorMessage(authErrorText);
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [authErrorText]);

  useEffect(() => {
    const authCode = searchParams.get("auth_code");
    if (authCode) {
      (async () => {
        try {
          const customToken = await exchangeAuthCode(authCode);
          const signInResult = await signInWithTwitch(customToken, setBotUser);
          if (signInResult.ok) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
            navigate("/home");
            return;
          }

          console.error("Firebase login error:", signInResult.reason);
        } catch (error) {
          console.error("Auth code exchange failed:", error);
        }

        alert("ログインに失敗しました。");
        clearBotUser();
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      })();
    }
  }, [searchParams, navigate, clearBotUser, setBotUser]);

  useEffect(() => {
    if (authErrorText) {
      return;
    }
    (async () => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return;
      }
      const idTokenResult = await currentUser.getIdTokenResult();
      const claims = idTokenResult.claims;
      if (claims?.twitch_id) {
        navigate("/home");
      }
    })().catch((error) => {
      console.error("Auto login check failed:", error);
    });
  }, [authErrorText, navigate]);

  const handleLoginWithTwitch = () =>
    (window.location.href = `${AUTH_API_URI}/authWithTwitch`);
  return (
    <>
      <img src={logo} alt="logo" className={logoStyle} />
      {authErrorMessage ? <p>{authErrorMessage}</p> : null}
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
