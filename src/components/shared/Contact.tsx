import { FaTwitch, FaXTwitter } from "react-icons/fa6";
import { contact, note, contactLinks } from "./Contact.css";

export const Contact = () => {
  return (
    <div className={contact}>
      <div className={note}>
        <p>実験的かつ個人趣味のためサポートしきれない場合がございます。</p>
        <p>
          予めご了承ください。質問等ございましたら、何らかの手段で開発兼管理者に気兼ねなく連絡ください。
        </p>
      </div>

      <div className={contactLinks}>
        <img
          src="https://static-cdn.jtvnw.net/jtv_user_pictures/2130d4f6-98ef-48a0-9c3f-07d510b09925-profile_image-300x300.png"
          alt="tom_t100ta"
          loading="lazy"
          title="にかなとむ"
        />
        <p>
          にかなとむ
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.twitch.tv/tom_t100ta"
          >
            <FaTwitch />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://x.com/tom_t100ta"
          >
            <FaXTwitter />
          </a>
        </p>
      </div>
    </div>
  );
};
