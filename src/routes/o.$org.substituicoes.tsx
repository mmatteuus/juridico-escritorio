import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Clock3, Plus, Search, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { DelegationGrant } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/substituicoes")({
  head: () => ({ meta: [{ title: "Substituições · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: SubstituicoesPage,
});
const scopes = ["Visualizar caso", "Preparar documentos", "Acompanhar tarefas"];
const statusLabel = { ativa: "Ativa", agendada: "Agendada", revogada: "Revogada" };
function SubstituicoesPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todas");
  const [open, setOpen] = useState(false);
  const [granteeId, setGranteeId] = useState("");
  const [matterId, setMatterId] = useState("");
  const [scope, setScope] = useState<string[]>(["Visualizar caso"]);
  const [justification, setJustification] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [endingId, setEndingId] = useState<string | null>(null);
  const canManage = ["gestor", "socio"].includes(view.role);
  const eligibleGrantees = view.members.filter(member => member.id !== view.me?.id && ["advogado", "coordenador", "socio"].includes(member.role));
  const now = new Date();
  const effective = (grant: DelegationGrant) => grant.status === "revogada" ? "revogada" : new Date(grant.expiresAt) < now ? "expirada" : new Date(grant.startsAt) > now ? "agendada" : "ativa";
  const visible = useMemo(() => view.delegations.filter(g => (filter === "todas" || effective(g) === filter) && `${view.memberName(g.granteeId)} ${view.memberName(g.grantorId)} ${view.matterById(g.matterId)?.code ?? ""}`.toLowerCase().includes(query.toLowerCase())), [view, filter, query]);
  if (!canManage) return <DeniedState />;
  function save(e: FormEvent) {
    e.preventDefault();
    if (!eligibleGrantees.some(member => member.id === granteeId) || !view.matterById(matterId) || !startsAt || !expiresAt || new Date(expiresAt) <= new Date(startsAt) || !scope.length || !justification.trim()) return;
    const grant: DelegationGrant = { id: uid("deleg"), officeId: office.id, grantorId: view.me!.id, granteeId, matterId, scope, justification: justification.trim(), startsAt: new Date(startsAt).toISOString(), expiresAt: new Date(expiresAt).toISOString(), status: new Date(startsAt) > new Date() ? "agendada" : "ativa" };
    update(data => ({...data, delegations: [grant, ...data.delegations]}));
    setOpen(false); setGranteeId(""); setMatterId(""); setScope(["Visualizar caso"]); setJustification(""); setStartsAt(""); setExpiresAt("");
  }
  function revoke(g: DelegationGrant) { update(data => ({...data, delegations: data.delegations.map(item => item.id === g.id && item.officeId === office.id ? {...item, status: "revogada", revokedAt: new Date().toISOString()} : item)})); }
  return <div className="space-y-5"><PageHeader title="Substituições e delegações" subtitle="Acessos temporários com escopo, justificativa e validade" actions={<Button onClick={() => setOpen(!open)}><Plus className="size-4"/> Nova delegação</Button>}/>
    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={<ShieldCheck className="size-5"/>} label="Ativas" count={view.delegations.filter(g=>effective(g)==="ativa").length}/><Metric icon={<Clock3 className="size-5"/>} label="Agendadas" count={view.delegations.filter(g=>effective(g)==="agendada").length}/><Metric icon={<ShieldOff className="size-5"/>} label="Encerradas" count={view.delegations.filter(g=>["revogada","expirada"].includes(effective(g))).length}/></div>
    {open && <form onSubmit={save} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Conceder acesso temporário</h2><p className="text-xs text-muted-foreground">Prévia local: a concessão não altera autenticação nem permissões reais. Selecione um profissional jurídico ativo; o acesso fica limitado ao caso, escopo e período.</p><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Profissional substituto<select required value={granteeId} onChange={e=>setGranteeId(e.target.value)} className="h-10 rounded-md border bg-background px-3"><option value="">Selecione</option>{eligibleGrantees.map(m=><option key={m.id} value={m.id}>{m.name} · {m.title}</option>)}</select></label><label className="grid gap-1 text-sm">Caso autorizado<select required value={matterId} onChange={e=>setMatterId(e.target.value)} className="h-10 rounded-md border bg-background px-3"><option value="">Selecione</option>{view.matters.map(m=><option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}</select></label><label className="grid gap-1 text-sm">Início<input required type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} className="h-10 rounded-md border bg-background px-3"/></label><label className="grid gap-1 text-sm">Expiração<input required type="datetime-local" min={startsAt} value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="h-10 rounded-md border bg-background px-3"/></label></div><fieldset><legend className="text-sm font-medium">Escopo permitido</legend><div className="mt-2 flex flex-wrap gap-4">{scopes.map(item=><label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scope.includes(item)} onChange={e=>setScope(prev=>e.target.checked?[...prev,item]:prev.filter(x=>x!==item))}/>{item}</label>)}</div></fieldset><label className="grid gap-1 text-sm">Justificativa<textarea required value={justification} onChange={e=>setJustification(e.target.value)} className="min-h-20 rounded-md border bg-background p-3" placeholder="Motivo da substituição"/></label><div className="flex flex-wrap gap-2"><Button type="submit" disabled={!scope.length}>Registrar delegação demo</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button></div></form>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar delegação" placeholder="Buscar por pessoa ou caso" value={query} onChange={e=>setQuery(e.target.value)} className="pl-9"/></div><select aria-label="Filtrar status" className="h-10 rounded-md border bg-background px-3 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todas">Todas</option><option value="ativa">Ativas</option><option value="agendada">Agendadas</option><option value="expirada">Expiradas</option><option value="revogada">Revogadas</option></select></div>
    {visible.length ? <div className="grid gap-3">{visible.map(g=>{const state=effective(g);const openTasks=g.matterId?view.tasks.filter(t=>t.matterId===g.matterId&&t.status!=="concluida").length:0;const openDeadlines=g.matterId?view.deadlines.filter(d=>d.matterId===g.matterId&&!['concluido','cancelado'].includes(d.status)).length:0;return <article key={g.id} className="rounded-xl border bg-card p-5 shadow-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="flex items-center gap-2 font-semibold"><Users className="size-4 shrink-0 text-primary"/>{view.memberName(g.granteeId)}</p><p className="mt-1 break-words text-sm text-muted-foreground">Concedido por {view.memberName(g.grantorId)} · {g.matterId && view.matterById(g.matterId) ? <Link to="/o/$org/casos/$id" params={{org,id:g.matterId}} className="text-primary hover:underline">{view.matterById(g.matterId)?.code}</Link> : "Caso não disponível"}</p></div><span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">{state === "expirada" ? "Expirada" : statusLabel[g.status]}</span></div><p className="mt-3 break-words text-sm">{g.justification}</p><div className="mt-3 flex flex-wrap gap-2">{g.scope.map(item=><span key={item} className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">{item}</span>)}</div><p className="mt-3 rounded-lg bg-muted p-3 text-sm">Ao retornar o titular ou encerrar o período: revogar acessos derivados, preservar a titularidade e manter autoria e histórico. {openTasks+openDeadlines} pendência(s) aberta(s) deste caso devem ser revisadas.</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground"><span className="break-words">De {fmtDate(g.startsAt)} até {fmtDate(g.expiresAt)}{g.revokedAt ? ` · revogada em ${fmtDate(g.revokedAt)}` : ""}</span>{["ativa","agendada"].includes(state)&&(endingId===g.id?<span className="flex min-w-0 flex-wrap items-center gap-2 text-foreground"><span className="break-words">Confirma retorno/encerramento? A ação é apenas demonstrativa.</span><Button type="button" size="sm" variant="outline" onClick={()=>{revoke(g);setEndingId(null)}}>Confirmar revogação demo</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setEndingId(null)}>Cancelar</Button></span>:<Button type="button" size="sm" variant="outline" onClick={()=>setEndingId(g.id)}>Titular retornou · encerrar</Button>)}</div><p className="mt-2 text-xs text-muted-foreground">Sem revogação de sessão ou acesso real nesta demonstração.</p></article>})}</div> : <EmptyState title="Nenhuma delegação encontrada" hint="Ajuste os filtros ou registre uma concessão temporária."/>}
  </div>;
}
function Metric({icon,label,count}:{icon:ReactNode;label:string;count:number}){return <div className="rounded-xl border bg-card p-4 shadow-soft"><span className="text-copper">{icon}</span><p className="mt-2 font-display text-3xl">{count}</p><p className="text-sm text-muted-foreground">{label}</p></div>}

