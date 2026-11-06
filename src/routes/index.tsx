import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Placeholder dashboard – will be replaced by actual UI later.
  component: () => <div>Loading…</div>,
});

