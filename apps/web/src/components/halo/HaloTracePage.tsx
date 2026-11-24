import {
  deriveLatestContextWindowSnapshot,
  latestProviderTurnTokenUsage,
} from "@t3tools/client-runtime/state/context-window";
import { promptTitle } from "@t3tools/client-runtime/state/subagentRuntime";
import {
  deriveThreadActivityRun,
  deriveThreadStructureRuntime,
} from "@t3tools/client-runtime/state/thread-execution";
import { deriveThreadTurnSubagents } from "@t3tools/client-runtime/state/thread-subagents";
import type { OrchestrationV2Subagent, ScopedThreadRef } from "@t3tools/contracts";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { msg, useGT, useMessages } from "gt-react";
import { AlertCircleIcon, CheckIcon, ChevronRightIcon, ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";

import { isElectron } from "~/env";
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
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import { resolveHaloOrbState } from "./halo.logic";
import { HaloOrb, useHaloThreadPill } from "./HaloOrb";
import { deriveHaloRunStages, type HaloRunStages, type HaloStageId } from "./haloStages.logic";
import { deriveHaloTraceLog, formatHaloTraceOffset, type HaloTraceTone } from "./haloTrace.logic";
import { HaloViewSwitcher } from "./HaloViewSwitcher";

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
  const contextWindow =
    projection === null
      ? null
      : deriveLatestContextWindowSnapshot(
          projection.visibleTurnItems,
          latestProviderTurnTokenUsage(projection.providerTurns, projection, activeProviderThread),
          activeProviderThread,
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
      <WorkspacePageHeader electron={isElectron} className="justify-end">
        <HaloViewSwitcher />
      </WorkspacePageHeader>
      <div className="topbar-scroll-fade min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-2 pb-16 @container/halo-trace sm:px-6.5">
        <div className="mt-1.5 mb-5 flex flex-wrap items-end gap-3.5">
          <div className="min-w-0">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight">
              {gt("Trace", { $context: "run trace view title" })}
            </h1>
            <p className="mt-1.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <span
            className="ml-auto flex h-8.5 items-center gap-2.25 rounded-full border border-border/60 bg-card/60 ps-2.5 pe-3.5 text-xs font-medium shadow-xs"
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
          <HaloStat label={gt("Tool calls", { $context: "run trace stat" })}>
            {stages.toolCount}
          </HaloStat>
          <HaloStat label={gt("Context", { $context: "run trace stat: context window tokens" })}>
            {contextWindow ? formatContextWindowTokens(contextWindow.usedTokens) : "-"}
          </HaloStat>
          <HaloStat label={gt("Subagents", { $context: "run trace stat" })}>
            {fleet?.subagents.length ?? 0}
            {fleet && fleet.liveCount > 0 ? (
              <small className="ms-1 text-sm font-medium text-muted-foreground">
                {gt("{count} live", { count: fleet.liveCount })}
              </small>
            ) : null}
          </HaloStat>
        </div>

        <div className="grid grid-cols-1 items-start gap-3 @min-[56rem]/halo-trace:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <HaloTraceCard title={gt("Stages", { $context: "run trace card" })}>
              <HaloStageBars stages={stages} />
              {fleet ? (
                <ul className="mt-4 flex flex-col gap-1.5">
                  {fleet.subagents.map((subagent) => (
                    <HaloFleetRow key={subagent.id} subagent={subagent} />
                  ))}
                </ul>
              ) : null}
            </HaloTraceCard>
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
              <ol className="max-h-[min(52vh,460px)] overflow-auto font-mono text-xs leading-normal">
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

function HaloStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/60 px-4.5 py-4 shadow-xs">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline text-3xl leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums">
        {children}
      </div>
    </div>
  );
}

function HaloTraceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-border/60 bg-card/60 px-4.5 pt-4 pb-3.5 shadow-xs has-[>div:empty]:hidden">
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

function HaloFleetRow({ subagent }: { subagent: OrchestrationV2Subagent }) {
  const gt = useGT();
  const status = subagent.status;
  const running = status === "running" || status === "pending" || status === "waiting";
  const label = running
    ? gt("Running", { $context: "subagent status" })
    : status === "completed"
      ? gt("Done", { $context: "subagent status" })
      : status === "failed"
        ? gt("Failed", { $context: "subagent status" })
        : status === "idle"
          ? gt("Idle", { $context: "subagent status" })
          : gt("Stopped", { $context: "subagent status" });
  return (
    <li className="flex min-h-6 items-center gap-2 text-xs text-muted-foreground">
      <span className="w-24 shrink-0 truncate font-medium text-foreground">
        {subagent.title ?? promptTitle(subagent.prompt)}
      </span>
      <span className="truncate font-mono">{subagent.executedModel ?? subagent.model}</span>
      <span
        className={cn(
          "ms-auto shrink-0 font-medium",
          running && "text-info-foreground",
          status === "failed" && "text-destructive-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}
