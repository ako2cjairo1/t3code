import type { MessagesTimelineRow } from "../chat/MessagesTimeline.logic";
import { workEntryDisplayIndicatesToolFailure } from "../../session-logic";

/** Timeline row kinds that sit inside Liquid Halo's "Agent trail" card. Thinking stays outside. */
const TRAIL_KINDS = new Set(["work", "work-live", "work-toggle"]);

export type HaloTrailPosition = "first" | "middle" | "last" | "only";

export interface HaloTrailSlot {
  readonly position: HaloTrailPosition;
  /** The first segment of its run carries the card header. */
  readonly head: boolean;
}

/**
 * Each virtualized row paints one segment of the card, so a run of adjacent trail rows reads as
 * one glass surface without any element spanning rows. Null for rows outside a trail.
 */
export function haloTrailSlots(
  rows: ReadonlyArray<{ readonly kind: string; readonly runId: string | null }>,
): Array<HaloTrailSlot | null> {
  const seenRuns = new Set<string>();
  return rows.map((row, index) => {
    if (!TRAIL_KINDS.has(row.kind)) return null;
    const startsSegment = !TRAIL_KINDS.has(rows[index - 1]?.kind ?? "");
    const endsSegment = !TRAIL_KINDS.has(rows[index + 1]?.kind ?? "");
    const position: HaloTrailPosition = startsSegment
      ? endsSegment
        ? "only"
        : "first"
      : endsSegment
        ? "last"
        : "middle";
    let head = false;
    if (startsSegment) {
      head = row.runId === null || !seenRuns.has(row.runId);
      if (row.runId !== null) seenRuns.add(row.runId);
    }
    return { position, head };
  });
}

export type HaloTrailStepState = "active" | "wait" | "bad" | "stopped" | "note" | "done";

/** A row's node on the trail; null for expanded tool lists, which carry only the connector. */
export function haloTrailStepState(
  row: MessagesTimelineRow,
  pendingApprovals: ReadonlyMap<string, unknown>,
): HaloTrailStepState | null {
  if (row.kind === "work-live") return row.active ? "active" : "done";
  if (row.kind === "work-toggle") return row.hasFailure ? "bad" : row.stopped ? "stopped" : "done";
  if (row.kind !== "work" || row.isExpandedToolGroup) return null;
  const entries = row.groupedEntries;
  if (
    entries.some((entry) => {
      const item = entry.projectedItem?.item;
      return item?.type === "approval_request" && pendingApprovals.has(item.requestId);
    })
  )
    return "wait";
  if (
    entries.some(
      (entry) =>
        entry.sourceActivityKind === "runtime.error" || workEntryDisplayIndicatesToolFailure(entry),
    )
  )
    return "bad";
  // A runtime warning isn't a step the agent finished; it keeps the plain hollow node.
  if (entries.some((entry) => entry.sourceActivityKind === "runtime.warning")) return "note";
  // A step the user's Stop cut short; tools that finished before it stay done.
  return entries.some((entry) => entry.toolLifecycleStatus === "stopped") ? "stopped" : "done";
}
