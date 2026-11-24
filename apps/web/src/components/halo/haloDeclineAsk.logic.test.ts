import { describe, expect, it } from "vite-plus/test";
import { haloDeclineAskVisible } from "./haloDeclineAsk.logic";

const ask = { threadKey: "env:thread-1", runId: "run-1" };
const current = {
  haloExperience: true,
  threadKey: "env:thread-1",
  runId: "run-1",
  approvalPending: false,
};

describe("haloDeclineAskVisible", () => {
  it("shows for the declined run of the same thread under Halo", () => {
    expect(haloDeclineAskVisible(ask, current)).toBe(true);
  });

  it("lapses on a new run, another thread, a new approval, or another theme", () => {
    expect(haloDeclineAskVisible(null, current)).toBe(false);
    expect(haloDeclineAskVisible(ask, { ...current, runId: "run-2" })).toBe(false);
    expect(haloDeclineAskVisible(ask, { ...current, threadKey: "env:thread-2" })).toBe(false);
    expect(haloDeclineAskVisible(ask, { ...current, approvalPending: true })).toBe(false);
    expect(haloDeclineAskVisible(ask, { ...current, haloExperience: false })).toBe(false);
  });
});
