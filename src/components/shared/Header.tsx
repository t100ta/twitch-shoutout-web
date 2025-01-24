import { useNavigate } from "react-router-dom";
import useStore from "../../store";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import logo from "../../assets/logo.png";
import { header, headerLogo } from "./Header.css";

export const Header = () => {
  const navigate = useNavigate();
  const { clearAppToken: clearToken, clearBotUser } = useStore();

  const handleLogout = async () => {
    clearToken();
    clearBotUser();
    await signOut(auth);
    await navigate("/");
  };
  return (
    <header className={header}>
      <img src={logo} alt="logo" className={headerLogo} />
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};
