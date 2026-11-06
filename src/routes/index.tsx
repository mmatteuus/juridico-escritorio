import { createFileRoute } from "@tanstack/react-router";
import { withAuth } from "@/components/withAuth"; // assumed HOC

export const Route = createFileRoute("/")({
  // Placeholder dashboard – will be replaced by actual UI later.
  component: () => <div>Loading…</div>,
});

export const withAuthRoute = withAuth(Route);
