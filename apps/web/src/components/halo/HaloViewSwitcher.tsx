import type { ScopedThreadRef } from "@t3tools/contracts";
import { useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { useGT } from "gt-react";
import { ActivityIcon, InboxIcon, MessageSquareIcon } from "lucide-react";
import { scopeThreadRef, scopedThreadKey } from "@t3tools/client-runtime/environment";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { useNowMinute } from "~/hooks/useNowMinute";
import { useServerConfigs, useVisibleThreadShells } from "~/state/entities";
import { useUiStateStore } from "~/uiStateStore";
import { useThreadRouteRef } from "~/hooks/useThreadRouteTarget";
import { resolveThreadRouteRef } from "~/threadRoutes";
import { resolveThreadLastVisitedAt } from "../Sidebar.logic";
import { buildHaloInboxBoard } from "./haloInbox.logic";
import { HaloSegmented } from "./HaloSegmented";

type HaloView = "thread" | "inbox" | "trace";

const INBOX_ROUTE_ID = "/_chat/inbox";
const TRACE_ROUTE_ID = "/_chat/trace/$traceEnvironmentId/$traceThreadId";

// The Inbox has no thread of its own; Thread and Trace return to the last one a view showed.
let lastHaloThreadRef: ScopedThreadRef | null = null;

export function rememberHaloThread(ref: ScopedThreadRef | null) {
  if (ref !== null) lastHaloThreadRef = ref;
}

export function lastHaloThread() {
  return lastHaloThreadRef;
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
  // The header row is the main pane less ~136px of gutters and panel controls, so this is the
  // prototype's 1060px main-width break; the island and git label follow at 860 and 740.
  const label = "@max-[924px]/chat-header:sr-only";
  return (
    <HaloSegmented
      name="view"
      aria-label={gt("View", { $context: "Thread, Inbox, or Trace view switcher" })}
      value={view}
      onValueChange={(value) => void go(value, threadRef)}
      items={[
        {
          value: "thread",
          label: (
            <>
              <MessageSquareIcon />
              <span className={label}>{gt("Thread", { $context: "view switcher" })}</span>
            </>
          ),
        },
        {
          value: "inbox",
          label: (
            <>
              <InboxIcon />
              <span className={label}>{gt("Inbox", { $context: "view switcher" })}</span>
              <HaloInboxBadge />
            </>
          ),
        },
        {
          value: "trace",
          disabled: threadRef === null,
          label: (
            <>
              <ActivityIcon />
              <span className={label}>{gt("Trace", { $context: "view switcher" })}</span>
            </>
          ),
        },
      ]}
    />
  );
}

/** How many inbox cards need the user; hidden at zero, pops when the count changes. */
function HaloInboxBadge() {
  const threads = useVisibleThreadShells();
  const serverConfigs = useServerConfigs();
  const lastVisitedById = useUiStateStore((state) => state.threadLastVisitedAtById);
  const nowMinute = useNowMinute();
  const count = buildHaloInboxBoard(threads, {
    now: `${nowMinute}:00.000Z`,
    doneLimit: 0,
    configLoaded: (thread) => serverConfigs.has(thread.environmentId),
    lastVisitedAt: (thread) =>
      resolveThreadLastVisitedAt(
        thread.lastVisitedAt,
        lastVisitedById[scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id))],
      ),
  }).needs.length;
  if (count === 0) return null;
  return (
    <span
      key={count}
      data-halo-badge=""
      className="ms-0.5 min-w-4 rounded-full bg-primary px-1.25 text-center text-3xs leading-4 font-semibold text-primary-foreground tabular-nums"
    >
      {count}
    </span>
  );
}
