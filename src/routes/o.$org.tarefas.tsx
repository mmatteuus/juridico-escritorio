import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Columns3, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { findOffice, fmtDateTime, isOverdue, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Task, TaskPriority, TaskStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/tarefas")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Tarefas · JURIDO Escritórios" }, { name: "description", content: "Tarefas pessoais e da equipe." }, { name: "robots", content: "noindex" }] }),
  component: Tarefas,
});

const COLS: TaskStatus[] = ["a_fazer", "em_andamento", "aguardando_cliente", "aguardando_revisao", "concluida"];

function Tarefas() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [scope, setScope] = useState<"minhas" | "equipe">("minhas");
  const [mode, setMode] = useState<"lista" | "kanban">("lista");
  const [form, setForm] = useState({ title: "", matterId: "none", assigneeId: v.me?.id ?? "", priority: "normal" as TaskPriority, date: "" });
  const actor = v.me?.name ?? "—";
  const list = v.tasks.filter((t) => scope === "equipe" || t.assigneeId === v.me?.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const patch = (t: Task, next: Partial<Task>, msg: string) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, ...next } : x)),
      timeline: t.matterId ? [timelineEvent({ officeId: office.id, matterId: t.matterId, actor, kind: "tarefa", text: `${msg}: ${t.title}` }), ...d.timeline] : d.timeline,
    }));
    toast.success(msg);
  };
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Informe o título."); return; }
    const t: Task = { id: uid("t"), officeId: office.id, title: form.title.trim(), priority: form.priority, status: "a_fazer", assigneeId: form.assigneeId || (v.me?.id ?? ""), dueAt: form.date ? new Date(`${form.date}T17:00`).toISOString() : new Date(Date.now() + 864e5).toISOString() };
    if (form.matterId !== "none") t.matterId = form.matterId;
    update((d) => ({ ...d, tasks: [...d.tasks, t] }));
    setForm({ ...form, title: "", date: "" });
    navigate({ search: {}, replace: true });
    toast.success("Tarefa criada");
  };

  const Row = ({ t }: { t: Task }) => {
    const m = v.matterById(t.matterId);
    return (
      <div className="flex flex-wrap items-start gap-3">
        <Checkbox className="mt-1" aria-label={`Concluir ${t.title}`} checked={t.status === "concluida"} onCheckedChange={(c) => patch(t, { status: c ? "concluida" : "a_fazer" }, c ? "Concluiu tarefa" : "Reabriu tarefa")} />
        <div className="min-w-0 flex-1">
          <p className={t.status === "concluida" ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>{t.title}</p>
          <p className="text-xs text-muted-foreground">
            {isOverdue(t) ? <strong className="text-destructive">Atrasada · </strong> : null}{fmtDateTime(t.dueAt)}
            {m && <> · <Link to="/o/$org/casos/$id" params={{ org, id: m.id }} className="text-primary hover:underline">{m.code}</Link></>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge value={t.priority} />
            <Select value={t.assigneeId} onValueChange={(a) => patch(t, { assigneeId: a }, `Delegou para ${v.memberName(a)}`)}>
              <SelectTrigger className="h-7 w-40 text-xs" aria-label="Responsável"><SelectValue /></SelectTrigger>
              <SelectContent>{v.members.map((mm) => <SelectItem key={mm.id} value={mm.id}>{mm.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={t.status} onValueChange={(s) => patch(t, { status: s as TaskStatus }, `Status: ${TASK_STATUS_LABEL[s as TaskStatus]}`)}>
              <SelectTrigger className="h-7 w-44 text-xs" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>{COLS.map((c) => <SelectItem key={c} value={c}>{TASK_STATUS_LABEL[c]}</SelectItem>)}</SelectContent>
            </Select>
            {t.status !== "concluida" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => patch(t, { dueAt: new Date(new Date(t.dueAt).getTime() < Date.now() ? Date.now() + 864e5 : new Date(t.dueAt).getTime() + 864e5).toISOString() }, "Reagendou +1 dia")}><CalendarClock /> +1 dia</Button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Tarefas" subtitle="Organize, delegue e reagende — tudo com histórico no caso."
        actions={<Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Nova tarefa</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={scope === "minhas" ? "default" : "outline"} aria-pressed={scope === "minhas"} onClick={() => setScope("minhas")}>Minhas</Button>
        <Button size="sm" variant={scope === "equipe" ? "default" : "outline"} aria-pressed={scope === "equipe"} onClick={() => setScope("equipe")}>Equipe</Button>
        <span className="ml-auto flex gap-1">
          <Button size="sm" variant={mode === "lista" ? "secondary" : "ghost"} aria-pressed={mode === "lista"} onClick={() => setMode("lista")}><List /> Lista</Button>
          <Button size="sm" variant={mode === "kanban" ? "secondary" : "ghost"} aria-pressed={mode === "kanban"} onClick={() => setMode("kanban")}><Columns3 /> Quadro</Button>
        </span>
      </div>
      {list.length === 0 ? <EmptyState title="Nenhuma tarefa" hint={scope === "minhas" ? "Veja as tarefas da equipe ou crie uma nova." : undefined} /> : mode === "lista" ? (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">{list.map((t) => <li key={t.id} className="p-4"><Row t={t} /></li>)}</ul>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLS.map((c) => {
            const items = list.filter((t) => t.status === c);
            return (
              <section key={c} className="w-72 shrink-0 rounded-xl border bg-muted/60 p-3" aria-label={TASK_STATUS_LABEL[c]}>
                <h2 className="mb-2 flex justify-between text-sm font-semibold">{TASK_STATUS_LABEL[c]}<span className="text-muted-foreground">{items.length}</span></h2>
                <ul className="space-y-2">{items.map((t) => <li key={t.id} className="rounded-lg border bg-card p-3 shadow-soft"><Row t={t} /></li>)}</ul>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!novo} onOpenChange={(o) => !o && navigate({ search: {}, replace: true })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-xl font-medium">Nova tarefa</DialogTitle><DialogDescription>Vincular a um caso é opcional.</DialogDescription></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t-t">Título</Label><Input id="t-t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Caso</Label>
                <Select value={form.matterId} onValueChange={(x) => setForm({ ...form, matterId: x })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sem caso</SelectItem>{v.matters.map((m) => <SelectItem key={m.id} value={m.id}>{m.code}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Responsável</Label>
                <Select value={form.assigneeId} onValueChange={(x) => setForm({ ...form, assigneeId: x })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{v.members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(x) => setForm({ ...form, priority: x as TaskPriority })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="critica">Crítica</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="t-d">Data</Label><Input id="t-d" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="submit">Criar tarefa</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
