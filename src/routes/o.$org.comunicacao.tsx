import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { findOffice, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { MessageDraft } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/comunicacao")({ component: ComunicacaoPage });
const labels: Record<MessageDraft["status"], string> = {
  rascunho: "Rascunho",
  aguardando_revisao: "Aguardando revisão",
  pronto_envio_manual: "Pronto para envio manual",
  acao_simulada: "Ação simulada",
};
function ComunicacaoPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [clientId, setClientId] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");
  const filtered = useMemo(
    () =>
      v.messages.filter(
        (m) =>
          (status === "todos" || m.status === status) &&
          `${m.recipient} ${m.content} ${v.matterById(m.matterId)?.code ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [v, status, query],
  );
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const client = v.clients.find((item) => item.id === clientId && item.officeId === office.id);
    const matter = v.matterById(matterId);
    if (!matter || !client || !matter.clientIds.includes(client.id) || !content.trim()) {
      setFormError("Selecione um caso e um cliente visíveis vinculados a ele, e informe a mensagem.");
      return;
    }
    setFormError("");
    update((d) => ({
      ...d,
      messages: [
        {
          id: uid("msg"),
          officeId: office.id,
          matterId,
          clientId: client.id,
          recipient: client.name,
          content: content.trim(),
          status: "rascunho",
        },
        ...d.messages,
      ],
    }));
    setOpen(false);
    setMatterId("");
    setClientId("");
    setContent("");
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Comunicações"
        subtitle="Rascunhos e revisão de mensagens vinculadas a casos visíveis"
        actions={
          <Button onClick={() => { setFormError(""); setOpen((x) => !x); }}>
            <Plus /> Novo rascunho
          </Button>
        }
      />
      {open && (
        <form onSubmit={save} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl">Novo rascunho</h2>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Caso
              <select
                className="mt-1 block w-full rounded-md border bg-background p-2"
                value={matterId}
                onChange={(e) => { setMatterId(e.target.value); setClientId(""); }}
                required
              >
                <option value="">Selecione o caso</option>
                {v.matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Cliente destinatário
              <select className="mt-1 block w-full rounded-md border bg-background p-2" value={clientId} onChange={(e) => setClientId(e.target.value)} required disabled={!matterId}>
                <option value="">{matterId ? "Selecione um cliente do caso" : "Selecione primeiro o caso"}</option>
                {v.matterById(matterId)?.clientIds.map((id) => v.clients.find((client) => client.id === id)).filter((client): client is NonNullable<typeof client> => !!client).map((client) => <option key={client.id} value={client.id}>{client.name} · {client.contact}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Somente clientes vinculados ao caso e visíveis neste perfil.</span>
            </label>
          </div>
          <label className="text-sm font-medium">
            Mensagem
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border bg-background p-3 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit">Salvar rascunho</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nenhuma mensagem é enviada nesta demonstração.
          </p>
        </form>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Buscar comunicações"
            className="pl-9"
            placeholder="Buscar destinatário ou conteúdo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por status"
          className="rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todos">Todos os estados</option>
          {Object.entries(labels).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3"><SavedFilterViews officeId={office.id} role={v.role} collection="comunicacao" currentValues={{ query, status }} onApply={(filters) => { setQuery(filters.query); setStatus(filters.status); }} /></div>
      {filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((m) => (
            <article key={m.id} className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-medium">{m.recipient}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.matterById(m.matterId) ? (
                        <Link
                          to="/o/$org/casos/$id"
                          params={{ org, id: m.matterId }}
                          className="text-primary hover:underline"
                        >
                          {v.matterById(m.matterId)?.code}
                        </Link>
                      ) : (
                        "Caso não disponível"
                      )}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{labels[m.status]}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">{m.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/o/$org/comunicacao/$id" params={{ org, id: m.id }}>
                    Abrir revisão supervisionada
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma comunicação encontrada"
          hint="Ajuste os filtros ou crie um rascunho para um caso visível."
        />
      )}
    </div>
  );
}
