import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BriefcaseBusiness, CalendarDays, ShieldAlert, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineStatusChip, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
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
    { label: "Casos visíveis", value: v.matters.length, Icon: BriefcaseBusiness },
    { label: "Tarefas atrasadas", value: open.filter(isOverdue).length, Icon: AlertTriangle },
    { label: "Prazos a revisar", value: v.deadlines.filter((d) => d.status === "proposto" || d.status === "em_revisao").length, Icon: ShieldAlert },
    { label: "Compromissos hoje", value: v.appointments.filter((a) => isToday(a.at)).length, Icon: CalendarDays },
  ];
  const caseLink = (id?: string) => id && v.matterById(id);

  return (
    <>
      <PageHeader title="Início" subtitle={`${office.displayName} · visão do seu perfil`} actions={<Button variant="outline" onClick={() => setMeuDiaOpen(true)}><Sun /> Abrir Meu Dia</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-soft">
            <Icon className="size-4 text-copper" />
            <p className="mt-3 font-display text-3xl tabular">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="mb-3 font-display text-xl">Tarefas próximas</h2>
          <ul className="divide-y">
            {open.sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map((t) => {
              const m = caseLink(t.matterId);
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
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
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-xl">Prazos</h2>
            <ul className="space-y-3">
              {v.deadlines.map((d) => (
                <li key={d.id}><Link to="/o/$org/casos/$id" params={{ org, id: d.matterId }} search={{ tab: "prazos" }} className="block rounded-lg p-2 hover:bg-muted">
                  <p className="text-sm font-medium">{d.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><DeadlineStatusChip status={d.status} /> {fmtDateTime(d.dueDate)}</div>
                </Link></li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-xl">Agenda de hoje</h2>
            <ul className="space-y-2 text-sm">
              {v.appointments.filter((a) => isToday(a.at)).map((a) => <li key={a.id}><span className="tabular font-semibold">{fmtTime(a.at)}</span> · {a.title}</li>)}
            </ul>
          </section>
          <section className="rounded-xl border bg-card p-5 shadow-soft">
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
