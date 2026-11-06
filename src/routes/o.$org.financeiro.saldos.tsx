import { createFileRoute } from "@tanstack/react-router";
import { OfficeBankConcept } from "@/components/office/OfficeBankConcept";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/financeiro/saldos")({
  head: () => ({ meta: [{ title: "Open Finance · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { const { org } = Route.useParams(); return <OfficeBankConcept office={findOffice(org)!} section="saldos" />; }

