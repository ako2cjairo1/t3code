/** Timeline row kinds that sit inside Liquid Halo's "Agent trail" card. Thinking stays outside. */
const TRAIL_KINDS = new Set(["work", "work-live", "work-toggle"]);

export type HaloTrailPosition = "first" | "middle" | "last" | "only";

export interface HaloTrailSlot {
  readonly position: HaloTrailPosition;
  /** The first segment of its run carries the card header. */
  readonly head: boolean;
}

/**
 * Each virtualized row paints one segment of the card, so a run of adjacent trail rows reads as
 * one glass surface without any element spanning rows. Null for rows outside a trail.
 */
export function haloTrailSlots(
  rows: ReadonlyArray<{ readonly kind: string; readonly runId: string | null }>,
): Array<HaloTrailSlot | null> {
  const seenRuns = new Set<string>();
  return rows.map((row, index) => {
    if (!TRAIL_KINDS.has(row.kind)) return null;
    const startsSegment = !TRAIL_KINDS.has(rows[index - 1]?.kind ?? "");
    const endsSegment = !TRAIL_KINDS.has(rows[index + 1]?.kind ?? "");
    const position: HaloTrailPosition = startsSegment
      ? endsSegment
        ? "only"
        : "first"
      : endsSegment
        ? "last"
        : "middle";
    let head = false;
    if (startsSegment) {
      head = row.runId === null || !seenRuns.has(row.runId);
      if (row.runId !== null) seenRuns.add(row.runId);
    }
    return { position, head };
  });
}
