import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Confidentiality, Matter, MatterNature, Office, Proceeding } from "@/features/demo/types";

export function NewMatterDialog({ office }: { office: Office }) {
  const { newMatterOpen, setNewMatterOpen, update } = useDemo();
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [matterNature, setMatterNature] = useState<MatterNature>("consultivo");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [area, setArea] = useState(office.practiceAreas[0]?.id ?? "");
  const [conf, setConf] = useState<Confidentiality>("normal");
  const [summary, setSummary] = useState("");
  const [opposingParties, setOpposingParties] = useState("");
  const [cnj, setCnj] = useState("");
  const [court, setCourt] = useState("");
  const [phase, setPhase] = useState("");

  const toggle = (list: string[], value: string, setter: (ids: string[]) => void) =>
    setter(list.includes(value) ? list.filter(id => id !== value) : [...list, value]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || clientIds.length === 0 || !area) { toast.error("Informe título, área e pelo menos um cliente."); return; }
    if (cnj.trim() && !court.trim()) { toast.error("Informe o tribunal para o processo inicial."); return; }
    const id = uid("k");
    const n = v.matters.length + 1;
    const matter: Matter = {
      id, officeId: office.id, code: `${office.monogram}-2026-${String(100 + n)}`, title: title.trim(), matterNature,
      clientIds, ...(opposingParties.trim() ? { opposingParties: opposingParties.trim() } : {}),
      practiceAreaId: area, status: "em_analise",
      assignedMemberIds: assignedMemberIds.length ? assignedMemberIds : v.me ? [v.me.id] : [],
      // The demo identifies the active user by role; grant the creator so the draft remains visible.
      confidentiality: conf, grantRoles: [v.role],
      updatedAt: new Date().toISOString(), summary: summary.trim() || "Caso criado para análise inicial.",
    };
    const proceeding: Proceeding | null = cnj.trim() ? {
      id: uid("proc"), officeId: office.id, matterId: id,
      cnjMasked: cnj.trim(), court: court.trim(), phase: phase.trim() || "Cadastro inicial", sourceState: "manual_demo",
    } : null;
    update(data => ({
      ...data,
      matters: [matter, ...data.matters],
      proceedings: proceeding ? [proceeding, ...data.proceedings] : data.proceedings,
      timeline: [timelineEvent({ officeId: office.id, matterId: id, actor: v.me?.name ?? "Equipe", kind: "cadastro", text: proceeding ? "Caso e processo inicial cadastrados (demo)" : "Caso cadastrado sem processo judicial" }), ...data.timeline],
    }));
    toast.success("Caso demonstrativo criado");
    setNewMatterOpen(false);
    setTitle(""); setMatterNature("consultivo"); setSummary(""); setClientIds([]); setAssignedMemberIds([]);
    setOpposingParties(""); setCnj(""); setCourt(""); setPhase("");
    navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id } });
  };

  return <Dialog open={newMatterOpen} onOpenChange={setNewMatterOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle className="font-display text-xl font-medium">Novo rascunho de caso</DialogTitle><DialogDescription>Cadastro demonstrativo em análise. Vincule clientes, equipe e, se existir, um processo inicial. A criação não aprova o caso nem conclui revisão de conflitos.</DialogDescription></DialogHeader>
      <p role="note" className="rounded-lg border border-copper/30 bg-copper-soft p-3 text-sm text-copper">Para um potencial cliente novo, registre primeiro o atendimento e conclua a revisão humana de conflitos. <Link to="/o/$org/atendimentos" params={{ org: office.slug }} search={{ novo: true }} className="font-semibold underline">Iniciar atendimento</Link></p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="nm-title">Título interno</Label><Input id="nm-title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Natureza do caso</Label><Select value={matterNature} onValueChange={value => setMatterNature(value as MatterNature)}><SelectTrigger aria-label="Natureza do caso"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="consultivo">Consultivo</SelectItem><SelectItem value="extrajudicial">Extrajudicial</SelectItem><SelectItem value="pre_contencioso">Pré-contencioso</SelectItem><SelectItem value="judicial">Judicial</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Natureza do trabalho; a existência de processo judicial é um vínculo separado e opcional.</p></div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Clientes vinculados *</legend><div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">{v.clients.map(client => <label key={client.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"><input type="checkbox" checked={clientIds.includes(client.id)} onChange={() => toggle(clientIds, client.id, setClientIds)} className="size-4 accent-primary" />{client.name}</label>)}</div><p className="text-xs text-muted-foreground">Selecione uma ou mais pessoas físicas ou jurídicas.</p></fieldset>
        <div className="space-y-1.5"><Label htmlFor="nm-opposing">Partes contrárias ou relacionadas</Label><Input id="nm-opposing" value={opposingParties} onChange={e => setOpposingParties(e.target.value)} placeholder="Nomes separados por vírgula" /></div>
        <div className="space-y-1.5"><Label>Área</Label><Select value={area} onValueChange={setArea}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{office.practiceAreas.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Responsáveis</legend><div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2">{v.members.filter(member => ["gestor", "socio", "coordenador", "advogado", "substituto"].includes(member.role)).map(member => <label key={member.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"><input type="checkbox" checked={assignedMemberIds.includes(member.id)} onChange={() => toggle(assignedMemberIds, member.id, setAssignedMemberIds)} className="size-4 accent-primary" />{member.name}</label>)}</div></fieldset>
        <div className="space-y-1.5"><Label>Confidencialidade</Label><Select value={conf} onValueChange={value => setConf(value as Confidentiality)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="restrito_a_equipe">Restrito à equipe</SelectItem><SelectItem value="sigilo_reforcado">Sigilo reforçado</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="nm-sum">Resumo</Label><Textarea id="nm-sum" value={summary} onChange={e => setSummary(e.target.value)} /></div>
        <fieldset className="space-y-3 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Processo inicial (opcional)</legend><p className="text-xs text-muted-foreground">Dados inseridos manualmente para a demonstração; sem consulta ao tribunal.</p><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="nm-cnj">Número CNJ</Label><Input id="nm-cnj" value={cnj} onChange={e => setCnj(e.target.value)} placeholder="0000000-00.0000.0.00.0000" /></div><div className="space-y-1"><Label htmlFor="nm-court">Tribunal</Label><Input id="nm-court" value={court} onChange={e => setCourt(e.target.value)} /></div><div className="space-y-1 sm:col-span-2"><Label htmlFor="nm-phase">Fase</Label><Input id="nm-phase" value={phase} onChange={e => setPhase(e.target.value)} /></div></div></fieldset>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setNewMatterOpen(false)}>Cancelar</Button><Button type="submit">Criar rascunho em análise</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
