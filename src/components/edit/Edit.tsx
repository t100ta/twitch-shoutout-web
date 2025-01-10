import { useRef, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "../shared/Header";
import { MessageCreator } from "./MessageCreator";
import { TargetChannelFinder } from "./TargetChannelFinder";
import useStore from "../../store";
import { useMutateSettings } from "../../hooks/useMutateSettings";
import { useQuerySettings } from "../../hooks/useQuerySettings";

export const Edit = () => {
  const queryClient = useQueryClient();
  const botUser = useStore((state) => state.botUser);
  const ACCESS_TOKEN = botUser?.accessToken as string;
  const ID = botUser?.id as string;

  const navigate = useNavigate();
  const createSettingsMutation = useMutateSettings();

  const userSettings = useQuerySettings(ID).data;
  const [targetChannelDisplayName, setTargetChannelName] = useState(
    userSettings?.targetChannelDisplayName ?? ""
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

  const handleShowModal = (modal: React.RefObject<HTMLDialogElement>) =>
    modal.current?.showModal();
  const handleCloseModal = (modal: React.RefObject<HTMLDialogElement>) =>
    modal.current?.close();

  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const backHome = () => navigate("/home");

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createSettingsMutation.mutateAsync({
      twitchId: ID,
      data: {
        targetChannelDisplayName: targetChannelDisplayName,
        targetChannelId: targetChannelId,
        shoutoutMessage: shoutoutMessage,
        isShoutoutCommandExecute: isCommandExecuteChecked,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["settings", ID] });

    navigate("/home");
  };

  return (
    <>
      <Header />
      <form onSubmit={save}>
        <h1>編集</h1>
        <TargetChannelFinder
          accessToken={ACCESS_TOKEN}
          channelName={targetChannelDisplayName}
          setChannelName={setTargetChannelName}
          setId={setTargetChannelId}
        />
        <MessageCreator
          accessToken={ACCESS_TOKEN}
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
          disabled={!targetChannelDisplayName || !shoutoutMessage}
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
