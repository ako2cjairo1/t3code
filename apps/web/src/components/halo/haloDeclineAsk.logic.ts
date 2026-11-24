/** A declined approval the composer is asking about: which thread, during which run. */
export interface HaloDeclineAsk {
  readonly threadKey: string;
  readonly runId: string | null;
}

/**
 * The ask stays until it is dismissed or answered, and lapses on its own when the thread
 * changes, a new run starts, or the agent asks for another approval.
 */
export function haloDeclineAskVisible(
  ask: HaloDeclineAsk | null,
  current: {
    readonly haloExperience: boolean;
    readonly threadKey: string | null;
    readonly runId: string | null;
    readonly approvalPending: boolean;
  },
): boolean {
  return (
    ask !== null &&
    current.haloExperience &&
    !current.approvalPending &&
    ask.threadKey === current.threadKey &&
    ask.runId === current.runId
  );
}
