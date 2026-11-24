import { promptTitle } from "@t3tools/client-runtime/state/subagentRuntime";
import {
  deriveThreadTurnSubagents,
  resolveSubagentPillSegment,
} from "@t3tools/client-runtime/state/thread-subagents";
import {
  isOrchestrationV2WorkActive,
  type EnvironmentId,
  type OrchestrationV2Subagent,
  type ScopedThreadRef,
} from "@t3tools/contracts";
import { Link } from "@tanstack/react-router";
import * as DateTime from "effect/DateTime";
import { useGT, useMessages } from "gt-react";
import { ChevronRightIcon } from "lucide-react";

import { useHaloExperience } from "~/hooks/useHaloExperience";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { cn } from "~/lib/utils";
import { useQuietThreadProjection, useThreadShell } from "../../../state/entities";
import { AgentElapsed } from "../../chat/AgentElapsed";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../../ui/collapsible";
import { resolveHaloOrbState, type HaloOrbState } from "../halo.logic";
import { HaloOrb, useHaloThreadPill } from "../HaloOrb";
import { HALO_GRAPH_NODE, haloSubagentOrbState, layoutHaloGraph } from "./haloGraph.logic";

const isoOrNull = (value: DateTime.Utc | null) => (value ? DateTime.formatIso(value) : null);

/** The main agent and its subagents as a node graph; nodes with a child thread open it. */
export function HaloGraphStage({
  environmentId,
  subagents,
  main,
}: {
  environmentId: EnvironmentId;
  subagents: ReadonlyArray<OrchestrationV2Subagent>;
  main: { state: HaloOrbState; label: string; detail: string | null };
}) {
  const gt = useGT();
  const layout = layoutHaloGraph(subagents.map((subagent) => subagent.id));
  const anyLive = subagents.some((subagent) => isOrchestrationV2WorkActive(subagent.status));
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div
        ref={anyLive ? observeVisibleAnimation : undefined}
        className="relative"
        style={{ width: layout.width, height: layout.height }}
      >
        <svg aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          {layout.nodes.map((node, index) => {
            const status = subagents[index]!.status;
            return (
              <path
                key={node.id}
                d={node.wire}
                data-halo-wire=""
                data-live={isOrchestrationV2WorkActive(status) ? "" : undefined}
                className={cn(
                  "stroke-ring",
                  status === "failed" && "stroke-destructive",
                  !isOrchestrationV2WorkActive(status) && status !== "failed" && "opacity-35",
                )}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div
          aria-hidden="true"
          className="absolute flex flex-col justify-center rounded-2xl border border-ring/40 bg-card px-2.75 shadow-xs"
          style={{
            left: layout.main.x,
            top: layout.main.y,
            width: layout.main.width,
            height: HALO_GRAPH_NODE.height,
          }}
        >
          <span className="flex min-w-0 items-center gap-2 text-xs font-medium">
            <HaloOrb state={main.state} className="size-4" />
            <span className="truncate">{main.label}</span>
          </span>
          {main.detail ? (
            <span className="mt-0.75 truncate font-mono text-2xs text-muted-foreground">
              {main.detail}
            </span>
          ) : null}
        </div>
        <ul aria-label={gt("Subagents", { $context: "run trace stat" })}>
          {layout.nodes.map((node, index) => (
            <li
              key={node.id}
              className="absolute"
              style={{
                left: node.x,
                top: node.y,
                width: HALO_GRAPH_NODE.width,
                height: HALO_GRAPH_NODE.height,
              }}
            >
              <HaloGraphNode environmentId={environmentId} subagent={subagents[index]!} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HaloGraphNode({
  environmentId,
  subagent,
}: {
  environmentId: EnvironmentId;
  subagent: OrchestrationV2Subagent;
}) {
  const gt = useGT();
  const { status } = subagent;
  const live = isOrchestrationV2WorkActive(status);
  const statusLabel = live
    ? gt("Running", { $context: "subagent status" })
    : status === "completed"
      ? gt("Done", { $context: "subagent status" })
      : status === "failed"
        ? gt("Failed", { $context: "subagent status" })
        : status === "idle"
          ? gt("Idle", { $context: "subagent status" })
          : gt("Stopped", { $context: "subagent status" });
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
        <HaloOrb state={haloSubagentOrbState(status)} className="size-4" />
        <span className="min-w-0 flex-1 truncate">
          {subagent.title ?? promptTitle(subagent.prompt)}
        </span>
        <span className="sr-only">{statusLabel}</span>
        <span className="shrink-0 font-mono text-2xs font-normal text-muted-foreground">
          <AgentElapsed
            compact
            agent={{
              status,
              startedAt: isoOrNull(subagent.startedAt),
              completedAt: isoOrNull(subagent.completedAt),
            }}
          />
        </span>
      </span>
      <span className="mt-0.75 block truncate font-mono text-2xs text-muted-foreground">
        {subagent.progress ?? subagent.executedModel ?? subagent.model ?? statusLabel}
      </span>
    </>
  );
  const className = cn(
    "flex size-full flex-col justify-center rounded-2xl border border-border/60 bg-card px-2.75 shadow-xs",
    !live && status !== "failed" && status !== "completed" && "border-dashed opacity-70",
  );
  if (subagent.childThreadId === null) return <div className={className}>{body}</div>;
  return (
    <Link
      to="/$environmentId/$threadId"
      params={{ environmentId, threadId: subagent.childThreadId }}
      className={cn(
        className,
        "outline-none transition-colors hover:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
    >
      {body}
    </Link>
  );
}

/** Thread view: a collapsible graph of the current turn's fleet, only under Liquid Halo. */
export function HaloThreadFleet({ threadRef }: { threadRef: ScopedThreadRef | null }) {
  if (!useHaloExperience() || threadRef === null) return null;
  return <HaloThreadFleetLive threadRef={threadRef} />;
}

function HaloThreadFleetLive({ threadRef }: { threadRef: ScopedThreadRef }) {
  const gt = useGT();
  const messages = useMessages();
  const pill = useHaloThreadPill(threadRef);
  const shell = useThreadShell(threadRef);
  const projection = useQuietThreadProjection(threadRef)?.projection ?? null;
  const fleet = projection === null ? null : deriveThreadTurnSubagents(projection);
  const segment = resolveSubagentPillSegment(fleet, messages);
  if (fleet === null || segment === null) return null;
  return (
    <div className="mb-2 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 shadow-xs">
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground data-panel-open:[&_svg]:rotate-90">
          <ChevronRightIcon className="size-3.5 transition-transform" />
          {gt("Subagents", { $context: "run trace stat" })}
          <span className="ms-auto font-mono text-2xs" aria-label={segment.accessibilityLabel}>
            {segment.label}
          </span>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="max-h-72 overflow-y-auto pt-2">
            <HaloGraphStage
              environmentId={threadRef.environmentId}
              subagents={fleet.subagents}
              main={{
                state: resolveHaloOrbState(pill),
                label: shell?.title ?? "",
                detail: pill ? messages(pill.label) : null,
              }}
            />
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  );
}
