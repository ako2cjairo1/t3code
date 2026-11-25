import { projectScriptCwd } from "@t3tools/shared/projectScripts";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { isElectron } from "~/env";
import { useProjects, useThreadShell } from "~/state/entities";
import ThreadGitActionsControl from "../GitActionsControl";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import { HaloOverflowMenu } from "./HaloOverflowMenu";
import { HaloIdleIsland, HaloStatusIsland } from "./HaloStatusIsland";
import { HaloViewSwitcher } from "./HaloViewSwitcher";

/** The thread header's cluster on Inbox and Trace, so switching views keeps the same chrome. */
export function HaloPageHeader({
  title,
  threadRef,
}: {
  title: string;
  /** The thread the island and git pill follow; null shows an idle island. */
  threadRef: ScopedThreadRef | null;
}) {
  const shell = useThreadShell(threadRef);
  const project = useProjects().find(
    (entry) => entry.environmentId === shell?.environmentId && entry.id === shell.projectId,
  );
  const gitCwd = project
    ? projectScriptCwd({
        project: { cwd: project.workspaceRoot },
        worktreePath: shell?.worktreePath ?? null,
      })
    : null;
  return (
    <WorkspacePageHeader electron={isElectron} data-halo-page-header="">
      {/* Reserves the space ChatHeader keeps for the panel controls, so both collapse alike. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 pe-17 @container/chat-header">
        <h2 data-halo-title="" className="min-w-0 flex-1 truncate font-semibold">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2 [-webkit-app-region:no-drag]">
          {threadRef && shell ? (
            <HaloStatusIsland threadRef={threadRef} workStartedAt={null} />
          ) : (
            <HaloIdleIsland />
          )}
          <HaloViewSwitcher />
          {threadRef && gitCwd ? (
            <ThreadGitActionsControl
              presentation="halo"
              showChanges={false}
              gitCwd={gitCwd}
              name={project?.title ?? ""}
              activeThreadRef={threadRef}
            />
          ) : null}
        </div>
      </div>
      <div className="[-webkit-app-region:no-drag]">
        <HaloOverflowMenu />
      </div>
    </WorkspacePageHeader>
  );
}
