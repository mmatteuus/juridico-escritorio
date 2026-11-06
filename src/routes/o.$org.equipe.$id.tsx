import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarClock, ClipboardList, IdCard, UserRound, UserRoundCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineStatusChip, DeniedState, EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/equipe/$id")({
  head: () => ({ meta: [{ title: "Profissional · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: MemberPage,
});
const card = "rounded-xl border bg-card p-5 shadow-soft";
function MemberPage() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const [offboardingOpen, setOffboardingOpen] = useState(false);
  const [successorId, setSuccessorId] = useState("");
  const [reason, setReason] = useState("");
  const [prepared, setPrepared] = useState(false);
  const member = view.members.find(person => person.id === id);
  if (!member) return <DeniedState />;
  const matters = view.matters.filter(matter => matter.assignedMemberIds.includes(member.id));
  const tasks = view.tasks.filter(task => task.assigneeId === member.id && task.status !== "concluida").sort((a,b) => a.dueAt.localeCompare(b.dueAt));
  const deadlines = view.deadlines.filter(deadline => deadline.assigneeId === member.id && !["concluido","cancelado"].includes(deadline.status)).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const areas = member.practiceAreaIds.map(view.areaName);
  const canManage = ["gestor", "socio"].includes(view.role);
  const successorOptions = view.members.filter(person => person.id !== member.id && ["advogado", "coordenador", "socio", "gestor"].includes(person.role));
  function prepareOffboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!successorId || !reason.trim()) return;
    setPrepared(true);
    setOffboardingOpen(false);
  }
  return <div className="space-y-5">
    <Link to="/o/$org/equipe" params={{org}} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/> Equipe</Link>
    <PageHeader title={member.name} subtitle={`${member.title} · ${ROLE_LABEL[member.role]}`}/>
    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={<BriefcaseBusiness className="size-4"/>} label="Casos atribuídos visíveis" value={matters.length}/><Metric icon={<ClipboardList className="size-4"/>} label="Tarefas em aberto" value={tasks.length}/><Metric icon={<CalendarClock className="size-4"/>} label="Prazos em aberto" value={deadlines.length}/></div>
    {canManage && <section className={`${card} border-amber-500/40`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-display text-xl"><UserRoundCheck className="size-5 text-warning"/> Desligamento e continuidade</h2><p className="mt-1 text-sm text-muted-foreground">Confira responsabilidades pendentes e prepare uma transferência autorizada.</p></div><span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">Demonstração</span></div>
      <div className="mt-4 flex items-start gap-3 rounded-lg bg-warning-soft p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning"/><p>A revogação de acesso do profissional desligado seria imediata e independente da transferência. Esta tela não encerra contas, não muda permissões e não reatribui registros.</p></div>
      {prepared ? <div role="status" className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm"><p className="font-semibold">Preparação registrada nesta tela</p><p className="mt-1">Novo responsável proposto: {view.memberName(successorId)}. {tasks.length} tarefa(s), {deadlines.length} prazo(s) e {matters.length} caso(s) aguardam autorização e aceite antes de qualquer transferência.</p><p className="mt-2 text-muted-foreground">Motivo: {reason}</p><p className="mt-2 text-xs text-muted-foreground">O aceite do novo responsável, a validação de acesso e a trilha de auditoria ainda seriam necessários.</p></div> : <>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-lg border p-3">{tasks.length} tarefa(s) em aberto</div><div className="rounded-lg border p-3">{deadlines.length} prazo(s) em aberto</div><div className="rounded-lg border p-3">{matters.length} caso(s) atribuídos visíveis</div></div>
        {offboardingOpen ? <form onSubmit={prepareOffboarding} className="mt-4 grid gap-3 rounded-lg border p-4"><label className="grid gap-1 text-sm">Responsável proposto<select required value={successorId} onChange={event=>setSuccessorId(event.target.value)} className="h-10 rounded-md border bg-background px-3"><option value="">Selecione um profissional</option>{successorOptions.map(person=><option key={person.id} value={person.id}>{person.name} · {person.title}</option>)}</select></label><label className="grid gap-1 text-sm">Justificativa<textarea required minLength={8} value={reason} onChange={event=>setReason(event.target.value)} className="min-h-20 rounded-md border bg-background p-3" placeholder="Por que a redistribuição está sendo preparada?"/></label><div className="flex flex-wrap gap-2"><Button type="submit" disabled={!successorId || reason.trim().length<8}>Preparar transferência demo</Button><Button type="button" variant="outline" onClick={()=>setOffboardingOpen(false)}>Cancelar</Button></div></form> : <Button className="mt-4" variant="outline" onClick={()=>setOffboardingOpen(true)} disabled={!successorOptions.length}>Preparar desligamento demonstrativo</Button>}
      </>}
    </section>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className={card}><div className="flex items-center gap-2"><UserRound className="size-5 text-primary"/><h2 className="font-display text-xl">Perfil profissional</h2></div><div className="mt-5 flex items-center gap-4"><span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xl text-primary">{member.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><p className="font-medium">{member.name}</p><p className="text-sm text-muted-foreground">{ROLE_LABEL[member.role]}</p></div></div><dl className="mt-5 space-y-1"><Info label="Função" value={member.title}/><Info label="Áreas" value={areas.length ? areas.join(" · ") : "Todas as áreas"}/><Info label="Escritório" value={office.displayName}/></dl><div className="mt-5 rounded-lg border p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><IdCard className="size-4 text-copper"/> Credenciais profissionais</h3>{member.oabNumber ? <dl className="mt-3 space-y-1"><Info label="Inscrição OAB" value={member.oabNumber}/><Info label="Seccional" value={member.oabUf ?? "Não informada"}/></dl> : <p className="mt-2 text-sm text-muted-foreground">Sem inscrição OAB informada para este perfil administrativo na amostra.</p>}<p className="mt-3 text-xs text-muted-foreground">Dados inteiramente fictícios para apresentação. Nenhuma consulta ou validação na OAB foi realizada.</p></div><p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Ficha demonstrativa. Vínculos e acessos exibidos seguem o perfil ativo e a visibilidade dos casos.</p></section>
      <div className="space-y-5"><section className={card}><h2 className="font-display text-xl">Casos atribuídos</h2>{matters.length ? <ul className="mt-4 divide-y">{matters.map(matter=><li key={matter.id}><Link to="/o/$org/casos/$id" params={{org,id:matter.id}} className="block py-3 text-sm hover:text-primary"><span className="block font-medium">{matter.title}</span><span className="text-xs text-muted-foreground">{matter.code} · {view.areaName(matter.practiceAreaId)}</span></Link></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhum caso visível atribuído"/></div>}</section>
      <section className={card}><h2 className="font-display text-xl">Tarefas em aberto</h2>{tasks.length ? <ul className="mt-4 divide-y">{tasks.map(task=><li key={task.id}><Link to="/o/$org/tarefas/$id" params={{org,id:task.id}} className="flex flex-wrap items-center gap-2 py-3 text-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><span className="min-w-0 flex-1"><span className="block break-words font-medium">{task.title}</span><span className="block text-xs text-muted-foreground">{TASK_STATUS_LABEL[task.status]} · {fmtDateTime(task.dueAt)}</span></span><PriorityBadge value={task.priority}/></Link></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhuma tarefa em aberto"/></div>}</section>
      <section className={card}><h2 className="font-display text-xl">Prazos em aberto</h2>{deadlines.length ? <ul className="mt-4 divide-y">{deadlines.map(deadline=><li key={deadline.id}><Link to="/o/$org/prazos/$id" params={{org,id:deadline.id}} className="flex flex-wrap items-center gap-2 py-3 text-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><span className="min-w-0 flex-1"><span className="block break-words font-medium">{deadline.title}</span><span className="block text-xs text-muted-foreground">{fmtDateTime(deadline.dueDate)}</span></span><DeadlineStatusChip status={deadline.status}/></Link></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhum prazo em aberto"/></div>}</section>
    </div>
    </div>
  </div>;
}
type MetricProps = { icon: ReactNode; label: string; value: number };
function Metric({ icon, label, value }: MetricProps) { return <div className={card}><span className="text-copper">{icon}</span><p className="mt-3 font-display text-3xl tabular">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div> }
type InfoProps = { label: string; value: string };
function Info({ label, value }: InfoProps) { return <div className="flex justify-between gap-4 border-b py-2 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }


