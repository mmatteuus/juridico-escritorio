import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, ClipboardCheck, FileCheck2, Landmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeFinance } from "@/features/demo/permissions";
import { brl, fmtDate, useDemo, useOfficeView } from "@/features/demo/store";
import type { FiscalPreparationDraft, Office, Receivable } from "@/features/demo/types";

export type FiscalStep = "resumo" | "classificacao" | "conciliacao" | "preparacao";
const route = (step: FiscalStep) => `/o/$org/financeiro/fiscal/${step}` as const;
const steps: { id: FiscalStep; label: string; detail: string }[] = [
  { id: "resumo", label: "Visão geral", detail: "Escopo e indicadores da amostra" },
  { id: "classificacao", label: "Classificação", detail: "Prévia de categorias por lançamento" },
  { id: "conciliacao", label: "Conciliação interna", detail: "Vínculos entre custo e reembolso" },
  { id: "preparacao", label: "Preparação fiscal", detail: "Checklist de conferência humana" },
];
const category: Record<NonNullable<Receivable["category"]>, string> = {
  honorario_contratual: "Honorários contratuais", honorario_sucumbencial: "Honorários sucumbenciais",
  despesa_escritorio: "Despesa", custa_judicial: "Custa judicial",
  reembolso_despesa: "Reembolso de despesa", reembolso_custa: "Reembolso de custa",
};
const card = "rounded-xl border bg-card p-5 shadow-soft";
function ConceptBadge() { return <span className="rounded-full border border-copper/40 bg-copper-soft px-3 py-1 text-xs font-semibold text-copper">Conceito · Fase 2</span>; }

export function FiscalConcept({ office, step }: { office: Office; step: FiscalStep }) {
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const memberId = view.me?.id ?? `role-${view.role}`;
  const draft: FiscalPreparationDraft = view.fiscalPreparationDraft ?? { officeId: office.id, memberId, classification: {}, reviewedIds: [], checks: {} };
  const saveDraft = (patch: Partial<FiscalPreparationDraft>) => update(data => {
    const existing = data.fiscalPreparationDrafts.find(item => item.officeId === office.id && item.memberId === memberId);
    const next = { ...(existing ?? draft), ...patch };
    return { ...data, fiscalPreparationDrafts: [...data.fiscalPreparationDrafts.filter(item => item.officeId !== office.id || item.memberId !== memberId), next] };
  });
  const records = useMemo(() => view.receivables.filter(row =>
    `${row.label} ${view.matterById(row.matterId)?.code ?? ""} ${view.clientName(row.clientId ?? "")}`
      .toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  ).sort((a,b) => a.dueDate.localeCompare(b.dueDate)), [view, query]);
  if (!canSeeFinance(view.role)) return <DeniedState />;
  const incoming = view.receivables.filter(row => row.kind !== "despesa").reduce((sum,row) => sum+row.amount,0);
  const outgoing = view.receivables.filter(row => row.kind === "despesa").reduce((sum,row) => sum+row.amount,0);
  const reimbursements = view.receivables.filter(row => row.category?.startsWith("reembolso"));
  const linked = reimbursements.filter(row => row.relatedCostId && view.receivables.some(cost =>
    cost.id === row.relatedCostId && cost.officeId === office.id && cost.matterId === row.matterId && cost.clientId === row.clientId));
  const checklist = [
    "Conferir categorias e documentos de origem",
    "Verificar cliente, caso e competência",
    "Validar custos e reembolsos vinculados",
    "Encaminhar dados à revisão contábil humana",
  ];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><ConceptBadge /><Link to="/o/$org/financeiro" params={{org:office.slug}} className="text-sm text-primary hover:underline">Voltar ao financeiro</Link></div>
    <PageHeader title={steps.find(item => item.id === step)?.label ?? "Preparação fiscal"} subtitle="Exploração visual de conciliação e preparação fiscal do escritório" />
    <p className="rounded-lg border border-copper/30 bg-copper-soft p-3 text-sm text-copper">
      Estes números são fictícios. Nenhuma apuração, emissão fiscal, conexão bancária ou transmissão é executada.
    </p>
    <nav aria-label="Etapas do conceito fiscal" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map(item => <Link key={item.id} to={route(item.id)} params={{org:office.slug}} aria-current={step===item.id?"step":undefined} className={`rounded-xl border p-3 text-sm transition-colors hover:border-primary/40 ${step===item.id?"border-primary bg-primary/5":"bg-card"}`}>
        <span className="block font-semibold">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
      </Link>)}
    </nav>
    {step === "resumo" && <>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Lançamentos visíveis" value={String(view.receivables.length)} /><Metric label="Entradas previstas" value={brl(incoming)} /><Metric label="Saídas previstas" value={brl(outgoing)} /></div>
      <section className={card}><h2 className="font-display text-xl">Escopo da prévia</h2><div className="mt-4 grid gap-3 md:grid-cols-3">
        <ConceptItem icon={<Landmark className="size-5"/>} name="Dados financeiros" text="Somente lançamentos demonstrativos visíveis ao perfil e escritório ativos." />
        <ConceptItem icon={<ClipboardCheck className="size-5"/>} name="Revisão de categorias" text="A classificação é uma hipótese de apresentação, sujeita à conferência humana." />
        <ConceptItem icon={<FileCheck2 className="size-5"/>} name="Preparação" text="Um checklist visual organiza pendências sem gerar obrigação ou arquivo fiscal." />
      </div></section>
    </>}
    {step === "classificacao" && <section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl">Classificação prévia</h2><p className="text-sm text-muted-foreground">Seleções ficam nesta tela, sem alterar lançamentos ou gerar escrituração.</p></div><SearchBox value={query} onChange={setQuery}/></div>
      {records.length ? <div className="grid gap-3 lg:grid-cols-2">{records.map(row => <article key={row.id} className="min-w-0 rounded-lg border p-4"><p className="break-words font-medium">{row.label}</p><p className="mt-1 text-xs text-muted-foreground">{view.matterById(row.matterId)?.code ?? "Caso indisponível"} · {fmtDate(row.dueDate)} · {brl(row.amount)}</p><label className="mt-3 block text-xs font-medium">Categoria para revisão<select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={draft.classification[row.id] ?? row.category ?? ""} onChange={event => saveDraft({ classification: { ...draft.classification, [row.id]: event.target.value } })}><option value="">A definir</option>{Object.entries(category).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></article>)}</div> : <EmptyState title="Nenhum lançamento encontrado" />}
    </section>}
    {step === "conciliacao" && <><div className="grid gap-3 sm:grid-cols-3"><Metric label="Reembolsos da amostra" value={String(reimbursements.length)} /><Metric label="Com custo vinculado" value={String(linked.length)} /><Metric label="A conferir" value={String(reimbursements.length-linked.length)} /></div><section className={card}><h2 className="font-display text-xl">Vínculos internos demonstrativos</h2><p className="mt-1 text-sm text-muted-foreground">Esta visão compara registros da amostra do mesmo caso e cliente. Não consulta extratos bancários.</p><div className="mt-4 space-y-3">{reimbursements.length ? reimbursements.map(row => {const cost=view.receivables.find(item=>item.id===row.relatedCostId && item.matterId===row.matterId && item.clientId===row.clientId);const checked=draft.reviewedIds.includes(row.id);return <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div className="min-w-0"><p className="break-words font-medium">{row.label}</p><p className="text-xs text-muted-foreground">{view.matterById(row.matterId)?.code ?? "Caso indisponível"} · {brl(row.amount)}</p><p className="mt-1 text-xs">{cost ? `Origem: ${cost.label} · ${brl(cost.amount)}` : "Custo de origem não localizado na amostra"}</p></div><Button size="sm" variant="outline" onClick={()=>saveDraft({ reviewedIds: checked ? draft.reviewedIds.filter(id=>id!==row.id) : [...draft.reviewedIds,row.id] })}>{checked?"Conferido nesta sessão":"Marcar para conferência"}</Button></article>}) : <EmptyState title="Nenhum reembolso na amostra" />}</div></section></>}
    {step === "preparacao" && <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><section className={card}><h2 className="font-display text-xl">Checklist de preparação</h2><p className="mt-1 text-sm text-muted-foreground">Controles de apresentação. Nenhuma declaração, nota ou arquivo é emitido.</p><div className="mt-4 space-y-2">{checklist.map(label=><label key={label} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" checked={!!draft.checks[label]} onChange={event=>saveDraft({ checks: { ...draft.checks, [label]: event.target.checked } })}/><span>{label}</span></label>)}</div></section><section className={card}><h2 className="font-display text-xl">Conferência humana</h2><p className="mt-3 text-sm">Etapas marcadas: <strong>{Object.values(draft.checks).filter(Boolean).length} de {checklist.length}</strong></p><p className="mt-3 text-sm text-muted-foreground">Um profissional contábil deve validar classificação, competência e documentação antes de qualquer uso fora desta demonstração.</p><span className="mt-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"><BadgeCheck className="size-4"/> Prévia sem emissão</span></section></div>}
  </div>;
}
function Metric({label,value}:{label:string;value:string}){return <div className={card}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl">{value}</p></div>}
function SearchBox({value,onChange}:{value:string;onChange:(value:string)=>void}){return <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input value={value} onChange={event=>onChange(event.target.value)} placeholder="Buscar lançamento" aria-label="Buscar lançamento" className="pl-9"/></div>}
function ConceptItem({icon,name,text}:{icon:ReactNode;name:string;text:string}){return <div className="rounded-lg border p-4"><div className="text-copper">{icon}</div><p className="mt-2 font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>}


