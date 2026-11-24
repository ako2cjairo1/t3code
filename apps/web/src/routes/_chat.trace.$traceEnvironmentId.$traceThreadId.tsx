import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import { EnvironmentId, ThreadId } from "@t3tools/contracts";
import { createFileRoute, Navigate } from "@tanstack/react-router";

import { HaloTracePage } from "../components/halo/HaloTracePage";
import { useHaloExperience } from "../hooks/useHaloExperience";

// Not named `environmentId` and `threadId`: those make the chat layout render the thread itself.
function HaloTraceRoute() {
  const { traceEnvironmentId, traceThreadId } = Route.useParams();
  if (!useHaloExperience()) {
    return (
      <Navigate
        to="/$environmentId/$threadId"
        params={{ environmentId: traceEnvironmentId, threadId: traceThreadId }}
        replace
      />
    );
  }
  return (
    <HaloTracePage
      threadRef={scopeThreadRef(
        EnvironmentId.make(traceEnvironmentId),
        ThreadId.make(traceThreadId),
      )}
    />
  );
}

export const Route = createFileRoute("/_chat/trace/$traceEnvironmentId/$traceThreadId")({
  component: HaloTraceRoute,
});
