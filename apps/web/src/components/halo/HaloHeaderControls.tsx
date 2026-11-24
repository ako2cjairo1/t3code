import type { DraftId } from "~/composerDraftStore";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import ThreadGitActionsControl from "../GitActionsControl";
import { HaloStatusIsland } from "./HaloStatusIsland";
import { HaloViewSwitcher } from "./HaloViewSwitcher";

/** The Liquid Halo header cluster: run island, view switcher, git pill. Nothing elsewhere. */
export function HaloHeaderControls({
  threadRef,
  isServerThread,
  workStartedAt,
  gitCwd,
  projectName,
  draftId,
}: {
  threadRef: ScopedThreadRef;
  isServerThread: boolean;
  workStartedAt: string | null;
  gitCwd: string | null;
  projectName: string;
  draftId: DraftId | null;
}) {
  if (!useHaloExperience()) return null;
  return (
    <div
      className="flex shrink-0 items-center gap-2"
      // The header's own context menu would otherwise open over the commit form.
      onContextMenu={(event) => event.stopPropagation()}
    >
      {isServerThread ? (
        <HaloStatusIsland threadRef={threadRef} workStartedAt={workStartedAt} />
      ) : null}
      <HaloViewSwitcher />
      {gitCwd ? (
        <ThreadGitActionsControl
          presentation="halo"
          showChanges={false}
          gitCwd={gitCwd}
          name={projectName}
          activeThreadRef={threadRef}
          {...(draftId ? { draftId } : {})}
        />
      ) : null}
    </div>
  );
}
