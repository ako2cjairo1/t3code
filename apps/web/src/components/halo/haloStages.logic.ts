import { commandDisplayText } from "@t3tools/client-runtime/work-log/command-label";
import type { OrchestrationV2TurnItemStatus } from "@t3tools/contracts";
import * as DateTime from "effect/DateTime";

const HALO_STAGE_IDS = ["plan", "edit", "test", "commit"] as const;
export type HaloStageId = (typeof HALO_STAGE_IDS)[number];
export type HaloStageStatus = "pending" | "active" | "done" | "skipped";

export interface HaloStage {
  readonly id: HaloStageId;
  readonly status: HaloStageStatus;
  /** Work items that fell in this stage. */
  readonly itemCount: number;
  /** First start to last finish of the stage's finished items; null before one finishes. */
  readonly durationMs: number | null;
  /** ISO start of the active stage, for a live timer; null otherwise. */
  readonly activeSince: string | null;
}

export interface HaloRunStages {
  readonly stages: ReadonlyArray<HaloStage>;
  /** Tool calls in the run: commands, file changes, searches, and provider tools. */
  readonly toolCount: number;
}

/** The fields the heuristic reads; every structure turn item satisfies it. */
export interface HaloStageItem {
  readonly type: string;
  readonly status: OrchestrationV2TurnItemStatus;
  readonly ordinal: number;
  readonly startedAt: DateTime.Utc | null;
  readonly completedAt: DateTime.Utc | null;
  readonly input?: unknown;
  readonly toolName?: string | null;
}

const TOOL_ITEM_TYPES = new Set([
  "command_execution",
  "file_change",
  "file_search",
  "web_search",
  "dynamic_tool",
]);
const PLAN_ITEM_TYPES = new Set(["file_search", "web_search", "todo_list", "proposed_plan"]);
const PLAN_TOOL_NAMES = new Set([
  "read",
  "grep",
  "glob",
  "ls",
  "list",
  "search",
  "webfetch",
  "websearch",
  "todowrite",
  "todoread",
  "exitplanmode",
  "update_plan",
  "read_file",
  "list_files",
  "view",
]);
const EDIT_TOOL_NAMES = new Set([
  "edit",
  "multiedit",
  "write",
  "notebookedit",
  "apply_patch",
  "str_replace",
  "write_file",
  "create_file",
]);
const COMMAND_TOOL_NAMES = new Set(["bash", "shell", "exec", "run_command", "terminal"]);

// Matched at the start of each command segment, so `rg "git commit"` stays a read.
const COMMIT_COMMAND = /^(?:git\s+(?:commit|push)|gh\s+pr\s+create|jj\s+(?:commit|git\s+push))\b/;
const TEST_COMMAND =
  /^(?:(?:npx|pnpx|bunx|pnpm\s+exec|yarn\s+exec)\s+)?(?:vitest|jest|mocha|ava|playwright\s+test|cypress\s+run|pytest|py\.test|tox|nox|phpunit|rspec|go\s+test|cargo\s+(?:test|nextest)|deno\s+test|swift\s+test|dotnet\s+test|mix\s+test|ctest|(?:mvn|\.\/mvnw)\s+(?:\S+\s+)*test|(?:gradle|\.\/gradlew)\s+(?:\S+\s+)*test|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test(?::\S+)?|(?:vp|\S*\/vp)\s+(?:run\s+)?test|python3?\s+-m\s+(?:pytest|unittest))\b/;
const READ_COMMAND =
  /^(?:cat|head|tail|less|ls|tree|find|fd|rg|grep|ag|sed\s+-n|wc|file|stat|pwd|git\s+(?:status|diff|log|show|blame|grep|branch))\b/;
const ENV_ASSIGNMENT = /^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/;

function commandSegments(command: string): string[] {
  return commandDisplayText(command)
    .split(/&&|\|\||[;|\n]/)
    .map((segment) =>
      segment
        .trim()
        .replace(ENV_ASSIGNMENT, "")
        .replace(/^(?:sudo|env|time|command)\s+/, "")
        .replace(ENV_ASSIGNMENT, ""),
    )
    .filter((segment) => segment.length > 0 && !/^cd(?:\s|$)/.test(segment));
}

/** Commit beats Test beats Plan, so `vitest && git commit` counts as a commit. */
function classifyCommand(command: string): HaloStageId | null {
  const segments = commandSegments(command);
  if (segments.some((segment) => COMMIT_COMMAND.test(segment))) return "commit";
  if (segments.some((segment) => TEST_COMMAND.test(segment))) return "test";
  if (segments.length > 0 && segments.every((segment) => READ_COMMAND.test(segment))) return "plan";
  return null;
}

function toolCommand(input: unknown): string | null {
  if (typeof input === "string") return input;
  if (input === null || typeof input !== "object") return null;
  const command = (input as { command?: unknown }).command;
  if (typeof command === "string") return command;
  if (Array.isArray(command) && command.every((part) => typeof part === "string"))
    return command.join(" ");
  return null;
}

/** Which stage a work item belongs to, or null when it says nothing about the stage. */
export function classifyHaloStageItem(item: HaloStageItem): HaloStageId | null {
  if (item.type === "file_change") return "edit";
  if (PLAN_ITEM_TYPES.has(item.type)) return "plan";
  if (item.type === "command_execution") {
    return typeof item.input === "string" ? classifyCommand(item.input) : null;
  }
  if (item.type !== "dynamic_tool") return null;
  const name = item.toolName?.trim().toLowerCase() ?? "";
  if (PLAN_TOOL_NAMES.has(name)) return "plan";
  if (EDIT_TOOL_NAMES.has(name)) return "edit";
  if (COMMAND_TOOL_NAMES.has(name)) {
    const command = toolCommand(item.input);
    return command === null ? null : classifyCommand(command);
  }
  return null;
}

/**
 * The run's Plan / Edit / Test / Commit stages. The stage of the newest classified item is
 * active while the run is live; any stage with items is otherwise done, so a test run that
 * sends the agent back to editing stays done. An empty stage before the furthest one reached,
 * or any empty stage once the run settles, is skipped.
 */
export function deriveHaloRunStages(
  items: ReadonlyArray<HaloStageItem>,
  live: boolean,
): HaloRunStages {
  const byStage = new Map<HaloStageId, HaloStageItem[]>();
  let latest: { stage: HaloStageId; ordinal: number } | null = null;
  let toolCount = 0;
  for (const item of items) {
    if (TOOL_ITEM_TYPES.has(item.type)) toolCount += 1;
    const stage = classifyHaloStageItem(item);
    if (stage === null) continue;
    byStage.set(stage, [...(byStage.get(stage) ?? []), item]);
    if (latest === null || item.ordinal >= latest.ordinal)
      latest = { stage, ordinal: item.ordinal };
  }
  const furthest = HALO_STAGE_IDS.findLastIndex((id) => byStage.has(id));
  const activeStage: HaloStageId | null = live ? (latest?.stage ?? "plan") : null;
  const stages = HALO_STAGE_IDS.map((id, index): HaloStage => {
    const stageItems = byStage.get(id) ?? [];
    const active = id === activeStage;
    const status: HaloStageStatus = active
      ? "active"
      : stageItems.length > 0
        ? "done"
        : live && index > furthest
          ? "pending"
          : "skipped";
    return {
      id,
      status,
      itemCount: stageItems.length,
      durationMs: stageSpanMs(stageItems),
      activeSince: active ? stageStartIso(stageItems) : null,
    };
  });
  return { stages, toolCount };
}

function stageSpanMs(items: ReadonlyArray<HaloStageItem>): number | null {
  let start: number | null = null;
  let end: number | null = null;
  for (const item of items) {
    if (item.startedAt === null || item.completedAt === null) continue;
    const itemStart = DateTime.toEpochMillis(item.startedAt);
    const itemEnd = DateTime.toEpochMillis(item.completedAt);
    start = start === null ? itemStart : Math.min(start, itemStart);
    end = end === null ? itemEnd : Math.max(end, itemEnd);
  }
  return start === null || end === null || end <= start ? null : end - start;
}

function stageStartIso(items: ReadonlyArray<HaloStageItem>): string | null {
  let start: DateTime.Utc | null = null;
  for (const item of items) {
    if (item.startedAt === null) continue;
    if (start === null || DateTime.toEpochMillis(item.startedAt) < DateTime.toEpochMillis(start))
      start = item.startedAt;
  }
  return start === null ? null : DateTime.formatIso(start);
}
