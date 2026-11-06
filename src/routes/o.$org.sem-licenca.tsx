import { createFileRoute } from "@tanstack/react-router";
import { OfficeAvailabilityState } from "@/components/office/OfficeAvailabilityState";

export const Route = createFileRoute("/o/$org/sem-licenca")({
  head: () => ({ meta: [{ title: "Recurso sem licença · JURIDO" }, { name: "robots", content: "noindex" }] }),
  component: () => <OfficeAvailabilityState org={Route.useParams().org} state="no-license" />,
});
