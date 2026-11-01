import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/o/$org/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações · JURIDO Escritórios" }, { name: "description", content: "Central de notificações do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Notificacoes,
});

const CATS = { todas: "Todas", prazo: "Prazos", tarefa: "Tarefas", documento: "Documentos", sistema: "Sistema" } as const;

function Notificacoes() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [cat, setCat] = useState<keyof typeof CATS>("todas");
  const list = v.notifications.filter((n) => cat === "todas" || n.category === cat).sort((a, b) => b.at.localeCompare(a.at));
  const ids = new Set(v.notifications.map((n) => n.id));
  const mark = (id?: string) => update((d) => ({ ...d, notifications: d.notifications.map((n) => ((id ? n.id === id : ids.has(n.id)) ? { ...n, read: true } : n)) }));

  return (
    <>
      <PageHeader title="Notificações" subtitle={`${v.notifications.filter((n) => !n.read).length} não lidas`} actions={<Button variant="outline" onClick={() => mark()}>Marcar todas como lidas</Button>} />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {(Object.keys(CATS) as (keyof typeof CATS)[]).map((c) => (
          <Button key={c} role="tab" aria-selected={cat === c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{CATS[c]}</Button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState title="Sem notificações nesta categoria" /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {list.map((n) => (
            <li key={n.id} className={cn("flex flex-wrap items-center gap-3 p-4", !n.read && "bg-secondary/50")}>
              <span className={cn("size-2 rounded-full", n.read ? "bg-transparent" : "bg-primary")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title} {n.priority === "alta" && <span className="ml-1 text-xs font-semibold text-destructive">· prioridade alta</span>}</p>
                <p className="text-xs text-muted-foreground">{CATS[n.category]} · {fmtDateTime(n.at)} {!n.read && "· não lida"}</p>
              </div>
              {n.matterId && <Button size="sm" variant="ghost" asChild><Link to="/o/$org/casos/$id" params={{ org, id: n.matterId }} onClick={() => mark(n.id)}>Abrir caso</Link></Button>}
              {!n.read && <Button size="sm" variant="outline" onClick={() => mark(n.id)}>Marcar lida</Button>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
