import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ConfidentialityBadge, DeniedState, DueBadge, EmptyState } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDate, fmtDateTime, useOfficeView } from "@/features/demo/store";

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
  const intakes = v.intakes.filter((intake) => !!intake.matterId && matters.some((matter) => matter.id === intake.matterId));
  const openDls = v.deadlines.filter((d) => ids.has(d.matterId) && !["concluido", "cancelado"].includes(d.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextFor = (mid: string) => openDls.find((d) => d.matterId === mid);
  const summary = [
    { label: "Casos visíveis", value: String(matters.length) },
    { label: "Prazos em aberto", value: String(openDls.length) },
    { label: "Próximo prazo", value: openDls[0] ? fmtDateTime(openDls[0].dueDate) : "—" },
  ];

  return (
    <>
      <Link to="/o/$org/clientes" params={{ org }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Clientes</Link>
      <header className="mb-6 rounded-xl border bg-card p-5 shadow-soft">
        <p className="text-xs text-muted-foreground">{c.kind === "PF" ? "Pessoa física" : "Empresa"} · dados fictícios</p>
        <h1 className="mt-1 font-display text-3xl font-medium">{c.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contato: {c.contact} · {c.city}{c.state ? `/${c.state}` : ""}</p>{c.document && <p className="mt-1 text-xs text-muted-foreground">Documento: {c.kind === "PF" ? "CPF" : "CNPJ"} •••• {c.document.slice(-4)}</p>}{c.conflictStatus === "pendente" && <p className="mt-3 inline-flex rounded-full bg-copper-soft px-2 py-1 text-xs font-medium text-copper">Conflito de interesses pendente</p>}{c.responsibleId && <p className="mt-2 text-xs text-muted-foreground">Responsável: {v.memberName(c.responsibleId)}</p>}{c.notes && <p className="mt-2 text-sm text-muted-foreground">{c.notes}</p>}
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
          {summary.map((x) => <div key={x.label}><dt className="text-xs text-muted-foreground">{x.label}</dt><dd className="font-display text-xl tabular">{x.value}</dd></div>)}
        </dl>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 font-display text-xl">Casos vinculados</h2>
          {matters.length === 0 ? <EmptyState title="Nenhum caso visível para seu perfil" /> : (
            <ul className="space-y-2">{matters.map((m) => (
              <li key={m.id}><Link to="/o/$org/casos/$id" params={{ org, id: m.id }} className="flex items-center justify-between gap-2 rounded-xl border bg-card p-4 hover:border-primary/40">
                <span><span className="block text-sm font-medium">{m.title}</span><span className="text-xs text-muted-foreground">{m.code} · {v.areaName(m.practiceAreaId)}</span>
                  {nextFor(m.id) && <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground"><DueBadge iso={nextFor(m.id)!.dueDate} /> {nextFor(m.id)!.title}</span>}</span>
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
