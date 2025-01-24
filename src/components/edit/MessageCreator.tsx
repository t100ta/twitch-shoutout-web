import { RefObject, useRef, useState } from "react";
import { VariablesAddButton } from "./VariablesAddButton";
import { replaceText } from "../../utils";
import { displayTextStyle } from "./MessageCreator.css";

type Props = {
  accessToken: string;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  handleCloseModal: (modal: RefObject<HTMLDialogElement>) => void;
  handleShowModal: (modal: RefObject<HTMLDialogElement>) => void;
};

export const MessageCreator = (props: Props) => {
  const [displayText, setDisplayText] = useState(replaceText(props.message));

  const setBundler = (s: string) => {
    props.setMessage(s);
    setDisplayText(replaceText(s));
  };

  const presetDialogRef = useRef<HTMLDialogElement>(null);
  const overwriteByPreset = () => {
    setBundler(
      "◆◆◆ Thanks for the raid! $displayname さん( https://www.twitch.tv/$loginname ). | $category -$title"
    );
    props.handleCloseModal(presetDialogRef);
  };
  return (
    <>
      <h2>メッセージ</h2>
      <span>メッセージの見え方例(スタンプは反映されません)</span>
      <p className={displayTextStyle}>{displayText}</p>
      <div className="button-box">
        <VariablesAddButton
          labelName="表示名"
          clickFunc={() => setBundler(props.message + "$displayname")}
        />
        <VariablesAddButton
          labelName="ID"
          clickFunc={() => setBundler(props.message + "$loginname")}
        />
        <VariablesAddButton
          labelName="カテゴリ"
          clickFunc={() => setBundler(props.message + "$category")}
        />
        <VariablesAddButton
          labelName="タイトル"
          clickFunc={() => setBundler(props.message + "$title")}
        />
        ///
        <button
          type="button"
          onClick={() => props.handleShowModal(presetDialogRef)}
        >
          プリセットを使う
        </button>
        <dialog ref={presetDialogRef}>
          <h2>プリセットで上書きしますか？</h2>
          <button type="button" onClick={() => overwriteByPreset()}>
            上書きする
          </button>
          <button
            type="button"
            onClick={() => props.handleCloseModal(presetDialogRef)}
          >
            キャンセル
          </button>
        </dialog>
      </div>
      <textarea
        placeholder="4つの変数ボタンを使うと、Raidしてきた配信者情報をメッセージに組み込めます"
        value={props.message}
        onChange={(event) => setBundler(event.target.value)}
      ></textarea>
    </>
  );
};
