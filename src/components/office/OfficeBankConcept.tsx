import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  FileSearch,
  Landmark,
  LockKeyhole,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canSeeFinance } from "@/features/demo/permissions";
import { fmtDate, useOfficeView } from "@/features/demo/store";
import { formatBrlCents } from "@/features/demo/money";
import type { Office } from "@/features/demo/types";

type Section = "bancos" | "conexao" | "saldos" | "extrato" | "conciliacao" | "consentimentos";
const route = {
  bancos: "/o/$org/financeiro/bancos",
  conexao: "/o/$org/financeiro/conexao",
  saldos: "/o/$org/financeiro/saldos",
  extrato: "/o/$org/financeiro/extrato",
  conciliacao: "/o/$org/financeiro/conciliacao",
  consentimentos: "/o/$org/financeiro/consentimentos",
} as const;
const names: Record<Section, string> = {
  bancos: "Bancos conectados",
  conexao: "Assistente de conexão",
  saldos: "Saldos consolidados",
  extrato: "Extrato unificado",
  conciliacao: "Conciliação financeira",
  consentimentos: "Consentimentos",
};
const descriptions: Record<Section, string> = {
  bancos: "Visão ilustrativa das instituições e conexões do escritório.",
  conexao: "Jornada visual de autorização, sem iniciar conexão bancária.",
  saldos: "Estrutura prevista para saldos de contas, ainda sem fonte bancária.",
  extrato:
    "Prévia da leitura de movimentos; a lista abaixo contém somente lançamentos manuais demo.",
  conciliacao: "Prévia de conferência humana entre lançamentos, sem importar transações.",
  consentimentos: "Escopos e revogação ilustrativos. Nenhuma autorização bancária foi criada.",
};
const card = "rounded-xl border bg-card p-5 shadow-soft";
const chip =
  "inline-flex rounded-full border border-copper/40 bg-copper-soft px-2 py-1 text-xs font-semibold text-copper";

export function OfficeBankConcept({ office, section }: { office: Office; section: Section }) {
  const view = useOfficeView(office);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  if (!canSeeFinance(view.role)) return <DeniedState />;
  const rows = view.receivables.filter((item) =>
    (item.label + " " + (view.matterById(item.matterId)?.code ?? ""))
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  const pending = view.receivables.filter((item) => item.reviewStatus !== "revisado_demo");
  const toggle = (id: string) =>
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  return (
    <div className="space-y-5">
      <Link
        to="/o/$org/financeiro"
        params={{ org: office.slug }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Financeiro
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={names[section]} subtitle={descriptions[section]} />
        <span className={chip}>Conceito · Fase 2</span>
      </div>
      <nav
        aria-label="Telas conceituais de Open Finance"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {(Object.keys(route) as Section[]).map((key) => (
          <Link
            key={key}
            to={route[key]}
            params={{ org: office.slug }}
            className={
              key === section
                ? "shrink-0 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "shrink-0 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted"
            }
          >
            {names[key]}
          </Link>
        ))}
      </nav>
      <div
        role="note"
        className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
      >
        Nenhum banco, saldo, extrato, consentimento ou transação real está conectado nesta
        demonstração. Dados jurídicos e valores exibidos abaixo são fictícios.
      </div>
      {section === "bancos" && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className={card}>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              <h2 className="font-display text-xl">Instituições</h2>
            </div>
            <div className="mt-5">
              <EmptyState
                title="Nenhum banco conectado"
                hint="A conexão bancária depende de integração, consentimento e verificação em fase posterior."
              />
            </div>
            <Button className="mt-5" variant="outline" asChild>
              <Link to={route.conexao} params={{ org: office.slug }}>
                Explorar jornada de conexão <ArrowRight />
              </Link>
            </Button>
          </section>
          <section className={card}>
            <h2 className="font-display text-xl">Visão prevista</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-copper" /> Acompanhar instituições
                autorizadas
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-copper" /> Identificar conta, escopo e
                validade
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-copper" /> Revisar falhas antes de
                reconectar
              </li>
            </ul>
          </section>
        </div>
      )}
      {section === "conexao" && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className={card}>
            <h2 className="font-display text-xl">Etapas da jornada</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                "Escolher instituição",
                "Revisar escopos",
                "Autorizar no banco",
                "Conferir retorno",
              ].map((name, index) => (
                <li
                  key={name}
                  className={
                    index === step
                      ? "rounded-lg border border-primary bg-primary/5 p-3 text-sm"
                      : "rounded-lg border p-3 text-sm"
                  }
                >
                  <span className="block font-display text-xl">{index + 1}</span>
                  {name}
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-lg bg-muted p-4">
              <p className="font-medium">
                {
                  [
                    "Escolha da instituição",
                    "Escopos necessários",
                    "Autorização fora do sistema",
                    "Conferência e validade",
                  ][step]
                }
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {
                  [
                    "A lista de instituições só será preenchida por integração real.",
                    "Dados de conta e movimentação exigem consentimento explícito.",
                    "Esta demonstração não abre site de banco nem solicita credenciais.",
                    "Nenhum retorno bancário está disponível agora.",
                  ][step]
                }
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((value) => value - 1)}
              >
                Anterior
              </Button>
              <Button disabled={step === 3} onClick={() => setStep((value) => value + 1)}>
                Próxima etapa
              </Button>
            </div>
          </section>
          <section className={card}>
            <LockKeyhole className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-xl">Consentimento sob controle</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Antes de qualquer operação futura, o escritório precisa revisar finalidade, escopo,
              prazo e revogação. Nenhum consentimento é criado aqui.
            </p>
            <Link
              to={route.consentimentos}
              params={{ org: office.slug }}
              className="mt-5 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver tela de consentimentos <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      )}
      {section === "saldos" && (
        <div className="grid gap-4 md:grid-cols-3">
          <section className={card}>
            <Wallet className="size-5 text-copper" />
            <p className="mt-3 text-sm text-muted-foreground">Saldo bancário</p>
            <p className="mt-2 font-display text-2xl">Indisponível</p>
            <p className="mt-2 text-xs text-muted-foreground">Sem contas conectadas</p>
          </section>
          <section className={card}>
            <CreditCard className="size-5 text-copper" />
            <p className="mt-3 text-sm text-muted-foreground">Contas incluídas</p>
            <p className="mt-2 font-display text-2xl">0</p>
            <p className="mt-2 text-xs text-muted-foreground">Nenhuma autorização ativa</p>
          </section>
          <section className={card}>
            <FileSearch className="size-5 text-copper" />
            <p className="mt-3 text-sm text-muted-foreground">Lançamentos manuais em aberto</p>
            <p className="mt-2 font-display text-2xl">{pending.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">Do financeiro demo; não são saldos</p>
          </section>
        </div>
      )}
      {section === "extrato" && (
        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Prévia de movimentos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Amostra construída com lançamentos manuais do escritório.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Buscar movimento"
                className="pl-9"
                placeholder="Buscar descrição ou caso"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          {rows.length ? (
            <div className="mt-5 divide-y">
              {rows.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {view.matterById(item.matterId)?.code ?? "Caso indisponível"} ·{" "}
                      {fmtDate(item.dueDate)} · lançamento manual demo
                    </p>
                  </div>
                  <p className="font-semibold">{formatBrlCents(item.amountCents)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState title="Nenhum lançamento na busca" />
            </div>
          )}
        </section>
      )}
      {section === "conciliacao" && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className={card}>
            <h2 className="font-display text-xl">Itens para conferência visual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Marcar um item organiza apenas esta prévia; nenhuma baixa ou conciliação é feita.
            </p>
            {pending.length ? (
              <ul className="mt-5 space-y-2">
                {pending.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        className="mt-1 size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {view.matterById(item.matterId)?.code} · {formatBrlCents(item.amountCents)} · previsão sujeita a revisão
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState title="Nenhuma previsão pendente de revisão" />
              </div>
            )}
          </section>
          <section className={card}>
            <h2 className="font-display text-xl">Revisão humana</h2>
            <p className="mt-3 font-display text-3xl">{checkedIds.length}</p>
            <p className="text-sm text-muted-foreground">itens marcados nesta prévia</p>
            <div className="mt-5 rounded-lg bg-muted p-4 text-sm">
              Extratos bancários e lançamentos externos não foram importados. A conferência futura
              precisará identificar origem, divergências e aprovação.
            </div>
          </section>
        </div>
      )}
      {section === "consentimentos" && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className={card}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="font-display text-xl">Autorizações bancárias</h2>
            </div>
            <div className="mt-5">
              <EmptyState
                title="Nenhum consentimento ativo"
                hint="A jornada visual não cria autorização nem conecta instituição."
              />
            </div>
          </section>
          <section className={card}>
            <CircleHelp className="size-5 text-copper" />
            <h2 className="mt-3 font-display text-xl">O que será revisado</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Instituição e conta autorizada</li>
              <li>• Finalidade e tipos de dados</li>
              <li>• Data de expiração e renovação</li>
              <li>• Revogação pelo titular</li>
            </ul>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => setPreview((value) => !value)}
            >
              {preview ? "Ocultar exemplo" : "Mostrar exemplo de escopo"}
            </Button>
            {preview && (
              <p className="mt-3 rounded-lg border bg-muted p-3 text-sm">
                Exemplo conceitual: leitura de saldo e movimentos por 90 dias. Não é consentimento
                válido nem solicitação enviada.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
