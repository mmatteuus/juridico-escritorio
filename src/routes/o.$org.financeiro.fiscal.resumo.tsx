import { createFileRoute } from "@tanstack/react-router";
import { FiscalConcept } from "@/components/office/FiscalConcept";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/financeiro/fiscal/resumo")({
  head: () => ({ meta: [{ title: "Conceito fiscal · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { const { org } = Route.useParams(); return <FiscalConcept office={findOffice(org)!} step="resumo" />; }

