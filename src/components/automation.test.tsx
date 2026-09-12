// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import useStore from "../store";
const mocks = vi.hoisted(() => ({ save: vi.fn(), callable: vi.fn(), settings: {
  targetChannelDisplayName: "Target", targetChannelLoginName: "target", targetChannelId: "2",
  shoutoutMessage: "Hi $displayname", isShoutoutCommandExecute: false, automationEnabled: true,
}, connection: { status: "connected", targetId: "2" } }));
vi.mock("../firebase", () => ({ functions: {} }));
vi.mock("firebase/functions", () => ({ httpsCallable: () => mocks.callable }));
vi.mock("../utils", () => ({ replaceText: (value: string) => value }));
vi.mock("./shared/Header", () => ({ Header: () => null }));
vi.mock("./edit/MessageCreator", () => ({ MessageCreator: ({ message }: { message: string }) => <p>{message}</p> }));
vi.mock("../hooks/useQuerySettings", () => ({ useQuerySettings: () => ({ data: mocks.settings, isLoading: false, isError: false }) }));
vi.mock("../hooks/useMutateSettings", () => ({ useMutateSettings: () => ({ mutateAsync: mocks.save, isPending: false }) }));
vi.mock("../hooks/useLiveDocument", () => ({ useLiveDocument: (collection: string) => ({ data: collection === "settings" ? mocks.settings : mocks.connection, loading: false, error: false }) }));
import { Home } from "./Home";
import { Edit } from "./edit/Edit";
import { TargetChannelFinder } from "./edit/TargetChannelFinder";
afterEach(cleanup);
beforeEach(() => {
  mocks.save.mockReset(); mocks.callable.mockReset(); mocks.settings.automationEnabled = true;
  useStore.getState().setBotUser({ id: "1", displayName: "User", loginName: "user", icon: "" });
});
it("turns background automation off and back on", async () => {
  const view = render(<MemoryRouter><Home /></MemoryRouter>);
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ twitchId: "1", data: { automationEnabled: false } }));
  mocks.settings.automationEnabled = false; view.rerender(<MemoryRouter><Home /></MemoryRouter>);
  expect(screen.getByRole("status").textContent).toBe("停止中");
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(mocks.save).toHaveBeenLastCalledWith({ twitchId: "1", data: { automationEnabled: true } }));
});
it("shows save failure and keeps the edit page open", async () => {
  mocks.save.mockRejectedValue(new Error("offline"));
  render(<MemoryRouter initialEntries={["/edit"]}><Routes><Route path="/edit" element={<Edit />} /><Route path="/home" element={<p>Home destination</p>} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "完了" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "保存に失敗しました。再度お試しください。");
  expect(screen.queryByText("Home destination")).toBeNull();
});
it("waits for saving before navigating and preserves the five existing settings", async () => {
  let finish!: () => void;
  mocks.save.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  render(<MemoryRouter initialEntries={["/edit"]}><Routes><Route path="/edit" element={<Edit />} /><Route path="/home" element={<p>Home destination</p>} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "完了" }));
  expect(screen.queryByText("Home destination")).toBeNull();
  expect(mocks.save).toHaveBeenCalledWith({ twitchId: "1", data: { targetChannelDisplayName: "Target", targetChannelLoginName: "target", targetChannelId: "2", shoutoutMessage: "Hi $displayname", isShoutoutCommandExecute: false } });
  finish(); expect(await screen.findByText("Home destination")).toBeDefined();
});
function Finder() {
  const [login, setLogin] = useState(""); const [name, setName] = useState(""); const [id, setId] = useState("");
  return <><TargetChannelFinder channelLoginName={login} channelDisplayName={name} setChannelLoginName={setLogin} setChannelDisplayName={setName} setId={setId} /><output>{id}</output></>;
}
it("looks up users through the callable and clears stale IDs when editing", async () => {
  mocks.callable.mockResolvedValue({ data: { id: "2", login: "target", display_name: "Target", profile_image_url: "" } });
  render(<Finder />); const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "target" } }); fireEvent.blur(input);
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("2"));
  expect(mocks.callable).toHaveBeenCalledWith({ login: "target" });
  fireEvent.change(input, { target: { value: "different" } }); expect(screen.getByRole("status").textContent).toBe("");
});
it("does not apply an in-flight lookup after the signed-in user changes", async () => {
  let finish!: (value: unknown) => void;
  mocks.callable.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<Finder />); fireEvent.change(screen.getByRole("textbox"), { target: { value: "target" } }); fireEvent.blur(screen.getByRole("textbox"));
  useStore.getState().setBotUser({ id: "9", displayName: "Other", loginName: "other", icon: "" });
  finish({ data: { id: "2", login: "target", display_name: "Target" } });
  await waitFor(() => expect(screen.queryByText("検索中")).toBeNull());
  expect(screen.getByRole("status").textContent).toBe("");
});
