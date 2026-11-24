import * as DateTime from "effect/DateTime";
import { describe, expect, it } from "vite-plus/test";
import { deriveHaloTraceLog, formatHaloTraceOffset } from "./haloTrace.logic";

const at = (iso: string) => DateTime.makeUnsafe(iso);
const item = (id: string, fields: Record<string, unknown>) =>
  ({
    id,
    title: null,
    status: "completed",
    startedAt: at("2026-01-01T00:00:01Z"),
    completedAt: at("2026-01-01T00:00:03Z"),
    ...fields,
  }) as never;

describe("deriveHaloTraceLog", () => {
  it("logs tool work with offsets, durations, and tones", () => {
    const log = deriveHaloTraceLog(
      [
        item("a", { type: "assistant_message" }),
        item("b", { type: "command_execution", input: "vp test run" }),
        item("c", { type: "file_change", fileName: "src/a.ts", status: "failed" }),
        item("d", { type: "approval_request", title: "Run git push", completedAt: null }),
        item("e", { type: "file_search" }),
      ],
      "2026-01-01T00:00:00Z",
      10,
    );
    expect(log).toEqual([
      { id: "b", label: "vp test run", tone: "ok", offsetMs: 1000, durationMs: 2000 },
      { id: "c", label: "src/a.ts", tone: "bad", offsetMs: 1000, durationMs: 2000 },
      { id: "d", label: "Run git push", tone: "need", offsetMs: 1000, durationMs: null },
    ]);
  });

  it("keeps the latest entries and tolerates a run without a start", () => {
    const log = deriveHaloTraceLog(
      [
        item("a", { type: "file_change", fileName: "a" }),
        item("b", { type: "file_change", fileName: "b", status: "running", completedAt: null }),
      ],
      null,
      1,
    );
    expect(log).toEqual([{ id: "b", label: "b", tone: "run", offsetMs: null, durationMs: null }]);
  });
});

describe("formatHaloTraceOffset", () => {
  it("formats minutes, seconds, and tenths", () => {
    expect(formatHaloTraceOffset(0)).toBe("0:00.0");
    expect(formatHaloTraceOffset(65_430)).toBe("1:05.4");
  });
});
