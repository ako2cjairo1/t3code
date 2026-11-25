import { describe, expect, it } from "vite-plus/test";
import type { MessagesTimelineRow } from "../chat/MessagesTimeline.logic";
import { haloTrailSlots, haloTrailStepState } from "./haloTrail.logic";

const row = (kind: string, runId: string | null = "r1") => ({ kind, runId });

describe("haloTrailSlots", () => {
  it("marks adjacent trail rows first / middle / last and leaves other rows out", () => {
    expect(
      haloTrailSlots([
        row("message"),
        row("work-toggle"),
        row("work"),
        row("work-live"),
        row("thinking"),
      ]),
    ).toEqual([
      null,
      { position: "first", head: true },
      { position: "middle", head: false },
      { position: "last", head: false },
      null,
    ]);
  });

  it("a lone row is the whole card", () => {
    expect(haloTrailSlots([row("work")])).toEqual([{ position: "only", head: true }]);
  });

  it("only a run's first segment carries the header", () => {
    expect(
      haloTrailSlots([
        row("work", "r1"),
        row("message", "r1"),
        row("work", "r1"),
        row("message", null),
        row("work", "r2"),
        row("work-toggle", "r2"),
      ]).map((slot) => slot && `${slot.position}:${slot.head}`),
    ).toEqual(["only:true", null, "only:false", null, "first:true", "last:false"]);
  });

  it("runless segments each get their own header", () => {
    expect(
      haloTrailSlots([row("work", null), row("event", null), row("work", null)]).map(
        (slot) => slot?.head ?? null,
      ),
    ).toEqual([true, null, true]);
  });
});

describe("haloTrailStepState", () => {
  const work = (...statuses: Array<"completed" | "stopped" | "failed">) =>
    ({
      kind: "work",
      groupedEntries: statuses.map((toolLifecycleStatus, index) => ({
        id: `e${index}`,
        tone: "tool",
        toolLifecycleStatus,
      })),
    }) as unknown as MessagesTimelineRow;
  const none = new Map<string, unknown>();

  it("marks a step the user stopped, but keeps tools that finished before Stop done", () => {
    expect(haloTrailStepState(work("completed", "stopped"), none)).toBe("stopped");
    expect(haloTrailStepState(work("completed"), none)).toBe("done");
  });

  it("runtime notices never read as a finished step", () => {
    const notice = (sourceActivityKind: string) =>
      ({
        kind: "work",
        groupedEntries: [
          { id: "n", tone: "info", toolLifecycleStatus: "completed", sourceActivityKind },
        ],
      }) as unknown as MessagesTimelineRow;
    expect(haloTrailStepState(notice("runtime.error"), none)).toBe("bad");
    expect(haloTrailStepState(notice("runtime.warning"), none)).toBe("note");
  });

  it("a collapsed group whose latest tool was stopped reads stopped", () => {
    const toggle = { kind: "work-toggle", hasFailure: false, stopped: true } as MessagesTimelineRow;
    expect(haloTrailStepState(toggle, none)).toBe("stopped");
    expect(haloTrailStepState({ ...toggle, hasFailure: true } as MessagesTimelineRow, none)).toBe(
      "bad",
    );
  });
});
