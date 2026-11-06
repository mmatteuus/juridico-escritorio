import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Link2, Plus, Search, ShieldCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { ClientPortalInvite } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/convites")({
  head: () => ({ meta: [{ title: "Convites do portal · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: PortalInvites,
});
const labels: Record<ClientPortalInvite["status"], string> = { pendente: "Pendente", ativo: "Ativo", expirado: "Expirado", revogado: "Revogado" };
const allowedRoles = ["gestor", "socio", "coordenador", "advogado", "secretario"];
function PortalInvites() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [creating, setCreating] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [clientId, setClientId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [days, setDays] = useState("7");
  const visibleMatters = view.matters.filter(m => m.clientIds.some(id => view.clients.some(c => c.id === id)));
  const matter = view.matterById(matterId);
  const clientsForMatter = view.clients.filter(c => matter?.clientIds.includes(c.id));
  const docsForMatter = view.docs.filter(d => d.matterId === matterId && d.visibility === "cliente");
  const rows = useMemo(() => view.clientPortalInvites.filter(i => (status === "todos" || i.status === status) && `${view.clientName(i.clientId)} ${view.matterById(i.matterId)?.title ?? ""} ${i.recipient}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [view, status, query]);
  if (!allowedRoles.includes(view.role)) return <DeniedState />;
  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!matter || !matter.clientIds.includes(clientId) || !view.clients.some(c => c.id === clientId) || !recipient.trim()) return;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + Number(days));
    const invite: ClientPortalInvite = { id: uid("invite"), officeId: office.id, clientId, matterId, recipient: recipient.trim(), status: "pendente", allowedDocIds: selectedDocs.filter(id => docsForMatter.some(d => d.id === id)), createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() };
    update(d => ({ ...d, clientPortalInvites: [invite, ...d.clientPortalInvites] }));
    setCreating(false); setMatterId(""); setClientId(""); setRecipient(""); setSelectedDocs([]);
  }
  function changeStatus(id: string, next: ClientPortalInvite["status"]) {
    update(d => ({ ...d, clientPortalInvites: d.clientPortalInvites.map(i => i.id === id && i.officeId === office.id ? { ...i, status: next } : i) }));
  }
  return <div className="space-y-5"><PageHeader title="Convites ao portal do cliente" subtitle="Acesso demonstrativo limitado ao cliente, caso e documentos liberados" actions={<Button onClick={() => setCreating(!creating)}><Plus/> Novo convite</Button>}/>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Pendentes" value={view.clientPortalInvites.filter(i=>i.status==="pendente").length}/><Metric label="Ativos" value={view.clientPortalInvites.filter(i=>i.status==="ativo").length}/><Metric label="Revogados ou expirados" value={view.clientPortalInvites.filter(i=>["revogado","expirado"].includes(i.status)).length}/></div>
    {creating && <form onSubmit={create} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Preparar convite</h2><p className="text-sm text-muted-foreground">Nenhum convite real será enviado. A prévia mostra apenas o escopo selecionado.</p><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Caso<select required className="h-10 rounded-md border bg-background px-3" value={matterId} onChange={e=>{setMatterId(e.target.value);setClientId("");setSelectedDocs([])}}><option value="">Selecione um caso</option>{visibleMatters.map(m=><option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}</select></label><label className="grid gap-1 text-sm">Cliente<select required className="h-10 rounded-md border bg-background px-3" value={clientId} onChange={e=>setClientId(e.target.value)} disabled={!matterId}><option value="">Selecione um cliente do caso</option>{clientsForMatter.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="grid gap-1 text-sm">Contato do convite<Input required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="email ou telefone de demonstração"/></label><label className="grid gap-1 text-sm">Validade<select className="h-10 rounded-md border bg-background px-3" value={days} onChange={e=>setDays(e.target.value)}><option value="3">3 dias</option><option value="7">7 dias</option><option value="14">14 dias</option></select></label></div><fieldset className="rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Documentos liberados neste caso</legend>{docsForMatter.length?<div className="grid gap-2">{docsForMatter.map(d=><label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={e=>setSelectedDocs(e.target.checked?[...selectedDocs,d.id]:selectedDocs.filter(id=>id!==d.id))}/>{d.title} · v{d.version}</label>)}</div>:<p className="text-sm text-muted-foreground">Nenhum documento marcado como liberado ao cliente.</p>}</fieldset><div className="flex gap-2"><Button type="submit">Criar convite demo</Button><Button type="button" variant="outline" onClick={()=>setCreating(false)}>Cancelar</Button></div></form>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar convite" className="pl-9" placeholder="Buscar cliente, caso ou contato" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filtrar status" className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todos os status</option>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    {rows.length ? <div className="grid gap-3 lg:grid-cols-2">{rows.map(i=>{const m=view.matterById(i.matterId); const docs=view.docs.filter(d=>i.allowedDocIds.includes(d.id) && d.matterId===i.matterId && d.visibility==="cliente"); return <article key={i.id} className="rounded-xl border bg-card p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{view.clientName(i.clientId)}</p><p className="text-sm text-muted-foreground">{i.recipient}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{labels[i.status]}</span></div><p className="mt-3 text-sm">{m?<Link to="/o/$org/casos/$id" params={{org,id:m.id}} className="text-primary hover:underline">{m.code} · {m.title}</Link>:"Caso indisponível"}</p><div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground"><p>Escopo: somente este caso · {docs.length} documento(s) liberado(s)</p>{docs.length>0&&<p>Documentos: {docs.map(d=>d.title).join(" · ")}</p>}<p>Criado em {fmtDate(i.createdAt)} · válido até {fmtDate(i.expiresAt)}</p></div><div className="mt-4 flex flex-wrap gap-2">{i.status==="pendente"&&<Button size="sm" variant="outline" onClick={()=>changeStatus(i.id,"ativo")}><ShieldCheck/> Simular aceite</Button>}{["pendente","ativo"].includes(i.status)&&<Button size="sm" variant="outline" onClick={()=>changeStatus(i.id,"revogado")}><UserRoundX/> Revogar demo</Button>}</div></article>})}</div>:<EmptyState title="Nenhum convite encontrado" hint="Ajuste os filtros ou prepare um convite demonstrativo."/>}
    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Link2 className="size-4"/>Esta tela não envia mensagens, cria contas nem concede acesso real ao portal.</p>
  </div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>}
