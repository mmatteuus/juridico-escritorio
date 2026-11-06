import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeCnj } from "@/features/demo/permissions";
import { findOffice, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/processos")({
  head: () => ({ meta: [{ title: "Processos · JURIDO Escritórios" }, { name: "description", content: "Processos vinculados aos casos." }, { name: "robots", content: "noindex" }] }),
  component: Processos,
});

function Processos() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [matterId, setMatterId] = useState("");
  const [cnj, setCnj] = useState("");
  const [court, setCourt] = useState("");
  const [warn, setWarn] = useState(false);
  if (!canSeeCnj(v.role)) return <DeniedState />;

  const link = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matterId || !cnj.trim()) { toast.error("Escolha o caso e informe o número de teste."); return; }
    const dup = v.proceedings.some((p) => p.cnjMasked === cnj.trim());
    if (dup && !warn) { setWarn(true); return; }
    update((d) => ({
      ...d,
      proceedings: [...d.proceedings, { id: uid("p"), officeId: office.id, matterId, cnjMasked: cnj.trim(), court: court || "—", phase: "Inicial", sourceState: "manual_demo" }],
      timeline: [timelineEvent({ officeId: office.id, matterId, actor: v.me?.name ?? "—", kind: "observacao", text: `Vinculou processo ${cnj.trim()}` }), ...d.timeline],
    }));
    setCnj(""); setCourt(""); setWarn(false);
    toast.success("Processo vinculado ao caso");
  };

  return (
    <>
      <PageHeader title="Processos" subtitle="Números de teste, cadastrados manualmente. Sem consulta a tribunais." />
      <form onSubmit={link} className="mb-6 rounded-xl border bg-card p-4 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Vincular processo a um caso</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={matterId} onValueChange={setMatterId}><SelectTrigger className="w-64" aria-label="Caso"><SelectValue placeholder="Caso" /></SelectTrigger>
            <SelectContent>{v.matters.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} · {m.title}</SelectItem>)}</SelectContent></Select>
          <Input aria-label="Número CNJ de teste" placeholder="0000000-00.2026.0.00.TESTE" value={cnj} onChange={(e) => { setCnj(e.target.value); setWarn(false); }} className="w-72" />
          <Input aria-label="Tribunal" placeholder="Vara / tribunal" value={court} onChange={(e) => setCourt(e.target.value)} className="w-52" />
          <Button type="submit" variant={warn ? "destructive" : "default"}><Link2 /> {warn ? "Vincular mesmo assim" : "Vincular"}</Button>
        </div>
        {warn && <p role="alert" className="mt-2 text-sm text-destructive">Este número já está cadastrado neste escritório. Confirme se não é duplicidade.</p>}
      </form>
      {v.proceedings.length === 0 ? <EmptyState title="Nenhum processo visível" /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {v.proceedings.map((p) => {
            const m = v.matterById(p.matterId);
            return (
              <li key={p.id} className="rounded-xl border bg-card p-4 shadow-soft">
                <Link to="/o/$org/processos/$id" params={{org,id:p.id}} className="tabular break-all font-semibold text-primary hover:underline">{p.cnjMasked || "Processo sem número"}</Link>
                <p className="text-sm text-muted-foreground">{p.court} · Fase: {p.phase}</p>
                {m && <Link to="/o/$org/casos/$id" params={{ org, id: m.id }} search={{ tab: "processos" }} className="mt-2 inline-block text-sm text-primary hover:underline">{m.code} · {m.title}</Link>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
