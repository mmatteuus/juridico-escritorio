import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfidentialityBadge, DeadlineStatusChip, DueBadge, DeniedState, EmptyState, PriorityBadge, TASK_STATUS_LABEL,
} from "@/components/office/badges";
import {
  canConfirmDeadline, canProposeDeadline, canSeeCnj, canSeeFinance, canSeeLegalDocs,
} from "@/features/demo/permissions";
import { brl, findOffice, fmtDateTime, isOverdue, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Deadline, DemoData, MessageDraft } from "@/features/demo/types";

const TABS = ["resumo", "timeline", "processos", "prazos", "tarefas", "documentos", "comunicacao", "financeiro"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/o/$org/casos/$id")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(s["tab"] as Tab) ? { tab: s["tab"] as Tab } : {},
  head: () => ({ meta: [{ title: "Dossiê do caso · JURIDO Escritórios" }, { name: "description", content: "Dossiê unificado do caso." }, { name: "robots", content: "noindex" }] }),
  component: Dossie,
});

const MSG_LABEL: Record<MessageDraft["status"], string> = {
  rascunho: "Rascunho", aguardando_revisao: "Aguardando revisão", pronto_envio_manual: "Pronto para envio manual", acao_simulada: "Ação de envio simulada",
};

function Dossie() {
  const { org, id } = Route.useParams();
  const { tab = "resumo" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const m = v.matterById(id);
  const [taskTitle, setTaskTitle] = useState("");
  const [dlTitle, setDlTitle] = useState("");
  const [dlDate, setDlDate] = useState("");
  const [msgText, setMsgText] = useState("");
  const [confirmMsg, setConfirmMsg] = useState<MessageDraft | null>(null);

  if (!m) return <DeniedState />;
  const actor = v.me?.name ?? "—";
  const ev = (kind: Parameters<typeof timelineEvent>[0]["kind"], text: string) => timelineEvent({ officeId: office.id, matterId: m.id, actor, kind, text });
  const patch = (fn: (d: DemoData) => DemoData) => update((d) => fn({ ...d, matters: d.matters.map((x) => (x.id === m.id ? { ...x, updatedAt: new Date().toISOString() } : x)) }));

  const procs = v.proceedings.filter((p) => p.matterId === m.id);
  const dls = v.deadlines.filter((d) => d.matterId === m.id);
  const tasks = v.tasks.filter((t) => t.matterId === m.id);
  const docs = v.docs.filter((d) => d.matterId === m.id);
  const msgs = v.messages.filter((x) => x.matterId === m.id);
  const recs = v.receivables.filter((r) => r.matterId === m.id);
  const tl = v.timeline.filter((e) => e.matterId === m.id).sort((a, b) => b.at.localeCompare(a.at));
  const canFin = canSeeFinance(v.role);

  const setDeadline = (d: Deadline, next: Partial<Deadline>, action: string) =>
    patch((s) => ({
      ...s,
      deadlines: s.deadlines.map((x) => (x.id === d.id ? { ...x, ...next, history: [...x.history, { at: new Date().toISOString(), actor, action }] } : x)),
      timeline: [ev("prazo", `${action}: ${d.title}`), ...s.timeline],
    }));

  const visibleTabs = TABS.filter((t) => (t === "financeiro" ? canFin : t === "documentos" || t === "comunicacao" ? canSeeLegalDocs(v.role) : true));

  return (
    <>
      <Link to="/o/$org/casos" params={{ org }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Casos</Link>
      <header className="mb-6 rounded-xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="tabular">{m.code}</span>·<span>{v.areaName(m.practiceAreaId)}</span><ConfidentialityBadge value={m.confidentiality} /></div>
        <h1 className="mt-2 font-display text-3xl font-medium">{m.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliente: {m.clientIds.map(v.clientName).join(", ")} · Responsáveis: {m.assignedMemberIds.map(v.memberName).join(", ") || "—"} · Atualizado {fmtDateTime(m.updatedAt)}
        </p>
      </header>

      <Tabs value={tab} onValueChange={(t) => navigate({ search: { tab: t as Tab }, replace: true })}>
        <TabsList className="mb-4 h-auto flex-wrap justify-start bg-card">
          {visibleTabs.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "comunicacao" ? "Comunicação" : t}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="resumo" className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 md:col-span-2"><h2 className="font-display text-lg">Resumo</h2><p className="mt-2 text-sm">{m.summary}</p></div>
          <div className="rounded-xl border bg-card p-5 text-sm">
            <p>{procs.length ? `${procs.length} processo(s) vinculados` : "Sem processo judicial — caso válido."}</p>
            <p className="mt-1">{dls.filter((d) => d.status !== "concluido").length} prazo(s) em aberto</p>
            <p className="mt-1">{tasks.filter((t) => t.status !== "concluida").length} tarefa(s) em aberto</p>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <ol className="relative space-y-4 border-l pl-5">
            {tl.map((e) => (
              <li key={e.id}><span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-card bg-copper" aria-hidden />
                <p className="text-sm"><span className="font-semibold">{e.actor}</span> — {e.text}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(e.at)} · {e.kind}</p></li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="processos">
          {procs.length === 0 ? <EmptyState title="Nenhum processo vinculado" hint="Um caso pode existir sem processo judicial." /> : (
            <ul className="space-y-2">{procs.map((p) => (
              <li key={p.id} className="rounded-xl border bg-card p-4 text-sm">
                <p className="tabular font-semibold">{canSeeCnj(v.role) ? p.cnjMasked : "CNJ oculto para seu perfil"}</p>
                <p className="text-muted-foreground">{p.court} · Fase: {p.phase} · origem: cadastro manual (demo)</p>
              </li>))}</ul>
          )}
        </TabsContent>

        <TabsContent value="prazos" className="space-y-4">
          <p className="rounded-lg border border-dashed bg-warning-soft p-3 text-xs text-foreground">O protótipo não calcula prazos legais. Toda data precisa de revisão profissional.</p>
          {canProposeDeadline(v.role) && (
            <form className="flex flex-wrap gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (!dlTitle || !dlDate) { toast.error("Informe título e data."); return; }
              const d: Deadline = { id: uid("d"), officeId: office.id, matterId: m.id, title: dlTitle, dueDate: new Date(`${dlDate}T18:00`).toISOString(), status: "proposto", assigneeId: v.me?.id ?? "", proposedBy: actor, version: 1, sourceLabel: "Cadastro manual (demo)", history: [{ at: new Date().toISOString(), actor, action: "Propôs o prazo" }] };
              patch((s) => ({ ...s, deadlines: [...s.deadlines, d], timeline: [ev("prazo", `Propôs prazo: ${dlTitle}`), ...s.timeline] }));
              setDlTitle(""); setDlDate(""); toast.success("Prazo proposto — aguarda confirmação");
            }}>
              <Input aria-label="Título do prazo" placeholder="Novo prazo" value={dlTitle} onChange={(e) => setDlTitle(e.target.value)} className="max-w-xs bg-card" />
              <Input aria-label="Data" type="date" value={dlDate} onChange={(e) => setDlDate(e.target.value)} className="w-44 bg-card" />
              <Button type="submit"><Plus /> Propor prazo</Button>
            </form>
          )}
          {dls.length === 0 ? <EmptyState title="Sem prazos" /> : dls.map((d) => (
            <article key={d.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{d.title}</h3><span className="flex gap-2"><DueBadge iso={d.dueDate} done={["concluido", "cancelado"].includes(d.status)} /><DeadlineStatusChip status={d.status} /></span></div>
              <p className="text-sm text-muted-foreground">Vence {fmtDateTime(d.dueDate)} · Fonte: {d.sourceLabel} · v{d.version}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(d.status === "proposto" || d.status === "em_revisao") && (canConfirmDeadline(v.role)
                  ? <Button size="sm" onClick={() => setDeadline(d, { status: "confirmado", confirmedBy: actor, confirmedAt: new Date().toISOString() }, "Confirmou o prazo")}><CheckCircle2 /> Confirmar prazo</Button>
                  : <span className="text-xs text-muted-foreground">Apenas advogado autorizado pode confirmar.</span>)}
                {d.status === "proposto" && <Button size="sm" variant="outline" onClick={() => setDeadline(d, { status: "em_revisao" }, "Enviou para revisão")}>Enviar para revisão</Button>}
                {d.status === "confirmado" && canConfirmDeadline(v.role) && <Button size="sm" variant="outline" onClick={() => setDeadline(d, { status: "concluido" }, "Concluiu o prazo")}>Concluir</Button>}
                {d.status !== "concluido" && d.status !== "cancelado" && canProposeDeadline(v.role) && (
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">Alterar data
                    <Input type="date" className="h-8 w-40 bg-card" onChange={(e) => e.target.value && setDeadline(d, { dueDate: new Date(`${e.target.value}T18:00`).toISOString(), status: "em_revisao", version: d.version + 1 }, "Alterou a data (volta para revisão)")} />
                  </label>)}
              </div>
              <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer">Histórico ({d.history.length})</summary>
                <ul className="mt-1 space-y-0.5">{d.history.map((h, i) => <li key={i}>{fmtDateTime(h.at)} — {h.actor}: {h.action}</li>)}</ul></details>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => {
            e.preventDefault(); if (!taskTitle.trim()) return;
            patch((s) => ({ ...s, tasks: [...s.tasks, { id: uid("t"), officeId: office.id, matterId: m.id, title: taskTitle.trim(), priority: "normal", status: "a_fazer", assigneeId: v.me?.id ?? "", dueAt: new Date(Date.now() + 864e5).toISOString() }], timeline: [ev("tarefa", `Criou tarefa: ${taskTitle.trim()}`), ...s.timeline] }));
            setTaskTitle(""); toast.success("Tarefa criada");
          }}>
            <Input aria-label="Nova tarefa" placeholder="Nova tarefa para este caso" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="max-w-md bg-card" />
            <Button type="submit"><Plus /> Adicionar</Button>
          </form>
          {tasks.length === 0 ? <EmptyState title="Sem tarefas" /> : (
            <ul className="divide-y rounded-xl border bg-card">{tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-3">
                <Checkbox aria-label={`Concluir ${t.title}`} checked={t.status === "concluida"} onCheckedChange={(c) => patch((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, status: c ? "concluida" : "a_fazer" } : x)), timeline: c ? [ev("tarefa", `Concluiu tarefa: ${t.title}`), ...s.timeline] : s.timeline }))} />
                <div className="flex-1"><p className={t.status === "concluida" ? "text-sm line-through text-muted-foreground" : "text-sm font-medium"}>{t.title}</p>
                  <p className="text-xs text-muted-foreground">{v.memberName(t.assigneeId)} · {TASK_STATUS_LABEL[t.status]} · {isOverdue(t) ? "atrasada" : fmtDateTime(t.dueAt)}</p></div>
                <PriorityBadge value={t.priority} />
              </li>))}</ul>
          )}
        </TabsContent>

        <TabsContent value="documentos">
          {docs.length === 0 ? <EmptyState title="Sem documentos" /> : (
            <ul className="grid gap-3 md:grid-cols-2">{docs.map((d) => (
              <li key={d.id} className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-semibold">{d.title}</p>
                <p className="text-muted-foreground">{d.category} · v{d.version} · visibilidade: {d.visibility} · por {d.createdBy}</p>
                <p className="mt-2 text-xs font-semibold text-copper">Minuta de demonstração — não usar juridicamente</p>
              </li>))}</ul>
          )}
        </TabsContent>

        <TabsContent value="comunicacao" className="space-y-4">
          <p className="rounded-lg border border-dashed bg-info-soft p-3 text-xs">Nada é enviado automaticamente. O envio por WhatsApp será sempre manual; aqui só registramos uma ação simulada.</p>
          <form className="space-y-2" onSubmit={(e) => {
            e.preventDefault(); if (!msgText.trim()) return;
            patch((s) => ({ ...s, messages: [...s.messages, { id: uid("msg"), officeId: office.id, matterId: m.id, recipient: v.clientName(m.clientIds[0] ?? ""), content: msgText.trim(), status: "rascunho" }] }));
            setMsgText(""); toast.success("Rascunho salvo");
          }}>
            <Textarea aria-label="Mensagem ao cliente" placeholder={`Mensagem administrativa para ${v.clientName(m.clientIds[0] ?? "")}`} value={msgText} onChange={(e) => setMsgText(e.target.value)} className="bg-card" />
            <Button type="submit" variant="outline">Salvar rascunho</Button>
          </form>
          {msgs.map((x) => (
            <article key={x.id} className="rounded-xl border bg-card p-4 text-sm">
              <div className="flex justify-between gap-2"><p className="font-semibold">Para: {x.recipient}</p><span className="text-xs font-medium text-copper">{MSG_LABEL[x.status]}</span></div>
              <p className="mt-1 whitespace-pre-wrap">{x.content}</p>
              <div className="mt-3 flex gap-2">
                {x.status === "rascunho" && <Button size="sm" variant="outline" onClick={() => patch((s) => ({ ...s, messages: s.messages.map((y) => (y.id === x.id ? { ...y, status: "aguardando_revisao" } : y)) }))}>Enviar para revisão</Button>}
                {x.status === "aguardando_revisao" && (canConfirmDeadline(v.role) || v.role === "gestor"
                  ? <Button size="sm" onClick={() => patch((s) => ({ ...s, messages: s.messages.map((y) => (y.id === x.id ? { ...y, status: "pronto_envio_manual" } : y)) }))}>Aprovar</Button>
                  : <span className="text-xs text-muted-foreground">Aguardando aprovação de advogado.</span>)}
                {x.status === "pronto_envio_manual" && <Button size="sm" onClick={() => setConfirmMsg(x)}>Confirmar envio manual</Button>}
              </div>
            </article>
          ))}
          <Dialog open={!!confirmMsg} onOpenChange={(o) => !o && setConfirmMsg(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Confirmar ação manual</DialogTitle><DialogDescription>Nenhuma mensagem será enviada. Será apenas registrada uma ação simulada.</DialogDescription></DialogHeader>
              <p className="text-sm"><strong>Destinatário:</strong> {confirmMsg?.recipient}</p>
              <p className="rounded-lg bg-muted p-3 text-sm">{confirmMsg?.content}</p>
              <DialogFooter><Button variant="outline" onClick={() => setConfirmMsg(null)}>Cancelar</Button>
                <Button onClick={() => { const x = confirmMsg!; patch((s) => ({ ...s, messages: s.messages.map((y) => (y.id === x.id ? { ...y, status: "acao_simulada" } : y)), timeline: [ev("comunicacao", `Ação de envio simulada para ${x.recipient}`), ...s.timeline] })); setConfirmMsg(null); toast.success("Ação de envio simulada registrada"); }}>Registrar ação simulada</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {canFin && (
          <TabsContent value="financeiro">
            {recs.length === 0 ? <EmptyState title="Sem lançamentos" /> : (
              <ul className="space-y-2">{recs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm">
                  <div className="flex-1"><p className="font-semibold">{r.label}</p><p className="text-muted-foreground">{r.kind} · vence {fmtDateTime(r.dueDate)}</p></div>
                  <p className="tabular">{brl(r.paid)} / {brl(r.amount)}</p>
                  {r.paid < r.amount && <Button size="sm" variant="outline" onClick={() => {
                    const val = Math.min(r.amount - r.paid, Math.round(r.amount / 2));
                    patch((s) => ({ ...s, receivables: s.receivables.map((y) => (y.id === r.id ? { ...y, paid: y.paid + val } : y)) }));
                    toast.success(`Recebimento manual de ${brl(val)} registrado (demo)`);
                  }}>Registrar pagamento parcial</Button>}
                </li>))}</ul>
            )}
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
