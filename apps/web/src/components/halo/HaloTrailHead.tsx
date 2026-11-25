import {
  deriveThreadActivityRun,
  deriveThreadStructureRuntime,
} from "@t3tools/client-runtime/state/thread-execution";
import type { RunId } from "@t3tools/contracts";
import { formatModelSlugName } from "@t3tools/shared/model";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import * as DateTime from "effect/DateTime";
import { useGT, useMessages } from "gt-react";
import { use, type ReactNode } from "react";
import { tickTextContent } from "~/lib/tickTextContent";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { isLatestRunSettled, workEntryDisplayIndicatesToolFailure } from "../../session-logic";
import { useQuietThreadProjection } from "../../state/entities";
import type { MessagesTimelineRow } from "../chat/MessagesTimeline.logic";
import { TimelineRowCtx } from "../chat/timelineRowContext";
import { formatWorkingTimerNow } from "../chat/TimelineWorkGroupRows.logic";
import { deriveHaloRunStages } from "./haloStages.logic";

/** The Agent trail card's top: model chip, title, and the run's `done/4 · elapsed` counter. */
export function HaloTrailHead({ runId }: { runId: RunId | null }) {
  const gt = useGT();
  const messages = useMessages();
  const { threadRef, activeThreadEnvironmentId } = use(TimelineRowCtx);
  const projection = useQuietThreadProjection(threadRef)?.projection ?? null;
  const run =
    runId === null ? undefined : projection?.runs.find((candidate) => candidate.id === runId);
  const activity = projection === null ? null : deriveThreadActivityRun(projection);
  const live =
    run !== undefined &&
    activity?.runId === run.id &&
    !isLatestRunSettled(activity, deriveThreadStructureRuntime(projection!));
  const { stages } = deriveHaloRunStages(
    run === undefined ? [] : projection!.turnItems.filter((item) => item.runId === run.id),
    live,
  );
  const done = stages.filter((stage) => stage.status === "done").length;
  const startedAt = run?.startedAt ? DateTime.formatIso(run.startedAt) : null;
  const settledMs =
    run?.startedAt && run.completedAt
      ? DateTime.toEpochMillis(run.completedAt) - DateTime.toEpochMillis(run.startedAt)
      : null;
  return (
    <div data-halo-trail-head="">
      {run ? (
        <span data-halo-trail-model="">{formatModelSlugName(run.modelSelection.model)}</span>
      ) : null}
      <span data-halo-trail-title="">{gt("Agent trail")}</span>
      {run ? (
        <span data-halo-trail-meta="" className="ms-auto font-mono tabular-nums">
          {gt("{done}/{total}", { done, total: stages.length })}
          {" · "}
          <span
            ref={
              live && startedAt !== null
                ? tickTextContent(
                    () => formatWorkingTimerNow(startedAt, activeThreadEnvironmentId),
                    true,
                  )
                : undefined
            }
          >
            {settledMs !== null && settledMs > 0 ? formatDuration(settledMs, messages) : ""}
          </span>
        </span>
      ) : null}
    </div>
  );
}

type TrailStepState = "active" | "wait" | "bad" | "done";

/** One row's node on the trail; expanded tool lists carry only the connector. */
export function HaloTrailStep({
  row,
  children,
}: {
  row: MessagesTimelineRow;
  children: ReactNode;
}) {
  const { pendingApprovals } = use(TimelineRowCtx);
  const state = trailStepState(row, pendingApprovals);
  return (
    <div
      data-halo-trail-step={state ?? ""}
      ref={state === "active" || state === "wait" ? observeVisibleAnimation : undefined}
    >
      {children}
    </div>
  );
}

function trailStepState(
  row: MessagesTimelineRow,
  pendingApprovals: ReadonlyMap<string, unknown>,
): TrailStepState | null {
  if (row.kind === "work-live") return row.active ? "active" : "done";
  if (row.kind === "work-toggle") return row.hasFailure ? "bad" : "done";
  if (row.kind !== "work" || row.isExpandedToolGroup) return null;
  const entries = row.groupedEntries;
  if (
    entries.some((entry) => {
      const item = entry.projectedItem?.item;
      return item?.type === "approval_request" && pendingApprovals.has(item.requestId);
    })
  )
    return "wait";
  return entries.some(workEntryDisplayIndicatesToolFailure) ? "bad" : "done";
}
