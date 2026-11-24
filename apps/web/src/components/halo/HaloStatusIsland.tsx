import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { latestProviderTurnTokenUsage } from "@t3tools/client-runtime/state/context-window";
import {
  deriveThreadActivityRun,
  deriveThreadStructureRuntime,
} from "@t3tools/client-runtime/state/thread-execution";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { msg, useGT, useMessages } from "gt-react";
import { formatContextWindowTokens } from "~/lib/contextWindow";
import { tickTextContent } from "~/lib/tickTextContent";
import { cn } from "~/lib/utils";
import { isLatestRunSettled } from "../../session-logic";
import { useQuietThreadProjection } from "../../state/entities";
import { formatWorkingTimerNow } from "../chat/TimelineWorkGroupRows.logic";
import { resolveHaloOrbState } from "./halo.logic";
import { HaloMorphPopup } from "./HaloMorphPopup";
import { HaloOrb, useHaloThreadPill } from "./HaloOrb";
import { deriveHaloRunStages, type HaloStage, type HaloStageId } from "./haloStages.logic";

const STAGE_LABELS = {
  plan: msg("Plan", { $context: "run stage: reading and planning" }),
  edit: msg("Edit", { $context: "run stage: changing files" }),
  test: msg("Test", { $context: "run stage: running tests" }),
  commit: msg("Commit", { $context: "run stage: committing changes" }),
} satisfies Record<HaloStageId, unknown>;

/** Liquid Halo's run status pill; it springs open into a card of the run's stages. */
export function HaloStatusIsland({
  threadRef,
  workStartedAt,
}: {
  threadRef: ScopedThreadRef;
  /** The active work's start from the chat view, which also covers a send before its run. */
  workStartedAt: string | null;
}) {
  const gt = useGT();
  const messages = useMessages();
  const pill = useHaloThreadPill(threadRef);
  const projection = useQuietThreadProjection(threadRef)?.projection ?? null;
  const run = projection === null ? null : deriveThreadActivityRun(projection);
  const runtime = projection === null ? null : deriveThreadStructureRuntime(projection);
  const live = run !== null && !isLatestRunSettled(run, runtime);
  const runItems =
    projection === null || run === null
      ? []
      : projection.turnItems.filter((item) => item.runId === run.runId);
  const { stages, toolCount } = deriveHaloRunStages(runItems, live);
  const activeProviderThread = projection?.providerThreads.find(
    (thread) => thread.id === projection.thread.activeProviderThreadId,
  );
  const tokenUsage =
    projection === null
      ? null
      : latestProviderTurnTokenUsage(projection.providerTurns, projection, activeProviderThread);
  const startedAt = (live ? workStartedAt : null) ?? run?.startedAt ?? null;
  const settledMs =
    !live && run?.startedAt && run.completedAt
      ? Date.parse(run.completedAt) - Date.parse(run.startedAt)
      : null;
  const environmentId = threadRef.environmentId;
  const elapsedRef =
    live && startedAt !== null
      ? tickTextContent(() => formatWorkingTimerNow(startedAt, environmentId), true)
      : undefined;
  const elapsedText =
    live || settledMs === null || settledMs <= 0 ? null : formatDuration(settledMs, messages);
  const label = pill ? messages(pill.label) : gt("Idle");
  const orbState = resolveHaloOrbState(pill);
  const doneCount = stages.filter((stage) => stage.status === "done").length;
  const activeIndex = stages.findIndex((stage) => stage.status === "active");
  const progress = live ? (Math.max(activeIndex, 0) + 0.5) / stages.length : run ? 1 : 0;
  const title = projection?.thread.title ?? "";

  const pillRow = (
    <>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full origin-left bg-primary/12 transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative flex h-7 items-center gap-2 ps-2 pe-3 text-xs whitespace-nowrap">
        <HaloOrb state={orbState} className="size-4" />
        <span className="min-w-0 flex-1 truncate text-start">{label}</span>
        <span
          ref={elapsedRef}
          className="shrink-0 font-mono text-2xs text-muted-foreground tabular-nums"
        >
          {elapsedText}
        </span>
      </span>
    </>
  );

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label={gt("Run status: {status}", { status: label })}
        className="relative h-7.5 w-46 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-card/78 text-foreground shadow-xs backdrop-blur-xl backdrop-saturate-140 transition-[border-color,opacity] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-popup-open:opacity-0 @max-3xl/chat-header:w-30"
      >
        {pillRow}
      </PopoverPrimitive.Trigger>
      <HaloMorphPopup align="start" aria-label={gt("Run status")} className="w-95">
        <PopoverPrimitive.Close
          aria-label={gt("Collapse run status")}
          className="relative block h-7.5 w-full cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {pillRow}
        </PopoverPrimitive.Close>
        <div className="px-4 pt-2 pb-3.5">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
            <span className="shrink-0 font-mono text-2xs text-muted-foreground tabular-nums">
              {gt("{done}/{total}", { done: doneCount, total: stages.length })}
            </span>
          </div>
          <ol className="mb-3 grid grid-cols-4 gap-1.5">
            {stages.map((stage) => (
              <HaloStageCell
                key={stage.id}
                stage={stage}
                label={messages(STAGE_LABELS[stage.id])}
                environmentId={environmentId}
              />
            ))}
          </ol>
          <p className="flex items-center gap-3 font-mono text-2xs text-muted-foreground tabular-nums">
            <span>
              {gt("{count, plural, one {# tool call} other {# tool calls}}", { count: toolCount })}
            </span>
            {tokenUsage ? (
              <span>
                {gt("{usedTokens} tokens used", {
                  usedTokens: formatContextWindowTokens(tokenUsage.usedTokens),
                })}
              </span>
            ) : null}
          </p>
        </div>
      </HaloMorphPopup>
    </PopoverPrimitive.Root>
  );
}

function HaloStageCell({
  stage,
  label,
  environmentId,
}: {
  stage: HaloStage;
  label: string;
  environmentId: ScopedThreadRef["environmentId"];
}) {
  const gt = useGT();
  const messages = useMessages();
  const { activeSince } = stage;
  const fill = stage.status === "done" ? 1 : stage.status === "active" ? 0.5 : 0;
  const detail =
    stage.status === "active"
      ? activeSince === null
        ? gt("In progress")
        : null
      : stage.status === "done"
        ? stage.durationMs === null
          ? gt("Done")
          : formatDuration(stage.durationMs, messages)
        : stage.status === "skipped"
          ? gt("Skipped")
          : gt("Not started");
  return (
    <li
      data-stage={stage.id}
      data-status={stage.status}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 text-2xs text-muted-foreground transition-colors duration-200",
        stage.status === "active" && "font-medium text-foreground",
      )}
    >
      <span aria-hidden className="relative h-1 overflow-hidden rounded-full bg-foreground/8">
        <span
          className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-450 ease-out"
          style={{ transform: `scaleX(${fill})` }}
        />
      </span>
      <span className="truncate">{label}</span>
      <span
        ref={
          stage.status === "active" && activeSince !== null
            ? tickTextContent(() => formatWorkingTimerNow(activeSince, environmentId), true)
            : undefined
        }
        className="truncate font-mono tabular-nums opacity-80"
      >
        {detail}
      </span>
    </li>
  );
}
