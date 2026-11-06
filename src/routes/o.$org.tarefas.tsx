import { createFileRoute } from "@tanstack/react-router";
import { withAuth } from "@/components/withAuth"; // assumed HOC

export const Route = createFileRoute("/o/$org/tarefas")({
  component: () => <div>Loading…</div>,
});

export const withAuthRoute = withAuth(Route);
