import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BriefcaseBusiness, CalendarDays, ShieldAlert, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineStatusChip, DueBadge, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { findOffice, fmtDateTime, fmtTime, isOverdue, isToday, useDemo, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/inicio")({
  head: () => ({ meta: [{ title: "Início · JURIDO Escritórios" }, { name: "description", content: "Meu Dia e visão geral do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Inicio,
});

function Inicio() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { setMeuDiaOpen } = useDemo();
  const open = v.tasks.filter((t) => t.status !== "concluida");
  const stats = [
    { label: "Casos visíveis", value: v.matters.length, Icon: BriefcaseBusiness, to: "/o/$org/casos" as const, alert: false },
    { label: "Tarefas atrasadas", value: open.filter(isOverdue).length, Icon: AlertTriangle, to: "/o/$org/tarefas" as const, alert: true },
    { label: "Prazos a revisar", value: v.deadlines.filter((d) => d.status === "proposto" || d.status === "em_revisao").length, Icon: ShieldAlert, to: "/o/$org/prazos" as const, alert: true },
    { label: "Compromissos hoje", value: v.appointments.filter((a) => isToday(a.at)).length, Icon: CalendarDays, to: "/o/$org/agenda" as const, alert: false },
  ];
  const openDls = v.deadlines.filter((d) => !["concluido", "cancelado"].includes(d.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const today = v.appointments.filter((a) => isToday(a.at)).sort((a, b) => a.at.localeCompare(b.at));
  const h = new Date().getHours();
  const hello = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const first = v.me?.name.split(" ")[0];
  const caseLink = (id?: string) => id && v.matterById(id);

  return (
    <>
      <PageHeader title={first ? `${hello}, ${first}` : "Início"} subtitle={`${office.displayName} · ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`} actions={<Button variant="outline" onClick={() => setMeuDiaOpen(true)}><Sun /> Abrir Meu Dia</Button>} />
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon, to, alert }) => (
          <Link key={label} to={to} params={{ org }} className="group min-w-0 rounded-xl border bg-card p-4 shadow-soft transition-colors hover:border-primary/40">
            <Icon className={alert && value > 0 ? "size-4 text-destructive" : "size-4 text-copper"} />
            <p className={`mt-3 font-display text-3xl tabular ${alert && value > 0 ? "text-destructive" : ""}`}>{value}</p>
            <p className="text-sm text-muted-foreground group-hover:text-foreground">{label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 rounded-xl border bg-card p-5 shadow-soft">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-xl">Tarefas próximas</h2><Link to="/o/$org/tarefas" params={{ org }} className="shrink-0 text-sm text-primary hover:underline">Ver todas</Link></div>
          {open.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa em aberto.</p>}
          <ul className="divide-y">
            {[...open].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 8).map((t) => {
              const m = caseLink(t.matterId);
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.memberName(t.assigneeId)} · {TASK_STATUS_LABEL[t.status]} · {isOverdue(t) ? <strong className="text-destructive">atrasada</strong> : fmtDateTime(t.dueAt)}
                      {m && <> · <Link className="text-primary underline-offset-2 hover:underline" to="/o/$org/casos/$id" params={{ org, id: m.id }}>{m.code}</Link></>}
                    </p>
                  </div>
                  <PriorityBadge value={t.priority} />
                </li>
              );
            })}
          </ul>
        </section>
        <div className="min-w-0 space-y-6">
          <section className="min-w-0 rounded-xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-xl">Prazos em aberto</h2><Link to="/o/$org/prazos" params={{ org }} className="shrink-0 text-sm text-primary hover:underline">Ver todos</Link></div>
            {openDls.length === 0 && <p className="text-sm text-muted-foreground">Nenhum prazo em aberto.</p>}
            <ul className="space-y-1">
              {openDls.slice(0, 5).map((d) => (
                <li key={d.id}><Link to="/o/$org/casos/$id" params={{ org, id: d.matterId }} search={{ tab: "prazos" }} className="block rounded-lg p-2 hover:bg-muted">
                  <p className="break-words text-sm font-medium">{d.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><DueBadge iso={d.dueDate} /><DeadlineStatusChip status={d.status} /> <span className="tabular">{fmtDateTime(d.dueDate)}</span></div>
                </Link></li>
              ))}
            </ul>
          </section>
          <section className="min-w-0 rounded-xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-xl">Agenda de hoje</h2><Link to="/o/$org/agenda" params={{ org }} className="shrink-0 text-sm text-primary hover:underline">Abrir agenda</Link></div>
            {today.length === 0 && <p className="text-sm text-muted-foreground">Nenhum compromisso hoje.</p>}
            <ul className="space-y-2 text-sm">
              {today.map((a) => <li key={a.id}><span className="tabular font-semibold">{fmtTime(a.at)}</span> · {a.title}</li>)}
            </ul>
          </section>
          <section className="min-w-0 rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-xl">Atividade recente</h2>
            <ul className="space-y-2 text-sm">
              {[...v.timeline].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5).map((e) => <li key={e.id}><span className="font-medium">{e.actor}</span> — {e.text}<span className="block text-xs text-muted-foreground">{fmtDateTime(e.at)}</span></li>)}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
