import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import useStore from "../../store";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

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
    <>
      <img src={logo} alt="logo" />
      <button onClick={handleLogout}>ログアウト</button>
    </>
  );
};
