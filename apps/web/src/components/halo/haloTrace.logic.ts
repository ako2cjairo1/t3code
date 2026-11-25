import { commandDisplayText } from "@t3tools/client-runtime/work-log/command-label";
import type { ThreadStructureTurnItem } from "@t3tools/client-runtime/state/models";
import * as DateTime from "effect/DateTime";
import { turnItemDurationMs } from "./halo.logic";

export type HaloTraceTone = "ok" | "need" | "bad" | "stop" | "run";

export interface HaloTraceEntry {
  readonly id: string;
  readonly label: string;
  readonly tone: HaloTraceTone;
  /** Since the run started; null when either side lacks a timestamp. */
  readonly offsetMs: number | null;
  readonly durationMs: number | null;
}

const LOGGED_TYPES = new Set([
  "command_execution",
  "file_change",
  "file_search",
  "web_search",
  "dynamic_tool",
  "approval_request",
  "user_input_request",
  "error",
]);

function itemLabel(item: ThreadStructureTurnItem): string | null {
  const title = item.title?.trim();
  if (title) return title;
  if (item.type === "command_execution") return commandDisplayText(item.input) || null;
  if (item.type === "file_change") return item.fileName;
  if (item.type === "file_search") return item.pattern ?? null;
  if (item.type === "web_search") return item.patterns?.[0] ?? null;
  if ("toolName" in item && typeof item.toolName === "string") return item.toolName;
  return null;
}

/** The run's tool work, oldest first, keeping the last `limit` entries. */
export function deriveHaloTraceLog(
  items: ReadonlyArray<ThreadStructureTurnItem>,
  runStartedAt: string | null,
  limit: number,
): HaloTraceEntry[] {
  const startMs = runStartedAt === null ? Number.NaN : Date.parse(runStartedAt);
  const entries: HaloTraceEntry[] = [];
  for (const item of items) {
    if (!LOGGED_TYPES.has(item.type)) continue;
    const label = itemLabel(item);
    if (label === null) continue;
    const tone: HaloTraceTone =
      item.status === "failed" || item.type === "error"
        ? "bad"
        : item.type === "approval_request" || item.type === "user_input_request"
          ? "need"
          : item.status === "completed"
            ? "ok"
            : item.status === "cancelled" || item.status === "interrupted"
              ? "stop"
              : "run";
    const offsetMs =
      item.startedAt === null || Number.isNaN(startMs)
        ? null
        : Math.max(0, DateTime.toEpochMillis(item.startedAt) - startMs);
    entries.push({ id: item.id, label, tone, offsetMs, durationMs: turnItemDurationMs(item) });
  }
  return entries.slice(-limit);
}

/** `m:ss.d`, the trace log's clock. */
export function formatHaloTraceOffset(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.${Math.floor((ms % 1000) / 100)}`;
}
