import * as DateTime from "effect/DateTime";
import { describe, expect, it } from "vite-plus/test";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { haloOrbStateAnimates, resolveHaloOrbState, turnItemDurationMs } from "./halo.logic";

describe("resolveHaloOrbState", () => {
  it("maps every status pill kind", () => {
    expect(resolveHaloOrbState(null)).toBe("idle");
    expect(resolveHaloOrbState({ kind: "waiting" })).toBe("idle");
    expect(resolveHaloOrbState({ kind: "working" })).toBe("working");
    expect(resolveHaloOrbState({ kind: "connecting" })).toBe("thinking");
    expect(resolveHaloOrbState({ kind: "approval" })).toBe("approval");
    expect(resolveHaloOrbState({ kind: "input" })).toBe("input");
    expect(resolveHaloOrbState({ kind: "guest" })).toBe("input");
    expect(resolveHaloOrbState({ kind: "plan-ready" })).toBe("input");
    expect(resolveHaloOrbState({ kind: "failed" })).toBe("error");
    expect(resolveHaloOrbState({ kind: "completed" })).toBe("done");
  });

  it("keeps idle, done, and error static", () => {
    expect(haloOrbStateAnimates("idle")).toBe(false);
    expect(haloOrbStateAnimates("done")).toBe(false);
    expect(haloOrbStateAnimates("error")).toBe(false);
    expect(haloOrbStateAnimates("working")).toBe(true);
    expect(haloOrbStateAnimates("approval")).toBe(true);
  });
});

describe("turnItemDurationMs", () => {
  const at = (iso: string) => DateTime.makeUnsafe(iso);

  it("returns null until the item has both timestamps", () => {
    expect(turnItemDurationMs({ startedAt: null, completedAt: null })).toBeNull();
    expect(
      turnItemDurationMs({ startedAt: at("2026-01-01T00:00:00Z"), completedAt: null }),
    ).toBeNull();
  });

  it("hides instant items and clock skew", () => {
    expect(
      turnItemDurationMs({
        startedAt: at("2026-01-01T00:00:00Z"),
        completedAt: at("2026-01-01T00:00:00Z"),
      }),
    ).toBeNull();
    expect(
      turnItemDurationMs({
        startedAt: at("2026-01-01T00:00:05Z"),
        completedAt: at("2026-01-01T00:00:00Z"),
      }),
    ).toBeNull();
  });

  it("formats like the agent trail", () => {
    const duration = (end: string) =>
      formatDuration(
        turnItemDurationMs({ startedAt: at("2026-01-01T00:00:00Z"), completedAt: at(end) }) ?? -1,
      );
    expect(duration("2026-01-01T00:00:01.200Z")).toBe("1.2s");
    expect(duration("2026-01-01T00:00:14Z")).toBe("14s");
    expect(duration("2026-01-01T00:02:03Z")).toBe("2m 3s");
  });
});
