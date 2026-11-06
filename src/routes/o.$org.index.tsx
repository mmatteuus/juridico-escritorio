import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/o/$org/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/o/$org/inicio", params: { org: params.org } });
  },
  component: () => null,
});
