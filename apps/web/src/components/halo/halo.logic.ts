import type { OrchestrationV2TurnItem } from "@t3tools/contracts";
import * as DateTime from "effect/DateTime";
import type { ThreadStatusPill } from "../Sidebar.logic";

export type HaloOrbState =
  | "idle"
  | "working"
  | "thinking"
  | "approval"
  | "input"
  | "error"
  | "done";

/** Maps the sidebar status pill onto the orb, so the orb never disagrees with the pill's tooltip. */
export function resolveHaloOrbState(pill: Pick<ThreadStatusPill, "kind"> | null): HaloOrbState {
  switch (pill?.kind) {
    case "approval":
      return "approval";
    case "input":
    case "guest":
    case "plan-ready":
      return "input";
    case "working":
      return "working";
    case "connecting":
      return "thinking";
    case "failed":
      return "error";
    case "completed":
      return "done";
    case "waiting":
    case undefined:
      return "idle";
  }
}

/** Only looping states register with `observeVisibleAnimation`; idle, done, and error stay static. */
export function haloOrbStateAnimates(state: HaloOrbState): boolean {
  return state !== "idle" && state !== "done" && state !== "error";
}

/** Elapsed time of a finished work item, or null while it runs or lacks timestamps. */
export function turnItemDurationMs(
  item: Pick<OrchestrationV2TurnItem, "startedAt" | "completedAt">,
): number | null {
  if (item.startedAt === null || item.completedAt === null) return null;
  const ms = DateTime.toEpochMillis(item.completedAt) - DateTime.toEpochMillis(item.startedAt);
  return ms > 0 ? ms : null;
}
