import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Landmark, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/office/badges";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/conceitos")({
  head: () => ({ meta: [{ title: "Conceitos Fase 2 · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Concepts,
});
const groups = [
  { title: "Análise contratual assistida", Icon: BrainCircuit, description: "Jornada visual de recebimento, estrutura, cláusulas e revisão humana.", items: [
    { label: "Recebimento", to: "/o/$org/analise-contratual" },
    { label: "Estrutura", to: "/o/$org/analise-contratual-estrutura" },
    { label: "Cláusulas", to: "/o/$org/analise-contratual-clausulas" },
    { label: "Revisão humana", to: "/o/$org/analise-contratual-revisao" },
  ] },
  { title: "Open Finance ilustrativo", Icon: Landmark, description: "Estados visuais de bancos, consentimento e conciliação sem conexão real.", items: [
    { label: "Bancos conectados", to: "/o/$org/financeiro/bancos" },
    { label: "Assistente de conexão", to: "/o/$org/financeiro/conexao" },
    { label: "Saldos consolidados", to: "/o/$org/financeiro/saldos" },
    { label: "Extrato unificado", to: "/o/$org/financeiro/extrato" },
    { label: "Conciliação financeira", to: "/o/$org/financeiro/conciliacao" },
    { label: "Consentimentos", to: "/o/$org/financeiro/consentimentos" },
  ] },
  { title: "Preparação fiscal", Icon: ReceiptText, description: "Conceitos de classificação, conciliação e preparo para conferência profissional.", items: [
    { label: "Resumo", to: "/o/$org/financeiro/fiscal/resumo" },
    { label: "Classificação", to: "/o/$org/financeiro/fiscal/classificacao" },
    { label: "Conciliação", to: "/o/$org/financeiro/fiscal/conciliacao" },
    { label: "Preparação", to: "/o/$org/financeiro/fiscal/preparacao" },
  ] },
  { title: "Estados do serviço", Icon: ReceiptText, description: "Prévia de indisponibilidade e de recurso sem licença, sem representar o estado real do escritório.", items: [
    { label: "Indisponibilidade", to: "/o/$org/indisponivel" },
    { label: "Recurso sem licença", to: "/o/$org/sem-licenca" },
    { label: "Acesso restrito", to: "/o/$org/acesso-negado" },
  ] },
] as const;
function Concepts() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  return <div className="space-y-5"><PageHeader title="Conceitos da Fase 2" subtitle={`${office.displayName} · catálogo visual da demonstração`} />
    <div className="rounded-xl border border-copper/30 bg-copper-soft p-4 text-sm text-copper">Estas telas apresentam possibilidades futuras. Não há análise por IA, conexão bancária, emissão fiscal ou decisão automática nesta demonstração.</div>
    <div className="grid gap-5 lg:grid-cols-3">{groups.map(group => <section key={group.title} className="min-w-0 rounded-xl border bg-card p-5 shadow-soft"><div className="flex items-center gap-2"><group.Icon className="size-5 text-primary"/><h2 className="font-display text-xl">{group.title}</h2></div><p className="mt-2 text-sm text-muted-foreground">{group.description}</p><ul className="mt-5 space-y-2">{group.items.map(item => <li key={item.to}><Link to={item.to} params={{org}} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/40 hover:bg-muted"><span>{item.label}</span><ArrowRight className="size-4 shrink-0"/></Link></li>)}</ul></section>)}</div>
  </div>;
}
