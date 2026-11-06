import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Clock3, History, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicationReviewPanel } from "@/components/office/PublicationReviewPanel";
import { DeadlineStatusChip, DeniedState, DueBadge, EmptyState, PageHeader } from "@/components/office/badges";
import { changeDeadline, rescheduleDeadline } from "@/features/demo/actions";
import { canConfirmDeadline, canProposeDeadline, canSeeCnj } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import type { Deadline } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/prazos/$id")({
  head: () => ({ meta: [{ title: "Revisão de prazo · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ReviewDeadline,
});

function ReviewDeadline() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [newDate, setNewDate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [reason, setReason] = useState("");
  const deadline = view.deadlines.find(d => d.id === id);
  if (!canSeeCnj(view.role)) return <DeniedState />;
  if (!deadline) return <div className="space-y-4"><EmptyState title="Prazo não encontrado ou sem acesso" hint="Confira o escritório e suas permissões para este caso."/><Button variant="outline" asChild><Link to="/o/$org/prazos" params={{org}}>Voltar aos prazos</Link></Button></div>;
  const matter = view.matterById(deadline.matterId);
  const actor = view.me?.name ?? "Profissional";
  const open = deadline.status !== "cancelado" && deadline.status !== "concluido";
  const reviewer = canConfirmDeadline(view.role);
  function act(next: Partial<Deadline>, description: string) {
    changeDeadline(update, deadline!, next, description, actor);
    toast.success(description);
  }
  function reschedule() {
    if (!newDate || !canProposeDeadline(view.role) || !open) return;
    const date = new Date(`${newDate}T18:00:00`);
    if (Number.isNaN(date.getTime())) { toast.error("Informe uma data válida."); return; }
    act(rescheduleDeadline(deadline!, date.toISOString(), changeReason), "Propôs alteração da data e solicitou nova revisão");
    setNewDate("");
    setChangeReason("");
  }
  return <div className="space-y-5"><Button variant="ghost" size="sm" asChild><Link to="/o/$org/prazos" params={{org}}><ArrowLeft/> Todos os prazos</Link></Button>
    <PageHeader title={deadline.title} subtitle={`${matter?.code ?? "Caso"} · Revisão humana do prazo`}/>
    <div className="grid gap-3 sm:grid-cols-3"><Stat icon={<CalendarClock className="size-5 text-copper"/>} label="Data vigente" value={fmtDateTime(deadline.dueDate)}/><Stat icon={<ShieldCheck className="size-5 text-primary"/>} label="Responsável" value={view.memberName(deadline.assigneeId)}/><Stat icon={<History className="size-5 text-primary"/>} label="Versão" value={`v${deadline.version}`}/></div>
    <PublicationReviewPanel office={office} reviews={view.publicationReviews.filter(review => review.linkedDeadlineId === deadline.id || review.matterId === deadline.matterId)} />
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]"><section className="rounded-xl border bg-card p-5 shadow-soft"><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-xl">Conferência</h2><DeadlineStatusChip status={deadline.status}/><DueBadge iso={deadline.dueDate} done={!open}/></div><p className="mt-3 text-sm text-muted-foreground">Confirme a origem e a data antes de aprovar. Este demonstrativo não calcula prazo judicial nem pratica ato automaticamente.</p><dl className="mt-5 grid gap-3 text-sm"><Info label="Origem" value={deadline.sourceLabel}/><Info label="Proposto por" value={deadline.proposedBy}/><Info label="Responsável" value={view.memberName(deadline.assigneeId)}/><Info label="Caso" value={matter?.title ?? "Caso indisponível"}/><Info label="Confirmado por" value={deadline.confirmedBy ?? "Aguardando revisão"}/><Info label="Confirmação" value={deadline.confirmedAt ? fmtDateTime(deadline.confirmedAt) : "—"}/></dl>
      {matter && <Link to="/o/$org/casos/$id" params={{org,id:matter.id}} search={{tab:"prazos"}} className="mt-5 inline-block text-sm text-primary hover:underline">Abrir caso {matter.code} →</Link>}
      {deadline.proposedDueDate && <div className="mt-4 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm"><p className="font-semibold">Alteração aguardando aprovação · proposta v{deadline.proposedVersion ?? deadline.version + 1}</p><p className="mt-1">Data vigente v{deadline.version}: {fmtDateTime(deadline.dueDate)} · Data proposta: {fmtDateTime(deadline.proposedDueDate)}</p><p className="mt-1 text-muted-foreground">Motivo: {deadline.proposedReason || "Não informado"}. A data vigente permanece ativa até aprovação profissional.</p></div>}
      {open && <div className="mt-6 space-y-4 border-t pt-5"><h3 className="font-medium">Ações demonstrativas</h3>{canProposeDeadline(view.role) && <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"><label className="grid gap-1 text-sm" htmlFor="new-deadline-date">Propor nova data<Input id="new-deadline-date" type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="w-full sm:w-44"/></label><label className="grid gap-1 text-sm" htmlFor="deadline-change-reason">Fonte e justificativa<Input id="deadline-change-reason" value={changeReason} onChange={e=>setChangeReason(e.target.value)} placeholder="Referência e motivo da alteração"/></label><Button variant="outline" disabled={!newDate || !changeReason.trim()} onClick={reschedule}>Enviar para revisão</Button></div>}
        <div className="flex flex-wrap gap-2">{deadline.status==="proposto" && canProposeDeadline(view.role) && <Button variant="outline" onClick={()=>act({status:"em_revisao"},"Encaminhou para revisão humana")}>Encaminhar para revisão</Button>}{["proposto","em_revisao"].includes(deadline.status) && reviewer && <Button onClick={()=>act({...(deadline.proposedDueDate ? { dueDate: deadline.proposedDueDate, version: deadline.proposedVersion ?? deadline.version + 1, proposedDueDate: undefined, proposedReason: undefined, proposedVersion: undefined } : {}),status:"confirmado",confirmedBy:actor,confirmedAt:new Date().toISOString()},"Confirmou o prazo após revisão") }><CheckCircle2/> Aprovar data e confirmar</Button>}{deadline.status==="confirmado" && reviewer && <Button variant="outline" onClick={()=>act({status:"concluido"},"Marcou o prazo como concluído")}>Marcar concluído</Button>}</div>
        {reviewer && <div className="flex flex-wrap items-end gap-2"><label htmlFor="cancel-reason" className="grid flex-1 gap-1 text-sm">Justificativa para cancelamento<Input id="cancel-reason" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Informe o motivo"/></label><Button variant="destructive" disabled={!reason.trim()} onClick={()=>{act({status:"cancelado"},`Cancelou o prazo: ${reason.trim()}`);setReason("")}}>Cancelar prazo</Button></div>}
        {!reviewer && <p className="text-xs text-muted-foreground">A confirmação e o cancelamento exigem perfil de advogado autorizado.</p>}
      </div>}
    </section><aside className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="flex items-center gap-2 font-display text-xl"><Clock3 className="size-5 text-primary"/> Histórico de alterações</h2><ol className="mt-5 space-y-4 border-l pl-4">{[...deadline.history].reverse().map((entry,index)=><li key={`${entry.at}-${index}`} className="relative text-sm before:absolute before:-left-[21px] before:top-1 before:size-2.5 before:rounded-full before:bg-primary"><p className="font-medium">{entry.action}</p><p className="text-xs text-muted-foreground">{entry.actor} · {fmtDateTime(entry.at)}</p></li>)}</ol><div className="mt-6 flex gap-2 rounded-lg bg-warning-soft p-3 text-xs text-warning"><AlertTriangle className="size-4 shrink-0"/><span>Histórico e confirmação são locais a esta sessão de demonstração.</span></div></aside></div>
  </div>;
}
function Info({label,value}:{label:string;value:string}){return <div className="flex flex-wrap justify-between gap-2 border-b pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-sm text-right font-medium">{value}</dd></div>}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl border bg-card p-4 shadow-soft"><div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div><p className="mt-2 font-display text-xl">{value}</p></div>}
