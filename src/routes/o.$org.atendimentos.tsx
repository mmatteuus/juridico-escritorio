import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeniedState, PageHeader } from "@/components/office/badges";
import { canApproveIntake } from "@/features/demo/permissions";
import { findOffice, fmtDate, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { ConflictCheck, Intake, IntakeStage, Matter, MatterNature } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/atendimentos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean; intakeId?: string } => ({
    ...(s["novo"] ? { novo: true } : {}),
    ...(typeof s["intakeId"] === "string" ? { intakeId: s["intakeId"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Atendimentos · JURIDO Escritórios" }, { name: "description", content: "Pipeline de atendimentos do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Atendimentos,
});

const STAGES: { id: IntakeStage; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "em_triagem", label: "Em triagem" },
  { id: "conflito_pendente", label: "Revisão de conflito" },
  { id: "documentos_pendentes", label: "Documentos pendentes" },
  { id: "aprovado", label: "Aprovado" },
  { id: "convertido", label: "Convertido" },
  { id: "arquivado", label: "Arquivado" },
];
const NEXT: Partial<Record<IntakeStage, IntakeStage>> = { novo: "em_triagem", em_triagem: "conflito_pendente", conflito_pendente: "documentos_pendentes", documentos_pendentes: "aprovado" };
const resolvedConflictStatuses: ConflictCheck["status"][] = ["sem_indicio", "prosseguir_com_ressalvas"];

function Atendimentos() {
  const { org } = Route.useParams();
  const { novo, intakeId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [sel, setSel] = useState<Intake | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", clientKind: "PF" as Intake["clientKind"], existingClientId: "", counterparty: "", area: office.practiceAreas[0]?.id ?? "", matterNature: "" as MatterNature | "", summary: "" });
  const actor = v.me?.name ?? "—";
  const canApprove = canApproveIntake(v.role);
  const canSeeOfficeQueue = ["gestor", "socio", "coordenador"].includes(v.role);
  const existingClients = v.clients.filter(client => client.officeId === office.id);

  useEffect(() => {
    if (!intakeId) return;
    const intake = v.intakes.find(item => item.id === intakeId);
    if (intake) setSel(intake);
  }, [intakeId, v.intakes]);

  useEffect(() => {
    if (sel && !v.intakes.some((intake) => intake.id === sel.id && intake.officeId === office.id)) {
      setSel(null);
      navigate({ search: {}, replace: true });
    }
  }, [intakeId, navigate, office.id, sel, v.intakes]);

  const conflictsFor = (intake: Intake) => v.conflicts.filter(check => check.intakeId === intake.id);
  const conflictReviewComplete = (intake: Intake) => {
    const checks = conflictsFor(intake);
    return checks.length > 0 && checks.every(check => resolvedConflictStatuses.includes(check.status));
  };
  if (v.role === "financeiro") return <DeniedState />;

  const setStage = (i: Intake, stage: IntakeStage) => {
    if (!v.intakes.some((intake) => intake.id === i.id && intake.officeId === office.id)) {
      toast.error("Este atendimento não está mais disponível na sua fila.");
      setSel(null);
      return;
    }
    if ((stage === "documentos_pendentes" || stage === "aprovado") && !conflictReviewComplete(i)) {
      toast.error("Conclua a revisão humana de conflito antes de avançar.");
      return;
    }
    if (stage === "aprovado" && !canApprove) return;
    update((d) => ({ ...d, intakes: d.intakes.map((x) => (x.officeId === office.id && x.id === i.id ? { ...x, stage } : x)) }));
    setSel((s) => (s ? { ...s, stage } : s));
    toast.success(`Movido para ${STAGES.find((s) => s.id === stage)?.label}`);
  };

  const convert = (i: Intake) => {
    const visibleIntake = v.intakes.find((intake) => intake.id === i.id && intake.officeId === office.id);
    if (!visibleIntake) {
      toast.error("Este atendimento não está mais disponível na sua fila.");
      setSel(null);
      return;
    }
    i = visibleIntake;
    if (i.stage !== "aprovado" || !canApprove || !conflictReviewComplete(i)) {
      toast.error("A conversão exige aprovação profissional e revisão de conflito concluída.");
      return;
    }
    const selectedClient = i.existingClientId
      ? existingClients.find(client => client.id === i.existingClientId)
      : undefined;
    if (i.existingClientId && (!selectedClient || selectedClient.kind !== i.clientKind)) {
      toast.error("O cliente selecionado não está disponível para este perfil ou escritório.");
      return;
    }
    const clientId = selectedClient?.id ?? uid("c");
    const matterId = uid("k");
    const checks = conflictsFor(i);
    const cleared = checks.every(check => check.status === "sem_indicio");
    const matter: Matter = {
      id: matterId, officeId: office.id, code: `${office.monogram}-2026-${100 + v.matters.length + 1}`,
      title: `Caso – ${i.name}`, matterNature: i.matterNature, clientIds: [clientId], opposingParties: checks.map(check => check.counterparty).join(", "), practiceAreaId: i.practiceAreaId, status: "em_analise",
      assignedMemberIds: v.me ? [v.me.id] : [], confidentiality: "normal", grantRoles: [],
      updatedAt: new Date().toISOString(), summary: i.summary,
    };
    update((d) => ({
      ...d,
      clients: d.clients.some(client => client.id === clientId && client.officeId === office.id)
        ? d.clients
        : [...d.clients, { id: clientId, officeId: office.id, name: i.name, kind: i.clientKind, contact: i.contact, city: "—", conflictStatus: cleared ? "liberado" : "pendente" }],
      matters: [matter, ...d.matters],
      intakes: d.intakes.map((x) => (x.officeId === office.id && x.id === i.id ? { ...x, stage: "convertido", matterId } : x)),
      timeline: [timelineEvent({ officeId: office.id, matterId, actor, kind: "cadastro", text: "Caso criado a partir de atendimento" }), ...d.timeline],
    }));
    toast.success("Atendimento convertido em caso");
    setSel(null);
    navigate({ to: "/o/$org/casos/$id", params: { org, id: matterId } });
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const counterparties = [...new Set(form.counterparty.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean))];
    const selectedClient = form.existingClientId
      ? existingClients.find(client => client.id === form.existingClientId)
      : undefined;
    if (form.existingClientId && (!selectedClient || selectedClient.kind !== form.clientKind)) { toast.error("Selecione um cliente visível deste escritório."); return; }
    if ((!selectedClient && (!form.name.trim() || !form.contact.trim())) || !counterparties.length || !form.area || !form.matterNature || !v.me?.id) { toast.error("Preencha nome, contato, partes relacionadas, área, natureza e responsável do perfil atual."); return; }
    const prospectName = selectedClient?.name ?? form.name.trim();
    const prospectContact = selectedClient?.contact ?? form.contact.trim();
    const intakeId = uid("i");
    const createdAt = new Date().toISOString();
    const checks: ConflictCheck[] = counterparties.map(counterparty => ({ id: uid("conflito"), officeId: office.id, intakeId, prospect: prospectName, counterparty, summary: form.summary.trim(), status: "pendente", createdAt, reviewedBy: undefined, reviewReason: undefined, reviewedAt: undefined }));
    update((d) => ({ ...d, intakes: [{ id: intakeId, officeId: office.id, name: prospectName, contact: prospectContact, clientKind: selectedClient?.kind ?? form.clientKind, ...(selectedClient ? { existingClientId: selectedClient.id } : {}), assigneeId: v.me!.id, practiceAreaId: form.area, matterNature: form.matterNature as MatterNature, summary: form.summary.trim(), stage: "novo", createdAt }, ...d.intakes], conflicts: [...checks, ...d.conflicts] }));
    setForm({ ...form, name: "", contact: "", clientKind: "PF", existingClientId: "", counterparty: "", matterNature: "", summary: "" });
    navigate({ search: {}, replace: true });
    toast.success("Atendimento registrado; revisão de conflito pendente na demonstração");
  };

  return (
    <>
      <PageHeader title="Atendimentos" subtitle={canSeeOfficeQueue ? "Fila de todo o escritório. Da primeira conversa ao caso, com conversão só após aprovação profissional." : `Minha carteira: exibe apenas atendimentos atribuídos a ${v.me?.name ?? "este perfil"}.`}
        actions={<Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Novo atendimento</Button>} />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((s) => {
          const items = v.intakes.filter((i) => i.stage === s.id);
          return (
            <section key={s.id} className="w-64 shrink-0 rounded-xl border bg-muted/60 p-3" aria-label={s.label}>
              <h2 className="mb-2 flex justify-between text-sm font-semibold">{s.label}<span className="text-muted-foreground">{items.length}</span></h2>
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.id}>
                    <button onClick={() => setSel(i)} className="w-full rounded-lg border bg-card p-3 text-left shadow-soft hover:border-primary/40">
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Responsável: {v.memberName(i.assigneeId)}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">{v.areaName(i.practiceAreaId)} · {fmtDate(i.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => { if (!o) { setSel(null); navigate({ search: {}, replace: true }); } }}>
        <DialogContent>
          {sel && <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">{sel.name}</DialogTitle>
              <DialogDescription>{sel.clientKind} · {sel.existingClientId ? "Cliente existente selecionado" : "Novo cliente na conversão"} · {v.areaName(sel.practiceAreaId)} · Responsável: {v.memberName(sel.assigneeId)} · {STAGES.find((s) => s.id === sel.stage)?.label} · {sel.contact}</DialogDescription>
            </DialogHeader>
            <p className="text-sm">{sel.summary}</p>
            <section className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/><div><h3 className="text-sm font-semibold">Verificação de conflito</h3><p className="mt-1 text-xs text-muted-foreground">A equipe compara as partes com os registros visíveis ao perfil. Nenhuma coincidência decide conflito automaticamente.</p></div></div>
              {canApprove ? conflictsFor(sel).length ? <ul className="mt-3 space-y-2">{conflictsFor(sel).map(check => <li key={check.id} className="rounded-md border bg-card p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="break-words font-medium">{check.prospect} × {check.counterparty}</span><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{check.status === "sem_indicio" ? "Sem indício após revisão" : check.status === "prosseguir_com_ressalvas" ? "Prosseguir com ressalvas" : check.status === "risco_identificado" ? "Risco identificado" : check.status === "em_revisao" ? "Em revisão" : "Pendente"}</span></div>{check.reviewReason && <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">Decisão registrada por {check.reviewedBy}: {check.reviewReason}</p>}</li>)}</ul> : <p className="mt-3 text-xs text-amber-800">Nenhuma verificação associada ainda. Registre as partes e revise as possíveis correspondências.</p> : <p className="mt-3 text-xs text-muted-foreground">A revisão das partes está pendente. Os detalhes são exibidos apenas a profissionais autorizados.</p>}
              <p className="mt-3 text-xs text-muted-foreground">{conflictReviewComplete(sel) ? "Revisão humana registrada; o atendimento pode seguir para a etapa de documentos." : "A progressão permanece bloqueada até a decisão humana em todas as verificações associadas."}</p>
              {canApprove && <Button className="mt-3" size="sm" variant="outline" asChild><Link to="/o/$org/conflitos" params={{ org }} search={{ intakeId: sel.id }}>Abrir revisão de conflito</Link></Button>}
              {!canApprove && <p className="mt-3 text-xs text-muted-foreground">Solicite a revisão a um advogado, coordenação ou gestão do escritório.</p>}
            </section>
            {sel.stage === "documentos_pendentes" && !canApprove && <p className="text-xs text-muted-foreground">A aprovação e conversão exigem advogado ou gestora.</p>}
            <DialogFooter className="flex-wrap gap-2">
              {sel.stage !== "convertido" && sel.stage !== "arquivado" && <Button variant="outline" onClick={() => setStage(sel, "arquivado")}>Arquivar</Button>}
              {NEXT[sel.stage] && (NEXT[sel.stage] !== "aprovado" || canApprove) && (
                <Button variant="outline" disabled={((NEXT[sel.stage] === "documentos_pendentes" || NEXT[sel.stage] === "aprovado") && !conflictReviewComplete(sel)) || (NEXT[sel.stage] === "aprovado" && !canApprove)} onClick={() => setStage(sel, NEXT[sel.stage]!)}>Mover para {STAGES.find((s) => s.id === NEXT[sel.stage])?.label}</Button>
              )}
              {sel.stage === "aprovado" && canApprove && <Button disabled={!conflictReviewComplete(sel)} onClick={() => convert(sel)}>Converter em caso <ArrowRight /></Button>}
              {sel.stage === "convertido" && sel.matterId && <Button asChild><Link to="/o/$org/casos/$id" params={{ org, id: sel.matterId }}>Abrir caso</Link></Button>}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!novo} onOpenChange={(o) => !o && navigate({ search: {}, replace: true })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-xl font-medium">Novo atendimento</DialogTitle><DialogDescription>Use apenas dados fictícios.</DialogDescription></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="i-existing-client">Cliente existente (opcional)</Label>
              <Select value={form.existingClientId || "novo"} onValueChange={(clientId) => {
                if (clientId === "novo") {
                  setForm({ ...form, existingClientId: "", name: form.existingClientId ? "" : form.name, contact: form.existingClientId ? "" : form.contact });
                  return;
                }
                const client = existingClients.find(item => item.id === clientId);
                if (client) setForm({ ...form, existingClientId: client.id, clientKind: client.kind, name: client.name, contact: client.contact });
              }}>
                <SelectTrigger id="i-existing-client" aria-label="Cliente existente opcional"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="novo">Novo cliente / prospect</SelectItem>{existingClients.map(client => <SelectItem key={client.id} value={client.id}>{client.kind} · {client.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Clientes disponíveis conforme o acesso deste perfil neste escritório.</p>
            </div>
            <div className="space-y-1.5"><Label htmlFor="i-kind">Tipo de cliente</Label>
              <Select value={form.clientKind} disabled={!!form.existingClientId} onValueChange={(clientKind) => setForm({ ...form, clientKind: clientKind as Intake["clientKind"] })}>
                <SelectTrigger id="i-kind" aria-label="Tipo de cliente"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PF">Pessoa física (PF)</SelectItem><SelectItem value="PJ">Pessoa jurídica (PJ)</SelectItem></SelectContent>
              </Select>
              {form.existingClientId && <p className="text-xs text-muted-foreground">O tipo acompanha o cadastro do cliente selecionado.</p>}
            </div>
            <div className="space-y-1.5"><Label htmlFor="i-n">{form.clientKind === "PJ" ? "Nome / razão social" : "Nome"}</Label><Input id="i-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" readOnly={!!form.existingClientId} required /></div>
            <div className="space-y-1.5"><Label htmlFor="i-c">Contato</Label><Input id="i-c" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Telefone, e-mail ou outro contato" readOnly={!!form.existingClientId} required /></div>
            <div className="space-y-1.5"><Label htmlFor="i-counterparty">Partes contrárias ou relacionadas</Label><Input id="i-counterparty" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} placeholder="Separe por vírgula ou escreva ‘a identificar’" required /><p className="text-xs text-muted-foreground">Cada parte cria uma verificação pendente. A busca não conclui nem decide conflito automaticamente.</p></div>
            <div className="space-y-1.5"><Label htmlFor="i-area">Área</Label>
              <Select value={form.area} onValueChange={(a) => setForm({ ...form, area: a })}><SelectTrigger id="i-area" aria-label="Área de atuação" aria-required="true"><SelectValue /></SelectTrigger>
                <SelectContent>{office.practiceAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="i-nature">Natureza provável do caso</Label>
              <Select value={form.matterNature} onValueChange={(matterNature) => setForm({ ...form, matterNature: matterNature as MatterNature })}><SelectTrigger id="i-nature" aria-label="Natureza provável do caso" aria-required="true"><SelectValue placeholder="Selecione a natureza" /></SelectTrigger>
                <SelectContent><SelectItem value="consultivo">Consultivo</SelectItem><SelectItem value="extrajudicial">Extrajudicial</SelectItem><SelectItem value="pre_contencioso">Pré-contencioso</SelectItem><SelectItem value="judicial">Judicial</SelectItem></SelectContent></Select>
              <p className="text-xs text-muted-foreground">Classificação inicial, preservada se o atendimento for convertido em caso.</p>
            </div>
            <div className="space-y-1.5"><Label htmlFor="i-s">Relato</Label><Textarea id="i-s" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Registrar atendimento demo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
