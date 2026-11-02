import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ConfidentialityBadge, DeniedState, EmptyState } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDate, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/clientes/$id")({
  head: () => ({ meta: [{ title: "Ficha do cliente · JURIDO Escritórios" }, { name: "description", content: "Ficha do cliente." }, { name: "robots", content: "noindex" }] }),
  component: Cliente,
});

function Cliente() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const c = v.clients.find((x) => x.id === id);
  if (!c) return <DeniedState />;
  const matters = v.matters.filter((m) => m.clientIds.includes(c.id));
  const ids = new Set(matters.map((m) => m.id));
  const docs = canSeeLegalDocs(v.role) ? v.docs.filter((d) => ids.has(d.matterId)) : [];
  const intakes = v.intakes.filter((i) => i.name === c.name);

  return (
    <>
      <Link to="/o/$org/clientes" params={{ org }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Clientes</Link>
      <header className="mb-6 rounded-xl border bg-card p-5 shadow-soft">
        <p className="text-xs text-muted-foreground">{c.kind === "PF" ? "Pessoa física" : "Empresa"} · dados fictícios</p>
        <h1 className="mt-1 font-display text-3xl font-medium">{c.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contato: {c.contact} · {c.city}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 font-display text-xl">Casos vinculados</h2>
          {matters.length === 0 ? <EmptyState title="Nenhum caso visível para seu perfil" /> : (
            <ul className="space-y-2">{matters.map((m) => (
              <li key={m.id}><Link to="/o/$org/casos/$id" params={{ org, id: m.id }} className="flex items-center justify-between gap-2 rounded-xl border bg-card p-4 hover:border-primary/40">
                <span><span className="block text-sm font-medium">{m.title}</span><span className="text-xs text-muted-foreground">{m.code} · {v.areaName(m.practiceAreaId)}</span></span>
                <ConfidentialityBadge value={m.confidentiality} /></Link></li>))}</ul>
          )}
        </section>
        <section className="space-y-6">
          <div>
            <h2 className="mb-2 font-display text-xl">Documentos</h2>
            {docs.length === 0 ? <EmptyState title="Nenhum documento disponível" /> : (
              <ul className="divide-y rounded-xl border bg-card">{docs.map((d) => <li key={d.id} className="p-3 text-sm">{d.title} <span className="text-xs text-muted-foreground">· v{d.version}</span></li>)}</ul>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-display text-xl">Histórico de atendimento</h2>
            {intakes.length === 0 ? <EmptyState title="Sem atendimentos registrados" /> : (
              <ul className="space-y-2 text-sm">{intakes.map((i) => <li key={i.id} className="rounded-xl border bg-card p-3">{i.summary}<span className="block text-xs text-muted-foreground">{fmtDate(i.createdAt)} · {i.stage.replace("_", " ")}</span></li>)}</ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
