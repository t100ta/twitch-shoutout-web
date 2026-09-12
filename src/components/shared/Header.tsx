import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useStore from "../../store";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import logo from "../../assets/logo.png";
import { header, headerLogo } from "./Header.css";

export const Header = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearBotUser } = useStore();

  const handleLogout = async () => {
    queryClient.clear();
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
