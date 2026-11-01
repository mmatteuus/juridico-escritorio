import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Confidentiality, Matter, Office } from "@/features/demo/types";

export function NewMatterDialog({ office }: { office: Office }) {
  const { newMatterOpen, setNewMatterOpen, update } = useDemo();
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [area, setArea] = useState(office.practiceAreas[0].id);
  const [conf, setConf] = useState<Confidentiality>("normal");
  const [summary, setSummary] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return toast.error("Informe título e cliente.");
    const id = uid("k");
    const n = v.matters.length + 1;
    const matter: Matter = {
      id, officeId: office.id, code: `${office.monogram}-2026-${String(100 + n)}`, title: title.trim(),
      clientIds: [clientId], practiceAreaId: area, status: "em_analise",
      assignedMemberIds: v.me ? [v.me.id] : [], confidentiality: conf,
      grantRoles: conf === "normal" ? [] : [v.role], updatedAt: new Date().toISOString(),
      summary: summary.trim() || "Caso criado sem processo judicial vinculado.",
    };
    update((d) => ({
      ...d,
      matters: [matter, ...d.matters],
      timeline: [timelineEvent({ officeId: office.id, matterId: id, actor: v.me?.name ?? "—", kind: "cadastro", text: "Caso cadastrado (sem número CNJ)" }), ...d.timeline],
    }));
    toast.success("Caso criado");
    setNewMatterOpen(false);
    setTitle(""); setSummary(""); setClientId("");
    navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id } });
  };

  return (
    <Dialog open={newMatterOpen} onOpenChange={setNewMatterOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">Novo caso</DialogTitle>
          <DialogDescription>Um caso não precisa de processo judicial. O número CNJ pode ser vinculado depois.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="nm-title">Título interno</Label><Input id="nm-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{v.clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Área</Label>
              <Select value={area} onValueChange={setArea}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{office.practiceAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1.5"><Label>Confidencialidade</Label>
            <Select value={conf} onValueChange={(x) => setConf(x as Confidentiality)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="restrito_a_equipe">Restrito à equipe</SelectItem>
                <SelectItem value="sigilo_reforcado">Sigilo reforçado</SelectItem>
              </SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="nm-sum">Resumo</Label><Textarea id="nm-sum" value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setNewMatterOpen(false)}>Cancelar</Button><Button type="submit">Criar caso</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
