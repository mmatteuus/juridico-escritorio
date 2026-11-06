import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlineStatusChip, EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { findOffice, fmtDateTime, fmtTime, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Appointment, DeadlineStatus } from "@/features/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/o/$org/agenda")({
  head: () => ({ meta: [{ title: "Agenda · JURIDO Escritórios" }, { name: "description", content: "Agenda de tarefas, prazos e compromissos." }, { name: "robots", content: "noindex" }] }),
  component: Agenda,
});

type Mode = "dia" | "semana" | "mes";
type Item = { id: string; at: string; title: string; kind: "Tarefa" | "Prazo" | "Compromisso"; matterId?: string | undefined; proceedingId?: string; who?: string; practiceAreaId?: string; status?: DeadlineStatus };

const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

function Agenda() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [mode, setMode] = useState<Mode>("semana");
  const [anchor, setAnchor] = useState(() => startOf(new Date()));
  const [who, setWho] = useState("todos");
  const [area, setArea] = useState("todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentAt, setAppointmentAt] = useState(() => localDateTime(new Date()));
  const [assigneeId, setAssigneeId] = useState(v.me?.id ?? v.members[0]?.id ?? "");
  const [practiceAreaId, setPracticeAreaId] = useState(office.practiceAreas[0]?.id ?? "");
  const [matterId, setMatterId] = useState("");
  const canAssignOthers = ["gestor", "socio", "coordenador"].includes(v.role);
  const assignableMembers = canAssignOthers ? v.members : v.members.filter((member) => member.id === v.me?.id);

  const from = new Date(anchor);
  if (mode === "semana") from.setDate(from.getDate() - from.getDay());
  if (mode === "mes") from.setDate(1);
  const to = new Date(from);
  if (mode === "dia") to.setDate(to.getDate() + 1);
  if (mode === "semana") to.setDate(to.getDate() + 7);
  if (mode === "mes") to.setMonth(to.getMonth() + 1);

  const items: Item[] = [
    ...v.tasks.filter((t) => t.status !== "concluida" && !!t.dueAt).map((t): Item => ({ id: t.id, at: t.dueAt!, title: t.title, kind: "Tarefa", matterId: t.matterId, who: t.assigneeId })),
    ...v.deadlines.filter((d) => d.status !== "cancelado").map((d): Item => ({ id: d.id, at: d.dueDate, title: d.title, kind: "Prazo", ...(d.matterId ? { matterId: d.matterId } : {}), ...(d.proceedingId ? { proceedingId: d.proceedingId } : {}), who: d.assigneeId, status: d.status })),
    ...v.appointments.map((a): Item => ({ id: a.id, at: a.at, title: a.title, kind: "Compromisso", matterId: a.matterId, who: a.assigneeId, practiceAreaId: a.practiceAreaId })),
  ].filter((i) => {
    const t = new Date(i.at);
    if (t < from || t >= to) return false;
    if (who !== "todos" && i.who !== who) return false;
    if (area !== "todas" && (i.practiceAreaId ?? v.matterById(i.matterId)?.practiceAreaId) !== area) return false;
    return true;
  }).sort((a, b) => a.at.localeCompare(b.at));

  const days: Date[] = [];
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const shift = (n: number) => { const x = new Date(anchor); if (mode === "dia") x.setDate(x.getDate() + n); if (mode === "semana") x.setDate(x.getDate() + 7 * n); if (mode === "mes") x.setMonth(x.getMonth() + n); setAnchor(x); };
  const today = startOf(new Date()).getTime();
  const label = mode === "mes" ? from.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : mode === "dia" ? from.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : `${from.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${new Date(to.getTime() - 1).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedDate = new Date(appointmentAt);
    if (!appointmentTitle.trim() || !Number.isFinite(selectedDate.getTime()) ||
      !assignableMembers.some((member) => member.id === assigneeId) ||
      !office.practiceAreas.some((practiceArea) => practiceArea.id === practiceAreaId) ||
      (matterId && v.matterById(matterId)?.practiceAreaId !== practiceAreaId)) return;
    const appointment: Appointment = {
      id: uid("appointment"),
      officeId: office.id,
      ...(matterId ? { matterId } : {}),
      title: appointmentTitle.trim(),
      at: selectedDate.toISOString(),
      assigneeId,
      practiceAreaId,
    };
    update((data) => ({ ...data, appointments: [appointment, ...data.appointments] }));
    setAppointmentTitle("");
    setAppointmentAt(localDateTime(new Date()));
    setMatterId("");
    setCreateOpen(false);
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Tarefas, prazos e compromissos do escritório." actions={<Button onClick={() => setCreateOpen(true)}><CalendarPlus className="size-4" /> Novo compromisso</Button>} />
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
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="agenda" currentValues={{ mode, anchor: localDateTime(anchor).slice(0, 10), who, area }} onApply={(filters) => {
        const modes: Mode[] = ["dia", "semana", "mes"];
        const dateParts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(filters.anchor);
        const savedDate = dateParts ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])) : null;
        setMode(modes.includes(filters.mode as Mode) ? filters.mode as Mode : "semana");
        setAnchor(savedDate && Number.isFinite(savedDate.getTime()) ? startOf(savedDate) : startOf(new Date()));
        setWho(filters.who === "todos" || v.members.some((member) => member.id === filters.who) ? filters.who : "todos");
        setArea(filters.area === "todas" || office.practiceAreas.some((practiceArea) => practiceArea.id === filters.area) ? filters.area : "todas");
      }} /></div>
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
                      {i.matterId ? <Link to="/o/$org/casos/$id" params={{ org, id: i.matterId }} search={i.kind === "Prazo" ? { tab: "prazos" } : i.kind === "Tarefa" ? { tab: "tarefas" } : {}} className="block rounded-md p-1.5 hover:bg-muted">{body}</Link> : i.proceedingId ? <Link to="/o/$org/processos/$id" params={{ org, id: i.proceedingId }} className="block rounded-md p-1.5 hover:bg-muted">{body}</Link> : <Button type="button" variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-md p-1.5 text-left" aria-label={`Ver detalhes: ${i.title}`} onClick={() => setSelectedItem(i)}>{body}</Button>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo compromisso</DialogTitle>
            <DialogDescription>O compromisso será salvo somente nesta demonstração e ficará visível conforme o escritório, o caso e a pessoa responsável.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createAppointment} className="space-y-4">
            <div className="grid gap-1.5"><Label htmlFor="appointment-title">Título</Label><Input id="appointment-title" value={appointmentTitle} onChange={(event) => setAppointmentTitle(event.target.value)} required maxLength={120} autoFocus /></div>
            <div className="grid gap-1.5"><Label htmlFor="appointment-at">Data e hora</Label><Input id="appointment-at" type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label htmlFor="appointment-assignee">Responsável</Label><select id="appointment-assignee" className="h-10 rounded-md border bg-background px-3 text-sm" value={assignableMembers.some((member) => member.id === assigneeId) ? assigneeId : v.me?.id ?? ""} onChange={(event) => setAssigneeId(event.target.value)} required>{assignableMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>{!canAssignOthers && <p className="text-xs text-muted-foreground">Neste perfil, compromissos sem caso ficam atribuídos a você.</p>}</div>
              <div className="grid gap-1.5"><Label htmlFor="appointment-area">Área</Label><select id="appointment-area" className="h-10 rounded-md border bg-background px-3 text-sm" value={practiceAreaId} onChange={(event) => { setPracticeAreaId(event.target.value); setMatterId(""); }} required>{office.practiceAreas.map((practiceArea) => <option key={practiceArea.id} value={practiceArea.id}>{practiceArea.name}</option>)}</select></div>
            </div>
            <div className="grid gap-1.5"><Label htmlFor="appointment-matter">Caso (opcional)</Label><select id="appointment-matter" className="h-10 rounded-md border bg-background px-3 text-sm" value={matterId} onChange={(event) => { const nextMatterId = event.target.value; setMatterId(nextMatterId); const selectedMatter = v.matterById(nextMatterId); if (selectedMatter) setPracticeAreaId(selectedMatter.practiceAreaId); }}><option value="">Sem caso vinculado</option>{v.matters.filter((matter) => matter.practiceAreaId === practiceAreaId).map((matter) => <option key={matter.id} value={matter.id}>{matter.code} · {matter.title}</option>)}</select><p className="text-xs text-muted-foreground">A lista inclui somente casos que seu perfil pode visualizar.</p></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit">Salvar compromisso demo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.title ?? "Detalhe do compromisso"}</DialogTitle>
            <DialogDescription>{selectedItem?.kind ?? "Compromisso"} sem caso vinculado · dados locais da demonstração.</DialogDescription>
          </DialogHeader>
          {selectedItem && <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Data e hora</dt><dd className="mt-0.5 font-medium">{fmtDateTime(selectedItem.at)}</dd></div><div><dt className="text-muted-foreground">Responsável</dt><dd className="mt-0.5 font-medium">{v.memberName(selectedItem.who)}</dd></div><div><dt className="text-muted-foreground">Área</dt><dd className="mt-0.5 font-medium">{selectedItem.practiceAreaId ? v.areaName(selectedItem.practiceAreaId) : v.matterById(selectedItem.matterId)?.practiceAreaId ? v.areaName(v.matterById(selectedItem.matterId)!.practiceAreaId) : "Não informada"}</dd></div><div><dt className="text-muted-foreground">Caso</dt><dd className="mt-0.5 font-medium">Sem caso vinculado</dd></div></dl>}
          <DialogFooter><Button type="button" onClick={() => setSelectedItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
