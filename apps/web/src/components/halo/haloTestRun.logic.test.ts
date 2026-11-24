import { describe, expect, it } from "vite-plus/test";
import { parseHaloTestRun } from "./haloTestRun.logic";

const parse = (command: string, output: string, running = false, exitCode?: number) =>
  parseHaloTestRun({ command, output, running, exitCode });

describe("parseHaloTestRun", () => {
  it("vitest: failing file lines, summary totals and duration", () => {
    const output = `
 RUN  v5.0.5 /repo/apps/web

 \u001b[31m❯\u001b[39m x.test.ts (3 tests | 1 failed | 1 skipped) 5ms
   × b 3ms
 ✓ |unit| src/y.test.ts (12 tests) 34ms
 ↓ src/z.test.ts (2 tests | 2 skipped)

 FAIL  x.test.ts > b
AssertionError: expected 1 to be 2
 ❯ x.test.ts:3:24

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 13 passed | 3 skipped (17)
   Start at  05:25:19
   Duration  1.20s (transform 51%, import 27%, tests 11%, worker 10%)
`;
    const run = parse("vp test run --project unit", output);
    expect(run).toMatchObject({
      runner: "vitest",
      state: "failed",
      totals: { passed: 13, failed: 1, skipped: 3, total: 17 },
      durationMs: 1200,
    });
    expect(run?.files).toEqual([
      { path: "x.test.ts", status: "fail", passed: 1, failed: 1, skipped: 1, durationMs: 5 },
      { path: "src/y.test.ts", status: "pass", passed: 12, failed: 0, skipped: 0, durationMs: 34 },
      { path: "src/z.test.ts", status: "skip", passed: 0, failed: 0, skipped: 2, durationMs: null },
    ]);
  });

  it("vitest: streaming progress, partial last line, and a summary-only pass", () => {
    const live = parse(
      "pnpm vitest",
      " ✓ a.test.ts (2 tests) 4ms\n ❯ b.test.ts 1/5\n ✓ c.te",
      true,
    );
    expect(live?.state).toBe("running");
    expect(live?.files.map((file) => [file.path, file.status])).toEqual([
      ["a.test.ts", "pass"],
      ["b.test.ts", "running"],
    ]);
    const summaryOnly = parse(
      "npm test",
      " RUN  v5.0.5 /repo\n\n Test Files  2 passed (2)\n      Tests  14 passed (14)\n   Duration  551ms\n",
    );
    expect(summaryOnly).toMatchObject({ runner: "vitest", state: "passed", files: [] });
    expect(summaryOnly?.totals.total).toBe(14);
  });

  it("jest: suite headers, verbose tests and summary", () => {
    const output = `PASS src/sum.test.js (1.234 s)
  ✓ adds (2 ms)
  ○ skipped later
FAIL src/sub.test.js
  ✕ subtracts (5 ms)
RUNS src/slow.test.js

Tests:       1 failed, 1 skipped, 1 passed, 3 total
Test Suites: 1 failed, 1 passed, 2 total
Time:        2.3 s
`;
    const run = parse("npx jest", output);
    expect(run).toMatchObject({
      runner: "jest",
      state: "failed",
      totals: { passed: 1, failed: 1, skipped: 1, total: 3 },
      durationMs: 2300,
    });
    expect(run?.files.map((file) => [file.path, file.status, file.durationMs])).toEqual([
      ["src/sum.test.js", "pass", 1234],
      ["src/sub.test.js", "fail", null],
      // Settled, so no file is still running.
      ["src/slow.test.js", "pass", null],
    ]);
  });

  it("pytest: progress rows, verbose rows and -q summary", () => {
    const progress = `============================= test session starts ==============================
collected 5 items

tests/test_a.py .Fs                                                      [ 60%]
tests/test_b.py ..                                                       [100%]

FAILED tests/test_a.py::test_two - assert 0
==================== 1 failed, 3 passed, 1 skipped in 0.05s ====================
`;
    expect(parse("pytest tests", progress)).toMatchObject({
      runner: "pytest",
      state: "failed",
      totals: { passed: 3, failed: 1, skipped: 1, total: 5 },
      durationMs: 50,
      files: [
        { path: "tests/test_a.py", status: "fail", passed: 1, failed: 1, skipped: 1 },
        { path: "tests/test_b.py", status: "pass", passed: 2 },
      ],
    });
    const verbose = `tests/test_a.py::test_one PASSED                                         [ 20%]
tests/test_a.py::test_three SKIPPED (unconditional skip)                 [ 60%]
tests/test_b.py::test_ok PASSED                                          [ 80%]
`;
    expect(parse("python -m pytest -v", verbose)?.files).toMatchObject([
      { path: "tests/test_a.py", passed: 1, skipped: 1, status: "pass" },
      { path: "tests/test_b.py", passed: 1, status: "pass" },
    ]);
    const live = parse("pytest", "tests/test_a.py ..\n", true);
    expect(live?.files[0]?.status).toBe("running");
    expect(
      parse("pytest -q", "..F.s  [100%]\n1 failed, 3 passed, 1 skipped in 0.05s\n"),
    ).toMatchObject({ files: [], totals: { failed: 1, passed: 3, skipped: 1 } });
  });

  it("go test: one row per package", () => {
    const output = `=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
--- PASS: TestSub (0.00s)
ok  	example.com/calc	0.012s
--- FAIL: TestParse (0.00s)
    parse_test.go:12: unexpected token
    --- FAIL: TestParse/nested (0.00s)
FAIL
FAIL	example.com/parse	0.020s
ok  	example.com/util	(cached)
?   	example.com/cmd	[no test files]
`;
    expect(parse("go test ./...", output)).toMatchObject({
      runner: "go",
      state: "failed",
      totals: { passed: 2, failed: 1, skipped: 0 },
      files: [
        { path: "example.com/calc", status: "pass", passed: 2, durationMs: 12 },
        { path: "example.com/parse", status: "fail", failed: 1, durationMs: 20 },
        { path: "example.com/util", status: "pass", durationMs: null },
      ],
    });
  });

  it("cargo test: one row per test target, empty targets dropped", () => {
    const output = `    Finished \`test\` profile [unoptimized + debuginfo] target(s) in 1.55s
     Running unittests src/lib.rs (target/debug/deps/rs-ccd0641990ccab04)

running 3 tests
test tests::c ... ignored
test tests::a ... ok
test tests::b ... FAILED

test result: FAILED. 1 passed; 1 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/integ.rs (target/debug/deps/integ-b92601716d72216a)

running 1 test
test it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

   Doc-tests rs

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
`;
    expect(parse("cargo test --no-fail-fast", output)).toMatchObject({
      runner: "cargo",
      state: "failed",
      totals: { passed: 2, failed: 1, skipped: 1, total: 4 },
      files: [
        { path: "src/lib.rs", status: "fail", passed: 1, failed: 1, skipped: 1 },
        { path: "tests/integ.rs", status: "pass", passed: 1, durationMs: 10 },
      ],
    });
    const live = parse(
      "cargo test",
      "     Running tests/a.rs (x)\n\nrunning 2 tests\ntest a ... ok\n",
      true,
    );
    expect(live?.files).toMatchObject([{ path: "tests/a.rs", status: "running", passed: 1 }]);
  });

  it("bun test: piped output lists only failing files", () => {
    const output = `bun test v1.3.12 (700fc117)

c.test.ts:
error: expect(received).toBe(expected)

(fail) fails [1.59ms]

 2 pass
 1 skip
 1 fail
 3 expect() calls
Ran 4 tests across 2 files. [27.00ms]
`;
    expect(parse("bun test", output)).toMatchObject({
      runner: "bun",
      state: "failed",
      totals: { passed: 2, failed: 1, skipped: 1, total: 4 },
      durationMs: 27,
      files: [{ path: "c.test.ts", status: "fail", failed: 1 }],
    });
  });

  it("node --test: spec totals, ignoring suites and the repeated failures", () => {
    const output = `▶ math
  ✔ adds (0.667833ms)
  ✖ fails (0.860125ms)
    AssertionError [ERR_ASSERTION]: 1 == 2

✖ math (2.563167ms)
﹣ skipped (0.134209ms) # SKIP
✔ ok (0.526042ms)
ℹ tests 4
ℹ suites 1
ℹ pass 2
ℹ fail 1
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 96.312916

✖ failing tests:

✖ fails (0.860125ms)
`;
    expect(parse("node --test", output)).toMatchObject({
      runner: "node",
      state: "failed",
      files: [],
      totals: { passed: 2, failed: 1, skipped: 1 },
      durationMs: 96,
    });
    const live = output.split("ℹ tests")[0]!;
    expect(parse("node --test a.test.js", live, true)?.totals).toMatchObject({
      passed: 2,
      failed: 1,
      skipped: 1,
    });
    const tap =
      "TAP version 13\n# Subtest: ok\nok 1 - ok\n1..1\n# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# duration_ms 85.2\n";
    expect(parse("node --test --test-reporter=tap", tap)).toMatchObject({
      state: "passed",
      totals: { passed: 1, total: 1 },
    });
  });

  it("mocha: spec reporter totals", () => {
    const output = `
  Array
    #indexOf()
      ✔ should return -1
      1) should fail
      - pending test


  1 passing (10ms)
  1 failing
  1 pending

  1) Array
       #indexOf()
         should fail:
`;
    expect(parse("npx mocha", output)).toMatchObject({
      runner: "mocha",
      state: "failed",
      files: [],
      totals: { passed: 1, failed: 1, skipped: 1, total: 3 },
      durationMs: 10,
    });
  });

  it("returns null for unknown or empty output, and a nonzero exit fails the run", () => {
    expect(parse("npm test", "> app@1.0.0 test\n> ./run-tests.sh\nall good\n")).toBeNull();
    expect(parse("vitest", "")).toBeNull();
    expect(parse("pytest", "garbage\n")).toBeNull();
    expect(parse("cargo test", " Running tests/a.rs (x)\ntest a ... ok\n", false, 101)?.state).toBe(
      "failed",
    );
  });
});
