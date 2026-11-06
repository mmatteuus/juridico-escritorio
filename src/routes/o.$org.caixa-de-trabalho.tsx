import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeadlineStatusChip, DueBadge, EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
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
      {tasks.length + dls.length + pendingMessages.length + pendingDocuments.length + pendingIntakes.length === 0 ? <EmptyState title="Fila vazia" hint="Nada pendente nesta visão." /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {pendingIntakes.map((intake) => (
            <li key={intake.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Atendimento aguardando triagem: {intake.name}</p><p className="mt-1 break-words text-xs text-muted-foreground">{intake.stage.replaceAll("_", " ")} · responsável {v.memberName(intake.assigneeId)} · revisão humana pendente</p></div>
              <Button size="sm" variant="outline" asChild><Link to="/o/$org/atendimentos" params={{ org }} search={{ intakeId: intake.id }}>Revisar atendimento</Link></Button>
            </li>
          ))}
          {dls.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1"><p className="text-sm font-medium">Prazo: {d.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(d.dueDate)} · proposto por {d.proposedBy}</p></div>
              <DueBadge iso={d.dueDate} />
              <DeadlineStatusChip status={d.status} />
              <Button size="sm" variant="outline" asChild><Link to="/o/$org/prazos/$id" params={{ org, id: d.id }}>Revisar</Link></Button>
            </li>
          ))}
          {pendingMessages.map((message) => (
            <li key={message.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Comunicação aguardando revisão: {message.recipient}</p><p className="mt-1 break-words text-xs text-muted-foreground">Rascunho não enviado · {message.content}</p></div>
              <Button size="sm" variant="outline" asChild><Link to="/o/$org/comunicacao/$id" params={{ org, id: message.id }}>Revisar rascunho</Link></Button>
            </li>
          ))}
          {pendingDocuments.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">Documento aguardando revisão: {doc.title}</p><p className="mt-1 break-words text-xs text-muted-foreground">{doc.category} · {v.matterById(doc.matterId)?.code ?? "Caso indisponível"} · revisão profissional pendente · demonstração</p></div>
              <Button size="sm" variant="outline" asChild><Link to="/o/$org/documentos" params={{ org }} search={{ docId: doc.id }}>Abrir revisão</Link></Button>
            </li>
          ))}
          {tasks.map((t) => {
            const m = v.matterById(t.matterId);
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.memberName(t.assigneeId)} · {TASK_STATUS_LABEL[t.status]} · {isOverdue(t) ? <strong className="text-destructive">atrasada</strong> : fmtDateTime(t.dueAt)}
                    {m && <> · <Link to="/o/$org/casos/$id" params={{ org, id: m.id }} className="text-primary hover:underline">{m.code}</Link></>}
                  </p>
                </div>
                <PriorityBadge value={t.priority} />
                <Button size="sm" variant="outline" disabled={!canManageTask(v.role, t, v.me?.id)} onClick={() => { setSelectedTask(t); setReason(""); }}>Etapa rápida</Button>
              </li>
            );
          })}
        </ul>
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
