import { scopeThreadRef, scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";
import { effectiveSnoozed } from "@t3tools/client-runtime/state/thread-settled";
import { resolveThreadActivityTimestamp } from "@t3tools/client-runtime/state/thread-sort";
import {
  resolveThreadStatusPill,
  type ThreadStatusKind,
  type ThreadStatusPill,
} from "../Sidebar.logic";

export type HaloInboxColumn = "needs" | "running" | "done";
export type HaloInboxDrop = "settle" | "unsettle" | "unsnooze";

type HaloInboxThread = Parameters<typeof resolveThreadStatusPill>[0]["thread"] &
  Parameters<typeof effectiveSnoozed>[0] &
  Pick<
    EnvironmentThreadShell,
    "id" | "environmentId" | "archivedAt" | "settledOverride" | "latestUserMessageAt" | "updatedAt"
  >;

export interface HaloInboxCard<T extends HaloInboxThread> {
  readonly key: string;
  readonly thread: T;
  readonly column: HaloInboxColumn;
  readonly pill: ThreadStatusPill | null;
  /** Parked threads sit in Done until the user brings them back. */
  readonly parked: "settled" | "snoozed" | null;
  /** The environment's config is loaded, so settle and snooze state is known and changeable. */
  readonly settleable: boolean;
  readonly activityAt: string | null;
}

const NEEDS_KINDS: ReadonlySet<ThreadStatusKind> = new Set([
  "approval",
  "input",
  "guest",
  "plan-ready",
  "failed",
  "completed",
]);
const RUNNING_KINDS: ReadonlySet<ThreadStatusKind> = new Set(["working", "connecting", "waiting"]);

export function resolveHaloInboxColumn(
  pill: Pick<ThreadStatusPill, "kind"> | null,
  parked: boolean,
): HaloInboxColumn {
  if (pill === null) return "done";
  if (RUNNING_KINDS.has(pill.kind)) return "running";
  // Parked threads stay in Done, like the sidebar's settled and snoozed shelves.
  if (!parked && NEEDS_KINDS.has(pill.kind)) return "needs";
  return "done";
}

/** Columns hold newest activity first; Done keeps only the most recent `doneLimit` cards. */
export function buildHaloInboxBoard<T extends HaloInboxThread>(
  threads: readonly T[],
  options: {
    readonly now: string;
    readonly doneLimit: number;
    readonly configLoaded: (thread: T) => boolean;
    readonly lastVisitedAt: (thread: T) => string | undefined;
    /** A drop in flight: its card shows in the target column until the command settles. */
    readonly pending?: { readonly key: string; readonly column: HaloInboxColumn } | null;
  },
) {
  const columns: Record<HaloInboxColumn, HaloInboxCard<T>[]> = { needs: [], running: [], done: [] };
  for (const thread of threads) {
    if (thread.archivedAt != null) continue;
    const key = scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id));
    const settleable = options.configLoaded(thread);
    const parked = !settleable
      ? null
      : thread.settledOverride === "settled"
        ? "settled"
        : effectiveSnoozed(thread, { now: options.now })
          ? "snoozed"
          : null;
    const pill = resolveThreadStatusPill({
      thread: { ...thread, lastVisitedAt: options.lastVisitedAt(thread) },
    });
    const derived = resolveHaloInboxColumn(pill, parked !== null);
    const column = options.pending?.key === key ? options.pending.column : derived;
    columns[column].push({
      key,
      thread,
      column,
      pill,
      parked,
      settleable,
      activityAt: resolveThreadActivityTimestamp(thread),
    });
  }
  const newestFirst = (left: HaloInboxCard<T>, right: HaloInboxCard<T>) =>
    Date.parse(right.activityAt ?? "") - Date.parse(left.activityAt ?? "") ||
    left.key.localeCompare(right.key);
  const done = columns.done.sort(newestFirst);
  return {
    needs: columns.needs.sort(newestFirst),
    running: columns.running.sort(newestFirst),
    done: done.slice(0, options.doneLimit),
    doneHidden: Math.max(0, done.length - options.doneLimit),
  };
}

/** What dropping `card` on `target` does, or null when the column refuses it. */
export function resolveHaloInboxDrop(
  card: Pick<HaloInboxCard<HaloInboxThread>, "column" | "parked" | "settleable">,
  target: HaloInboxColumn,
): HaloInboxDrop | null {
  if (!card.settleable || target === card.column) return null;
  // Working threads only leave Running by finishing, like sidebar rows.
  if (target === "done")
    return card.column === "needs" && card.parked !== "settled" ? "settle" : null;
  if (target === "running") {
    return card.parked === "snoozed" ? "unsnooze" : card.parked === "settled" ? "unsettle" : null;
  }
  return null;
}
