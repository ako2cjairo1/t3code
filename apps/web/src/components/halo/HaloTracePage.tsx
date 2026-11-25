import {
  deriveLatestContextWindowSnapshot,
  latestProviderTurnTokenUsage,
} from "@t3tools/client-runtime/state/context-window";
import {
  deriveThreadActivityRun,
  deriveThreadStructureRuntime,
} from "@t3tools/client-runtime/state/thread-execution";
import { deriveThreadTurnSubagents } from "@t3tools/client-runtime/state/thread-subagents";
import type { CommandOutputView } from "@t3tools/client-runtime/state/command-output";
import type { EnvironmentId, ScopedThreadRef, ThreadId, TurnItemId } from "@t3tools/contracts";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { msg, useGT, useMessages } from "gt-react";
import { AlertCircleIcon, CheckIcon, ChevronRightIcon, ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";

import { formatContextWindowTokens } from "~/lib/contextWindow";
import { tickTextContent } from "~/lib/tickTextContent";
import { cn } from "~/lib/utils";
import { isLatestRunSettled } from "../../session-logic";
import {
  useProjects,
  useQuietThreadProjection,
  useServerConfigs,
  useThreadShell,
} from "../../state/entities";
import { useEnvironmentProviders } from "../../state/environments";
import { formatWorkingTimerNow } from "../chat/TimelineWorkGroupRows.logic";
import { ThreadDetailsContext, ThreadDetailsUsage } from "../chat/ThreadDetailsUsage";
import { SidebarInset } from "../ui/sidebar";
import { HaloGraphStage } from "./graph/HaloGraphStage";
import { resolveHaloOrbState } from "./halo.logic";
import { HaloOrb, useHaloThreadPill } from "./HaloOrb";
import { deriveHaloRunStages, type HaloRunStages, type HaloStageId } from "./haloStages.logic";
import { deriveHaloTraceLog, formatHaloTraceOffset, type HaloTraceTone } from "./haloTrace.logic";
import { HaloPageHeader } from "./HaloPageHeader";
import { latestHaloTestCommand, parseHaloTestRun } from "./haloTestRun.logic";
import { orchestrationEnvironment } from "../../state/orchestration";
import { useEnvironmentQuery } from "../../state/query";

const LOG_LIMIT = 120;

const STAGE_LABELS = {
  plan: msg("Plan", { $context: "run stage: reading and planning" }),
  edit: msg("Edit", { $context: "run stage: changing files" }),
  test: msg("Test", { $context: "run stage: running tests" }),
  commit: msg("Commit", { $context: "run stage: committing changes" }),
} satisfies Record<HaloStageId, unknown>;

const TONE_ICON: Record<HaloTraceTone, ReactNode> = {
  ok: <CheckIcon className="size-3 text-primary" />,
  need: <ShieldIcon className="size-3 text-warning-foreground" />,
  bad: <AlertCircleIcon className="size-3 text-destructive-foreground" />,
  run: <ChevronRightIcon className="size-3" />,
};

/** One thread's run, laid out as stats, stages, subagents, usage, and a log of its tool work. */
export function HaloTracePage({ threadRef }: { threadRef: ScopedThreadRef }) {
  const gt = useGT();
  const messages = useMessages();
  const shell = useThreadShell(threadRef);
  const projects = useProjects();
  const pill = useHaloThreadPill(threadRef);
  const providers = useEnvironmentProviders().get(threadRef.environmentId) ?? [];
  const serverConfig = useServerConfigs().get(threadRef.environmentId);
  const projection = useQuietThreadProjection(threadRef)?.projection ?? null;

  const run = projection === null ? null : deriveThreadActivityRun(projection);
  const runtime = projection === null ? null : deriveThreadStructureRuntime(projection);
  const live = run !== null && !isLatestRunSettled(run, runtime);
  const runItems =
    projection === null || run === null
      ? []
      : projection.turnItems.filter((item) => item.runId === run.runId);
  const stages: HaloRunStages = deriveHaloRunStages(runItems, live);
  const log = deriveHaloTraceLog(runItems, run?.startedAt ?? null, LOG_LIMIT);
  const fleet = projection === null ? null : deriveThreadTurnSubagents(projection);
  const activeProviderThread = projection?.providerThreads.find(
    (thread) => thread.id === projection.thread.activeProviderThreadId,
  );
  const tokenUsage =
    projection === null
      ? null
      : latestProviderTurnTokenUsage(projection.providerTurns, projection, activeProviderThread);
  const contextWindow =
    projection === null
      ? null
      : deriveLatestContextWindowSnapshot(
          projection.visibleTurnItems,
          tokenUsage,
          activeProviderThread,
        );
  const testCommand = latestHaloTestCommand(
    runItems.filter((item) => item.type === "command_execution"),
  );
  const project = shell
    ? projects.find(
        (entry) => entry.environmentId === shell.environmentId && entry.id === shell.projectId,
      )
    : undefined;
  const subtitle = [shell?.title, project?.title, shell?.branch].filter(Boolean).join(" · ");
  const settledMs =
    run?.startedAt && run.completedAt
      ? Date.parse(run.completedAt) - Date.parse(run.startedAt)
      : null;
  const startedAt = run?.startedAt ?? null;
  const environmentId = threadRef.environmentId;

  return (
    <SidebarInset data-halo-page="" className="h-dvh min-h-0 overflow-hidden overscroll-y-none">
      <HaloPageHeader
        title={shell?.title ?? gt("Trace", { $context: "run trace view title" })}
        threadRef={threadRef}
      />
      <div className="topbar-scroll-fade min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-2 pb-16 @container/halo-trace sm:px-6.5">
        <div className="mt-1.5 mb-5 flex flex-wrap items-end gap-3.5">
          <div className="min-w-0">
            <h1 className="text-3xl leading-tight font-semibold">
              {gt("Trace", { $context: "run trace view title" })}
            </h1>
            <p className="mt-1.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <span
            className="ml-auto flex h-8.5 items-center gap-2.25 rounded-full border border-(--halo-line) bg-foreground/6 ps-2.5 pe-3.5 text-xs font-medium shadow-(--halo-depth) backdrop-blur-(--glass-blur)"
            role="status"
          >
            <HaloOrb state={resolveHaloOrbState(pill)} className="size-5" />
            {pill ? messages(pill.label) : gt("Idle")}
          </span>
        </div>

        <div className="mb-3.5 grid grid-cols-2 gap-3 @min-[56rem]/halo-trace:grid-cols-4">
          <HaloStat label={gt("Elapsed", { $context: "run trace stat" })}>
            <span
              ref={
                live && startedAt !== null
                  ? tickTextContent(() => formatWorkingTimerNow(startedAt, environmentId), true)
                  : undefined
              }
            >
              {settledMs !== null && settledMs > 0 ? formatDuration(settledMs, messages) : "-"}
            </span>
          </HaloStat>
          <HaloStat label={gt("Tokens", { $context: "run trace stat: tokens used" })}>
            {tokenUsage ? formatContextWindowTokens(tokenUsage.usedTokens) : "-"}
          </HaloStat>
          <HaloStat label={gt("Tool calls", { $context: "run trace stat" })}>
            {stages.toolCount}
          </HaloStat>
          {testCommand ? (
            <HaloStat label={gt("Tests passed", { $context: "run trace stat" })}>
              {testCommand.output !== undefined && testCommand.outputOmitted !== true ? (
                <HaloTestsPassed
                  command={testCommand.input}
                  output={testCommand.output}
                  running={testCommand.status === "running"}
                  exitCode={testCommand.exitCode}
                />
              ) : (
                <HaloTestsPassedFetched
                  environmentId={environmentId}
                  threadId={threadRef.threadId}
                  itemId={testCommand.id}
                  command={testCommand.input}
                  exitCode={testCommand.exitCode}
                />
              )}
            </HaloStat>
          ) : (
            <HaloStat label={gt("Subagents", { $context: "run trace stat" })}>
              {fleet?.subagents.length ?? 0}
              {fleet && fleet.liveCount > 0 ? (
                <small className="ms-1 text-sm font-medium text-muted-foreground">
                  {gt("{count} live", { count: fleet.liveCount })}
                </small>
              ) : null}
            </HaloStat>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-3 @min-[56rem]/halo-trace:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <HaloTraceCard title={gt("Stages", { $context: "run trace card" })}>
              <HaloStageBars stages={stages} />
            </HaloTraceCard>
            {fleet ? (
              <HaloTraceCard title={gt("Fleet", { $context: "run trace card: subagent graph" })}>
                <HaloGraphStage
                  environmentId={environmentId}
                  subagents={fleet.subagents}
                  main={{
                    state: resolveHaloOrbState(pill),
                    label: shell?.title ?? "",
                    detail: shell?.modelSelection.model ?? null,
                  }}
                />
              </HaloTraceCard>
            ) : null}
            <HaloTraceCard title={gt("Usage", { $context: "run trace card" })}>
              {shell ? (
                <ThreadDetailsUsage
                  providerInstanceId={shell.modelSelection.instanceId ?? shell.providerInstanceId}
                  model={shell.modelSelection.model}
                  providers={providers}
                  sources={serverConfig?.usageLimitSources ?? []}
                />
              ) : null}
              {contextWindow ? <ThreadDetailsContext usage={contextWindow} /> : null}
            </HaloTraceCard>
          </div>
          <HaloTraceCard title={gt("Event log", { $context: "run trace card" })}>
            {log.length === 0 ? (
              <p className="py-1.5 text-xs text-muted-foreground">{gt("No events yet.")}</p>
            ) : (
              <ol
                ref={live ? followTraceLog : undefined}
                data-halo-trace-live={live || undefined}
                className="max-h-[min(52vh,460px)] overflow-auto font-mono text-xs leading-normal"
              >
                {log.map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(
                      "grid grid-cols-[52px_16px_minmax(0,1fr)_auto] items-start gap-2 border-t border-border/60 px-0.5 py-1 text-muted-foreground first:border-t-0",
                      entry.tone === "need" && "font-medium text-foreground",
                    )}
                  >
                    <span className="text-end opacity-70">
                      {entry.offsetMs === null ? "" : formatHaloTraceOffset(entry.offsetMs)}
                    </span>
                    <span className="grid h-4.5 place-items-center">{TONE_ICON[entry.tone]}</span>
                    <span className="truncate">{entry.label}</span>
                    <span className="opacity-70">
                      {entry.durationMs === null ? "" : formatDuration(entry.durationMs, messages)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </HaloTraceCard>
        </div>
      </div>
    </SidebarInset>
  );
}

function HaloTestsPassed(props: {
  command: string;
  output: string;
  running: boolean;
  exitCode: number | undefined;
}) {
  const run = parseHaloTestRun(props);
  if (run === null) return "-";
  return (
    <>
      {run.totals.passed}
      <small className="text-sm font-medium text-muted-foreground">/{run.totals.total}</small>
    </>
  );
}

function HaloTestsPassedFetched(props: {
  environmentId: EnvironmentId;
  threadId: ThreadId;
  itemId: TurnItemId;
  command: string;
  exitCode: number | undefined;
}) {
  const { data } = useEnvironmentQuery<CommandOutputView, unknown>(
    orchestrationEnvironment.v2.commandOutput({
      environmentId: props.environmentId,
      input: { threadId: props.threadId, itemId: props.itemId },
    }),
  );
  if (!data) return "-";
  return (
    <HaloTestsPassed
      command={props.command}
      output={data.output.text}
      running={data.running}
      exitCode={props.exitCode}
    />
  );
}

function HaloStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-(--halo-line) bg-card/60 px-4.5 py-4 shadow-(--halo-depth) backdrop-blur-(--glass-blur)">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline text-3xl leading-tight font-semibold whitespace-nowrap tabular-nums">
        {children}
      </div>
    </div>
  );
}

function HaloTraceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-(--halo-line) bg-card/60 px-4.5 pt-4 pb-3.5 shadow-(--halo-depth) backdrop-blur-(--glass-blur) has-[>div:empty]:hidden">
      <h2 className="mb-3.5 text-sm font-semibold tracking-tight">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

/** Stage bars from `deriveHaloRunStages`, the same derivation the header's status island shows. */
function HaloStageBars({ stages }: { stages: HaloRunStages }) {
  const gt = useGT();
  const messages = useMessages();
  return (
    <ol className="flex flex-col">
      {stages.stages.map((stage) => (
        <li
          key={stage.id}
          className={cn(
            "flex min-h-8.5 items-center gap-3 text-xs",
            stage.status === "skipped" && "text-muted-foreground",
          )}
        >
          <span className="w-16 shrink-0">{messages(STAGE_LABELS[stage.id])}</span>
          <span
            aria-hidden
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/8"
          >
            <span
              className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-500 ease-out"
              style={{
                transform: `scaleX(${stage.status === "done" ? 1 : stage.status === "active" ? 0.5 : 0})`,
              }}
            />
          </span>
          <b
            className={cn(
              "w-13 text-end font-mono text-2xs font-medium text-muted-foreground",
              stage.status === "active" && "text-primary",
            )}
          >
            {stage.status === "done"
              ? stage.durationMs === null
                ? gt("done", { $context: "run stage status" })
                : formatDuration(stage.durationMs, messages)
              : stage.status === "active"
                ? gt("now", { $context: "run stage status: in progress" })
                : "-"}
          </b>
        </li>
      ))}
    </ol>
  );
}

/** While the run is live, new events keep the log pinned to its end unless the user scrolled up. */
function followTraceLog(list: HTMLOListElement) {
  let atEnd = true;
  const onScroll = () => {
    atEnd = list.scrollHeight - list.scrollTop - list.clientHeight <= 4;
  };
  const observer = new MutationObserver(() => {
    if (atEnd) list.scrollTop = list.scrollHeight;
  });
  list.scrollTop = list.scrollHeight;
  list.addEventListener("scroll", onScroll, { passive: true });
  observer.observe(list, { childList: true });
  return () => {
    observer.disconnect();
    list.removeEventListener("scroll", onScroll);
  };
}
