import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Plus, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { findOffice, fmtDateTime, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { ConflictCheck } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/conflitos")({
  validateSearch: (s: Record<string, unknown>): { intakeId?: string } => typeof s["intakeId"] === "string" ? { intakeId: s["intakeId"] } : {},
  head: () => ({ meta: [{ title: "Conflitos de interesses · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Conflicts,
});
const statusLabel: Record<ConflictCheck["status"], string> = { pendente: "Pendente", em_revisao: "Em revisão", sem_indicio: "Sem indício após revisão", risco_identificado: "Risco identificado", prosseguir_com_ressalvas: "Prosseguir com ressalvas" };
const roles = ["gestor", "socio", "coordenador", "advogado"];
function Conflicts() {
  const { org } = Route.useParams();
  const { intakeId: prefillIntakeId } = Route.useSearch();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [intakeId, setIntakeId] = useState("");
  const [prospect, setProspect] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const filtered = useMemo(() => view.conflicts.filter(c => (status === "todos" || c.status === status) && `${c.prospect} ${c.counterparty} ${c.summary}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)), [view.conflicts, status, query]);
  const pagination = useOfficePagination(filtered, `${query}|${status}`);
  const current = view.conflicts.find(c => c.id === selected);
  const linkedIntake = prefillIntakeId ? view.intakes.find(item => item.id === prefillIntakeId) : undefined;
  const possibleMatches = current ? view.clients.filter(c => [current.prospect, ...current.counterparty.split(/[,;\n]+/)].some(name => name.trim().length > 3 && (c.name.toLocaleLowerCase("pt-BR").includes(name.trim().toLocaleLowerCase("pt-BR")) || name.trim().toLocaleLowerCase("pt-BR").includes(c.name.toLocaleLowerCase("pt-BR"))))) : [];
  useEffect(() => {
    if (!prefillIntakeId || !linkedIntake) return;
    setIntakeId(prefillIntakeId);
    const existing = view.conflicts.filter(item => item.intakeId === prefillIntakeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (existing.length) {
      setSelected(existing[0]!.id);
      setCreating(false);
    } else {
      setProspect(linkedIntake.name);
      setCounterparty("");
      setSummary(linkedIntake.summary);
      setCreating(true);
    }
  }, [prefillIntakeId, linkedIntake, linkedIntake?.name, linkedIntake?.summary, view.intakes, view.conflicts]);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prospect.trim() || !counterparty.trim()) return;
    const item: ConflictCheck = { id: uid("conflito"), officeId: office.id, intakeId: intakeId || undefined, prospect: prospect.trim(), counterparty: counterparty.trim(), summary: summary.trim(), status: "pendente", createdAt: new Date().toISOString(), reviewedBy: undefined, reviewReason: undefined, reviewedAt: undefined };
    update(d => ({...d, conflicts: [item, ...d.conflicts]}));
    setSelected(item.id); setCreating(false); setProspect(""); setCounterparty(""); setSummary("");
  }
  function mark(next: ConflictCheck["status"]) {
    if (!current || !reason.trim() || !roles.includes(view.role)) return;
    update(d => ({...d, conflicts: d.conflicts.map(c => c.id === current.id && c.officeId === office.id ? {...c, status: next, reviewedBy: view.me?.name ?? "Equipe", reviewReason: reason.trim(), reviewedAt: new Date().toISOString()} : c)}));
    setReason("");
  }
  if (!roles.includes(view.role)) return <DeniedState/>;
  return <div className="space-y-5"><PageHeader title="Conflitos de interesses" subtitle="Triagem e decisão humana antes da abertura do caso" actions={<Button onClick={()=>setCreating(v=>!v)}><Plus/> Nova verificação</Button>}/>
    <div className="grid gap-3 sm:grid-cols-3">{[["Verificações",view.conflicts.length],["Aguardando análise",view.conflicts.filter(c=>c.status==="pendente"||c.status==="em_revisao").length],["Riscos identificados",view.conflicts.filter(c=>c.status==="risco_identificado").length]].map(([label,value])=><div key={String(label)} className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</div>
    {creating && <form onSubmit={save} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Nova verificação</h2><p className="text-sm text-muted-foreground">Informe as partes para revisão do escritório. As possíveis correspondências são limitadas à carteira visível deste perfil; a busca não decide automaticamente se existe impedimento.</p><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Potencial cliente<Input required value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Nome da pessoa ou empresa"/></label><label className="grid gap-1 text-sm">Parte contrária ou relacionada<Input required value={counterparty} onChange={e=>setCounterparty(e.target.value)} placeholder="Nome da parte"/></label></div><label className="grid gap-1 text-sm">Atendimento associado<select className="rounded-md border bg-background p-2" value={intakeId} onChange={e=>setIntakeId(e.target.value)}><option value="">Sem vínculo</option>{view.intakes.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label className="grid gap-1 text-sm">Contexto<textarea className="min-h-20 rounded-md border bg-background p-2" value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Descreva o assunto sem incluir dados desnecessários"/></label><div className="flex gap-2"><Button type="submit">Registrar para revisão</Button><Button variant="outline" type="button" onClick={()=>{setCreating(false);if(!view.conflicts.some(item=>item.intakeId===intakeId))setIntakeId("")}}>Cancelar</Button></div></form>}
    <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap"><div className="relative min-w-0 sm:max-w-xs sm:flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar verificação" className="pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar parte ou assunto"/></div><select aria-label="Filtrar por situação" className="min-w-0 w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto" value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todas as situações</option>{Object.entries(statusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    <SavedFilterViews officeId={office.id} role={view.role} collection="conflitos" currentValues={{ query, status }} onApply={(filters) => { setQuery(filters.query); setStatus(filters.status); }} />
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"><section className="min-w-0 rounded-xl border bg-card p-4 shadow-soft"><h2 className="mb-3 font-display text-xl">Verificações registradas</h2>{filtered.length?<div className="space-y-2">{pagination.items.map(c=><button key={c.id} onClick={()=>{setSelected(c.id);setReason("")}} className={`min-w-0 w-full overflow-hidden rounded-lg border p-4 text-left hover:border-primary/40 ${selected===c.id?"border-primary bg-primary/5":""}`}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="block w-full min-w-0 whitespace-normal break-all text-sm sm:w-auto">{c.prospect} × {c.counterparty}</strong><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{statusLabel[c.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(c.createdAt)}{c.intakeId && ` · ${view.intakes.find(i=>i.id===c.intakeId)?.name ?? "Atendimento"}`}</p></button>)}</div>:<EmptyState title="Nenhuma verificação encontrada" hint="Ajuste o filtro ou registre uma nova triagem."/>}<OfficePaginationControls pagination={pagination} /></section><aside className="min-w-0 rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Análise</h2>{current?<div className="mt-4 space-y-4 text-sm"><div><p className="text-xs text-muted-foreground">Partes</p><p className="font-medium">{current.prospect} × {current.counterparty}</p></div>{current.intakeId && <div><p className="text-xs text-muted-foreground">Atendimento</p><Link to="/o/$org/atendimentos" params={{org}} search={{intakeId:current.intakeId}} className="text-primary hover:underline">{view.intakes.find(i=>i.id===current.intakeId)?.name ?? "Voltar ao atendimento"}</Link></div>}<p className="whitespace-pre-wrap">{current.summary || "Sem contexto adicional."}</p><div className="rounded-lg border bg-muted/40 p-3"><p className="font-medium">Possíveis coincidências na carteira visível</p>{possibleMatches.length?<ul className="mt-2 space-y-1">{possibleMatches.map(c=><li key={c.id}>{c.name}</li>)}</ul>:<p className="mt-1 text-xs text-muted-foreground">Nenhuma correspondência simples encontrada. Isso não comprova ausência de conflito.</p>}<p className="mt-2 text-xs text-muted-foreground">Coincidências nominais são apenas pistas para análise humana.</p></div>{current.reviewReason && <div className="rounded-lg border p-3"><p className="font-medium">Decisão humana: {statusLabel[current.status]}</p><p className="mt-1 whitespace-pre-wrap">{current.reviewReason}</p><p className="mt-2 text-xs text-muted-foreground">{current.reviewedBy} · {current.reviewedAt && fmtDateTime(current.reviewedAt)}</p></div>}{<div className="space-y-2 border-t pt-3"><label htmlFor="review-reason" className="font-medium">Justificativa obrigatória da decisão</label><textarea id="review-reason" className="min-h-20 w-full rounded-md border bg-background p-2" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Registre o fundamento da decisão"/><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!reason.trim()} onClick={()=>mark("sem_indicio")}><CheckCircle2/> Sem indício</Button><Button size="sm" variant="outline" disabled={!reason.trim()} onClick={()=>mark("risco_identificado")}><AlertTriangle/> Risco identificado</Button><Button size="sm" variant="outline" disabled={!reason.trim()} onClick={()=>mark("prosseguir_com_ressalvas")}><ShieldAlert/> Prosseguir com ressalvas</Button><Button size="sm" variant="ghost" disabled={!reason.trim()} onClick={()=>mark("em_revisao")}><ShieldAlert/> Manter em revisão</Button></div><p className="text-xs text-muted-foreground">Decisão local da demonstração. O sistema não declara impedimento nem libera caso por conta própria.</p></div>}</div>:<p className="mt-4 text-sm text-muted-foreground">Selecione uma verificação para revisar as partes e registrar uma decisão.</p>}</aside></div>
  </div>;
}




