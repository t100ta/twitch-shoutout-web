import { useRef, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSettings } from "../../types";
import { Header } from "../shared/Header";
import { MessageCreator } from "./MessageCreator";
import { TargetChannelFinder } from "./TargetChannelFinder";
import useStore from "../../store";
import { useMutateSettings } from "../../hooks/useMutateSettings";
import { useQuerySettings } from "../../hooks/useQuerySettings";

export const Edit = () => {
  const uid = useStore((state) => state.botUser?.id);
  const query = useQuerySettings(uid || "");
  if (query.isLoading) return <p>読み込み中</p>;
  if (query.isError) return <p role="alert">設定の取得に失敗しました。</p>;
  if (!uid) return null;
  return <EditForm key={uid} userSettings={query.data} />;
};
const EditForm = ({ userSettings }: { userSettings: UserSettings | null | undefined }) => {
  const botUser = useStore((state) => state.botUser);
  const ID = botUser?.id as string;

  const navigate = useNavigate();
  const createSettingsMutation = useMutateSettings();

  const [saveError, setSaveError] = useState("");
  const [targetChannelDisplayName, setTargetChannelDisplayName] = useState(
    userSettings?.targetChannelDisplayName ?? ""
  );
  const [targetChannelLoginName, setTargetChannelLoginName] = useState(
    userSettings?.targetChannelLoginName ?? ""
  );
  const [targetChannelId, setTargetChannelId] = useState(
    userSettings?.targetChannelId ?? ""
  );
  const [shoutoutMessage, setShoutoutMessage] = useState(
    userSettings?.shoutoutMessage ?? ""
  );
  const [isCommandExecuteChecked, setIsCommandExecuteChecked] = useState(
    userSettings?.isShoutoutCommandExecute ?? false
  );

  const handleShowModal = (
    modal: React.RefObject<HTMLDialogElement | null>
  ) =>
    modal.current?.showModal();
  const handleCloseModal = (
    modal: React.RefObject<HTMLDialogElement | null>
  ) =>
    modal.current?.close();

  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const backHome = () => navigate("/home");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");
    try {
    await createSettingsMutation.mutateAsync({
      twitchId: ID,
      data: {
        targetChannelDisplayName: targetChannelDisplayName,
        targetChannelLoginName: targetChannelLoginName,
        targetChannelId: targetChannelId,
        shoutoutMessage: shoutoutMessage,
        isShoutoutCommandExecute: isCommandExecuteChecked,
      },
    });
    navigate("/home");
    } catch { setSaveError("保存に失敗しました。再度お試しください。"); }
  };

  return (
    <>
      <Header />
      <form onSubmit={save}>
        <h1>編集</h1>
        {saveError && <p role="alert">{saveError}</p>}
        <TargetChannelFinder
          channelLoginName={targetChannelLoginName}
          channelDisplayName={targetChannelDisplayName}
          setChannelLoginName={setTargetChannelLoginName}
          setChannelDisplayName={setTargetChannelDisplayName}
          setId={setTargetChannelId}
        />
        <MessageCreator
          message={shoutoutMessage}
          setMessage={setShoutoutMessage}
          handleCloseModal={handleCloseModal}
          handleShowModal={handleShowModal}
        />

        <h2>/shoutoutコマンド</h2>
        <span>
          メッセージ投稿のあとにTwitchのshoutoutコマンドを自動実行しますか？
        </span>
        <input
          type="checkbox"
          checked={isCommandExecuteChecked}
          onChange={(event) => setIsCommandExecuteChecked(event.target.checked)}
        />

        <button
          type="submit"
          disabled={createSettingsMutation.isPending || (!!targetChannelLoginName && !targetChannelId) || !shoutoutMessage}
        >
          完了
        </button>
        <button type="button" onClick={() => handleShowModal(cancelDialogRef)}>
          キャンセル
        </button>
        <dialog ref={cancelDialogRef}>
          <h2>修正せずに終了しますか？</h2>
          <button type="button" onClick={() => backHome()}>
            終了する
          </button>
          <button
            type="button"
            onClick={() => handleCloseModal(cancelDialogRef)}
          >
            キャンセル
          </button>
        </dialog>
      </form>
    </>
  );
};
