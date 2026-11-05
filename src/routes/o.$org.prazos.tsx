import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus } from "lucide-react";
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
  const [form, setForm] = useState({ matterId: "", title: "", date: "" });
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
    if (!form.matterId || !form.title || !form.date) { toast.error("Preencha caso, título e data."); return; }
    const d: Deadline = { id: uid("d"), officeId: office.id, matterId: form.matterId, title: form.title, dueDate: new Date(`${form.date}T18:00`).toISOString(), status: "proposto", assigneeId: v.me?.id ?? "", proposedBy: actor, version: 1, sourceLabel: "Cadastro manual (demo)", history: [{ at: new Date().toISOString(), actor, action: "Propôs o prazo" }] };
    update((s) => ({ ...s, deadlines: [...s.deadlines, d], timeline: [timelineEvent({ officeId: office.id, matterId: d.matterId, actor, kind: "prazo", text: `Propôs prazo: ${d.title}` }), ...s.timeline] }));
    setForm({ matterId: "", title: "", date: "" });
    navigate({ search: {}, replace: true });
    toast.success("Prazo proposto — aguarda confirmação de advogado");
  };

  return (
    <>
      <PageHeader title="Prazos" subtitle="O protótipo não calcula prazos legais. Toda data passa por revisão profissional."
        actions={canProposeDeadline(v.role) && <Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Propor prazo</Button>} />
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
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!review} onOpenChange={(o) => { if (!o) { setReview(null); setCancelWhy(""); setNewDate(""); } }}>
        <DialogContent>
          {review && <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">{review.title}</DialogTitle>
              <DialogDescription>Vence {fmtDateTime(review.dueDate)} · Fonte: {review.sourceLabel} · v{review.version}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2"><DeadlineStatusChip status={review.status} /><DueBadge iso={review.dueDate} done={["concluido", "cancelado"].includes(review.status)} /></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {review.history.map((h, i) => <li key={i}>{fmtDateTime(h.at)} — {h.actor}: {h.action}</li>)}
            </ul>
            {!["concluido", "cancelado"].includes(review.status) && (
              <div className="space-y-3">
                {canProposeDeadline(v.role) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Label htmlFor="r-d">Nova data</Label>
                    <Input id="r-d" type="date" className="w-44" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    <Button variant="outline" size="sm" disabled={!newDate} onClick={() => { act(review, rescheduleDeadline(review, new Date(`${newDate}T18:00`).toISOString()), "Alterou a data (volta para revisão)"); setNewDate(""); }}>Aplicar</Button>
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
              {review.status === "proposto" && <Button variant="outline" onClick={() => act(review, { status: "em_revisao" }, "Enviou para revisão")}>Enviar para revisão</Button>}
              {(review.status === "proposto" || review.status === "em_revisao") && canConfirmDeadline(v.role) && (
                <Button onClick={() => act(review, { status: "confirmado", confirmedBy: actor, confirmedAt: new Date().toISOString() }, "Confirmou o prazo")}><CheckCircle2 /> Confirmar</Button>
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
            <div className="space-y-1.5"><Label>Caso</Label>
              <Select value={form.matterId} onValueChange={(x) => setForm({ ...form, matterId: x })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{v.matters.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} · {m.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="p-t">Título</Label><Input id="p-t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-d">Data</Label><Input id="p-d" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Propor</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
