import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState, DeniedState } from "@/components/office/badges";
import { canSeeFinance } from "@/features/demo/permissions";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import { formatBrlCents, parseBrlCents } from "@/features/demo/money";
import type { Receivable } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/financeiro")({ component: FinancePage });
const kinds: Record<Receivable["kind"], string> = {
  honorario: "Honorário",
  despesa: "Despesa ou custa",
  repasse: "Reembolso/repasse",
};
const categories: Record<NonNullable<Receivable["category"]>, string> = {
  honorario_contratual: "Honorários contratuais",
  honorario_sucumbencial: "Honorários sucumbenciais",
  despesa_escritorio: "Despesa do escritório",
  custa_judicial: "Custa judicial",
  reembolso_despesa: "Reembolso de despesa",
  reembolso_custa: "Reembolso de custa",
};
const categoryKind = (category: NonNullable<Receivable["category"]>): Receivable["kind"] =>
  category.startsWith("honorario")
    ? "honorario"
    : category.startsWith("reembolso")
      ? "repasse"
      : "despesa";
function FinancePage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("todos");
  const [reviewState, setReviewState] = useState<"todos" | "pendente" | "em_revisao" | "revisado_demo">("todos");
  const [open, setOpen] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [label, setLabel] = useState("");
  const [entryCategory, setEntryCategory] =
    useState<NonNullable<Receivable["category"]>>("honorario_contratual");
  const [clientId, setClientId] = useState("");
  const [relatedCostId, setRelatedCostId] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMatter = v.matterById(matterId);
  const relatedCosts = v.receivables.filter(
    (r) => r.matterId === matterId && r.clientId === clientId && r.kind === "despesa",
  );
  const isReimbursement = entryCategory.startsWith("reembolso");
  const rows = useMemo(
    () =>
      v.receivables
        .filter(
          (r) =>
            (kind === "todos" || r.kind === kind) &&
            (reviewState === "todos" || (r.reviewStatus ?? "pendente") === reviewState) &&
            `${r.label} ${v.matterById(r.matterId)?.code ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [v, kind, reviewState, query],
  );
  if (!canSeeFinance(v.role)) return <DeniedState />;
  const incoming = v.receivables
    .filter((r) => r.kind === "honorario" || r.category?.startsWith("reembolso"))
    .reduce((n, r) => n + r.amountCents, 0);
  const outgoing = v.receivables
    .filter(
      (r) => r.kind === "despesa" || (r.kind === "repasse" && !r.category?.startsWith("reembolso")),
    )
    .reduce((n, r) => n + r.amountCents, 0);
  const pendingReview = v.receivables.filter(
    (r) => r.reviewStatus === "pendente" || r.reviewStatus === "em_revisao",
  ).length;
  const selected = v.receivables.find((r) => r.id === selectedId);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseBrlCents(amount);
    const cost = relatedCosts.find((r) => r.id === relatedCostId);
    if (
      !selectedMatter ||
      !selectedMatter.clientIds.includes(clientId) ||
      !label.trim() ||
      !reason.trim() ||
      !dueDate ||
      amountCents === null ||
      (isReimbursement && (!cost || cost.officeId !== office.id))
    ) {
      setFormError(
        "Confira os dados. Informe um valor BRL como 1.234,56, maior que zero e sem notação científica.",
      );
      return;
    }
    setFormError("");
    update((d) => ({
      ...d,
      receivables: [
        {
          id: uid("fin"),
          officeId: office.id,
          matterId,
          clientId,
          ...(v.me ? { responsibleId: v.me.id } : {}),
          label: label.trim(),
          kind: categoryKind(entryCategory),
          category: entryCategory,
          ...(isReimbursement ? { relatedCostId: cost!.id } : {}),
          reason: reason.trim(),
          reviewStatus: "pendente",
          amountCents,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
        },
        ...d.receivables,
      ],
    }));
    setOpen(false);
    setMatterId("");
    setClientId("");
    setRelatedCostId("");
    setLabel("");
    setReason("");
    setAmount("");
    setDueDate("");
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Financeiro"
        subtitle="Honorários, despesas e repasses dos casos visíveis"
        actions={
          <Button
            onClick={() => {
              setFormError("");
              setOpen((x) => !x);
            }}
          >
            <Plus /> Novo lançamento
          </Button>
        }
      />
      {formError && open && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Entradas previstas", formatBrlCents(incoming)],
          ["Saídas previstas", formatBrlCents(outgoing)],
          ["Em revisão", String(pendingReview)],
        ].map(([name, value]) => (
          <div key={name} className="rounded-xl border bg-card p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="mt-2 font-display text-2xl">{value}</p>
          </div>
        ))}
      </div>
      {open && (
        <form onSubmit={save} className="grid gap-4 rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl">Novo lançamento demonstrativo</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Caso
              <select
                className="mt-1 block w-full rounded-md border bg-background p-2"
                value={matterId}
                onChange={(e) => {
                  setMatterId(e.target.value);
                  setClientId("");
                  setRelatedCostId("");
                }}
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
              Descrição
              <Input
                className="mt-1"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium">
              Categoria
              <select
                className="mt-1 block w-full rounded-md border bg-background p-2"
                value={entryCategory}
                onChange={(e) => {
                  setEntryCategory(e.target.value as NonNullable<Receivable["category"]>);
                  setRelatedCostId("");
                }}
              >
                {Object.entries(categories).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Cliente
              <select
                className="mt-1 block w-full rounded-md border bg-background p-2"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setRelatedCostId("");
                }}
                required
              >
                <option value="">Selecione o cliente</option>
                {selectedMatter?.clientIds.map((id) => (
                  <option key={id} value={id}>
                    {v.clientName(id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Valor previsto (R$)
              <Input
                className="mt-1"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="1.234,56"
                aria-describedby="finance-amount-help"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <span id="finance-amount-help" className="mt-1 block text-xs font-normal text-muted-foreground">
                Formato brasileiro; armazenado em centavos inteiros.
              </span>
            </label>
            <label className="text-sm font-medium">
              Vencimento
              <Input
                className="mt-1"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
            {isReimbursement && (
              <label className="text-sm font-medium">
                Despesa ou custa de origem
                <select
                  className="mt-1 block w-full rounded-md border bg-background p-2"
                  value={relatedCostId}
                  onChange={(e) => setRelatedCostId(e.target.value)}
                  required
                >
                  <option value="">Selecione o custo do mesmo cliente e caso</option>
                  {relatedCosts.map((cost) => (
                    <option key={cost.id} value={cost.id}>
                      {cost.label} · {formatBrlCents(cost.amountCents)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm font-medium md:col-span-2">
              Justificativa
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border bg-background p-2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Salvar lançamento</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      <section className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Wallet className="size-5 text-primary" /> Lançamentos
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                aria-label="Buscar lançamento"
                placeholder="Buscar lançamento"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrar tipo"
              className="rounded-md border bg-background px-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              {Object.entries(kinds).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar estado da revisão"
              className="rounded-md border bg-background px-2 text-sm"
              value={reviewState}
              onChange={(e) => setReviewState(e.target.value as typeof reviewState)}
            >
              <option value="todos">Todos os estados</option>
              <option value="pendente">Pendente</option>
              <option value="em_revisao">Em revisão</option>
              <option value="revisado_demo">Revisado na demonstração</option>
            </select>
          </div>
        </div>
        {rows.length ? (
          <div className="grid gap-2">
            {rows.map((r) => {
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-left hover:border-primary/40 ${selectedId === r.id ? "border-primary bg-primary/5" : ""}`}
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.category ? categories[r.category] : kinds[r.kind]} ·{" "}
                      {r.reviewStatus === "revisado_demo" ? "Revisado na demonstração" : r.reviewStatus === "em_revisao" ? "Em revisão" : "Pendente de revisão"} ·{" "}
                      {v.matterById(r.matterId)?.code ?? "Caso não disponível"} · Referência{" "}
                      {fmtDate(r.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatBrlCents(r.amountCents)}</p>
                    <p className="text-xs text-copper">Previsão demonstrativa</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhum lançamento encontrado"
            hint="Ajuste os filtros ou crie um lançamento para um caso visível."
          />
        )}
      </section>
      {selected && (
        <section className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Detalhe do lançamento</h2>
              <p className="mt-1 text-sm font-medium">{selected.label}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/o/$org/financeiro/$id" params={{ org, id: selected.id }}>
                  Abrir ficha completa
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                Fechar
              </Button>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Valor previsto</dt>
              <dd className="font-medium">{formatBrlCents(selected.amountCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data de referência</dt>
              <dd className="font-medium">{fmtDate(selected.dueDate)}</dd>
            </div>
          </dl>
          <Link
            to="/o/$org/casos/$id"
            params={{ org, id: selected.matterId }}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Abrir caso vinculado →
          </Link>
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Valores e lançamentos são previsões fictícias. Não há status de pagamento, transação bancária ou recebimento comprovado nesta demonstração.
      </p>
    </div>
  );
}
