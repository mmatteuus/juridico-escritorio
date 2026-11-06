import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleHelp, Clock3, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlineStatusChip, DeniedState, DueBadge, EmptyState, PageHeader } from "@/components/office/badges";
import { changeDeadline, rescheduleDeadline } from "@/features/demo/actions";
import { canConfirmDeadline, canProposeDeadline, canSeeCnj } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Deadline, DeadlineStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/prazos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Prazos · JURIDO Escritórios" }, { name: "description", content: "Prazos propostos, em revisão e confirmados." }, { name: "robots", content: "noindex" }] }),
  component: Prazos,
});

const FILTERS: { id: DeadlineStatus | "abertos" | "todos"; label: string }[] = [
  { id: "abertos", label: "Em aberto" }, { id: "proposto", label: "Propostos" }, { id: "em_revisao", label: "Em revisão" },
  { id: "confirmado", label: "Confirmados" }, { id: "concluido", label: "Concluídos" }, { id: "cancelado", label: "Cancelados" }, { id: "todos", label: "Todos" },
];

function Prazos() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("abertos");
  const [review, setReview] = useState<Deadline | null>(null);
  const [cancelWhy, setCancelWhy] = useState("");
  const [newDate, setNewDate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [form, setForm] = useState({ matterId: "", title: "", date: "", assigneeId: v.me?.id ?? "", sourceLabel: "", basis: "", notes: "" });
  const actor = v.me?.name ?? "—";
  if (!canSeeCnj(v.role)) return <DeniedState />;

  const list = v.deadlines
    .filter((d) => (f === "todos" ? true : f === "abertos" ? !["concluido", "cancelado"].includes(d.status) : d.status === f))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const act = (d: Deadline, next: Partial<Deadline>, action: string) => {
    changeDeadline(update, d, next, action, actor);
    setReview((r) => (r ? { ...r, ...next, history: [...r.history, { at: new Date().toISOString(), actor, action }] } : r));
    toast.success(action);
  };
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.matterId || !form.title.trim() || !form.date || !form.assigneeId || !form.sourceLabel.trim()) { toast.error("Preencha caso, título, data e horário, responsável e fonte."); return; }
    const d: Deadline = { id: uid("d"), officeId: office.id, matterId: form.matterId, title: form.title.trim(), dueDate: new Date(form.date).toISOString(), status: "proposto", assigneeId: form.assigneeId, proposedBy: actor, version: 1, sourceLabel: form.sourceLabel.trim(), ...(form.basis.trim() ? { basis: form.basis.trim() } : {}), ...(form.notes.trim() ? { notes: form.notes.trim() } : {}), history: [{ at: new Date().toISOString(), actor, action: `Propôs prazo com base em: ${form.sourceLabel.trim()}` }] };
    update((s) => ({ ...s, deadlines: [...s.deadlines, d], timeline: [timelineEvent({ officeId: office.id, matterId: d.matterId, actor, kind: "prazo", text: `Propôs prazo: ${d.title}` }), ...s.timeline] }));
    setForm({ matterId: "", title: "", date: "", assigneeId: v.me?.id ?? "", sourceLabel: "", basis: "", notes: "" });
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
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => <Button key={x.id} size="sm" variant={f === x.id ? "default" : "outline"} aria-pressed={f === x.id} onClick={() => setF(x.id)}>{x.label} <span className="tabular opacity-70">{x.id === "todos" ? v.deadlines.length : x.id === "abertos" ? v.deadlines.filter((d) => !["concluido", "cancelado"].includes(d.status)).length : v.deadlines.filter((d) => d.status === x.id).length}</span></Button>)}
      </div>
      {list.length === 0 ? <EmptyState title="Nenhum prazo neste filtro" /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {list.map((d) => {
            const m = v.matterById(d.matterId);
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular">{fmtDateTime(d.dueDate)}</span> · {v.memberName(d.assigneeId)} · proposto por {d.proposedBy}
                    {m && <> · <Link to="/o/$org/casos/$id" params={{ org, id: m.id }} search={{ tab: "prazos" }} className="text-primary hover:underline">{m.code}</Link></>}
                  </p>
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
              <DialogDescription>Data vigente: {fmtDateTime(review.dueDate)} · Fonte: {review.sourceLabel} · Responsável: {v.memberName(review.assigneeId)} · v{review.version}</DialogDescription>
            </DialogHeader>
            {review.proposedDueDate && <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm"><p className="font-semibold">Nova data proposta · v{review.proposedVersion ?? review.version + 1}: {fmtDateTime(review.proposedDueDate)}</p><p className="mt-1 text-muted-foreground">Data vigente v{review.version}: {fmtDateTime(review.dueDate)}. Motivo/fonte: {review.proposedReason || "Não informado"}. A data vigente continua valendo até aprovação.</p></div>}
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
            <div className="space-y-1.5"><Label htmlFor="p-d">Data e hora local</Label><Input id="p-d" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required/><p className="text-xs text-muted-foreground">Fuso do dispositivo: {Intl.DateTimeFormat().resolvedOptions().timeZone || "fuso local"}. A demonstração não calcula prazo legal.</p></div>
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
