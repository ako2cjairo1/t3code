/**
 * Reads a test command's terminal output, streaming or final, into per-file results for the
 * Liquid Halo test-run card. Unknown or unparseable output returns null so the raw output shows.
 */

export type HaloTestRunner =
  | "vitest"
  | "jest"
  | "pytest"
  | "go"
  | "cargo"
  | "bun"
  | "node"
  | "mocha";
export type HaloTestFileStatus = "pass" | "fail" | "skip" | "running";
export type HaloTestRunState = "running" | "passed" | "failed";

export interface HaloTestCounts {
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
}

export interface HaloTestFile extends HaloTestCounts {
  /** A file path, or a package / test target for runners that report those instead. */
  readonly path: string;
  readonly status: HaloTestFileStatus;
  readonly durationMs: number | null;
}

export interface HaloTestRun {
  readonly runner: HaloTestRunner;
  readonly state: HaloTestRunState;
  /** Files in output order. Empty for runners that report only totals (node, mocha, pytest -q). */
  readonly files: ReadonlyArray<HaloTestFile>;
  /** From the runner's summary when present, else summed over `files`. */
  readonly totals: HaloTestCounts & { readonly total: number };
  readonly durationMs: number | null;
}

interface MutableFile {
  path: string;
  status: HaloTestFileStatus;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number | null;
}

interface Parsed {
  files: MutableFile[];
  totals: HaloTestCounts | null;
  durationMs: number | null;
}

const COMMAND_RUNNERS: ReadonlyArray<readonly [HaloTestRunner, RegExp]> = [
  ["vitest", /\bvitest\b|(?:^|[\s/])vp\s+(?:run\s+)?test\b/],
  ["jest", /\bjest\b/],
  ["pytest", /\bpy\.?test\b|-m\s+pytest\b/],
  ["go", /\bgo\s+test\b/],
  ["cargo", /\bcargo\s+test\b/],
  ["bun", /\bbun\s+test\b/],
  ["node", /\bnode\s+(?:\S+\s+)*--test\b/],
  ["mocha", /\bmocha\b/],
];

// For `npm test` and friends, which don't name the runner.
const OUTPUT_RUNNERS: ReadonlyArray<readonly [HaloTestRunner, RegExp]> = [
  ["vitest", /^\s*(?:RUN\s+v\d|Test Files\s+\d)/m],
  ["jest", /^(?:Test Suites:|(?:PASS|FAIL|RUNS)\s+\S)/m],
  ["pytest", /^=+ (?:test session starts|.* in [\d.]+s)/m],
  ["cargo", /^test result: |^running \d+ tests?$/m],
  ["go", /^(?:ok|FAIL)\s+\S+\s+(?:[\d.]+s|\(cached\))|^--- (?:PASS|FAIL):/m],
  ["bun", /^bun test v\d|^Ran \d+ tests? across \d+ files?/m],
  ["node", /^[ℹ#] (?:tests|pass) \d+$/m],
  ["mocha", /^\s*\d+ passing \(/m],
];

const ANSI = /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007\u001B]*(?:\u0007|\u001B\\)|[@-Z\\-_])/g;

function outputLines(output: string, running: boolean): string[] {
  const lines = output
    .replace(ANSI, "")
    .split("\n")
    // A carriage return redraws the line; only the last frame is on screen.
    .map((line) => line.slice(line.lastIndexOf("\r") + 1).trimEnd());
  // While streaming, the last line may still be half written.
  if (running && !output.endsWith("\n")) lines.pop();
  return lines;
}

/** `34ms`, `1.2s`, `1.234 s`, `1m 2s` → milliseconds. */
function durationMs(text: string | undefined): number | null {
  if (!text) return null;
  const match = /^(?:(\d+)m\s*)?(\d+(?:\.\d+)?)\s*(ms|s)?$/.exec(text.trim());
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) * 60_000 : 0;
  const value = Number(match[2]);
  return Math.round(minutes + (match[3] === "ms" ? value : value * 1000));
}

function countOf(text: string, word: RegExp): number {
  const match = new RegExp(`(\\d+)\\s+(?:${word.source})`).exec(text);
  return match ? Number(match[1]) : 0;
}

function newFile(path: string, status: HaloTestFileStatus = "running"): MutableFile {
  return { path, status, passed: 0, failed: 0, skipped: 0, durationMs: null };
}

function fileFor(files: MutableFile[], path: string): MutableFile {
  const existing = files.find((file) => file.path === path);
  if (existing) return existing;
  const file = newFile(path);
  files.push(file);
  return file;
}

function settledStatus(file: HaloTestCounts): HaloTestFileStatus {
  if (file.failed > 0) return "fail";
  if (file.passed === 0 && file.skipped > 0) return "skip";
  return "pass";
}

function vitest(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let totals: HaloTestCounts | null = null;
  let duration: number | null = null;
  for (const line of lines) {
    // ` ✓ |unit| src/a.test.ts (12 tests | 1 skipped) 34ms`
    const done =
      /^\s*([✓√×✗❯↓])\s+(?:\|[^|]+\|\s+)?(\S+)\s+\((\d+) tests?([^)]*)\)(?:\s+(\d+(?:\.\d+)?m?s))?/.exec(
        line,
      );
    if (done) {
      const total = Number(done[3]);
      const failed = countOf(done[4] ?? "", /failed/);
      const skipped = countOf(done[4] ?? "", /skipped|todo/);
      const file = fileFor(files, done[2]!);
      Object.assign(file, { passed: total - failed - skipped, failed, skipped });
      file.status = done[1] === "↓" ? "skip" : settledStatus(file);
      file.durationMs = durationMs(done[5]);
      continue;
    }
    // TTY progress: ` ❯ src/a.test.ts 3/12`
    const progress = /^\s*❯\s+(?:\|[^|]+\|\s+)?(\S+)\s+(\d+)\/(\d+)$/.exec(line);
    if (progress) {
      const file = fileFor(files, progress[1]!);
      if (file.status === "running") file.passed = Number(progress[2]);
      continue;
    }
    // A file that failed to load never gets a result line.
    const failure = /^\s*FAIL\s+(?:\|[^|]+\|\s+)?(\S+?)(?:\s+>|\s+\[|$)/.exec(line);
    if (failure) {
      const file = fileFor(files, failure[1]!);
      if (file.status === "running") file.status = "fail";
      continue;
    }
    const summary = /^\s*Tests\s+(.+)\((\d+)\)$/.exec(line);
    if (summary) {
      totals = {
        passed: countOf(summary[1]!, /passed/),
        failed: countOf(summary[1]!, /failed/),
        skipped: countOf(summary[1]!, /skipped|todo/),
      };
      continue;
    }
    const time = /^\s*Duration\s+(\d+(?:\.\d+)?m?s)/.exec(line);
    if (time) duration = durationMs(time[1]);
  }
  return { files, totals, durationMs: duration };
}

function jest(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let totals: HaloTestCounts | null = null;
  let duration: number | null = null;
  let current: MutableFile | null = null;
  for (const line of lines) {
    const header =
      /^\s*(PASS|FAIL|RUNS)\s+(?:\S+\s+)??(\S+\.\w+)(?:\s+\((\d+(?:\.\d+)?\s*m?s)\))?$/.exec(line);
    if (header) {
      current = fileFor(files, header[2]!);
      current.status = header[1] === "PASS" ? "pass" : header[1] === "FAIL" ? "fail" : "running";
      current.durationMs = durationMs(header[3]);
      continue;
    }
    // --verbose lists each test under its file.
    const test = /^\s+([✓√✕×○])\s/.exec(line);
    if (test && current) {
      if (test[1] === "○") current.skipped += 1;
      else if (test[1] === "✓" || test[1] === "√") current.passed += 1;
      else current.failed += 1;
      continue;
    }
    const summary = /^Tests:\s+(.+)$/.exec(line);
    if (summary) {
      totals = {
        passed: countOf(summary[1]!, /passed/),
        failed: countOf(summary[1]!, /failed/),
        skipped: countOf(summary[1]!, /skipped|todo/),
      };
      current = null;
      continue;
    }
    const time = /^Time:\s+(\d+(?:\.\d+)?\s*m?s)/.exec(line);
    if (time) duration = durationMs(time[1]);
  }
  return { files, totals, durationMs: duration };
}

const PYTEST_RESULTS = {
  PASSED: "passed",
  XPASS: "passed",
  FAILED: "failed",
  ERROR: "failed",
  SKIPPED: "skipped",
  XFAIL: "skipped",
} as const;

function pytest(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let totals: HaloTestCounts | null = null;
  let duration: number | null = null;
  let current: MutableFile | null = null;
  const addMarks = (file: MutableFile, marks: string) => {
    for (const mark of marks) {
      if (mark === "." || mark === "X") file.passed += 1;
      else if (mark === "F" || mark === "E") file.failed += 1;
      else file.skipped += 1;
    }
  };
  for (const line of lines) {
    // `tests/test_a.py .Fs     [ 60%]`; the percentage lands once the file finishes.
    const progress = /^(\S+\.py)\s+([.FEsxX]+)(\s+\[\s*\d+%\])?$/.exec(line);
    if (progress) {
      current = fileFor(files, progress[1]!);
      addMarks(current, progress[2]!);
      current.status = progress[3] ? settledStatus(current) : "running";
      continue;
    }
    const wrapped = /^([.FEsxX]+)(\s+\[\s*\d+%\])?$/.exec(line);
    if (wrapped && current) {
      addMarks(current, wrapped[1]!);
      current.status = wrapped[2] ? settledStatus(current) : "running";
      continue;
    }
    // -v: `tests/test_a.py::test_one PASSED    [ 20%]`
    const verbose = /^(\S+\.py)::\S+\s+(PASSED|FAILED|ERROR|SKIPPED|XFAIL|XPASS)\b/.exec(line);
    if (verbose) {
      current = fileFor(files, verbose[1]!);
      current[PYTEST_RESULTS[verbose[2] as keyof typeof PYTEST_RESULTS]] += 1;
      current.status = settledStatus(current);
      continue;
    }
    const summary = /^=*\s*((?:\d+ \w+(?:, )?)+) in (\d+(?:\.\d+)?)s\b/.exec(line);
    if (summary) {
      totals = {
        passed: countOf(summary[1]!, /passed|xpassed/),
        failed: countOf(summary[1]!, /failed|errors?/),
        skipped: countOf(summary[1]!, /skipped|xfailed|deselected/),
      };
      duration = durationMs(`${summary[2]}s`);
    }
  }
  // Verbose rows don't say when a file ends; once the summary lands, every file has.
  if (totals) for (const file of files) file.status = settledStatus(file);
  return { files, totals, durationMs: duration };
}

function go(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let pending = { passed: 0, failed: 0, skipped: 0 };
  for (const line of lines) {
    // Top-level tests only; subtests are indented.
    const test = /^--- (PASS|FAIL|SKIP): /.exec(line);
    if (test) {
      const key = test[1] === "PASS" ? "passed" : test[1] === "FAIL" ? "failed" : "skipped";
      pending[key] += 1;
      continue;
    }
    const pkg = /^(ok|FAIL)\s+(\S+)\s+(\d+(?:\.\d+)?s|\(cached\)|\[[^\]]+\])/.exec(line);
    if (pkg) {
      const file = fileFor(files, pkg[2]!);
      Object.assign(file, pending);
      file.status = pkg[1] === "FAIL" ? "fail" : settledStatus(file);
      file.durationMs = durationMs(pkg[3]);
      pending = { passed: 0, failed: 0, skipped: 0 };
    }
  }
  return { files, totals: null, durationMs: null };
}

function cargo(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let current: MutableFile | null = null;
  for (const line of lines) {
    const target = /^\s*(?:Running\s+(?:unittests\s+)?(\S+)|(Doc-tests\s+\S+))/.exec(line);
    if (target) {
      current = newFile(target[1] ?? target[2]!);
      files.push(current);
      continue;
    }
    if (!current) continue;
    const test = /^test \S+(?: - .*)? \.\.\. (ok|FAILED|ignored)/.exec(line);
    if (test) {
      if (test[1] === "ok") current.passed += 1;
      else if (test[1] === "FAILED") current.failed += 1;
      else current.skipped += 1;
      continue;
    }
    const result =
      /^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored;.*finished in (\d+(?:\.\d+)?)s/.exec(
        line,
      );
    if (result) {
      current.passed = Number(result[2]);
      current.failed = Number(result[3]);
      current.skipped = Number(result[4]);
      current.status = result[1] === "FAILED" ? "fail" : settledStatus(current);
      current.durationMs = durationMs(`${result[5]}s`);
      current = null;
    }
  }
  // Binaries and doc-tests with no tests say nothing about the run.
  return {
    files: files.filter(
      (file) => file.status === "running" || file.passed + file.failed + file.skipped > 0,
    ),
    totals: null,
    durationMs: null,
  };
}

function bun(lines: string[]): Parsed {
  const files: MutableFile[] = [];
  let totals: { passed: number; failed: number; skipped: number } | null = null;
  let duration: number | null = null;
  let current: MutableFile | null = null;
  for (const line of lines) {
    const header = /^(\S+\.[cm]?[jt]sx?):$/.exec(line);
    if (header) {
      if (current?.status === "running") current.status = settledStatus(current);
      current = fileFor(files, header[1]!);
      continue;
    }
    // TTY prints ✓ ✗ »; piped output prints (pass) (fail) (skip).
    const test = /^\s*(✓|✗|»|\(pass\)|\(fail\)|\(skip\)|\(todo\))\s/.exec(line);
    if (test && current) {
      if (test[1] === "✓" || test[1] === "(pass)") current.passed += 1;
      else if (test[1] === "✗" || test[1] === "(fail)") current.failed += 1;
      else current.skipped += 1;
      continue;
    }
    const count = /^\s*(\d+) (pass|fail|skip|todo)$/.exec(line);
    if (count) {
      totals ??= { passed: 0, failed: 0, skipped: 0 };
      const key = count[2] === "pass" ? "passed" : count[2] === "fail" ? "failed" : "skipped";
      totals[key] += Number(count[1]);
      continue;
    }
    const ran = /^Ran \d+ tests? across \d+ files?\. \[(\d+(?:\.\d+)?m?s)\]/.exec(line);
    if (ran) duration = durationMs(ran[1]);
  }
  if (totals) for (const file of files) file.status = settledStatus(file);
  return { files, totals, durationMs: duration };
}

/** Node's spec and TAP reporters both end with `ℹ pass 2` / `# pass 2` totals and no files. */
function node(lines: string[]): Parsed {
  const live = { passed: 0, failed: 0, skipped: 0 };
  const summary: Partial<Record<"pass" | "fail" | "skipped" | "todo" | "duration_ms", number>> = {};
  const suites = new Set<string>();
  let summarized = false;
  for (const line of lines) {
    const total = /^[ℹ#] (pass|fail|skipped|todo|duration_ms) (\d+(?:\.\d+)?)$/.exec(line);
    if (total) {
      summary[total[1] as keyof typeof summary] = Number(total[2]);
      summarized = true;
      continue;
    }
    // After the totals, the spec reporter repeats failing tests.
    if (summarized) continue;
    const suite = /^(\s*)▶ (.+)$/.exec(line);
    if (suite) {
      suites.add(`${suite[1]}${suite[2]}`);
      continue;
    }
    const test = /^(\s*)([✔✖﹣]) (.+?)(?: \([\d.]+m?s\))?( # SKIP| # TODO)?$/.exec(line);
    if (!test || suites.has(`${test[1]}${test[3]}`)) continue;
    if (test[4] || test[2] === "﹣") live.skipped += 1;
    else if (test[2] === "✔") live.passed += 1;
    else live.failed += 1;
  }
  return {
    files: [],
    totals:
      summary.pass === undefined
        ? live.passed + live.failed + live.skipped > 0
          ? live
          : null
        : {
            passed: summary.pass,
            failed: summary.fail ?? 0,
            skipped: (summary.skipped ?? 0) + (summary.todo ?? 0),
          },
    durationMs: summary.duration_ms === undefined ? null : Math.round(summary.duration_ms),
  };
}

function mocha(lines: string[]): Parsed {
  const live = { passed: 0, failed: 0, skipped: 0 };
  let totals: HaloTestCounts | null = null;
  let duration: number | null = null;
  for (const line of lines) {
    const passing = /^\s*(\d+) passing \((\d+(?:\.\d+)?m?s)\)$/.exec(line);
    if (passing) {
      totals = { passed: Number(passing[1]), failed: 0, skipped: 0 };
      duration = durationMs(passing[2]);
      continue;
    }
    const other = /^\s*(\d+) (failing|pending)$/.exec(line);
    if (other && totals) {
      totals = { ...totals, [other[2] === "failing" ? "failed" : "skipped"]: Number(other[1]) };
      continue;
    }
    // Failure details after the totals reuse the `1) name` form.
    if (totals) continue;
    if (/^\s+[✔✓] /.test(line)) live.passed += 1;
    else if (/^\s+\d+\) /.test(line)) live.failed += 1;
    else if (/^\s+- /.test(line)) live.skipped += 1;
  }
  return {
    files: [],
    totals: totals ?? (live.passed + live.failed + live.skipped > 0 ? live : null),
    durationMs: duration,
  };
}

const PARSERS: Record<HaloTestRunner, (lines: string[]) => Parsed> = {
  vitest,
  jest,
  pytest,
  go,
  cargo,
  bun,
  node,
  mocha,
};

/** The runner a command invokes, or one its output identifies. */
function detectRunner(command: string, output: string): HaloTestRunner | null {
  for (const [runner, pattern] of COMMAND_RUNNERS) if (pattern.test(command)) return runner;
  const plain = output.replace(ANSI, "");
  for (const [runner, pattern] of OUTPUT_RUNNERS) if (pattern.test(plain)) return runner;
  return null;
}

/**
 * Parses a test command's output. `running` comes from the command, not the text; `exitCode`
 * fails a settled run whose output shows no failing test (a crash or compile error).
 */
export function parseHaloTestRun(input: {
  readonly command: string;
  readonly output: string;
  readonly running: boolean;
  readonly exitCode?: number | null | undefined;
}): HaloTestRun | null {
  const runner = detectRunner(input.command, input.output);
  if (runner === null) return null;
  const parsed = PARSERS[runner](outputLines(input.output, input.running));
  if (parsed.files.length === 0 && parsed.totals === null) return null;
  const files = parsed.files.map((file): HaloTestFile =>
    // A settled command has no running files, even when its last line never arrived.
    !input.running && file.status === "running" ? { ...file, status: settledStatus(file) } : file,
  );
  const counts = parsed.totals ?? {
    passed: files.reduce((sum, file) => sum + file.passed, 0),
    failed: files.reduce((sum, file) => sum + file.failed, 0),
    skipped: files.reduce((sum, file) => sum + file.skipped, 0),
  };
  const failed =
    counts.failed > 0 ||
    files.some((file) => file.status === "fail") ||
    (input.exitCode !== undefined && input.exitCode !== null && input.exitCode !== 0);
  return {
    runner,
    state: input.running ? "running" : failed ? "failed" : "passed",
    files,
    totals: { ...counts, total: counts.passed + counts.failed + counts.skipped },
    durationMs: parsed.durationMs ?? sumDurations(files),
  };
}

function sumDurations(files: ReadonlyArray<HaloTestFile>): number | null {
  const known = files.filter((file) => file.durationMs !== null);
  return known.length === 0 ? null : known.reduce((sum, file) => sum + file.durationMs!, 0);
}
