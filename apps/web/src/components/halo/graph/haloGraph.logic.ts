import type { OrchestrationV2Subagent } from "@t3tools/contracts";
import type { HaloOrbState } from "../halo.logic";

export const HALO_GRAPH_NODE = { width: 184, height: 52 } as const;
const MAIN_WIDTH = 168;
const PAD = 8;
const ROW_GAP = 10;
const COL_GAP = 28;
const WIRE_SPAN = 56;
const MAX_ROWS = 6;
const FAN = 4;

export interface HaloGraphLayout {
  readonly width: number;
  readonly height: number;
  readonly main: { readonly x: number; readonly y: number; readonly width: number };
  readonly nodes: ReadonlyArray<{
    readonly id: string;
    readonly x: number;
    readonly y: number;
    /** SVG path from the main node's right edge to this node's left edge. */
    readonly wire: string;
  }>;
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = (x2 - x1) * 0.55;
  return `C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

/**
 * Main node on the left, subagents in input order down columns of at most six rows, balanced
 * across columns. Wires to later columns run through the row gaps of the earlier ones.
 */
export function layoutHaloGraph(ids: ReadonlyArray<string>): HaloGraphLayout {
  const count = ids.length;
  const columns = Math.max(1, Math.ceil(count / MAX_ROWS));
  const rows = Math.max(1, Math.ceil(count / columns));
  const { width: nodeWidth, height: nodeHeight } = HALO_GRAPH_NODE;
  const height = rows * nodeHeight + (rows - 1) * ROW_GAP + PAD * 2;
  const firstColumnX = PAD + MAIN_WIDTH + WIRE_SPAN;
  const main = { x: PAD, y: (height - nodeHeight) / 2, width: MAIN_WIDTH };
  const startX = main.x + MAIN_WIDTH;
  const centerY = height / 2;
  const nodes = ids.map((id, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const x = firstColumnX + column * (nodeWidth + COL_GAP);
    const y = PAD + row * (nodeHeight + ROW_GAP);
    const startY = centerY + (index - (count - 1) / 2) * FAN;
    const endY = y + nodeHeight / 2;
    const wire =
      column === 0
        ? `M ${startX} ${startY} ${curve(startX, startY, x, endY)}`
        : `M ${startX} ${startY} ${curve(startX, startY, firstColumnX, y - ROW_GAP / 2)} H ${x - COL_GAP} ${curve(x - COL_GAP, y - ROW_GAP / 2, x, endY)}`;
    return { id, x, y, wire };
  });
  return {
    width: firstColumnX + columns * nodeWidth + (columns - 1) * COL_GAP + PAD,
    height,
    main,
    nodes,
  };
}

/** Subagent status onto the orb the main agent uses, so both read the same way. */
export function haloSubagentOrbState(status: OrchestrationV2Subagent["status"]): HaloOrbState {
  switch (status) {
    case "pending":
      return "thinking";
    case "running":
      return "working";
    case "waiting":
      return "input";
    case "completed":
      return "done";
    case "failed":
      return "error";
    case "idle":
    case "cancelled":
    case "interrupted":
      return "idle";
  }
}
