import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";
import { describe, expect, it } from "vite-plus/test";
import {
  buildHaloInboxBoard,
  resolveHaloInboxColumn,
  resolveHaloInboxDrop,
  type HaloInboxColumn,
} from "./haloInbox.logic";

const NOW = "2026-01-01T12:00:00.000Z";

function thread(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    environmentId: "env",
    archivedAt: null,
    settledOverride: null,
    snoozedUntil: null,
    snoozedAt: null,
    latestUserMessageAt: null,
    updatedAt: "2026-01-01T10:00:00.000Z",
    hasActionableProposedPlan: false,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    pendingSubagentRequest: null,
    pendingGuestMessageCount: 0,
    interactionMode: "default",
    latestRun: null,
    runtime: null,
    ...overrides,
  } as unknown as EnvironmentThreadShell;
}

const board = (
  threads: EnvironmentThreadShell[],
  pending: { key: string; column: HaloInboxColumn } | null = null,
) =>
  buildHaloInboxBoard(threads, {
    now: NOW,
    doneLimit: 2,
    configLoaded: () => true,
    lastVisitedAt: () => "2026-01-01T11:00:00.000Z",
    pending,
  });
const keys = (cards: readonly { thread: { id: string } }[]) => cards.map((card) => card.thread.id);

describe("resolveHaloInboxColumn", () => {
  it("places every status pill kind", () => {
    const column = (kind: string | null, parked = false) =>
      resolveHaloInboxColumn(kind === null ? null : ({ kind } as never), parked);
    expect(column("approval")).toBe("needs");
    expect(column("input")).toBe("needs");
    expect(column("guest")).toBe("needs");
    expect(column("plan-ready")).toBe("needs");
    expect(column("failed")).toBe("needs");
    expect(column("completed")).toBe("needs");
    expect(column("working")).toBe("running");
    expect(column("connecting")).toBe("running");
    expect(column("waiting")).toBe("running");
    expect(column(null)).toBe("done");
  });

  it("keeps parked threads in Done unless they are running", () => {
    expect(resolveHaloInboxColumn({ kind: "completed" }, true)).toBe("done");
    expect(resolveHaloInboxColumn({ kind: "plan-ready" }, true)).toBe("done");
    expect(resolveHaloInboxColumn({ kind: "approval" }, true)).toBe("done");
    expect(resolveHaloInboxColumn({ kind: "working" }, true)).toBe("running");
  });
});

describe("buildHaloInboxBoard", () => {
  it("derives columns from thread state", () => {
    const result = board([
      thread("approval", { hasPendingApprovals: true }),
      thread("working", { runtime: { status: "running" } }),
      thread("settled", { settledOverride: "settled" }),
      thread("snoozed", { snoozedUntil: "2026-01-02T00:00:00.000Z" }),
      thread("archived", { archivedAt: NOW, hasPendingApprovals: true }),
    ]);
    expect(keys(result.needs)).toEqual(["approval"]);
    expect(keys(result.running)).toEqual(["working"]);
    expect(result.done.map((card) => [card.thread.id, card.parked])).toEqual([
      ["settled", "settled"],
      ["snoozed", "snoozed"],
    ]);
  });

  it("keeps a settled card in Done while its request is still pending", () => {
    const result = board([thread("a", { hasPendingApprovals: true, settledOverride: "settled" })]);
    expect(result.needs).toEqual([]);
    expect(result.done[0]).toMatchObject({ parked: "settled", pill: { kind: "approval" } });
  });

  it("sorts newest first and caps Done", () => {
    const result = board([
      thread("a", { updatedAt: "2026-01-01T01:00:00.000Z" }),
      thread("b", { updatedAt: "2026-01-01T03:00:00.000Z" }),
      thread("c", { updatedAt: "2026-01-01T02:00:00.000Z" }),
    ]);
    expect(keys(result.done)).toEqual(["b", "c"]);
    expect(result.doneHidden).toBe(1);
  });

  it("shows a drop in flight in its target column", () => {
    const [card] = board([thread("a", { hasPendingApprovals: true })]).needs;
    const result = board([thread("a", { hasPendingApprovals: true })], {
      key: card!.key,
      column: "done",
    });
    expect(keys(result.done)).toEqual(["a"]);
    expect(result.needs).toEqual([]);
  });

  it("leaves settle state unknown until the environment config loads", () => {
    const result = buildHaloInboxBoard([thread("a", { settledOverride: "settled" })], {
      now: NOW,
      doneLimit: 5,
      configLoaded: () => false,
      lastVisitedAt: () => undefined,
    });
    expect(result.done[0]).toMatchObject({ parked: null, settleable: false });
  });
});

describe("resolveHaloInboxDrop", () => {
  const card = (column: HaloInboxColumn, parked: "settled" | "snoozed" | null = null) => ({
    column,
    parked,
    settleable: true,
  });

  it("settles cards that need you when dropped on Done", () => {
    expect(resolveHaloInboxDrop(card("needs"), "done")).toBe("settle");
    expect(resolveHaloInboxDrop(card("needs", "snoozed"), "done")).toBe("settle");
    expect(resolveHaloInboxDrop(card("running"), "done")).toBeNull();
    expect(resolveHaloInboxDrop(card("done"), "done")).toBeNull();
  });

  it("brings parked cards back when dropped on Running", () => {
    expect(resolveHaloInboxDrop(card("done", "settled"), "running")).toBe("unsettle");
    expect(resolveHaloInboxDrop(card("done", "snoozed"), "running")).toBe("unsnooze");
    expect(resolveHaloInboxDrop(card("done"), "running")).toBeNull();
  });

  it("never drops on Needs you or without a loaded config", () => {
    expect(resolveHaloInboxDrop(card("done", "settled"), "needs")).toBeNull();
    expect(
      resolveHaloInboxDrop({ column: "needs", parked: null, settleable: false }, "done"),
    ).toBeNull();
  });
});
