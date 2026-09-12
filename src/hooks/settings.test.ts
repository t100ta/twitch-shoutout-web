import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ setDoc: vi.fn(), invalidateQueries: vi.fn() }));
vi.mock("../firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({ collection: () => "settings", doc: (_ref: string, uid: string) => uid, setDoc: mocks.setDoc }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => mocks, useMutation: (options: unknown) => options }));
import { useMutateSettings } from "./useMutateSettings";
it("merges settings so automationEnabled and existing values survive partial saves", async () => {
  const options = useMutateSettings() as unknown as { mutationFn: (payload: unknown) => Promise<unknown>; onSuccess: (payload: unknown) => Promise<void> };
  const payload = { twitchId: "1", data: { automationEnabled: false } };
  await options.mutationFn(payload); expect(mocks.setDoc).toHaveBeenCalledWith("1", payload.data, { merge: true });
  await options.onSuccess(payload); expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["settings", "1"] });
});
it("propagates persistence failures to the screen", async () => {
  mocks.setDoc.mockRejectedValueOnce(new Error("offline"));
  const options = useMutateSettings() as unknown as { mutationFn: (payload: unknown) => Promise<unknown> };
  await expect(options.mutationFn({ twitchId: "1", data: {} })).rejects.toThrow("offline");
});
