import type { EnvironmentId } from "@t3tools/contracts";
import { formatDuration } from "@t3tools/shared/orchestrationTimingCopy";
import { useGT, useMessages } from "gt-react";
import { CheckIcon, XIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { tickTextContent } from "~/lib/tickTextContent";
import { cn } from "~/lib/utils";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { formatWorkingTimerNow } from "../chat/TimelineWorkGroupRows.logic";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { isHaloTestCommand } from "./haloStages.logic";
import { parseHaloTestRun, type HaloTestFile, type HaloTestRun } from "./haloTestRun.logic";

const MAX_ROWS = 10;
const MAX_CELLS = 48;

type CellStatus = "pass" | "fail" | "skip" | "running";

const CELL_CLASS: Record<CellStatus, string> = {
  pass: "bg-primary",
  fail: "bg-destructive shadow-[0_0_8px_color-mix(in_srgb,var(--destructive)_60%,transparent)]",
  skip: "bg-foreground/9",
  running: "bg-foreground/14",
};

function fileCells(file: HaloTestFile): CellStatus[] {
  const cells: CellStatus[] = [
    ...Array<CellStatus>(file.failed).fill("fail"),
    ...Array<CellStatus>(file.passed).fill("pass"),
    ...Array<CellStatus>(file.skipped).fill("skip"),
  ].slice(0, MAX_CELLS);
  // A running file gets a shimmering cell for the test in flight; one with no counts shows its status.
  if (file.status === "running") cells.push("running");
  else if (cells.length === 0) cells.push(file.status);
  return cells;
}

/** Failing and running files first, so a long run still shows what matters. */
function visibleFiles(files: ReadonlyArray<HaloTestFile>): HaloTestFile[] {
  const rank = (file: HaloTestFile) =>
    file.status === "fail" ? 0 : file.status === "running" ? 1 : 2;
  return files.toSorted((a, b) => rank(a) - rank(b)).slice(0, MAX_ROWS);
}

function HaloTestRunCard({
  run,
  startedAt,
  settledMs,
  environmentId,
  outputShown,
  onToggleOutput,
}: {
  run: HaloTestRun;
  startedAt: string | null;
  settledMs: number | null;
  environmentId: EnvironmentId;
  outputShown: boolean;
  /** Omitted when the raw output is not offered (the collapsed-row card). */
  onToggleOutput: (() => void) | undefined;
}) {
  const gt = useGT();
  const m = useMessages();
  const running = run.state === "running";
  const { passed, failed, total } = run.totals;
  const title = running
    ? gt("Running tests")
    : failed > 0
      ? gt("{count, plural, one {# test failed} other {# tests failed}}", { count: failed })
      : gt("All {count} passed", { count: total });
  const elapsedMs = running ? null : (run.durationMs ?? settledMs);
  const rows: ReadonlyArray<{ key: string; label: string; cells: CellStatus[]; count: number }> =
    run.files.length > 0
      ? visibleFiles(run.files).map((file) => ({
          key: file.path,
          label: file.path,
          cells: fileCells(file),
          count: file.passed + file.failed + file.skipped,
        }))
      : [
          {
            key: run.runner,
            label: run.runner,
            cells: fileCells({
              ...run.totals,
              path: run.runner,
              status: running ? "running" : run.state === "failed" ? "fail" : "pass",
              durationMs: null,
            }),
            count: total,
          },
        ];
  const hiddenFiles = run.files.length - rows.length;

  return (
    <div
      ref={running ? observeVisibleAnimation : undefined}
      data-halo-test-run={run.state}
      className="cursor-auto rounded-3xl border border-(--halo-line) bg-card/55 px-4 pt-3.5 pb-3 font-sans shadow-(--halo-depth) backdrop-blur-(--glass-blur)"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full",
            running
              ? "bg-primary/12 text-primary"
              : failed > 0 || run.state === "failed"
                ? "bg-destructive/12 text-destructive"
                : "bg-foreground/14 text-foreground",
          )}
        >
          {running ? (
            <Spinner size="md" aria-hidden />
          ) : run.state === "failed" ? (
            <XIcon aria-hidden className="size-3.5" />
          ) : (
            <CheckIcon aria-hidden className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          <div className="mt-px flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{run.runner}</span>
            {run.files.length > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  {gt("{count, plural, one {# file} other {# files}}", {
                    count: run.files.length,
                  })}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <span
          ref={
            running && startedAt !== null
              ? tickTextContent(() => formatWorkingTimerNow(startedAt, environmentId), true)
              : undefined
          }
          className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums"
        >
          {elapsedMs !== null && elapsedMs > 0 ? formatDuration(elapsedMs, m) : null}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid min-h-5.5 grid-cols-[minmax(0,13.75rem)_1fr_2.75rem] items-center gap-3"
          >
            <span className="truncate font-mono text-2xs text-muted-foreground">{row.label}</span>
            <span className="flex flex-wrap gap-0.75" aria-hidden>
              {row.cells.map((cell, index) => (
                <i
                  // oxlint-disable-next-line react/no-array-index-key -- cells are positional
                  key={index}
                  data-halo-test-cell={cell}
                  className={cn("h-3.5 w-1.5 rounded-xs", CELL_CLASS[cell])}
                />
              ))}
            </span>
            <span className="text-end font-mono text-2xs text-muted-foreground tabular-nums">
              {row.count > 0 ? row.count : null}
            </span>
          </div>
        ))}
        {hiddenFiles > 0 ? (
          <div className="text-xs text-muted-foreground">
            {gt("+{count} more files", { count: hiddenFiles })}
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
        <span>{gt("{count} passed", { count: passed })}</span>
        <span className={failed > 0 ? "text-destructive" : undefined}>
          {gt("{count} failed", { count: failed })}
        </span>
        <span>{gt("of {count}", { count: total })}</span>
        <span className="flex-1" />
        {onToggleOutput ? (
          <Button size="xs" variant="ghost" aria-expanded={outputShown} onClick={onToggleOutput}>
            {outputShown ? gt("Hide output") : gt("Show output")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Liquid Halo: a test command's output as a live per-file card, with the raw output behind a
 * toggle. Anything else, or output the parser can't read, renders `children` unchanged.
 */
export function HaloTestRunOutput({
  command,
  output,
  running,
  exitCode,
  startedAt,
  settledMs,
  environmentId,
  children,
  cardOnly = false,
}: {
  command: string | undefined;
  output: string | null;
  running: boolean;
  exitCode: number | undefined;
  startedAt: string | null;
  settledMs: number | null;
  environmentId: EnvironmentId;
  children: ReactNode;
  /** Collapsed rows show just the card: no raw output, and nothing when it can't be parsed. */
  cardOnly?: boolean;
}) {
  const halo = useHaloExperience();
  const [outputShown, setOutputShown] = useState(false);
  const run =
    halo && command && output && isHaloTestCommand(command)
      ? parseHaloTestRun({ command, output, running, exitCode })
      : null;
  if (run === null) return cardOnly ? null : children;
  return (
    <>
      <HaloTestRunCard
        run={run}
        startedAt={startedAt}
        settledMs={settledMs}
        environmentId={environmentId}
        outputShown={outputShown}
        onToggleOutput={cardOnly ? undefined : () => setOutputShown(!outputShown)}
      />
      {outputShown && !cardOnly ? children : null}
    </>
  );
}
