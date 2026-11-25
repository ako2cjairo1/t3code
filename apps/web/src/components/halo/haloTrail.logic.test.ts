import { describe, expect, it } from "vite-plus/test";
import { haloTrailSlots } from "./haloTrail.logic";

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
