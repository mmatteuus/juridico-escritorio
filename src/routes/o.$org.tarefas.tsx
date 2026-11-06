import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { findOffice, fmtDateTime, isOverdue, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import { canTransitionTask, TASK_TRANSITIONS } from "@/features/demo/actions";
import { canApproveTask, canDelegateTask, canManageTask } from "@/features/demo/permissions";
import type { Appointment, Task, TaskPriority, TaskStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/tarefas")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Tarefas · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: TasksPage,
});
const statuses: { value: TaskStatus | "abertas" | "todas"; label: string }[] = [
  { value: "abertas", label: "Em aberto" }, { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" }, { value: "aguardando_cliente", label: "Aguardando cliente" },
  { value: "aguardando_revisao", label: "Em revisão" }, { value: "concluida", label: "Concluídas" }, { value: "todas", label: "Todas" },
];
const priorities: TaskPriority[] = ["critica", "alta", "normal", "baixa"];
const blank = { title: "", matterId: "", assigneeId: "", requesterId: "", proceedingId: "", instructions: "", appointmentAt: "", priority: "normal" as TaskPriority, dueAt: "" };

function TasksPage() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [status, setStatus] = useState<(typeof statuses)[number]["value"]>("abertas");
  const [priority, setPriority] = useState<TaskPriority | "todas">("todas");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Task | null>(null);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState(blank);
  const canDelegate = canDelegateTask(view.role);
  const list = [...view.tasks].filter(t =>
    (status === "todas" || (status === "abertas" ? t.status !== "concluida" : t.status === status)) &&
    (priority === "todas" || t.priority === priority) &&
    `${t.title} ${view.matterById(t.matterId)?.code ?? ""} ${view.memberName(t.assigneeId)}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a,b) => a.dueAt.localeCompare(b.dueAt));
  const change = (t: Task, next: TaskStatus) => {
    if (!reason.trim() || !canManageTask(view.role, t, view.me?.id) || !canTransitionTask(t.status, next) || (next === "concluida" && !canApproveTask(view.role)) || !view.tasks.some(item => item.id === t.id)) return;
    const history = [...(t.history ?? []), { at: new Date().toISOString(), actor: view.me?.name ?? "Equipe", action: `${TASK_STATUS_LABEL[next]} · ${reason.trim()}` }];
    update(s => ({ ...s, tasks: s.tasks.map(x => x.id === t.id && x.officeId === office.id ? { ...x, status: next, history } : x),
      timeline: t.matterId ? [timelineEvent({ officeId: office.id, matterId: t.matterId, actor: view.me?.name ?? "Equipe", kind: "tarefa", text: `${t.title}: ${TASK_STATUS_LABEL[next]}. ${reason.trim()}` }), ...s.timeline] : s.timeline }));
    setSelected({ ...t, status: next }); setReason(""); toast.success("Tarefa atualizada na demonstração");
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigneeId || !form.dueAt) return;
    if (!canDelegate && form.assigneeId !== view.me?.id) { toast.error("Este perfil só pode atribuir a tarefa a si próprio nesta demonstração."); return; }
    const matter = view.matterById(form.matterId);
    const proceeding = view.proceedings.find(item => item.id === form.proceedingId && item.matterId === matter?.id);
    if (form.proceedingId && !proceeding) return;
    const task: Task = { id: uid("task"), officeId: office.id, title: form.title.trim(), ...(matter ? { matterId: matter.id } : {}),
      assigneeId: form.assigneeId, priority: form.priority, status: "a_fazer", dueAt: new Date(form.dueAt).toISOString(),
      history: [{ at: new Date().toISOString(), actor: view.me?.name ?? "Equipe", action: "Tarefa criada" }],
      ...(view.me?.id ? { requesterId: canDelegate ? (form.requesterId || view.me.id) : view.me.id } : {}), ...(form.instructions.trim() ? { instructions: form.instructions.trim() } : {}), ...(proceeding ? { proceedingId: proceeding.id } : {}), ...(form.appointmentAt ? { appointmentId: uid("appointment") } : {}) };
    const appointment: Appointment | undefined = form.appointmentAt ? { id: task.appointmentId!, officeId: office.id, ...(matter ? { matterId: matter.id } : {}), title: `Acompanhamento: ${task.title}`, at: new Date(form.appointmentAt).toISOString(), assigneeId: task.assigneeId, practiceAreaId: matter?.practiceAreaId ?? office.practiceAreas[0]?.id ?? "" } : undefined;
    update(s => ({ ...s, tasks: [task, ...s.tasks], ...(appointment ? { appointments: [appointment, ...s.appointments] } : {}), timeline: task.matterId ? [timelineEvent({ officeId: office.id, matterId: task.matterId, actor: view.me?.name ?? "Equipe", kind: "tarefa", text: `Criou tarefa: ${task.title}` }), ...s.timeline] : s.timeline }));
    setForm(blank); navigate({ search: {}, replace: true }); toast.success("Tarefa criada na demonstração");
  };
  return <>
    <PageHeader title="Tarefas" subtitle="Delegações e entregas internas. A data-alvo de tarefa não substitui um prazo judicial." actions={<Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Nova tarefa</Button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">{[
      ["Em aberto", view.tasks.filter(t=>t.status!=="concluida").length],
      ["Atrasadas", view.tasks.filter(isOverdue).length],
      ["Em revisão", view.tasks.filter(t=>t.status==="aguardando_revisao").length]
    ].map(([label,value])=><div key={label} className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl tabular">{value}</p></div>)}</div>
    <div className="mb-4 flex flex-wrap items-center gap-2"><div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar tarefas" placeholder="Buscar tarefa, caso ou responsável" className="pl-9" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      <select aria-label="Filtrar por status" className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={e=>setStatus(e.target.value as typeof status)}>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
      <select aria-label="Filtrar por prioridade" className="h-9 rounded-md border bg-background px-3 text-sm" value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}><option value="todas">Todas as prioridades</option>{priorities.map(p=><option key={p} value={p}>{p === "critica" ? "Crítica" : p === "alta" ? "Alta" : p === "normal" ? "Normal" : "Baixa"}</option>)}</select>
    </div>
    <div className="mb-4"><SavedFilterViews officeId={office.id} role={view.role} collection="tarefas" currentValues={{ query, status, priority }} onApply={(filters) => { setQuery(filters.query); setStatus(filters.status as typeof status); setPriority(filters.priority as typeof priority); }} /></div>
    {list.length ? <ul className="divide-y rounded-xl border bg-card shadow-soft">{list.map(t=>{const matter=view.matterById(t.matterId);return <li key={t.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{t.title}</p><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(t.dueAt)} · {view.memberName(t.assigneeId)}{matter && <> · <Link className="text-primary hover:underline" to="/o/$org/casos/$id" params={{org,id:matter.id}}>{matter.code}</Link></>}</p></div><PriorityBadge value={t.priority}/><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOverdue(t)?"bg-destructive-soft text-destructive":"bg-muted text-muted-foreground"}`}>{isOverdue(t)?"Atrasada":TASK_STATUS_LABEL[t.status]}</span><Button variant="outline" size="sm" disabled={!canManageTask(view.role,t,view.me?.id)} onClick={()=>{setSelected(t);setReason("")}}>Etapa rápida</Button><Button variant="outline" size="sm" asChild><Link to="/o/$org/tarefas/$id" params={{org,id:t.id}}>Abrir ficha</Link></Button></li>})}</ul> : <EmptyState title="Nenhuma tarefa neste filtro" hint="Ajuste a busca ou crie uma tarefa demonstrativa."/>}
    <Dialog open={!!selected} onOpenChange={open=>{if(!open){setSelected(null);setReason("")}}}><DialogContent><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Responsável: {view.memberName(selected?.assigneeId)} · Data-alvo interna: {selected && fmtDateTime(selected.dueAt)}</DialogDescription></DialogHeader>{selected && <><div className="flex flex-wrap gap-2"><PriorityBadge value={selected.priority}/><span className="text-sm">{TASK_STATUS_LABEL[selected.status]}</span></div><div><Label htmlFor="task-reason">Justificativa da etapa</Label><Input id="task-reason" className="mt-2" placeholder="Motivo da mudança de etapa" value={reason} onChange={e=>setReason(e.target.value)}/></div><DialogFooter className="flex-wrap gap-2">{TASK_TRANSITIONS[selected.status].filter(next=>next!=="concluida"||canApproveTask(view.role)).map(next=><Button key={next} variant={next === "concluida" ? "default" : "outline"} disabled={!reason.trim()} onClick={()=>change(selected,next)}>{next === "em_andamento" ? "Retomar / iniciar" : next === "aguardando_cliente" ? "Aguardar cliente" : next === "aguardando_revisao" ? "Enviar para revisão" : "Concluir após revisão"}</Button>)}{selected.status==="aguardando_revisao"&&!canApproveTask(view.role)&&<p className="w-full text-xs text-muted-foreground">A conclusão após revisão exige advogado, sócio ou coordenador.</p>}</DialogFooter></>}</DialogContent></Dialog>
    <Dialog open={!!novo} onOpenChange={open=>!open&&navigate({search:{},replace:true})}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova tarefa</DialogTitle><DialogDescription>Os dados são mantidos somente nesta sessão de demonstração.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4"><div><Label htmlFor="task-title">Título</Label><Input id="task-title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="task-requester">Solicitante</Label><select id="task-requester" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.requesterId} onChange={e=>setForm({...form,requesterId:e.target.value})} disabled={!canDelegate}><option value="">Pessoa atual</option>{canDelegate&&view.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><Label htmlFor="task-assignee">Responsável</Label><select id="task-assignee" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.assigneeId} onChange={e=>setForm({...form,assigneeId:e.target.value})} required><option value="">Selecione</option>{view.members.filter(m=>canDelegate||m.id===view.me?.id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div></div><div><Label htmlFor="task-instructions">Instruções da delegação</Label><textarea id="task-instructions" className="mt-2 min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Descreva o resultado esperado"/></div><div><Label htmlFor="task-case">Caso (opcional)</Label><select id="task-case" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.matterId} onChange={e=>setForm({...form,matterId:e.target.value,proceedingId:""})}><option value="">Sem vínculo</option>{view.matters.map(m=><option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}</select></div>{form.matterId&&<div><Label htmlFor="task-proceeding">Processo vinculado (opcional)</Label><select id="task-proceeding" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.proceedingId} onChange={e=>setForm({...form,proceedingId:e.target.value})}><option value="">Sem processo específico</option>{view.proceedings.filter(item=>item.matterId===form.matterId).map(item=><option key={item.id} value={item.id}>{item.cnjMasked??"Processo sem número"}</option>)}</select></div>}<div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="task-priority">Prioridade</Label><select id="task-priority" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as TaskPriority})}>{priorities.map(p=><option key={p} value={p}>{p}</option>)}</select></div><div><Label htmlFor="task-due">Data-alvo interna</Label><Input id="task-due" className="mt-2" type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})} required/></div></div><div><Label htmlFor="task-calendar">Adicionar evento à agenda (opcional)</Label><Input id="task-calendar" className="mt-2" type="datetime-local" value={form.appointmentAt} onChange={e=>setForm({...form,appointmentAt:e.target.value})}/><p className="mt-1 text-xs text-muted-foreground">Cria um lembrete interno local, sem enviar convite.</p></div><DialogFooter><Button type="submit">Criar tarefa</Button></DialogFooter></form></DialogContent></Dialog>
  </>;
}
