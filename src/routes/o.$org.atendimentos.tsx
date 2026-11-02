import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/office/badges";
import { canApproveIntake } from "@/features/demo/permissions";
import { findOffice, fmtDate, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Intake, IntakeStage, Matter } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/atendimentos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Atendimentos · JURIDO Escritórios" }, { name: "description", content: "Pipeline de atendimentos do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Atendimentos,
});

const STAGES: { id: IntakeStage; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "em_triagem", label: "Em triagem" },
  { id: "documentos_pendentes", label: "Documentos pendentes" },
  { id: "aprovado", label: "Aprovado" },
  { id: "convertido", label: "Convertido" },
  { id: "arquivado", label: "Arquivado" },
];
const NEXT: Partial<Record<IntakeStage, IntakeStage>> = { novo: "em_triagem", em_triagem: "documentos_pendentes", documentos_pendentes: "aprovado" };

function Atendimentos() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [sel, setSel] = useState<Intake | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", area: office.practiceAreas[0]?.id ?? "", summary: "" });
  const actor = v.me?.name ?? "—";
  const canApprove = canApproveIntake(v.role);

  const setStage = (i: Intake, stage: IntakeStage) => {
    update((d) => ({ ...d, intakes: d.intakes.map((x) => (x.id === i.id ? { ...x, stage } : x)) }));
    setSel((s) => (s ? { ...s, stage } : s));
    toast.success(`Movido para ${STAGES.find((s) => s.id === stage)?.label}`);
  };

  const convert = (i: Intake) => {
    const clientId = uid("c");
    const matterId = uid("k");
    const matter: Matter = {
      id: matterId, officeId: office.id, code: `${office.monogram}-2026-${100 + v.matters.length + 1}`,
      title: `Caso – ${i.name}`, clientIds: [clientId], practiceAreaId: i.practiceAreaId, status: "em_analise",
      assignedMemberIds: v.me ? [v.me.id] : [], confidentiality: "normal", grantRoles: [],
      updatedAt: new Date().toISOString(), summary: i.summary,
    };
    update((d) => ({
      ...d,
      clients: [...d.clients, { id: clientId, officeId: office.id, name: i.name, kind: "PF", contact: i.contact, city: "—" }],
      matters: [matter, ...d.matters],
      intakes: d.intakes.map((x) => (x.id === i.id ? { ...x, stage: "convertido", matterId } : x)),
      timeline: [timelineEvent({ officeId: office.id, matterId, actor, kind: "cadastro", text: "Caso criado a partir de atendimento" }), ...d.timeline],
    }));
    toast.success("Atendimento convertido em caso");
    setSel(null);
    navigate({ to: "/o/$org/casos/$id", params: { org, id: matterId } });
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe o nome."); return; }
    update((d) => ({ ...d, intakes: [{ id: uid("i"), officeId: office.id, name: form.name.trim(), contact: form.contact, practiceAreaId: form.area, summary: form.summary, stage: "novo", createdAt: new Date().toISOString() }, ...d.intakes] }));
    setForm({ ...form, name: "", contact: "", summary: "" });
    navigate({ search: {}, replace: true });
    toast.success("Atendimento registrado");
  };

  return (
    <>
      <PageHeader title="Atendimentos" subtitle="Da primeira conversa ao caso — conversão só após aprovação profissional."
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
                      <p className="mt-2 text-[11px] text-muted-foreground">{v.areaName(i.practiceAreaId)} · {fmtDate(i.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          {sel && <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">{sel.name}</DialogTitle>
              <DialogDescription>{v.areaName(sel.practiceAreaId)} · {STAGES.find((s) => s.id === sel.stage)?.label} · {sel.contact}</DialogDescription>
            </DialogHeader>
            <p className="text-sm">{sel.summary}</p>
            {sel.stage === "documentos_pendentes" && !canApprove && <p className="text-xs text-muted-foreground">Aprovação exige advogado ou gestora.</p>}
            <DialogFooter className="flex-wrap gap-2">
              {sel.stage !== "convertido" && sel.stage !== "arquivado" && <Button variant="outline" onClick={() => setStage(sel, "arquivado")}>Arquivar</Button>}
              {NEXT[sel.stage] && (NEXT[sel.stage] !== "aprovado" || canApprove) && (
                <Button variant="outline" onClick={() => setStage(sel, NEXT[sel.stage]!)}>Mover para {STAGES.find((s) => s.id === NEXT[sel.stage])?.label}</Button>
              )}
              {sel.stage === "aprovado" && <Button onClick={() => convert(sel)}>Converter em caso <ArrowRight /></Button>}
              {sel.stage === "convertido" && sel.matterId && <Button asChild><Link to="/o/$org/casos/$id" params={{ org, id: sel.matterId }}>Abrir caso</Link></Button>}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!novo} onOpenChange={(o) => !o && navigate({ search: {}, replace: true })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-xl font-medium">Novo atendimento</DialogTitle><DialogDescription>Use apenas dados fictícios.</DialogDescription></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="i-n">Nome</Label><Input id="i-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="i-c">Contato</Label><Input id="i-c" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Área</Label>
              <Select value={form.area} onValueChange={(a) => setForm({ ...form, area: a })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{office.practiceAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="i-s">Relato</Label><Textarea id="i-s" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Registrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
