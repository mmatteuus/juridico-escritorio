import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeadlineStatusChip, DueBadge, EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { canTransitionTask, TASK_TRANSITIONS } from "@/features/demo/actions";
import { findOffice, fmtDateTime, isOverdue, timelineEvent, useDemo, useOfficeView } from "@/features/demo/store";
import { canApproveTask, canManageTask, canSeeCnj, canSeeLegalDocs } from "@/features/demo/permissions";
import type { Task, TaskStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/caixa-de-trabalho")({
  head: () => ({ meta: [{ title: "Caixa de trabalho · JURIDO Escritórios" }, { name: "description", content: "Fila unificada de trabalho." }, { name: "robots", content: "noindex" }] }),
  component: Caixa,
});

type Q = "minhas" | "revisao" | "atrasadas" | "delegadas" | "area";
const PRI = { critica: 0, alta: 1, normal: 2, baixa: 3 } as const;

function Caixa() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [q, setQ] = useState<Q>("minhas");
  const [area, setArea] = useState("todas");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reason, setReason] = useState("");
  const me = v.me?.id;
  const open = v.tasks.filter((t) => t.status !== "concluida");
  const inArea = (matterId?: string) => area === "todas" || v.matterById(matterId)?.practiceAreaId === area;
  const queues: Record<Q, { label: string; tasks: typeof open }> = {
    minhas: { label: "Atribuídas a mim", tasks: open.filter((t) => t.assigneeId === me) },
    revisao: { label: "Aguardando revisão", tasks: open.filter((t) => t.status === "aguardando_revisao") },
    atrasadas: { label: "Atrasadas", tasks: open.filter(isOverdue) },
    delegadas: { label: "Aguardando cliente", tasks: open.filter((t) => t.status === "aguardando_cliente") },
    area: { label: "Toda a equipe", tasks: open },
  };
  const tasks = queues[q].tasks.filter((t) => inArea(t.matterId)).sort((a, b) => PRI[a.priority] - PRI[b.priority] || a.dueAt.localeCompare(b.dueAt));
  const dls = q === "revisao" && canSeeCnj(v.role) ? v.deadlines.filter((d) => (d.status === "proposto" || d.status === "em_revisao") && inArea(d.matterId)) : [];
  const pendingMessages = q === "revisao" && canSeeLegalDocs(v.role)
    ? v.messages.filter((message) => message.status === "aguardando_revisao" && inArea(message.matterId))
    : [];
  const pendingIntakes = q === "revisao" && v.role !== "financeiro"
    ? v.intakes.filter((intake) => !["convertido", "arquivado"].includes(intake.stage) && (area === "todas" || area === intake.practiceAreaId))
    : [];
  const pendingDocuments = q === "revisao" && canSeeLegalDocs(v.role)
    ? v.docs.filter((doc) => doc.status === "revisao_pendente" && inArea(doc.matterId))
    : [];
  const workItems = [
    ...pendingIntakes.map((data) => ({ kind: "intake" as const, data })),
    ...dls.map((data) => ({ kind: "deadline" as const, data })),
    ...pendingMessages.map((data) => ({ kind: "message" as const, data })),
    ...pendingDocuments.map((data) => ({ kind: "document" as const, data })),
    ...tasks.map((data) => ({ kind: "task" as const, data })),
  ];
  const pagination = useOfficePagination(workItems, `${q}|${area}`);

  const changeTaskStatus = (task: Task, next: TaskStatus) => {
    const current = v.tasks.find((item) => item.id === task.id && item.officeId === office.id);
    if (!current || !canManageTask(v.role, current, v.me?.id) || !reason.trim() || !canTransitionTask(current.status, next) || (next === "concluida" && !canApproveTask(v.role))) {
      toast.error("A etapa não está disponível ou falta a justificativa.");
      return;
    }
    update((data) => ({
      ...data,
      tasks: data.tasks.map((item) => item.id === current.id && item.officeId === office.id ? { ...item, status: next, history: [...(item.history ?? []), { at: new Date().toISOString(), actor: v.me?.name ?? "Equipe", action: `${TASK_STATUS_LABEL[next]} · ${reason.trim()}` }] } : item),
      timeline: current.matterId ? [timelineEvent({
        officeId: office.id,
        matterId: current.matterId,
        actor: v.me?.name ?? "Equipe",
        kind: "tarefa",
        text: `${current.title}: ${TASK_STATUS_LABEL[next]}. ${reason.trim()}`,
      }), ...data.timeline] : data.timeline,
    }));
    setSelectedTask({ ...current, status: next });
    setReason("");
    toast.success("Tarefa atualizada na demonstração");
  };

  return (
    <>
      <PageHeader title="Caixa de trabalho" subtitle="Tudo o que precisa de ação, ordenado por prioridade e data." />
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar caixa de trabalho">
        {(Object.keys(queues) as Q[]).map((k) => (
          <Button key={k} aria-pressed={q === k} size="sm" variant={q === k ? "default" : "outline"} onClick={() => setQ(k)}>
            {queues[k].label} <span className="tabular opacity-70">{queues[k].tasks.length + (k === "revisao" ? (canSeeCnj(v.role) ? v.deadlines.filter((d) => (d.status === "proposto" || d.status === "em_revisao") && inArea(d.matterId)).length : 0) + pendingMessages.length + pendingDocuments.length + pendingIntakes.length : 0)}</span>
          </Button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[{ id: "todas", name: "Todas as áreas" }, ...office.practiceAreas].map((a) => (
          <Button key={a.id} size="sm" variant={area === a.id ? "secondary" : "ghost"} aria-pressed={area === a.id} onClick={() => setArea(a.id)}>{a.name}</Button>
        ))}
      </div>
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="caixa-de-trabalho" currentValues={{ q, area }} onApply={(filters) => { const queue = filters.q as Q; const queueIds = Object.keys(queues) as Q[]; const areaIds = ["todas", ...office.practiceAreas.map((item) => item.id)]; setQ(queueIds.includes(queue) ? queue : "minhas"); setArea(areaIds.includes(filters.area) ? filters.area : "todas"); }} /></div>
      {workItems.length === 0 ? <EmptyState title="Fila vazia" hint="Nada pendente nesta visão." /> : (
        <>
          <ul className="divide-y rounded-xl border bg-card shadow-soft">
            {pagination.items.map((item) => {
              if (item.kind === "intake") {
                const intake = item.data;
                return <li key={`intake-${intake.id}`} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Atendimento aguardando triagem: {intake.name}</p><p className="mt-1 break-words text-xs text-muted-foreground">{intake.stage.replaceAll("_", " ")} · responsável {v.memberName(intake.assigneeId)} · revisão humana pendente</p></div>
                  <Button size="sm" variant="outline" asChild><Link to="/o/$org/atendimentos" params={{ org }} search={{ intakeId: intake.id }}>Revisar atendimento</Link></Button>
                </li>;
              }
              if (item.kind === "deadline") {
                const deadline = item.data;
                return <li key={`deadline-${deadline.id}`} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex-1"><p className="text-sm font-medium">Prazo: {deadline.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(deadline.dueDate)} · proposto por {deadline.proposedBy}</p></div>
                  <DueBadge iso={deadline.dueDate} /><DeadlineStatusChip status={deadline.status} />
                  <Button size="sm" variant="outline" asChild><Link to="/o/$org/prazos/$id" params={{ org, id: deadline.id }}>Revisar</Link></Button>
                </li>;
              }
              if (item.kind === "message") {
                const message = item.data;
                return <li key={`message-${message.id}`} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Comunicação aguardando revisão: {message.recipient}</p><p className="mt-1 break-words text-xs text-muted-foreground">Rascunho não enviado · {message.content}</p></div>
                  <Button size="sm" variant="outline" asChild><Link to="/o/$org/comunicacao/$id" params={{ org, id: message.id }}>Revisar rascunho</Link></Button>
                </li>;
              }
              if (item.kind === "document") {
                const doc = item.data;
                return <li key={`document-${doc.id}`} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Documento aguardando revisão: {doc.title}</p><p className="mt-1 break-words text-xs text-muted-foreground">{doc.category} · {v.matterById(doc.matterId)?.code ?? "Caso indisponível"} · revisão profissional pendente · demonstração</p></div>
                  <Button size="sm" variant="outline" asChild><Link to="/o/$org/documentos" params={{ org }} search={{ docId: doc.id }}>Abrir revisão</Link></Button>
                </li>;
              }
              const task = item.data;
              const matter = v.matterById(task.matterId);
              return <li key={`task-${task.id}`} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{v.memberName(task.assigneeId)} · {TASK_STATUS_LABEL[task.status]} · {isOverdue(task) ? <strong className="text-destructive">atrasada</strong> : fmtDateTime(task.dueAt)}{matter && <> · <Link to="/o/$org/casos/$id" params={{ org, id: matter.id }} className="text-primary hover:underline">{matter.code}</Link></>}</p>
                </div>
                <PriorityBadge value={task.priority} />
                <Button size="sm" variant="outline" disabled={!canManageTask(v.role, task, v.me?.id)} onClick={() => { setSelectedTask(task); setReason(""); }}>Etapa rápida</Button>
              </li>;
            })}
          </ul>
          <OfficePaginationControls pagination={pagination} />
        </>
      )}
      <Dialog open={!!selectedTask} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedTask(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Responsável: {v.memberName(selectedTask?.assigneeId)} · Data-alvo interna: {selectedTask && fmtDateTime(selectedTask.dueAt)}</DialogDescription>
          </DialogHeader>
          {selectedTask && <>
            <div className="flex flex-wrap gap-2"><PriorityBadge value={selectedTask.priority}/><span className="text-sm">{TASK_STATUS_LABEL[selectedTask.status]}</span></div>
            <div>
              <Label htmlFor="work-queue-task-reason">Justificativa da etapa</Label>
              <Input id="work-queue-task-reason" className="mt-2" placeholder="Motivo da mudança de etapa" value={reason} onChange={(event) => setReason(event.target.value)} required />
            </div>
            <DialogFooter className="flex-wrap gap-2">
              {TASK_TRANSITIONS[selectedTask.status].filter(next => next !== "concluida" || canApproveTask(v.role)).map((next) => <Button key={next} variant={next === "concluida" ? "default" : "outline"} disabled={!reason.trim() || !canTransitionTask(selectedTask.status, next)} onClick={() => changeTaskStatus(selectedTask, next)}>
                {next === "em_andamento" ? "Retomar / iniciar" : next === "aguardando_cliente" ? "Aguardar cliente" : next === "aguardando_revisao" ? "Enviar para revisão" : "Concluir após revisão"}
              </Button>)}
              {selectedTask.status === "aguardando_revisao" && !canApproveTask(v.role) && <p className="w-full text-xs text-muted-foreground">A conclusão após revisão exige advogado, sócio ou coordenador nesta demonstração.</p>}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}
