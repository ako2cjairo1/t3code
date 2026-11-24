import { scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { useMessages } from "gt-react";
import { CheckIcon } from "lucide-react";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { useThreadShell } from "../../state/entities";
import { useUiStateStore } from "../../uiStateStore";
import { resolveThreadLastVisitedAt, resolveThreadStatusPill } from "../Sidebar.logic";
import { haloOrbStateAnimates, resolveHaloOrbState, type HaloOrbState } from "./halo.logic";

/** Decorative; the caller owns the accessible label. Styles live in `halo.css`. */
export function HaloOrb({
  state,
  className,
  ...rest
}: {
  state: HaloOrbState;
  className?: string | undefined;
  "data-thread-status"?: string;
}) {
  return (
    <span
      ref={haloOrbStateAnimates(state) ? observeVisibleAnimation : undefined}
      aria-hidden="true"
      data-halo-orb=""
      data-state={state}
      {...rest}
      className={cn("relative inline-block size-3.5 shrink-0", className)}
    >
      <i data-halo-glow="" />
      <i data-halo-ring="" />
      <i data-halo-core="" />
      <i data-halo-pulse="" />
      {state === "done" ? <CheckIcon data-halo-check="" strokeWidth={3.5} /> : null}
    </span>
  );
}

/** The active thread's orb; renders nothing outside Liquid Halo, so other themes subscribe to nothing. */
export function HaloThreadOrb({
  threadRef,
  className,
}: {
  threadRef: ScopedThreadRef;
  className?: string | undefined;
}) {
  if (!useHaloExperience()) return null;
  return <HaloThreadOrbLive threadRef={threadRef} className={className} />;
}

function HaloThreadOrbLive({
  threadRef,
  className,
}: {
  threadRef: ScopedThreadRef;
  className: string | undefined;
}) {
  const m = useMessages();
  const thread = useThreadShell(threadRef);
  const localLastVisitedAt = useUiStateStore(
    (state) => state.threadLastVisitedAtById[scopedThreadKey(threadRef)],
  );
  const pill = thread
    ? resolveThreadStatusPill({
        thread: {
          ...thread,
          lastVisitedAt: resolveThreadLastVisitedAt(thread.lastVisitedAt, localLastVisitedAt),
        },
      })
    : null;
  const orb = <HaloOrb state={resolveHaloOrbState(pill)} className={className} />;
  if (!pill) return orb;
  const label = m(pill.label);
  return (
    <Tooltip>
      <TooltipTrigger render={<span role="img" aria-label={label} className="inline-flex" />}>
        {orb}
      </TooltipTrigger>
      <TooltipPopup side="bottom">{label}</TooltipPopup>
    </Tooltip>
  );
}
