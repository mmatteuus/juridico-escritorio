import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/o/$org/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações · JURIDO Escritórios" }, { name: "description", content: "Central de notificações do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Notificacoes,
});

const CATS = { todas: "Todas", prazo: "Prazos", tarefa: "Tarefas", atribuicao: "Atribuições", mencao: "Menções", documento: "Documentos", resposta_cliente: "Clientes", suporte: "Suporte", sincronizacao: "Atualização", sistema: "Sistema", adiadas: "Adiadas" } as const;

function Notificacoes() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [cat, setCat] = useState<keyof typeof CATS>("todas");
  const now = Date.now();
  const isSnoozed = (n: (typeof v.notifications)[number]) => !!n.snoozedUntil && new Date(n.snoozedUntil).getTime() > now;
  const activeUnread = v.notifications.filter((n) => !n.read && !isSnoozed(n)).length;
  const list = v.notifications.filter((n) => cat === "adiadas" ? isSnoozed(n) : !isSnoozed(n) && (cat === "todas" || n.category === cat)).sort((a, b) => b.at.localeCompare(a.at));
  const pagination = useOfficePagination(list, cat);
  const ids = new Set(v.notifications.map((n) => n.id));
  const mark = (id?: string) => update((d) => ({ ...d, notifications: d.notifications.map((n) => (n.officeId === office.id && (id ? n.id === id : ids.has(n.id)) ? { ...n, read: true } : n)) }));
  const snooze = (id: string) => update((d) => ({ ...d, notifications: d.notifications.map((n) => n.officeId === office.id && n.id === id ? { ...n, snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } : n) }));
  const unsnooze = (id: string) => update((d) => ({ ...d, notifications: d.notifications.map((n) => {
    if (n.officeId !== office.id || n.id !== id) return n;
    const { snoozedUntil: _snoozedUntil, ...active } = n;
    return active;
  }) }));

  return (
    <>
      <PageHeader title="Notificações" subtitle={`${activeUnread} não lidas na central · ${v.notifications.filter(isSnoozed).length} adiadas`} actions={<Button variant="outline" onClick={() => mark()} disabled={!v.notifications.some((n) => !n.read)}>Marcar todas como lidas</Button>} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar notificações">
        {(Object.keys(CATS) as (keyof typeof CATS)[]).map((c) => (
          <Button key={c} aria-pressed={cat === c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{CATS[c]}</Button>
        ))}
      </div>
      <div className="mb-4"><SavedFilterViews officeId={office.id} role={v.role} collection="notificacoes" currentValues={{ cat }} onApply={(filters) => { const categories = Object.keys(CATS) as (keyof typeof CATS)[]; setCat(categories.includes(filters.cat as keyof typeof CATS) ? filters.cat as keyof typeof CATS : "todas"); }} /></div>
      {list.length === 0 ? <EmptyState title="Sem notificações nesta categoria" /> : (
        <ul className="divide-y rounded-xl border bg-card shadow-soft">
          {pagination.items.map((n) => (
            <li key={n.id} className={cn("flex flex-wrap items-center gap-3 p-4", !n.read && "bg-secondary/50")}>
              <span className={cn("size-2 rounded-full", n.read ? "bg-transparent" : "bg-primary")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title} {n.priority === "alta" && <span className="ml-1 text-xs font-semibold text-destructive">· prioridade alta</span>}</p>
                <p className="text-xs text-muted-foreground">{CATS[n.category]} · {fmtDateTime(n.at)} {!n.read && "· não lida"}{isSnoozed(n) && n.snoozedUntil && ` · adiada até ${fmtDateTime(n.snoozedUntil)}`}</p>
              </div>
              <div className="flex w-full flex-wrap gap-2 pl-5 sm:w-auto sm:pl-0">
              {n.taskId && v.tasks.some(task => task.id === n.taskId) && <Button size="sm" variant="ghost" asChild><Link to="/o/$org/tarefas/$id" params={{ org, id: n.taskId }} onClick={() => mark(n.id)}>Abrir tarefa</Link></Button>}
              {n.docId && v.docs.some(doc => doc.id === n.docId) && <Button size="sm" variant="ghost" asChild><Link to="/o/$org/casos/$id" params={{ org, id: n.matterId ?? v.docs.find(doc => doc.id === n.docId)!.matterId }} search={{ tab: "documentos" }} onClick={() => mark(n.id)}>Abrir documento</Link></Button>}
              {!n.taskId && !n.docId && n.matterId && v.matterById(n.matterId) && <Button size="sm" variant="ghost" asChild><Link to="/o/$org/casos/$id" params={{ org, id: n.matterId }} onClick={() => mark(n.id)}>Abrir caso</Link></Button>}
              {n.category === "suporte" && <Button size="sm" variant="ghost" asChild><Link to="/o/$org/suporte" params={{ org }} onClick={() => mark(n.id)}>Abrir suporte</Link></Button>}
              {!n.read && <Button size="sm" variant="outline" onClick={() => mark(n.id)}>Marcar lida</Button>}
              {cat === "adiadas" ? <Button size="sm" variant="outline" onClick={() => unsnooze(n.id)}>Reativar agora</Button> : <Button size="sm" variant="ghost" onClick={() => snooze(n.id)}>Adiar 24h</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <OfficePaginationControls pagination={pagination} />
    </>
  );
}
