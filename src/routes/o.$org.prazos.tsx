import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Clock3, Plus, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlineStatusChip, DeniedState, DueBadge, EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { changeDeadline, rescheduleDeadline } from "@/features/demo/actions";
import { canConfirmDeadline, canProposeDeadline, canSeeCnj } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Appointment, Deadline, DeadlineStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/prazos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Prazos · JURIDO Escritórios" }, { name: "description", content: "Prazos propostos, em revisão e confirmados." }, { name: "robots", content: "noindex" }] }),
  component: Prazos,
});

const FILTERS: { id: DeadlineStatus | "abertos" | "todos"; label: string }[] = [
  { id: "abertos", label: "Em aberto" }, { id: "proposto", label: "Propostos" }, { id: "em_revisao", label: "Em revisão" },
  { id: "confirmado", label: "Confirmados" }, { id: "concluido", label: "Concluídos" }, { id: "cancelado", label: "Cancelados" }, { id: "todos", label: "Todos" },
];

const DEADLINE_TIME_ZONES = [
  { id: "America/Noronha", label: "Fernando de Noronha" },
  { id: "America/Belem", label: "Belém" },
  { id: "America/Fortaleza", label: "Fortaleza" },
  { id: "America/Recife", label: "Recife" },
  { id: "America/Maceio", label: "Maceió" },
  { id: "America/Bahia", label: "Bahia" },
  { id: "America/Sao_Paulo", label: "Brasília / São Paulo" },
  { id: "America/Araguaina", label: "Araguaína" },
  { id: "America/Cuiaba", label: "Cuiabá" },
  { id: "America/Campo_Grande", label: "Campo Grande" },
  { id: "America/Boa_Vista", label: "Boa Vista" },
  { id: "America/Manaus", label: "Manaus" },
  { id: "America/Porto_Velho", label: "Porto Velho" },
  { id: "America/Rio_Branco", label: "Rio Branco" },
  { id: "America/Eirunepe", label: "Eirunepé" },
  { id: "America/Santarem", label: "Santarém" },
] as const;
const DEFAULT_DEADLINE_TIME_ZONE = "America/Sao_Paulo";

function localDateTimeToIso(value: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const desired = match.slice(1).map(Number);
  const target = Date.UTC(desired[0]!, desired[1]! - 1, desired[2]!, desired[3]!, desired[4]!);
  let candidate = target;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(parts["year"]), Number(parts["month"]) - 1, Number(parts["day"]), Number(parts["hour"]), Number(parts["minute"]));
    const adjustment = target - represented;
    if (adjustment === 0) return new Date(candidate).toISOString();
    candidate += adjustment;
  }
  return null;
}

function fmtDeadlineDateTime(deadline: Deadline) {
  const timeZone = deadline.timeZone ?? DEFAULT_DEADLINE_TIME_ZONE;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone }).format(new Date(deadline.dueDate));
}

function deadlineDayKey(deadline: Deadline) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: deadline.timeZone ?? DEFAULT_DEADLINE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(deadline.dueDate));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

function calendarDayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function appointmentDayKey(appointment: Appointment) {
  const date = new Date(appointment.at);
  return calendarDayKey(date.getFullYear(), date.getMonth(), date.getDate());
}

type ScheduleItem =
  | { type: "prazo"; id: string; at: string; title: string; assigneeId: string; matterId: string; sourceLabel: string; deadline: Deadline }
  | { type: "compromisso"; id: string; at: string; title: string; assigneeId: string; matterId?: string; appointment: Appointment };

function Prazos() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("abertos");
  const [typeFilter, setTypeFilter] = useState<"todos" | "prazos" | "compromissos">("todos");
  const [sourceFilter, setSourceFilter] = useState("todas");
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [review, setReview] = useState<Deadline | null>(null);
  const [cancelWhy, setCancelWhy] = useState("");
  const [newDate, setNewDate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [form, setForm] = useState({ matterId: "", title: "", date: "", timeZone: DEFAULT_DEADLINE_TIME_ZONE, assigneeId: v.me?.id ?? "", sourceLabel: "", basis: "", notes: "" });
  const actor = v.me?.name ?? "—";
  if (!canSeeCnj(v.role)) return <DeniedState />;

  const sources = [...new Set(v.deadlines.map((deadline) => deadline.sourceLabel.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filteredDeadlines = v.deadlines.filter((deadline) => {
    const statusMatches = f === "todos" ? true : f === "abertos" ? !["concluido", "cancelado"].includes(deadline.status) : deadline.status === f;
    const sourceMatches = sourceFilter === "todas" || deadline.sourceLabel === sourceFilter;
    const matter = v.matterById(deadline.matterId);
    const searchable = `${deadline.title} ${deadline.sourceLabel} ${deadline.basis ?? ""} ${deadline.notes ?? ""} ${matter?.code ?? ""} ${matter?.title ?? ""} ${v.memberName(deadline.assigneeId)}`.toLocaleLowerCase("pt-BR");
    return statusMatches && sourceMatches && searchable.includes(query.trim().toLocaleLowerCase("pt-BR"));
  });
  const search = query.trim().toLocaleLowerCase("pt-BR");
  const filteredAppointments = v.appointments.filter((appointment) => {
    if (!search) return true;
    const matter = appointment.matterId ? v.matterById(appointment.matterId) : undefined;
    const searchable = `${appointment.title} ${v.memberName(appointment.assigneeId)} ${matter?.code ?? ""} ${matter?.title ?? ""} ${v.areaName(appointment.practiceAreaId)}`.toLocaleLowerCase("pt-BR");
    return searchable.includes(search);
  });
  const scheduleItems: ScheduleItem[] = [
    ...(typeFilter === "compromissos" ? [] : filteredDeadlines.map((deadline): ScheduleItem => ({ type: "prazo", id: deadline.id, at: deadline.dueDate, title: deadline.title, assigneeId: deadline.assigneeId, matterId: deadline.matterId, sourceLabel: deadline.sourceLabel, deadline }))),
    ...(typeFilter === "prazos" ? [] : filteredAppointments.map((appointment): ScheduleItem => ({ type: "compromisso", id: appointment.id, at: appointment.at, title: appointment.title, assigneeId: appointment.assigneeId, ...(appointment.matterId ? { matterId: appointment.matterId } : {}), appointment }))),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const list = scheduleItems.filter((item) => !selectedDay || (item.type === "prazo" ? deadlineDayKey(item.deadline) : appointmentDayKey(item.appointment)) === selectedDay);
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const leadingDays = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const dayCounts = new Map<string, number>();
  for (const item of scheduleItems) {
    const key = item.type === "prazo" ? deadlineDayKey(item.deadline) : appointmentDayKey(item.appointment);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const shiftMonth = (amount: number) => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + amount, 1));
  const act = (d: Deadline, next: Partial<Deadline>, action: string) => {
    changeDeadline(update, d, next, action, actor);
    setReview((r) => (r ? { ...r, ...next, history: [...r.history, { at: new Date().toISOString(), actor, action }] } : r));
    toast.success(action);
  };
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.matterId || !form.title.trim() || !form.date || !form.assigneeId || !form.sourceLabel.trim()) { toast.error("Preencha caso, título, data e horário, responsável e fonte."); return; }
    const dueDate = localDateTimeToIso(form.date, form.timeZone);
    if (!dueDate) { toast.error("Este horário não existe no fuso selecionado por causa da mudança de horário local. Escolha outro horário."); return; }
    const d: Deadline = { id: uid("d"), officeId: office.id, matterId: form.matterId, title: form.title.trim(), dueDate, timeZone: form.timeZone, status: "proposto", assigneeId: form.assigneeId, proposedBy: actor, version: 1, sourceLabel: form.sourceLabel.trim(), ...(form.basis.trim() ? { basis: form.basis.trim() } : {}), ...(form.notes.trim() ? { notes: form.notes.trim() } : {}), history: [{ at: new Date().toISOString(), actor, action: `Propôs prazo com base em: ${form.sourceLabel.trim()}` }] };
    update((s) => ({ ...s, deadlines: [...s.deadlines, d], timeline: [timelineEvent({ officeId: office.id, matterId: d.matterId, actor, kind: "prazo", text: `Propôs prazo: ${d.title}` }), ...s.timeline] }));
    setForm({ matterId: "", title: "", date: "", timeZone: DEFAULT_DEADLINE_TIME_ZONE, assigneeId: v.me?.id ?? "", sourceLabel: "", basis: "", notes: "" });
    navigate({ search: {}, replace: true });
    toast.success("Prazo proposto — aguarda confirmação de advogado");
  };

  return (
    <>
      <PageHeader title="Prazos" subtitle="O protótipo não calcula prazos legais. Toda data passa por revisão profissional."
        actions={canProposeDeadline(v.role) && <Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Propor prazo</Button>} />
      <section aria-labelledby="coverage-title" className="mb-6 rounded-xl border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="coverage-title" className="font-display text-xl">Cobertura demonstrativa de publicações</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Estados fictícios por fonte e período. Nenhum tribunal ou serviço externo foi consultado; status desconhecido não significa ausência de publicação.</p>
          </div>
          <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">Somente demonstração</span>
        </div>
        {v.publicationCoverage.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {v.publicationCoverage.map((item) => {
            const appearance = {
              confirmada: { label: "Coleta fictícia confirmada", Icon: CheckCircle2, tone: "text-success bg-success-soft" },
              atrasada: { label: "Atrasada", Icon: Clock3, tone: "text-warning bg-warning-soft" },
              falha: { label: "Falha simulada", Icon: XCircle, tone: "text-destructive bg-destructive/10" },
              lacuna: { label: "Lacuna em reconciliação", Icon: AlertTriangle, tone: "text-warning bg-warning-soft" },
              nao_verificada: { label: "Cobertura não verificada", Icon: CircleHelp, tone: "text-muted-foreground bg-muted" },
            }[item.status];
            const Icon = appearance.Icon;
            return <li key={item.id} className="min-w-0 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-semibold">{item.source}</p><p className="mt-1 text-xs text-muted-foreground">{item.period}</p></div><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${appearance.tone}`}><Icon className="size-3.5"/>{appearance.label}</span></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">Última confirmação fictícia</dt><dd className="mt-0.5 font-medium">{item.lastConfirmedAt ? fmtDateTime(item.lastConfirmedAt) : "Sem confirmação"}</dd></div><div><dt className="text-muted-foreground">Atraso / lacunas</dt><dd className="mt-0.5 font-medium">{item.delayMinutes ? `${item.delayMinutes} min` : "—"} · {item.gaps} lacuna(s)</dd></div></dl>
              <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
            </li>;
          })}
        </ul> : <EmptyState title="Nenhuma fonte demonstrativa cadastrada" />}
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Este painel não atesta cobertura, entrega ou ausência de intimações reais. Consulte fontes oficiais e registre a revisão profissional no fluxo apropriado.</p>
      </section>
      <section aria-labelledby="calendar-title" className="mb-6 rounded-xl border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="calendar-title" className="font-display text-xl">Calendário de prazos e compromissos</h2>
            <p className="mt-1 text-xs text-muted-foreground">Contagens seguem tipo, origem e busca. A situação filtra somente prazos; prazos usam o fuso salvo e compromissos usam o horário local da agenda.</p>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}><ChevronLeft /></Button>
            <p aria-live="polite" className="min-w-36 text-center font-medium capitalize">{calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Próximo mês" onClick={() => shiftMonth(1)}><ChevronRight /></Button>
          </div>
        </div>
        <div role="group" aria-label="Calendário mensal de prazos" className="grid grid-cols-7 gap-1 sm:gap-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((weekday) => <div key={weekday} aria-hidden="true" className="py-1 text-center text-xs font-medium text-muted-foreground">{weekday}</div>)}
          {Array.from({ length: leadingDays }, (_, index) => <div key={`empty-${index}`} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const key = calendarDayKey(calendarYear, calendarMonthIndex, day);
            const count = dayCounts.get(key) ?? 0;
            const selected = selectedDay === key;
            const itemLabel = typeFilter === "prazos" ? count === 1 ? "prazo" : "prazos" : typeFilter === "compromissos" ? count === 1 ? "compromisso" : "compromissos" : count === 1 ? "item" : "itens";
            return <div key={key}>
              <button type="button" aria-label={`${day} de ${calendarMonth.toLocaleDateString("pt-BR", { month: "long" })}: ${count} ${itemLabel}${selected ? ", selecionado" : ""}`} aria-pressed={selected} onClick={() => setSelectedDay((current) => current === key ? null : key)} className={`flex min-h-14 w-full flex-col items-center justify-center rounded-md border p-1 text-sm transition-colors sm:min-h-16 ${selected ? "border-primary bg-primary text-primary-foreground" : count ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-transparent hover:border-border hover:bg-muted"}`}>
                <span>{day}</span>
                {count > 0 && <span className={`mt-0.5 rounded px-1 text-[10px] leading-4 ${selected ? "bg-primary-foreground/15" : "text-primary"}`}>{count} {itemLabel}</span>}
              </button>
            </div>;
          })}
        </div>
        {selectedDay && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
          <p role="status">Exibindo {list.length} item(ns) em {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("pt-BR", { dateStyle: "long" })}.</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>Limpar dia selecionado</Button>
        </div>}
      </section>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {(["todos", "prazos", "compromissos"] as const).map((type) => <Button key={type} type="button" size="sm" variant={typeFilter === type ? "default" : "outline"} aria-pressed={typeFilter === type} onClick={() => setTypeFilter(type)}>{type === "todos" ? "Todos" : type === "prazos" ? "Prazos" : "Compromissos"}</Button>)}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,auto)]">
        <div className="relative min-w-0">
          <Search aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input aria-label="Buscar prazos e compromissos" placeholder="Buscar título, caso, responsável ou origem" className="bg-card pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter} disabled={typeFilter === "compromissos"}>
          <SelectTrigger aria-label="Filtrar origem dos prazos" className="bg-card"><SelectValue placeholder="Todas as origens" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as origens</SelectItem>
            {sources.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {typeFilter !== "compromissos" && <section className="mb-4" aria-label="Filtrar prazos por situação">
        <p className="mb-2 text-xs text-muted-foreground">Situação (aplica-se somente aos prazos)</p>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((x) => <Button key={x.id} type="button" size="sm" variant={f === x.id ? "default" : "outline"} aria-pressed={f === x.id} onClick={() => setF(x.id)}>{x.label} <span className="tabular opacity-70">{x.id === "todos" ? v.deadlines.length : x.id === "abertos" ? v.deadlines.filter((d) => !["concluido", "cancelado"].includes(d.status)).length : v.deadlines.filter((d) => d.status === x.id).length}</span></Button>)}
        </div>
      </section>}
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="prazos" currentValues={{ query, f, typeFilter, sourceFilter, selectedDay: selectedDay ?? "" }} onApply={(filters) => { setQuery(filters.query); setF(filters.f as typeof f); setTypeFilter(filters.typeFilter as typeof typeFilter); setSourceFilter(filters.sourceFilter); setSelectedDay(filters.selectedDay || null); }} /></div>
      {list.length === 0 ? <EmptyState title={typeFilter === "compromissos" ? "Nenhum compromisso neste filtro" : "Nenhum prazo ou compromisso neste filtro"} /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {list.map((item) => {
            if (item.type === "compromisso") {
              const matter = item.matterId ? v.matterById(item.matterId) : undefined;
              return <li key={`appointment-${item.id}`} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground"><span className="tabular">{fmtDateTime(item.at)}</span> · {v.memberName(item.assigneeId)} · {v.areaName(item.appointment.practiceAreaId)} · Compromisso</p>
                  {matter && <p className="mt-1 text-xs"><Link to="/o/$org/casos/$id" params={{ org, id: matter.id }} className="text-primary hover:underline">{matter.code} · {matter.title}</Link></p>}
                </div>
                <Button size="sm" variant="outline" asChild><Link to="/o/$org/agenda" params={{ org }}>Abrir agenda</Link></Button>
              </li>;
            }
            const d = item.deadline;
            const m = v.matterById(d.matterId);
            return (
              <li key={`deadline-${d.id}`} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular">{fmtDeadlineDateTime(d)} ({d.timeZone ?? "fuso não informado"})</span> · {v.memberName(d.assigneeId)} · proposto por {d.proposedBy}
                    {m && <> · <Link to="/o/$org/casos/$id" params={{ org, id: m.id }} search={{ tab: "prazos" }} className="text-primary hover:underline">{m.code}</Link></>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Origem: {d.sourceLabel || "Não informada"}</p>
                </div>
                <DueBadge iso={d.dueDate} done={["concluido", "cancelado"].includes(d.status)} />
                <DeadlineStatusChip status={d.status} />
                <Button size="sm" variant="outline" onClick={() => setReview(d)}>Revisar</Button>
                <Button size="sm" variant="ghost" asChild><Link to="/o/$org/prazos/$id" params={{org,id:d.id}}>Abrir ficha</Link></Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!review} onOpenChange={(o) => { if (!o) { setReview(null); setCancelWhy(""); setNewDate(""); setChangeReason(""); } }}>
        <DialogContent>
          {review && <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">{review.title}</DialogTitle>
              <DialogDescription>Data vigente: {fmtDeadlineDateTime(review)} ({review.timeZone ?? "fuso não informado"}) · Fonte: {review.sourceLabel} · Responsável: {v.memberName(review.assigneeId)} · v{review.version}</DialogDescription>
            </DialogHeader>
            {review.proposedDueDate && <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm"><p className="font-semibold">Nova data proposta · v{review.proposedVersion ?? review.version + 1}: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: review.timeZone ?? DEFAULT_DEADLINE_TIME_ZONE }).format(new Date(review.proposedDueDate))} ({review.timeZone ?? "fuso não informado"})</p><p className="mt-1 text-muted-foreground">Data vigente v{review.version}: {fmtDeadlineDateTime(review)}. Motivo/fonte: {review.proposedReason || "Não informado"}. A data vigente continua valendo até aprovação.</p></div>}
            <div className="flex flex-wrap gap-2"><DeadlineStatusChip status={review.status} /><DueBadge iso={review.dueDate} done={["concluido", "cancelado"].includes(review.status)} /></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico</p>
            {(review.basis || review.notes) && <div className="rounded-lg bg-muted/40 p-3 text-sm"><p><strong>Fundamento:</strong> {review.basis || "Não informado"}</p>{review.notes && <p className="mt-2"><strong>Observações:</strong> {review.notes}</p>}</div>}
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {review.history.map((h, i) => <li key={i}>{fmtDateTime(h.at)} — {h.actor}: {h.action}</li>)}
            </ul>
            {!["concluido", "cancelado"].includes(review.status) && (
              <div className="space-y-3">
                {canProposeDeadline(v.role) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Label htmlFor="r-d">Nova data</Label>
                    <Input id="r-d" type="date" className="w-44" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    <Input aria-label="Fonte e justificativa da nova data" className="min-w-48 flex-1" placeholder="Fonte e justificativa" value={changeReason} onChange={e=>setChangeReason(e.target.value)} />
                    <Button variant="outline" size="sm" disabled={!newDate || !changeReason.trim()} onClick={() => { act(review, rescheduleDeadline(review, new Date(`${newDate}T18:00`).toISOString(), changeReason), "Propôs alteração de data para revisão"); setNewDate(""); setChangeReason(""); }}>Enviar para revisão</Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input aria-label="Justificativa do cancelamento" placeholder="Justificativa para cancelar" value={cancelWhy} onChange={(e) => setCancelWhy(e.target.value)} />
                  <Button variant="outline" disabled={!cancelWhy.trim() || !canConfirmDeadline(v.role)} onClick={() => { act(review, { status: "cancelado" }, `Cancelou: ${cancelWhy.trim()}`); setCancelWhy(""); }}>Cancelar prazo</Button>
                </div>
              </div>
            )}
            <DialogFooter className="flex-wrap gap-2">
              {!canConfirmDeadline(v.role) && <p className="mr-auto text-xs text-muted-foreground">Apenas advogado autorizado confirma ou cancela prazos.</p>}
              {review.status === "proposto" && canProposeDeadline(v.role) && <Button variant="outline" onClick={() => act(review, { status: "em_revisao" }, "Enviou para revisão")}>Enviar para revisão</Button>}
              {(review.status === "proposto" || review.status === "em_revisao") && canConfirmDeadline(v.role) && (
                <Button onClick={() => act(review, { ...(review.proposedDueDate ? { dueDate: review.proposedDueDate, version: review.proposedVersion ?? review.version + 1, proposedDueDate: undefined, proposedReason: undefined, proposedVersion: undefined } : {}), status: "confirmado", confirmedBy: actor, confirmedAt: new Date().toISOString() }, "Aprovou a data e confirmou o prazo")}><CheckCircle2 /> Aprovar e confirmar</Button>
              )}
              {review.status === "confirmado" && canConfirmDeadline(v.role) && <Button onClick={() => act(review, { status: "concluido" }, "Concluiu o prazo")}>Marcar concluído</Button>}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!novo} onOpenChange={(o) => !o && navigate({ search: {}, replace: true })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-xl font-medium">Propor prazo</DialogTitle><DialogDescription>O prazo fica como "proposto" até um advogado confirmar.</DialogDescription></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="deadline-case">Caso</Label>
              <Select value={form.matterId} onValueChange={(x) => setForm({ ...form, matterId: x })}><SelectTrigger id="deadline-case"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{v.matters.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} · {m.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="p-t">Título</Label><Input id="p-t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-assignee">Responsável</Label><select id="p-assignee" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.assigneeId} onChange={(e)=>setForm({...form,assigneeId:e.target.value})} required>{v.members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></div>
            <div className="space-y-1.5"><Label htmlFor="p-time-zone">Fuso horário (IANA)</Label><Select value={form.timeZone} onValueChange={(timeZone) => setForm({ ...form, timeZone })}><SelectTrigger id="p-time-zone"><SelectValue placeholder="Selecione o fuso" /></SelectTrigger><SelectContent>{DEADLINE_TIME_ZONES.map((timeZone) => <SelectItem key={timeZone.id} value={timeZone.id}>{timeZone.label} · {timeZone.id}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Escolha o fuso em que a data e hora informadas devem ser interpretadas.</p></div>
            <div className="space-y-1.5"><Label htmlFor="p-d">Data e hora local</Label><Input id="p-d" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required/><p className="text-xs text-muted-foreground">O horário digitado será interpretado em {form.timeZone}. O fuso será salvo com a proposta. A demonstração não calcula prazo legal.</p></div>
            <div className="space-y-1.5"><Label htmlFor="p-source">Fonte / referência</Label><Input id="p-source" value={form.sourceLabel} onChange={(e)=>setForm({...form,sourceLabel:e.target.value})} placeholder="Ex.: cadastro manual ou referência recebida" required maxLength={180}/></div>
            <div className="space-y-1.5"><Label htmlFor="p-basis">Fundamento / regra de contagem (opcional)</Label><Input id="p-basis" value={form.basis} onChange={(e)=>setForm({...form,basis:e.target.value})} placeholder="Regra a conferir pelo profissional" maxLength={240}/></div>
            <div className="space-y-1.5"><Label htmlFor="p-notes">Observações (opcional)</Label><textarea id="p-notes" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} maxLength={1000}/></div>
            <DialogFooter><Button type="submit">Propor</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
