import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeadlineStatusChip, EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { findOffice, fmtDateTime, isOverdue, useDemo, useOfficeView } from "@/features/demo/store";

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
  const dls = q === "revisao" ? v.deadlines.filter((d) => (d.status === "proposto" || d.status === "em_revisao") && inArea(d.matterId)) : [];

  return (
    <>
      <PageHeader title="Caixa de trabalho" subtitle="Tudo o que precisa de ação, ordenado por prioridade e data." />
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {(Object.keys(queues) as Q[]).map((k) => (
          <Button key={k} role="tab" aria-selected={q === k} size="sm" variant={q === k ? "default" : "outline"} onClick={() => setQ(k)}>
            {queues[k].label} <span className="tabular opacity-70">{queues[k].tasks.length + (k === "revisao" ? v.deadlines.filter((d) => d.status === "proposto" || d.status === "em_revisao").length : 0)}</span>
          </Button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[{ id: "todas", name: "Todas as áreas" }, ...office.practiceAreas].map((a) => (
          <Button key={a.id} size="sm" variant={area === a.id ? "secondary" : "ghost"} aria-pressed={area === a.id} onClick={() => setArea(a.id)}>{a.name}</Button>
        ))}
      </div>
      {tasks.length + dls.length === 0 ? <EmptyState title="Fila vazia" hint="Nada pendente nesta visão." /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {dls.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1"><p className="text-sm font-medium">Prazo: {d.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(d.dueDate)} · proposto por {d.proposedBy}</p></div>
              <DeadlineStatusChip status={d.status} />
              <Button size="sm" variant="outline" asChild><Link to="/o/$org/casos/$id" params={{ org, id: d.matterId }} search={{ tab: "prazos" }}>Revisar</Link></Button>
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
                <Button size="sm" variant="outline" onClick={() => { update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, status: "concluida" } : x)) })); toast.success("Tarefa concluída"); }}>Concluir</Button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
