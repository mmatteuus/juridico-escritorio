import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlineStatusChip, EmptyState, PageHeader } from "@/components/office/badges";
import { findOffice, fmtTime, useOfficeView } from "@/features/demo/store";
import type { DeadlineStatus } from "@/features/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/o/$org/agenda")({
  head: () => ({ meta: [{ title: "Agenda · JURIDO Escritórios" }, { name: "description", content: "Agenda de tarefas, prazos e compromissos." }, { name: "robots", content: "noindex" }] }),
  component: Agenda,
});

type Mode = "dia" | "semana" | "mes";
type Item = { id: string; at: string; title: string; kind: "Tarefa" | "Prazo" | "Compromisso"; matterId?: string; who?: string; status?: DeadlineStatus };

const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function Agenda() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const [mode, setMode] = useState<Mode>("semana");
  const [anchor, setAnchor] = useState(() => startOf(new Date()));
  const [who, setWho] = useState("todos");
  const [area, setArea] = useState("todas");

  const from = new Date(anchor);
  if (mode === "semana") from.setDate(from.getDate() - from.getDay());
  if (mode === "mes") from.setDate(1);
  const to = new Date(from);
  if (mode === "dia") to.setDate(to.getDate() + 1);
  if (mode === "semana") to.setDate(to.getDate() + 7);
  if (mode === "mes") to.setMonth(to.getMonth() + 1);

  const items: Item[] = [
    ...v.tasks.filter((t) => t.status !== "concluida").map((t): Item => ({ id: t.id, at: t.dueAt, title: t.title, kind: "Tarefa", matterId: t.matterId, who: t.assigneeId })),
    ...v.deadlines.filter((d) => d.status !== "cancelado").map((d): Item => ({ id: d.id, at: d.dueDate, title: d.title, kind: "Prazo", matterId: d.matterId, who: d.assigneeId, status: d.status })),
    ...v.appointments.map((a): Item => ({ id: a.id, at: a.at, title: a.title, kind: "Compromisso", matterId: a.matterId })),
  ].filter((i) => {
    const t = new Date(i.at);
    if (t < from || t >= to) return false;
    if (who !== "todos" && i.who !== who) return false;
    if (area !== "todas" && v.matterById(i.matterId)?.practiceAreaId !== area) return false;
    return true;
  }).sort((a, b) => a.at.localeCompare(b.at));

  const days: Date[] = [];
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const shift = (n: number) => { const x = new Date(anchor); if (mode === "dia") x.setDate(x.getDate() + n); if (mode === "semana") x.setDate(x.getDate() + 7 * n); if (mode === "mes") x.setMonth(x.getMonth() + n); setAnchor(x); };
  const today = startOf(new Date()).getTime();
  const label = mode === "mes" ? from.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : mode === "dia" ? from.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : `${from.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${new Date(to.getTime() - 1).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return (
    <>
      <PageHeader title="Agenda" subtitle="Tarefas, prazos e compromissos do escritório." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["dia", "semana", "mes"] as Mode[]).map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "mes" ? "Mês" : m[0]!.toUpperCase() + m.slice(1)}</Button>)}
        <span className="mx-1 flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Anterior" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(startOf(new Date()))}>Hoje</Button>
          <Button size="icon" variant="ghost" aria-label="Próximo" onClick={() => shift(1)}><ChevronRight /></Button>
        </span>
        <span className="font-display text-lg capitalize">{label}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          <Select value={who} onValueChange={setWho}><SelectTrigger className="w-44 bg-card" aria-label="Pessoa"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Toda a equipe</SelectItem>{v.members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={area} onValueChange={setArea}><SelectTrigger className="w-40 bg-card" aria-label="Área"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas as áreas</SelectItem>{office.practiceAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
        </span>
      </div>
      {items.length === 0 && <EmptyState title="Nada agendado neste período" />}
      <div className={cn("grid gap-2", mode === "mes" ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "")}>
        {days.map((d) => {
          const dayItems = items.filter((i) => startOf(new Date(i.at)).getTime() === d.getTime());
          if (mode !== "mes" && dayItems.length === 0) return null;
          return (
            <section key={d.toISOString()} className={cn("rounded-xl border bg-card p-3", d.getTime() === today && "border-primary ring-1 ring-primary")}>
              <h2 className="mb-2 text-sm font-semibold capitalize">{d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: mode === "mes" ? undefined : "short" })}{d.getTime() === today && <span className="ml-2 text-xs text-primary">hoje</span>}</h2>
              <ul className="space-y-1.5">
                {dayItems.map((i) => {
                  const body = (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="tabular text-xs font-semibold">{fmtTime(i.at)}</span>
                      <span className="text-xs text-muted-foreground">{i.kind}</span>
                      <span className="text-sm">{i.title}</span>
                      {i.status && mode !== "mes" && <DeadlineStatusChip status={i.status} />}
                    </span>
                  );
                  return (
                    <li key={i.id}>
                      {i.matterId ? <Link to="/o/$org/casos/$id" params={{ org, id: i.matterId }} search={i.kind === "Prazo" ? { tab: "prazos" } : i.kind === "Tarefa" ? { tab: "tarefas" } : {}} className="block rounded-md p-1.5 hover:bg-muted">{body}</Link> : <div className="p-1.5">{body}</div>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
