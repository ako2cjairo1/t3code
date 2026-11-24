import { createFileRoute, Navigate } from "@tanstack/react-router";

import { HaloInboxPage } from "../components/halo/HaloInboxPage";
import { useHaloExperience } from "../hooks/useHaloExperience";

function HaloInboxRoute() {
  if (!useHaloExperience()) return <Navigate to="/" replace />;
  return <HaloInboxPage />;
}

export const Route = createFileRoute("/_chat/inbox")({
  component: HaloInboxRoute,
});
