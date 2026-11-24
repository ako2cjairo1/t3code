import { describe, expect, it } from "vite-plus/test";
import { HALO_GRAPH_NODE, haloSubagentOrbState, layoutHaloGraph } from "./haloGraph.logic";

const ids = (count: number) => Array.from({ length: count }, (_, index) => `a${index}`);

describe("layoutHaloGraph", () => {
  it("keeps input order and stacks up to six in one column", () => {
    const layout = layoutHaloGraph(ids(6));
    expect(layout.nodes.map((node) => node.id)).toEqual(ids(6));
    expect(new Set(layout.nodes.map((node) => node.x)).size).toBe(1);
    const ys = layout.nodes.map((node) => node.y);
    expect(ys).toEqual([...ys].toSorted((a, b) => a - b));
    expect(layout.nodes[0]!.x).toBeGreaterThan(layout.main.x + layout.main.width);
  });

  it("wraps beyond six into balanced columns", () => {
    const layout = layoutHaloGraph(ids(7));
    const columns = [...new Set(layout.nodes.map((node) => node.x))];
    expect(columns).toHaveLength(2);
    expect(layout.nodes.filter((node) => node.x === columns[0]).map((node) => node.id)).toEqual([
      "a0",
      "a1",
      "a2",
      "a3",
    ]);
    expect(
      layoutHaloGraph(ids(13))
        .nodes.map((node) => node.x)
        .filter((x, i, all) => all.indexOf(x) === i),
    ).toHaveLength(3);
  });

  it("fits every node and centers the main node", () => {
    for (const count of [1, 3, 6, 7, 12]) {
      const layout = layoutHaloGraph(ids(count));
      for (const node of layout.nodes) {
        expect(node.x + HALO_GRAPH_NODE.width).toBeLessThanOrEqual(layout.width);
        expect(node.y + HALO_GRAPH_NODE.height).toBeLessThanOrEqual(layout.height);
        expect(node.wire.startsWith(`M ${layout.main.x + layout.main.width} `)).toBe(true);
        expect(node.wire.endsWith(` ${node.x} ${node.y + HALO_GRAPH_NODE.height / 2}`)).toBe(true);
      }
      expect(layout.main.y * 2 + HALO_GRAPH_NODE.height).toBe(layout.height);
    }
  });

  it("is a pure function of the ids", () => {
    expect(layoutHaloGraph(ids(4))).toEqual(layoutHaloGraph(ids(4)));
    expect(layoutHaloGraph([]).nodes).toEqual([]);
  });
});

describe("haloSubagentOrbState", () => {
  it("maps live, settled and failed statuses", () => {
    expect(haloSubagentOrbState("running")).toBe("working");
    expect(haloSubagentOrbState("pending")).toBe("thinking");
    expect(haloSubagentOrbState("waiting")).toBe("input");
    expect(haloSubagentOrbState("completed")).toBe("done");
    expect(haloSubagentOrbState("failed")).toBe("error");
    expect(haloSubagentOrbState("cancelled")).toBe("idle");
  });
});
