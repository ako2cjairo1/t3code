import type { ScopedThreadRef } from "@t3tools/contracts";
import { useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { useGT } from "gt-react";
import { ActivityIcon, InboxIcon, MessageSquareIcon } from "lucide-react";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { useThreadRouteRef } from "~/hooks/useThreadRouteTarget";
import { resolveThreadRouteRef } from "~/threadRoutes";
import { Toggle, ToggleGroup } from "../ui/toggle-group";

type HaloView = "thread" | "inbox" | "trace";

const INBOX_ROUTE_ID = "/_chat/inbox";
const TRACE_ROUTE_ID = "/_chat/trace/$traceEnvironmentId/$traceThreadId";

// The Inbox has no thread of its own; Thread and Trace return to the last one a view showed.
let lastHaloThreadRef: ScopedThreadRef | null = null;

export function rememberHaloThread(ref: ScopedThreadRef | null) {
  if (ref !== null) lastHaloThreadRef = ref;
}

/** Router option for moving between Thread, Inbox, and Trace; styles live in `halo.css`. */
export function haloDepthTransition() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return { types: ["halo-depth"] };
}

function useHaloViewNavigation() {
  const navigate = useNavigate();
  return (view: HaloView, ref: ScopedThreadRef | null) => {
    rememberHaloThread(ref);
    const viewTransition = haloDepthTransition();
    if (view === "inbox") return navigate({ to: "/inbox", viewTransition });
    if (ref === null) return navigate({ to: "/", viewTransition });
    return view === "trace"
      ? navigate({
          to: "/trace/$traceEnvironmentId/$traceThreadId",
          params: { traceEnvironmentId: ref.environmentId, traceThreadId: ref.threadId },
          viewTransition,
        })
      : navigate({
          to: "/$environmentId/$threadId",
          params: { environmentId: ref.environmentId, threadId: ref.threadId },
          viewTransition,
        });
  };
}

/** Thread / Inbox / Trace segmented control; renders nothing outside Liquid Halo. */
export function HaloViewSwitcher() {
  if (!useHaloExperience()) return null;
  return <HaloViewSwitcherLive />;
}

function HaloViewSwitcherLive() {
  const gt = useGT();
  const routeThreadRef = useThreadRouteRef();
  const view = useMatches({
    select: (matches): HaloView =>
      matches.some((match) => match.routeId === TRACE_ROUTE_ID)
        ? "trace"
        : matches.some((match) => match.routeId === INBOX_ROUTE_ID)
          ? "inbox"
          : "thread",
  });
  const traceRef = resolveThreadRouteRef({
    environmentId: useParams({ strict: false, select: (params) => params.traceEnvironmentId }),
    threadId: useParams({ strict: false, select: (params) => params.traceThreadId }),
  });
  const go = useHaloViewNavigation();
  const threadRef = routeThreadRef ?? traceRef ?? (view === "inbox" ? lastHaloThreadRef : null);
  return (
    <ToggleGroup
      aria-label={gt("View", { $context: "Thread, Inbox, or Trace view switcher" })}
      value={[view]}
      onValueChange={(next) => {
        const value = next[0];
        if (value === "thread" || value === "inbox" || value === "trace") void go(value, threadRef);
      }}
    >
      <Toggle value="thread">
        <MessageSquareIcon />
        <span className="max-lg:sr-only">{gt("Thread", { $context: "view switcher" })}</span>
      </Toggle>
      <Toggle value="inbox">
        <InboxIcon />
        <span className="max-lg:sr-only">{gt("Inbox", { $context: "view switcher" })}</span>
      </Toggle>
      <Toggle value="trace" disabled={threadRef === null}>
        <ActivityIcon />
        <span className="max-lg:sr-only">{gt("Trace", { $context: "view switcher" })}</span>
      </Toggle>
    </ToggleGroup>
  );
}
