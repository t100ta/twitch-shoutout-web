import { expect, it } from "vitest";
import { connectionLabel } from "./connection";
it("shows connection, syncing, stopped, error and reconnect states", () => {
  expect(connectionLabel(null, null, "1")).toBe("Twitchとの再連携が必要");
  expect(connectionLabel({ status: "reconnect_required" }, null, "1")).toBe("Twitchとの再連携が必要");
  expect(connectionLabel({ status: "connected", targetId: "1" }, {}, "1")).toBe("稼働中");
  expect(connectionLabel({ status: "connected", targetId: "1" }, { automationEnabled: false }, "1")).toBe("停止中");
  expect(connectionLabel({ status: "connected", targetId: "1" }, { targetChannelId: "2" }, "1")).toBe("設定反映中");
  expect(connectionLabel({ status: "error" }, {}, "1")).toBe("接続エラー");
});
