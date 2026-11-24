import type { PendingApproval } from "../../session-logic";

/**
 * The request a Mod+Enter press approves, or null to let the key through. An accept option with a
 * warning needs a deliberate click, so the shortcut never takes it.
 */
export function approvalRequestForShortcut(input: {
  readonly haloExperience: boolean;
  readonly approval: PendingApproval | null;
  readonly canOperateThread: boolean;
  readonly respondingRequestIds: ReadonlyArray<string>;
  readonly repeat: boolean;
}) {
  const { approval } = input;
  if (!input.haloExperience || !approval || !input.canOperateThread || input.repeat) return null;
  if (approval.responseCapability !== "live") return null;
  if (input.respondingRequestIds.includes(approval.requestId)) return null;
  const accept = approval.options
    ? approval.options.find((option) => option.decision === "accept")
    : { warning: undefined };
  return accept && !accept.warning ? approval.requestId : null;
}
