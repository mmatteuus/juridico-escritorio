import { createFileRoute } from "@tanstack/react-router";
import { ContractAnalysisConcept } from "@/components/office/ContractAnalysisConcept";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/analise-contratual")({
  head: () => ({ meta: [{ title: "Análise contratual · conceito Fase 2 · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { const { org } = Route.useParams(); return <ContractAnalysisConcept office={findOffice(org)!} step="preparacao" />; }

