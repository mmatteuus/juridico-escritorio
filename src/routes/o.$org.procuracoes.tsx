import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { FileSignature, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/office/badges";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Mandate } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/procuracoes")({
  head: () => ({ meta: [{ title: "Procurações · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Procuracoes,
});
const statusLabel: Record<Mandate["status"], string> = { minuta: "Minuta", em_revisao: "Em revisão", aprovado_demo: "Aprovado na demo", revogado_demo: "Revogado na demo" };
const kindLabel: Record<Mandate["kind"], string> = { procuracao: "Procuração", substabelecimento: "Substabelecimento" };

function Procuracoes() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("todos");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [clientId, setClientId] = useState("");
  const [attorneyId, setAttorneyId] = useState("");
  const [title, setTitle] = useState("");
  const [powers, setPowers] = useState("");
  const [newKind, setNewKind] = useState<Mandate["kind"]>("procuracao");
  const visible = view.mandates.filter(m => (kind === "todos" || m.kind === kind) && `${m.title} ${view.clientName(m.clientId)} ${view.matterById(m.matterId)?.code ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const current = view.mandates.find(m => m.id === selected);
  const eligibleClients = view.clients.filter(c => view.matterById(matterId)?.clientIds.includes(c.id));
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!view.matterById(matterId) || !eligibleClients.some(c => c.id === clientId) || !view.members.some(m => m.id === attorneyId) || !title.trim() || !powers.trim()) return;
    const entry: Mandate = { id: uid("mandato"), officeId: office.id, matterId, clientId, attorneyId, title: title.trim(), powers: powers.trim(), kind: newKind, status: "minuta", createdAt: new Date().toISOString() };
    update(d => ({ ...d, mandates: [entry, ...d.mandates] }));
    setSelected(entry.id); setCreating(false); setMatterId(""); setClientId(""); setAttorneyId(""); setTitle(""); setPowers("");
  }
  function changeStatus(id: string, status: Mandate["status"]) {
    update(d => ({ ...d, mandates: d.mandates.map(m => m.id === id && m.officeId === office.id ? { ...m, status } : m) }));
  }
  return <div className="space-y-5"><PageHeader title="Procurações e substabelecimentos" subtitle="Instrumentos vinculados a casos, em demonstração visual" actions={<Button onClick={() => setCreating(x=>!x)}><Plus /> Nova minuta</Button>} />
    <div className="grid gap-3 sm:grid-cols-3">{[["Instrumentos visíveis",view.mandates.length],["Em revisão",view.mandates.filter(m=>m.status==="em_revisao").length],["Minutas",view.mandates.filter(m=>m.status==="minuta").length]].map(([label,value])=><div key={String(label)} className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</div>
    {creating && <form onSubmit={save} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Nova minuta demonstrativa</h2><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Tipo<select className="rounded-md border bg-background p-2" value={newKind} onChange={e=>setNewKind(e.target.value as Mandate["kind"])}><option value="procuracao">Procuração</option><option value="substabelecimento">Substabelecimento</option></select></label><label className="grid gap-1 text-sm">Caso<select required className="rounded-md border bg-background p-2" value={matterId} onChange={e=>{setMatterId(e.target.value);setClientId("")}}><option value="">Selecione</option>{view.matters.map(m=><option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}</select></label><label className="grid gap-1 text-sm">Outorgante / cliente<select required className="rounded-md border bg-background p-2" value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Selecione</option>{eligibleClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="grid gap-1 text-sm">Profissional responsável<select required className="rounded-md border bg-background p-2" value={attorneyId} onChange={e=>setAttorneyId(e.target.value)}><option value="">Selecione</option>{view.members.filter(m=>["gestor","socio","coordenador","advogado"].includes(m.role)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div><label className="grid gap-1 text-sm">Título<Input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Procuração para o caso"/></label><label className="grid gap-1 text-sm">Poderes e observações<textarea required className="min-h-24 rounded-md border bg-background p-2" value={powers} onChange={e=>setPowers(e.target.value)} /></label><p className="text-xs text-muted-foreground">O registro não gera documento legal, assinatura ou protocolo.</p><div className="flex gap-2"><Button type="submit">Criar minuta demo</Button><Button type="button" variant="outline" onClick={()=>setCreating(false)}>Cancelar</Button></div></form>}
    <div className="flex flex-wrap gap-2"><div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar procurações" placeholder="Buscar instrumento, caso ou cliente" className="pl-9" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filtrar por tipo" className="rounded-md border bg-background px-3 text-sm" value={kind} onChange={e=>setKind(e.target.value)}><option value="todos">Todos os tipos</option><option value="procuracao">Procurações</option><option value="substabelecimento">Substabelecimentos</option></select></div>
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]"><section className="rounded-xl border bg-card p-4 shadow-soft"><h2 className="mb-3 font-display text-xl">Instrumentos</h2>{visible.length?<div className="space-y-2">{visible.map(m=><button key={m.id} onClick={()=>setSelected(m.id)} className={`w-full rounded-lg border p-4 text-left hover:border-primary/40 ${selected===m.id?"border-primary bg-primary/5":""}`}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{m.title}</strong><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{statusLabel[m.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{kindLabel[m.kind]} · {view.clientName(m.clientId)} · {fmtDate(m.createdAt)}</p></button>)}</div>:<EmptyState title="Nenhum instrumento encontrado" hint="Ajuste os filtros ou crie uma minuta demonstrativa."/>}</section><aside className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Detalhes</h2>{current?<div className="mt-4 space-y-4 text-sm"><div><p className="text-xs text-muted-foreground">Instrumento</p><p className="font-medium">{current.title}</p></div><div><p className="text-xs text-muted-foreground">Caso</p><Link className="text-primary hover:underline" to="/o/$org/casos/$id" params={{org,id:current.matterId}}>{view.matterById(current.matterId)?.code}</Link></div><div><p className="text-xs text-muted-foreground">Cliente</p><p>{view.clientName(current.clientId)}</p></div><div><p className="text-xs text-muted-foreground">Responsável</p><p>{view.memberName(current.attorneyId)}</p></div><div><p className="text-xs text-muted-foreground">Poderes e observações</p><p className="whitespace-pre-wrap">{current.powers}</p></div><div className="flex flex-wrap gap-2">{current.status==="minuta"&&<Button size="sm" variant="outline" onClick={()=>changeStatus(current.id,"em_revisao")}>Enviar para revisão</Button>}{current.status==="em_revisao"&&<Button size="sm" variant="outline" onClick={()=>changeStatus(current.id,"aprovado_demo")}>Aprovar na demo</Button>}{current.status==="aprovado_demo"&&<Button size="sm" variant="outline" onClick={()=>changeStatus(current.id,"revogado_demo")}>Marcar revogado</Button>}</div><p className="border-t pt-3 text-xs text-muted-foreground">Status demonstrativo. Sem validade jurídica, assinatura ou protocolo.</p></div>:<div className="mt-5"><FileSignature className="mb-2 size-8 text-muted-foreground"/><p className="text-sm text-muted-foreground">Selecione um instrumento para ver os detalhes.</p></div>}</aside></div>
  </div>;
}
