import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { findOffice, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/clientes/")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Clientes · JURIDO Escritórios" }, { name: "description", content: "Clientes do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Clientes,
});

function Clientes() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"todos" | "PF" | "PJ">("todos");
  useEffect(() => {
    if (novo) navigate({ to: "/o/$org/clientes/novo", params: { org }, replace: true });
  }, [novo, navigate, org]);
  const list = v.clients.filter((c) => (kind === "todos" || c.kind === kind) && c.name.toLowerCase().includes(q.toLowerCase()));
  const pagination = useOfficePagination(list, `${q}|${kind}`);

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${v.clients.length} clientes fictícios`} actions={<Button asChild><Link to="/o/$org/clientes/novo" params={{ org }}><Plus /> Novo cliente</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Buscar cliente" placeholder="Buscar por nome" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        {(["todos", "PF", "PJ"] as const).map((k) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} aria-pressed={kind === k}>{k === "todos" ? "Todos" : k === "PF" ? "Pessoa física" : "Empresa"}</Button>
        ))}
      </div>
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="clientes" currentValues={{ q, kind }} onApply={(filters) => { setQ(filters.q); setKind(filters.kind as typeof kind); }} /></div>
      {list.length === 0 ? <EmptyState title="Nenhum cliente encontrado" /> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pagination.items.map((c) => {
            const n = v.matters.filter((m) => m.clientIds.includes(c.id)).length;
            return (
              <li key={c.id}>
                <Link to="/o/$org/clientes/$id" params={{ org, id: c.id }} className="block rounded-xl border bg-card p-4 shadow-soft hover:border-primary/40">
                  <p className="text-xs text-muted-foreground">{c.kind === "PF" ? "Pessoa física" : "Empresa"} · {c.city}</p>
                  <p className="mt-1 font-display text-lg">{c.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.contact} · {n} caso(s) visível(is)</p>{c.conflictStatus === "pendente" && <p className="mt-2 text-xs font-medium text-copper">Conflito de interesses pendente</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <OfficePaginationControls pagination={pagination} />
    </>
  );
}
