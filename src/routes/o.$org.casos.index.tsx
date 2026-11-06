import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfidentialityBadge, DueBadge, EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { canCreateMatter } from "@/features/demo/permissions";
import { findOffice, fmtDate, useDemo, useOfficeView } from "@/features/demo/store";
import type { MatterNature } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/casos/")({
  head: () => ({ meta: [{ title: "Casos · JURIDO Escritórios" }, { name: "description", content: "Lista de casos jurídicos do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Casos,
});

const STATUS: Record<string, string> = { ativo: "Ativo", em_analise: "Em análise", suspenso: "Suspenso", encerrado: "Encerrado" };
const MATTER_NATURE: Record<MatterNature, string> = { consultivo: "Consultivo", extrajudicial: "Extrajudicial", pre_contencioso: "Pré-contencioso", judicial: "Judicial" };

function Casos() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { setNewMatterOpen } = useDemo();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("todas");
  const [nature, setNature] = useState<MatterNature | "todas">("todas");
  const list = v.matters.filter((m) =>
    (area === "todas" || m.practiceAreaId === area) &&
    (nature === "todas" || m.matterNature === nature) &&
    `${m.title} ${m.code} ${m.clientIds.map(v.clientName).join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Casos" subtitle={`${v.matters.length} casos visíveis para seu perfil`}
        actions={canCreateMatter(v.role) && <Button onClick={() => setNewMatterOpen(true)}><Plus /> Novo caso</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Filtrar casos" placeholder="Filtrar por título, código ou cliente" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-44 bg-card" aria-label="Área"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as áreas</SelectItem>{office.practiceAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={nature} onValueChange={(value) => setNature(value as MatterNature | "todas")}>
          <SelectTrigger className="w-48 bg-card" aria-label="Filtrar casos por natureza"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as naturezas</SelectItem>{Object.entries(MATTER_NATURE).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="casos" currentValues={{ q, area, nature }} onApply={(filters) => { setQ(filters.q); setArea(filters.area); setNature(filters.nature as MatterNature | "todas"); }} /></div>
      {list.length === 0 ? <EmptyState title="Nenhum caso encontrado" hint="Ajuste os filtros ou crie um novo caso." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const procs = v.proceedings.filter((p) => p.matterId === m.id).length;
            const next = v.deadlines.filter((d) => d.matterId === m.id && !["concluido", "cancelado"].includes(d.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
            return (
              <Link key={m.id} to="/o/$org/casos/$id" params={{ org, id: m.id }} className="group rounded-xl border bg-card p-4 shadow-soft transition hover:border-primary/40">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="tabular">{m.code}</span><ConfidentialityBadge value={m.confidentiality} /></div>
                <h2 className="mt-2 font-display text-lg leading-snug group-hover:text-primary">{m.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{m.clientIds.map(v.clientName).join(", ")}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{v.areaName(m.practiceAreaId)}</span><span>{MATTER_NATURE[m.matterNature]}</span><span>{STATUS[m.status]}</span>
                  <span>{procs ? `${procs} ${procs === 1 ? "processo" : "processos"}` : "Sem processo"}</span><span>Atual. {fmtDate(m.updatedAt)}</span>
                </div>
                {next && <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs"><DueBadge iso={next.dueDate} /><span className="truncate text-muted-foreground">{next.title}</span></div>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
