import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, Search, ShieldCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { Input } from "@/components/ui/input";
import { findOffice, fmtDateTime, useOfficeView } from "@/features/demo/store";
import type { TimelineEvent } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/atividade")({
  head: () => ({ meta: [{ title: "Atividade · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ActivityPage,
});
const kinds: Record<TimelineEvent["kind"], string> = {
  cadastro: "Cadastro", tarefa: "Tarefa", documento: "Documento", prazo: "Prazo",
  observacao: "Observação", comunicacao: "Comunicação", aprovacao: "Aprovação",
};
const card = "rounded-xl border bg-card shadow-soft";

function ActivityPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("todos");
  const [actor, setActor] = useState("todos");
  const [matter, setMatter] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const actors = [...new Set(view.timeline.map(event => event.actor))].sort();
  const events = useMemo(() => [...view.timeline].filter(event =>
    (kind === "todos" || event.kind === kind) &&
    (actor === "todos" || event.actor === actor) &&
    (matter === "todos" || event.matterId === matter) &&
    `${event.actor} ${event.text} ${event.matterId ? view.matterById(event.matterId)?.code ?? "" : "processo independente"}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  ).sort((a,b) => b.at.localeCompare(a.at)), [view,kind,actor,matter,query]);
  const pagination = useOfficePagination(events, `${query}|${kind}|${actor}|${matter}`);
  const selected = events.find(event => event.id === selectedId) ?? events[0];
  const today = events.filter(event => new Date(event.at).toDateString() === new Date().toDateString()).length;
  return <div className="space-y-5">
    <PageHeader title="Atividade e auditoria" subtitle="Movimentações demonstrativas por usuário e caso" />
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Eventos visíveis" value={events.length}/><Metric label="Hoje" value={today}/><Metric label="Pessoas na atividade" value={new Set(events.map(event => event.actor)).size}/>
    </div>
    <section className={`${card} p-4`} aria-label="Filtros da atividade">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar atividade" placeholder="Buscar ação, pessoa ou caso" className="pl-9" value={query} onChange={event=>setQuery(event.target.value)}/></div>
        <label className="sr-only" htmlFor="activity-kind">Tipo</label><select id="activity-kind" aria-label="Filtrar por tipo" className="h-9 rounded-md border bg-background px-3 text-sm" value={kind} onChange={event=>setKind(event.target.value)}><option value="todos">Todos os tipos</option>{Object.entries(kinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <label className="sr-only" htmlFor="activity-actor">Pessoa</label><select id="activity-actor" aria-label="Filtrar por pessoa" className="h-9 rounded-md border bg-background px-3 text-sm" value={actor} onChange={event=>setActor(event.target.value)}><option value="todos">Todas as pessoas</option>{actors.map(name=><option key={name} value={name}>{name}</option>)}</select>
        <label className="sr-only" htmlFor="activity-matter">Caso</label><select id="activity-matter" aria-label="Filtrar por caso" className="h-9 rounded-md border bg-background px-3 text-sm" value={matter} onChange={event=>setMatter(event.target.value)}><option value="todos">Todos os casos</option>{view.matters.map(item=><option key={item.id} value={item.id}>{item.code}</option>)}</select>
      </div>
    </section>
    <SavedFilterViews officeId={office.id} role={view.role} collection="atividade" currentValues={{ query, kind, actor, matter }} onApply={(filters) => { setQuery(filters.query); setKind(filters.kind); setActor(filters.actor); setMatter(filters.matter); }} />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
      <section className={card} aria-label="Linha do tempo"><div className="border-b px-5 py-4"><h2 className="font-display text-xl">Linha do tempo</h2><p className="text-xs text-muted-foreground">{events.length} registro(s) no filtro atual</p></div>
        {events.length ? <><ol className="divide-y">{pagination.items.map(event=><li key={event.id}><button type="button" onClick={()=>setSelectedId(event.id)} aria-current={selected?.id===event.id ? "true" : undefined} className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/60 ${selected?.id===event.id ? "bg-primary/5" : ""}`}><span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Activity className="size-4"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{event.text}</span><span className="mt-1 block text-xs text-muted-foreground">{event.actor} · {kinds[event.kind]} · {fmtDateTime(event.at)}</span><span className="mt-1 block text-xs text-primary">{event.matterId ? view.matterById(event.matterId)?.code ?? "Caso indisponível" : "Processo independente"}</span></span></button></li>)}</ol><div className="px-4 pb-4"><OfficePaginationControls pagination={pagination} /></div></> : <div className="p-5"><EmptyState title="Nenhuma atividade encontrada" hint="Ajuste os filtros para ver outros registros."/></div>}
      </section>
      <aside className={`${card} h-fit p-5`} aria-label="Detalhes do evento"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="font-display text-xl">Detalhe da movimentação</h2></div>{selected ? <dl className="mt-5 space-y-3 text-sm"><Field label="Ação" value={selected.text}/><Field label="Tipo" value={kinds[selected.kind]}/><Field label="Responsável" value={selected.actor}/><Field label="Data e hora" value={fmtDateTime(selected.at)}/><Field label="Referência" value={selected.id}/><div className="border-b pb-3"><dt className="text-xs text-muted-foreground">Caso ou vínculo</dt><dd className="mt-1 font-medium">{selected.matterId && view.matterById(selected.matterId) ? <Link to="/o/$org/casos/$id" params={{org,id:selected.matterId}} className="text-primary hover:underline">{view.matterById(selected.matterId)?.code}</Link> : "Processo independente ou sem caso visível"}</dd></div></dl> : <p className="mt-5 text-sm text-muted-foreground">Selecione um evento da linha do tempo.</p>}<p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Esta trilha é visual e usa dados demonstrativos. Não representa um log de auditoria imutável.</p></aside>
    </div>
  </div>;
}
function Metric({label,value}:{label:string;value:number}) { return <div className={`${card} p-4`}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl tabular">{value}</p></div> }
function Field({label,value}:{label:string;value:string}) { return <div className="border-b pb-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div> }
