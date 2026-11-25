import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { latestProviderTurnTokenUsage } from "@t3tools/client-runtime/state/context-window";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import {
  deriveThreadActivityRun,
  deriveThreadStructureRuntime,
} from "@t3tools/client-runtime/state/thread-execution";
import { thrownErrorMessage } from "@t3tools/client-runtime/errors";
import { AuthOrchestrationOperateScope, type ScopedThreadRef } from "@t3tools/contracts";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { useNavigate } from "@tanstack/react-router";
import { msg, useGT, useMessages } from "gt-react";
import { SquareIcon } from "lucide-react";
import { useThreadRouteRef } from "~/hooks/useThreadRouteTarget";
import { formatContextWindowTokens } from "~/lib/contextWindow";
import { tickTextContent } from "~/lib/tickTextContent";
import { cn } from "~/lib/utils";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { deriveCanInterruptRunningThread, isLatestRunSettled } from "../../session-logic";
import { useQuietThreadProjection } from "../../state/entities";
import { readEnvironmentScope, useEnvironmentScope } from "../../state/session";
import { threadEnvironment } from "../../state/threads";
import { useOrchestrationCommand } from "../../state/use-orchestration-command";
import { formatWorkingTimerNow } from "../chat/TimelineWorkGroupRows.logic";
import { toastManager } from "../ui/toast";
import { resolveHaloOrbState } from "./halo.logic";
import { HaloMorphPopup } from "./HaloMorphPopup";
import { HaloOrb, useHaloThreadPill } from "./HaloOrb";
import { deriveHaloRunStages, type HaloStage, type HaloStageId } from "./haloStages.logic";
import { deriveHaloTraceLog } from "./haloTrace.logic";
import { haloDepthTransition } from "./HaloViewSwitcher";

const STAGE_LABELS = {
  plan: msg("Plan", { $context: "run stage: reading and planning" }),
  edit: msg("Edit", { $context: "run stage: changing files" }),
  test: msg("Test", { $context: "run stage: running tests" }),
  commit: msg("Commit", { $context: "run stage: committing changes" }),
} satisfies Record<HaloStageId, unknown>;

const LOG_TAIL_LINES = 3;

const PILL_CLASS =
  "relative block h-7.5 w-46 shrink-0 cursor-pointer overflow-hidden rounded-full border text-foreground transition-[border-color,opacity] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset @max-[724px]/chat-header:w-39";

/** The run status pill for a draft, which has no run to open. */
export function HaloIdleIsland() {
  const gt = useGT();
  return (
    <span
      role="status"
      data-tone="muted"
      data-halo-island=""
      className={cn(PILL_CLASS, "cursor-default")}
    >
      <span className="relative flex h-7 items-center gap-2 ps-2 pe-3 text-xs whitespace-nowrap text-muted-foreground">
        <HaloOrb state="idle" className="size-4" />
        <span data-halo-island-label="">{gt("Idle")}</span>
      </span>
    </span>
  );
}

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
  const navigate = useNavigate();
  const routeThreadRef = useThreadRouteRef();
  const pill = useHaloThreadPill(threadRef);
  const canOperate = useEnvironmentScope(threadRef.environmentId, AuthOrchestrationOperateScope);
  const interruptTurn = useOrchestrationCommand(threadEnvironment.interruptTurn, {
    reportFailure: false,
  });
  const projection = useQuietThreadProjection(threadRef)?.projection ?? null;
  const run = projection === null ? null : deriveThreadActivityRun(projection);
  const runtime = projection === null ? null : deriveThreadStructureRuntime(projection);
  const live = run !== null && !isLatestRunSettled(run, runtime);
  const runItems =
    projection === null || run === null
      ? []
      : projection.turnItems.filter((item) => item.runId === run.runId);
  const { stages } = deriveHaloRunStages(runItems, live);
  const logTail = deriveHaloTraceLog(runItems, run?.startedAt ?? null, LOG_TAIL_LINES);
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
  const tone =
    orbState === "approval" || orbState === "input"
      ? "needs"
      : orbState === "done"
        ? "done"
        : orbState === "error"
          ? "error"
          : pill === null
            ? "muted"
            : "run";
  const doneCount = stages.filter((stage) => stage.status === "done").length;
  const activeIndex = stages.findIndex((stage) => stage.status === "active");
  const progress = live ? (Math.max(activeIndex, 0) + 0.5) / stages.length : run ? 1 : 0;
  const title = projection?.thread.title ?? "";
  const counter =
    live || orbState === "done"
      ? gt("{done}/{total}", { done: doneCount, total: stages.length })
      : null;
  const onThread =
    routeThreadRef?.environmentId === threadRef.environmentId &&
    routeThreadRef.threadId === threadRef.threadId;
  const canStop = live && canOperate && deriveCanInterruptRunningThread(true, runtime);
  const stop = async () => {
    if (!readEnvironmentScope(environmentId, AuthOrchestrationOperateScope)) return;
    const result = await interruptTurn({ environmentId, input: { threadId: threadRef.threadId } });
    if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
      toastManager.add({
        type: "error",
        title: gt("Failed to interrupt the current turn."),
        description:
          thrownErrorMessage(squashAtomCommandFailure(result), messages) ??
          gt("An error occurred."),
      });
    }
  };

  const pillRow = (
    <>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full origin-left bg-primary/14 transition-transform duration-500 ease-out in-data-[tone=done]:bg-primary/20 in-data-[tone=muted]:bg-foreground/5 in-data-[tone=needs]:bg-primary/30 in-data-[tone=error]:bg-destructive/12"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative flex h-7 items-center gap-2 ps-2 pe-3 text-xs whitespace-nowrap">
        <HaloOrb state={orbState} className="size-4" />
        <span
          key={label}
          data-halo-blur-in=""
          data-halo-island-label=""
          className="min-w-0 flex-1 truncate text-start"
        >
          {label}
        </span>
        {counter ? (
          <span
            data-halo-island-label=""
            className="shrink-0 font-mono text-2xs text-muted-foreground tabular-nums"
          >
            {counter}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <PopoverPrimitive.Root>
      <span
        ref={tone === "needs" ? observeVisibleAnimation : undefined}
        data-halo-pulse-ring={tone === "needs" ? "" : undefined}
        className="relative shrink-0 rounded-full"
      >
        <PopoverPrimitive.Trigger
          aria-label={gt("Run status: {status}", { status: label })}
          data-tone={tone}
          data-halo-island=""
          className={cn(PILL_CLASS, "data-popup-open:opacity-0")}
        >
          {pillRow}
        </PopoverPrimitive.Trigger>
      </span>
      <HaloMorphPopup align="start" aria-label={gt("Run status")} className="w-95">
        <PopoverPrimitive.Close
          aria-label={gt("Collapse run status")}
          data-tone={tone}
          className="relative block h-7.5 w-full cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {pillRow}
        </PopoverPrimitive.Close>
        <div className="px-4 pt-2 pb-3.5">
          <div className="mb-3 flex items-baseline gap-2">
            <span data-halo-title="" className="min-w-0 flex-1 truncate font-semibold">
              {title}
            </span>
            {tone === "needs" ? (
              <span className="shrink-0 font-mono text-2xs text-(--primary-light)">
                {gt("Waiting on you")}
              </span>
            ) : (
              <span
                ref={elapsedRef}
                className="shrink-0 font-mono text-2xs text-muted-foreground tabular-nums"
              >
                {elapsedText}
              </span>
            )}
          </div>
          <ol className="mb-3 grid grid-cols-4 gap-1.5">
            {stages.map((stage) => (
              <HaloStageCell
                key={stage.id}
                stage={stage}
                label={messages(STAGE_LABELS[stage.id])}
              />
            ))}
          </ol>
          {logTail.length > 0 ? (
            <ol
              aria-label={gt("Recent activity")}
              data-halo-logtail=""
              className="mb-3 flex flex-col justify-end overflow-hidden border px-2.75 py-2 font-mono text-2xs leading-4.25 text-muted-foreground"
            >
              {logTail.map((entry, index) => (
                <li
                  key={entry.id}
                  className={cn(
                    "truncate",
                    index === logTail.length - 1 && "text-foreground",
                    entry.tone === "bad" && "text-destructive-foreground",
                  )}
                >
                  {entry.tone === "ok" ? "✓ " : ""}
                  {entry.label}
                  {index === logTail.length - 1 && live ? (
                    <span
                      ref={observeVisibleAnimation}
                      aria-hidden
                      data-halo-cursor=""
                      className="ms-1 inline-block h-3 w-1.5 translate-y-0.5 bg-(--primary-light,var(--primary))"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
          {!onThread || canStop || tokenUsage ? (
            <div className="flex items-center gap-1.5">
              {onThread ? null : (
                <PopoverPrimitive.Close
                  className="h-6.5 cursor-pointer rounded-full bg-foreground px-3 text-2xs font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() =>
                    void navigate({
                      to: "/$environmentId/$threadId",
                      params: { environmentId, threadId: threadRef.threadId },
                      viewTransition: haloDepthTransition(),
                    })
                  }
                >
                  {gt("Open thread")}
                </PopoverPrimitive.Close>
              )}
              {canStop ? (
                <PopoverPrimitive.Close
                  className="flex h-6.5 cursor-pointer items-center gap-1.5 rounded-full border border-foreground/8 bg-foreground/8 px-3 text-2xs font-medium outline-none hover:bg-foreground/12 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() => void stop()}
                >
                  <SquareIcon aria-hidden className="size-2.5 fill-current" />
                  {gt("Stop")}
                </PopoverPrimitive.Close>
              ) : null}
              <span className="ms-auto font-mono text-2xs text-muted-foreground tabular-nums">
                {tokenUsage
                  ? gt("{usedTokens} tok", {
                      usedTokens: formatContextWindowTokens(tokenUsage.usedTokens),
                    })
                  : null}
              </span>
            </div>
          ) : null}
        </div>
      </HaloMorphPopup>
    </PopoverPrimitive.Root>
  );
}

function HaloStageCell({ stage, label }: { stage: HaloStage; label: string }) {
  const fill = stage.status === "done" ? 1 : stage.status === "active" ? 0.5 : 0;
  return (
    <li
      data-stage={stage.id}
      data-status={stage.status}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 text-2xs text-muted-foreground transition-colors duration-200",
        stage.status === "active" && "font-medium text-foreground",
      )}
    >
      <span
        aria-hidden
        ref={stage.status === "active" ? observeVisibleAnimation : undefined}
        data-halo-shimmer={stage.status === "active" ? "" : undefined}
        className="relative h-1 overflow-hidden rounded-full bg-foreground/8"
      >
        <span
          className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-450 ease-out"
          style={{ transform: `scaleX(${fill})` }}
        />
      </span>
      <span className="truncate">{label}</span>
    </li>
  );
}
