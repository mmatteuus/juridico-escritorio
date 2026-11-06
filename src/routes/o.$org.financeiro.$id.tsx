import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CircleAlert, FileText, Wallet } from "lucide-react";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { Button } from "@/components/ui/button";
import { canSeeFinance } from "@/features/demo/permissions";
import { findOffice, fmtDate, useDemo, useOfficeView } from "@/features/demo/store";
import { formatBrlCents } from "@/features/demo/money";
import type { Receivable } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/financeiro/$id")({
  head: () => ({
    meta: [
      { title: "Lançamento financeiro · JURIDO Escritórios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinancialDetail,
});

const kindLabel: Record<Receivable["kind"], string> = {
  honorario: "Honorários",
  despesa: "Despesa ou custa",
  repasse: "Repasse previsto",
};
const categoryLabel: Record<NonNullable<Receivable["category"]>, string> = {
  honorario_contratual: "Honorários contratuais",
  honorario_sucumbencial: "Honorários sucumbenciais",
  despesa_escritorio: "Despesa do escritório",
  custa_judicial: "Custa judicial",
  reembolso_despesa: "Reembolso de despesa",
  reembolso_custa: "Reembolso de custa",
};
const card = "min-w-0 rounded-xl border bg-card p-5 shadow-soft";
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{value}</dd>
    </div>
  );
}

function FinancialDetail() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [reviewNote, setReviewNote] = useState("");
  if (!canSeeFinance(view.role)) return <DeniedState />;
  const item = view.receivables.find((row) => row.id === id);
  if (!item)
    return (
      <div className="space-y-4">
        <EmptyState
          title="Lançamento não disponível"
          hint="O registro pode pertencer a outro escritório ou a um caso sem acesso para este perfil."
        />
        <Button variant="outline" asChild>
          <Link to="/o/$org/financeiro" params={{ org }}>
            Voltar ao financeiro
          </Link>
        </Button>
      </div>
    );
  const matter = view.matterById(item.matterId);
  if (!matter) return <DeniedState />;
  const relatedCosts = view.receivables.filter(
    (row) => row.id !== item.id && row.matterId === item.matterId && row.kind === "despesa",
  );
  const proceeding = view.proceedings.find((row) => row.matterId === item.matterId);
  const linkedCost = item.relatedCostId
    ? relatedCosts.find((row) => row.id === item.relatedCostId && row.clientId === item.clientId)
    : undefined;
  const review = () => {
    if (!reviewNote.trim()) return;
    update((data) => ({
      ...data,
      receivables: data.receivables.map((row) =>
        row.id === item.id && row.officeId === office.id
          ? { ...row, reviewStatus: "revisado_demo", reason: reviewNote.trim() }
          : row,
      ),
    }));
    setReviewNote("");
  };
  return (
    <div className="space-y-5">
      <Link
        to="/o/$org/financeiro"
        params={{ org }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Financeiro
      </Link>
      <PageHeader
        title={item.label}
        subtitle={`${kindLabel[item.kind]} · ${matter.code}`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/o/$org/casos/$id" params={{ org, id: matter.id }}>
              Abrir caso
            </Link>
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-sm text-muted-foreground">Valor previsto</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{formatBrlCents(item.amountCents)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-muted-foreground">Data de referência</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{fmtDate(item.dueDate)}</p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className={card}>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            <h2 className="font-display text-xl">Dados do lançamento</h2>
          </div>
          <dl className="mt-4">
            <Info
              label="Categoria"
              value={item.category ? categoryLabel[item.category] : kindLabel[item.kind]}
            />
            <Info label="Responsável" value={view.memberName(item.responsibleId)} />
            <Info
              label="Estado de revisão"
              value={
                item.reviewStatus === "revisado_demo"
                  ? "Revisado na demonstração"
                  : item.reviewStatus === "em_revisao"
                    ? "Em revisão"
                    : "Pendente"
              }
            />
            <Info label="Justificativa" value={item.reason ?? "Não informada"} />
            <Info
              label="Custo de origem"
              value={
                linkedCost?.label ??
                (item.relatedCostId ? "Referência não disponível" : "Não aplicável")
              }
            />
            <Info label="Data de referência" value={fmtDate(item.dueDate)} />
            <Info label="Caso" value={`${matter.code} · ${matter.title}`} />
            <Info label="Cliente(s)" value={matter.clientIds.map(view.clientName).join(" · ")} />
            <Info label="Processo" value={proceeding?.cnjMasked ?? "Sem processo vinculado"} />
          </dl>
          <p className="mt-4 rounded-lg border border-copper/30 bg-copper-soft p-3 text-xs text-copper">
            Esta é uma previsão fictícia. Não representa extrato, cobrança, obrigação contábil ou pagamento comprovado.
          </p>
        </section>
        <section className={card}>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h2 className="font-display text-xl">Custas e reembolso</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Um reembolso previsto precisa apontar para uma despesa ou custa do mesmo cliente e caso.
            Esta visão mostra apenas registros relacionados, sem comprovar ressarcimento.
          </p>
          {relatedCosts.length ? (
            <ul className="mt-4 divide-y">
              {relatedCosts.map((cost) => (
                <li key={cost.id} className="py-3">
                  <Link
                    to="/o/$org/financeiro/$id"
                    params={{ org, id: cost.id }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {cost.label}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBrlCents(cost.amountCents)} · referência {fmtDate(cost.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <CircleAlert className="size-4 shrink-0" />
              <p>Nenhuma despesa ou custa relacionada aparece neste caso.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
