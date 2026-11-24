import { RuntimeRequestId } from "@t3tools/contracts";
import { compileResolvedKeybindingsConfig, DEFAULT_KEYBINDINGS } from "@t3tools/shared/keybindings";
import { describe, expect, it } from "vite-plus/test";

import { resolveShortcutCommand } from "../../keybindings";
import type { PendingApproval } from "../../session-logic";
import { approvalRequestForShortcut } from "./approvalShortcut";

const requestId = RuntimeRequestId.make("request-1");
const approval: PendingApproval = {
  requestId,
  requestKind: "command",
  createdAt: "2026-01-01T00:00:00.000Z",
  responseCapability: "live",
};
const ready = {
  haloExperience: true,
  approval,
  canOperateThread: true,
  respondingRequestIds: [],
  repeat: false,
};

describe("approvalRequestForShortcut", () => {
  it("approves a live request with the default options", () => {
    expect(approvalRequestForShortcut(ready)).toBe(requestId);
  });

  it.each([
    ["Halo off", { haloExperience: false }],
    ["no approval", { approval: null }],
    ["no operate permission", { canOperateThread: false }],
    ["key repeat", { repeat: true }],
    ["already responding", { respondingRequestIds: [requestId] }],
    ["provider gone", { approval: { ...approval, responseCapability: "not_resumable" as const } }],
    [
      "no accept option",
      { approval: { ...approval, options: [{ decision: "decline" as const, label: "No" }] } },
    ],
    [
      "accept carries a warning",
      {
        approval: {
          ...approval,
          options: [{ decision: "accept" as const, label: "Yes", warning: "Risky" }],
        },
      },
    ],
  ])("lets the key through: %s", (_name, override) => {
    expect(approvalRequestForShortcut({ ...ready, ...override })).toBeNull();
  });
});

describe("thread.approve default binding", () => {
  const press = {
    key: "Enter",
    code: "Enter",
    metaKey: true,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };
  const context = {
    approvalPending: true,
    haloExperience: true,
    composerFocus: true,
    editableFocus: true,
    turnRunning: true,
    composerEmpty: true,
  };
  const resolve = (rules: typeof DEFAULT_KEYBINDINGS, overrides: Record<string, boolean> = {}) =>
    resolveShortcutCommand(press, compileResolvedKeybindingsConfig(rules), {
      platform: "MacIntel",
      context: { ...context, ...overrides },
    });

  it("approves from an empty focused composer", () => {
    expect(resolve(DEFAULT_KEYBINDINGS)).toBe("thread.approve");
  });

  it("keeps Mod+Enter for the composer when it has text or Halo is off", () => {
    expect(resolve(DEFAULT_KEYBINDINGS, { composerEmpty: false })).toBe("composer.sendAlternate");
    expect(resolve(DEFAULT_KEYBINDINGS, { haloExperience: false })).toBe("composer.sendAlternate");
  });

  it("approves outside a text field", () => {
    expect(
      resolve(DEFAULT_KEYBINDINGS, {
        composerFocus: false,
        editableFocus: false,
        composerEmpty: false,
      }),
    ).toBe("thread.approve");
  });

  // The server prepends a new default to an older saved config, so the saved composer rule wins;
  // ChatView's composer.sendAlternate handler approves in that case.
  it("resolves to composer.sendAlternate for a config saved before thread.approve", () => {
    const approve = DEFAULT_KEYBINDINGS.filter((rule) => rule.command === "thread.approve");
    const saved = DEFAULT_KEYBINDINGS.filter((rule) => rule.command !== "thread.approve");
    expect(approve).toHaveLength(1);
    expect(resolve([...approve, ...saved])).toBe("composer.sendAlternate");
  });
});
