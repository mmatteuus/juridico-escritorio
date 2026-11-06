import { createFileRoute } from "@tanstack/react-router";
import { OfficeAvailabilityState } from "@/components/office/OfficeAvailabilityState";

export const Route = createFileRoute("/o/$org/indisponivel")({
  head: () => ({ meta: [{ title: "Indisponibilidade demonstrativa · JURIDO" }, { name: "robots", content: "noindex" }] }),
  component: () => <OfficeAvailabilityState org={Route.useParams().org} state="unavailable" />,
});
