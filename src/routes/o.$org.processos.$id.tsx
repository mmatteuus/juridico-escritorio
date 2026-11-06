import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarClock, FileText, Gavel, History, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfidentialityBadge, DeadlineStatusChip, DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeCnj } from "@/features/demo/permissions";
import { findOffice, fmtDate, fmtDateTime, timelineEvent, useDemo, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/processos/$id")({
  head: () => ({ meta: [{ title: "Ficha do processo · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ProceedingDetail,
});

const card = "rounded-xl border bg-card p-5 shadow-soft";
const phases = ["Inicial", "Conhecimento", "Instrução", "Sentença", "Recurso", "Cumprimento", "Arquivado"];
function ProceedingDetail() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const proceeding = view.proceedings.find(item => item.id === id);
  const [phase, setPhase] = useState("");
  const [reason, setReason] = useState("");
  if (!canSeeCnj(view.role)) return <DeniedState />;
  if (!proceeding) return <div className="space-y-4"><EmptyState title="Processo não encontrado ou sem acesso" hint="Confira o escritório e a visibilidade do caso vinculado."/><Button variant="outline" asChild><Link to="/o/$org/processos" params={{org}}>Voltar aos processos</Link></Button></div>;
  const current = proceeding;
  const matter = current.matterId ? view.matterById(current.matterId) : undefined;
  const deadlines = view.deadlines.filter(item => item.proceedingId === current.id || (!item.proceedingId && !!current.matterId && item.matterId === current.matterId)).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const documents = view.docs.filter(item => item.proceedingId === current.id || (current.matterId && item.matterId === current.matterId)).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const events = view.timeline.filter(item => (!current.matterId || item.matterId === current.matterId) && item.text.toLocaleLowerCase("pt-BR").includes("processo")).sort((a,b) => b.at.localeCompare(a.at));
  function savePhase() {
    if (!phase || !reason.trim()) { toast.error("Escolha a fase e informe a justificativa."); return; }
    update(data => ({ ...data,
      proceedings: data.proceedings.map(item => item.id === current.id && item.officeId === office.id ? { ...item, phase } : item),
      timeline: [timelineEvent({ officeId: office.id, ...(current.matterId ? { matterId: current.matterId } : {}), actor: view.me?.name ?? "Equipe", kind: "observacao", text: `Atualizou a fase do processo para ${phase}. Motivo: ${reason.trim()}` }), ...data.timeline],
    }));
    setPhase(""); setReason(""); toast.success("Fase atualizada na demonstração");
  }
  return <div className="space-y-5"><Button size="sm" variant="ghost" asChild><Link to="/o/$org/processos" params={{org}}><ArrowLeft/> Processos</Link></Button>
    <PageHeader title={proceeding.title || proceeding.cnjMasked || "Processo sem número"} subtitle={`${matter ? `${matter.code} · ${matter.title}` : "Sem caso vinculado"} · Cadastro manual demonstrativo`}/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><section className={card}><Gavel className="size-5 text-copper"/><p className="mt-3 text-sm text-muted-foreground">Tribunal</p><p className="font-medium">{proceeding.court || "Não informado"}</p></section><section className={card}><ShieldCheck className="size-5 text-primary"/><p className="mt-3 text-sm text-muted-foreground">Unidade / vara</p><p className="font-medium">{proceeding.unit || "Não informada"}</p></section><section className={card}><p className="text-sm text-muted-foreground">Classe processual</p><p className="mt-3 font-medium">{proceeding.proceedingClass || "Não informada"}</p></section><section className={card}><CalendarClock className="size-5 text-primary"/><p className="mt-3 text-sm text-muted-foreground">Prazos no caso</p><p className="font-display text-2xl">{deadlines.length}</p></section></div>
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><div className="space-y-5"><section className={card}><h2 className="font-display text-xl">Caso vinculado</h2>{matter ? <div className="mt-4"><Link to="/o/$org/casos/$id" params={{org,id:matter.id}} className="font-medium text-primary hover:underline">{matter.code} · {matter.title}</Link><p className="mt-2 text-sm text-muted-foreground">{matter.clientIds.map(view.clientName).join(" · ")} · {view.areaName(matter.practiceAreaId)}</p><div className="mt-3"><ConfidentialityBadge value={matter.confidentiality}/></div><p className="mt-3 text-sm">{matter.summary}</p></div> : <p className="mt-4 text-sm text-muted-foreground">Este processo foi cadastrado sem vínculo com um caso.</p>}{proceeding.notes&&<div className="mt-4 border-t pt-4"><h3 className="text-sm font-semibold">Observações</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{proceeding.notes}</p></div>}</section>
      <section className={card}><h2 className="font-display text-xl">Prazos vinculados ao caso</h2>{deadlines.length ? <ul className="mt-3 divide-y">{deadlines.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link to="/o/$org/prazos/$id" params={{org,id:item.id}} className="text-sm font-medium text-primary hover:underline">{item.title}</Link><p className="text-xs text-muted-foreground">{fmtDate(item.dueDate)} · {view.memberName(item.assigneeId)}</p></div><DeadlineStatusChip status={item.status}/></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhum prazo neste caso"/></div>}</section>
      <section className={card}><h2 className="flex items-center gap-2 font-display text-xl"><FileText className="size-5 text-primary"/> Documentos deste processo ou caso</h2>{documents.length ? <ul className="mt-3 divide-y">{documents.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><Link to="/o/$org/documentos" params={{org}} search={{docId:item.id}} className="min-w-0 break-words text-primary hover:underline">{item.title}</Link><span className="shrink-0 text-muted-foreground">v{item.version} · {fmtDate(item.createdAt)}</span></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhum documento visível"/></div>}</section></div>
      <div className="space-y-5"><section className={card}><h2 className="font-display text-xl">Atualizar fase</h2><p className="mt-1 text-xs text-muted-foreground">Alteração local da demonstração. Não consulta o tribunal.</p><div className="mt-4 space-y-3"><label className="block text-sm font-medium">Nova fase<select className="mt-1 block w-full rounded-md border bg-background p-2" value={phase} onChange={e=>setPhase(e.target.value)}><option value="">Selecione</option>{phases.map(item=><option key={item} value={item}>{item}</option>)}</select></label><label className="block text-sm font-medium">Justificativa<textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-2" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Registre o motivo da alteração"/></label><Button onClick={savePhase} disabled={!phase || !reason.trim()}>Salvar fase demo</Button></div></section>
      <section className={card}><h2 className="flex items-center gap-2 font-display text-xl"><History className="size-5 text-primary"/> Atividade</h2>{events.length ? <ul className="mt-3 space-y-3">{events.map(item=><li key={item.id} className="border-l-2 border-primary/30 pl-3 text-sm"><p>{item.text}</p><p className="mt-1 text-xs text-muted-foreground">{item.actor} · {fmtDateTime(item.at)}</p></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">Nenhum evento processual registrado nesta demonstração.</p>}</section></div></div>
    <p className="text-xs text-muted-foreground">Número e informações processuais fictícios. Sem sincronização com tribunais.</p>
  </div>;
}

