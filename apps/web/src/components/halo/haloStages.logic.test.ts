import * as DateTime from "effect/DateTime";
import { describe, expect, it } from "vite-plus/test";
import { classifyHaloStageItem, deriveHaloRunStages, type HaloStageItem } from "./haloStages.logic";

const at = (seconds: number) => DateTime.makeUnsafe(Date.UTC(2026, 0, 1, 0, 0, seconds));

let ordinal = 0;
function item(fields: Partial<HaloStageItem> & Pick<HaloStageItem, "type">): HaloStageItem {
  ordinal += 1;
  return { status: "completed", ordinal, startedAt: null, completedAt: null, ...fields };
}
const command = (input: string, fields: Partial<HaloStageItem> = {}) =>
  item({ type: "command_execution", input, ...fields });
const tool = (toolName: string, input: unknown = {}) =>
  item({ type: "dynamic_tool", toolName, input });

describe("classifyHaloStageItem", () => {
  it("reads, searches and plans are Plan", () => {
    expect(classifyHaloStageItem(item({ type: "file_search" }))).toBe("plan");
    expect(classifyHaloStageItem(item({ type: "todo_list" }))).toBe("plan");
    expect(classifyHaloStageItem(tool("Read"))).toBe("plan");
    expect(classifyHaloStageItem(tool("Grep"))).toBe("plan");
    expect(classifyHaloStageItem(command("cd apps/web && rg useHalo src"))).toBe("plan");
    expect(classifyHaloStageItem(command("sed -n 1,40p a.ts | head"))).toBe("plan");
  });

  it("file changes and edit tools are Edit", () => {
    expect(classifyHaloStageItem(item({ type: "file_change" }))).toBe("edit");
    expect(classifyHaloStageItem(tool("MultiEdit"))).toBe("edit");
    expect(classifyHaloStageItem(tool("apply_patch"))).toBe("edit");
  });

  it("test runners are Test", () => {
    for (const input of [
      "vitest run src/a.test.ts",
      "CI=1 pnpm test",
      "npm run test:unit",
      "bun test",
      "../../node_modules/.bin/vp test run --project unit",
      "vp run test",
      "pytest -q",
      "go test ./...",
      "cargo test",
      "npx jest",
      "cd pkg && python -m pytest",
    ]) {
      expect(classifyHaloStageItem(command(input)), input).toBe("test");
    }
    expect(classifyHaloStageItem(tool("Bash", { command: "pnpm exec vitest" }))).toBe("test");
  });

  it("git commit and push are Commit, even after tests", () => {
    expect(classifyHaloStageItem(command('git commit -m "fix"'))).toBe("commit");
    expect(classifyHaloStageItem(command("git push origin HEAD"))).toBe("commit");
    expect(classifyHaloStageItem(command("vitest run && git commit -am x"))).toBe("commit");
    expect(classifyHaloStageItem(command("gh pr create --fill"))).toBe("commit");
  });

  it("only matches at the start of a segment", () => {
    expect(classifyHaloStageItem(command('rg "git commit" src'))).toBe("plan");
    expect(classifyHaloStageItem(command("cat composer.test.ts"))).toBe("plan");
    expect(classifyHaloStageItem(command("echo vitest"))).toBeNull();
  });

  it("ignores items that say nothing about the stage", () => {
    expect(classifyHaloStageItem(item({ type: "reasoning" }))).toBeNull();
    expect(classifyHaloStageItem(command("vp run build"))).toBeNull();
    expect(classifyHaloStageItem(tool("mcp__linear__search_issues"))).toBeNull();
  });
});

describe("deriveHaloRunStages", () => {
  const statuses = (items: HaloStageItem[], live: boolean) =>
    deriveHaloRunStages(items, live).stages.map((stage) => stage.status);

  it("starts in Plan while live with nothing classified", () => {
    expect(statuses([], true)).toEqual(["active", "pending", "pending", "pending"]);
    expect(statuses([], false)).toEqual(["skipped", "skipped", "skipped", "skipped"]);
  });

  it("marks the newest stage active and skips stages passed over", () => {
    expect(statuses([tool("Read"), command("vitest")], true)).toEqual([
      "done",
      "skipped",
      "active",
      "pending",
    ]);
  });

  it("keeps Test done when the agent goes back to editing", () => {
    const items = [tool("Read"), item({ type: "file_change" }), command("vitest"), tool("Edit")];
    expect(statuses(items, true)).toEqual(["done", "active", "done", "pending"]);
  });

  it("settles every stage once the run ends", () => {
    const items = [tool("Read"), item({ type: "file_change" })];
    expect(statuses(items, false)).toEqual(["done", "done", "skipped", "skipped"]);
  });

  it("spans durations across a stage's finished items and exposes the active start", () => {
    const { stages, toolCount } = deriveHaloRunStages(
      [
        item({ type: "file_search", startedAt: at(0), completedAt: at(2) }),
        tool("Read"),
        item({ type: "file_change", startedAt: at(5), completedAt: at(6) }),
        item({ type: "file_change", startedAt: at(8), completedAt: at(11) }),
        command("vitest", { status: "running", startedAt: at(12) }),
        item({ type: "reasoning" }),
      ],
      true,
    );
    expect(toolCount).toBe(5);
    expect(stages.map((stage) => stage.durationMs)).toEqual([2000, 6000, null, null]);
    expect(stages[2]).toMatchObject({ status: "active", itemCount: 1 });
    expect(stages[2]!.activeSince).toBe(DateTime.formatIso(at(12)));
    expect(stages[1]!.activeSince).toBeNull();
  });
});
