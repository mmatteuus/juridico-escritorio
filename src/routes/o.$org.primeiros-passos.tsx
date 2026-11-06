import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  Building2,
  Users,
  UserRound,
  BriefcaseBusiness,
  FileText,
  Bell,
} from "lucide-react";
import { PageHeader } from "@/components/office/badges";
import { findOffice, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/primeiros-passos")({
  head: () => ({
    meta: [
      { title: "Primeiros passos · JURIDO Escritórios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FirstSteps,
});
function FirstSteps() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      title: "Conheça o painel",
      description: "Veja tarefas, prazos e compromissos em uma única visão.",
      done: true,
      icon: Bell,
      to: "/o/$org/inicio" as const,
      action: "Abrir painel",
    },
    {
      title: "Revise a identidade do escritório",
      description: "Confira nome, OAB demonstrativa, contatos, unidades e signatários.",
      done: Boolean(
        office.displayName &&
        office.address &&
        office.oabNumber &&
        office.signatoryMemberIds.length,
      ),
      icon: Building2,
      to: "/o/$org/perfil-escritorio" as const,
      action: "Ver perfil",
    },
    {
      title: "Conheça a equipe",
      description: "Visualize profissionais, funções e áreas de atuação.",
      done: view.members.length > 0,
      icon: Users,
      to: "/o/$org/equipe" as const,
      action: "Ver equipe",
    },
    {
      title: "Organize os clientes",
      description: "Consulte a carteira demonstrativa antes de abrir novos casos.",
      done: view.clients.length > 0,
      icon: UserRound,
      to: "/o/$org/clientes" as const,
      action: "Ver clientes",
    },
    {
      title: "Acompanhe os casos",
      description: "Acesse a carteira jurídica com visibilidade conforme o seu perfil.",
      done: view.matters.length > 0,
      icon: BriefcaseBusiness,
      to: "/o/$org/casos" as const,
      action: "Ver casos",
    },
    {
      title: "Confira os documentos",
      description: "Veja documentos e modelos disponíveis para os casos autorizados.",
      done: view.docs.length > 0,
      icon: FileText,
      to: "/o/$org/documentos" as const,
      action: "Ver documentos",
    },
  ];
  const visibleSteps =
    view.role === "financeiro"
      ? steps.filter((step) => step.title !== "Confira os documentos")
      : steps;
  const complete = visibleSteps.filter((step) => step.done).length;
  const active = visibleSteps[Math.min(activeStep, visibleSteps.length - 1)];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Primeiros passos"
        subtitle={`Conheça a operação de ${office.displayName} neste ambiente de demonstração.`}
      />
      <section className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-copper">
            Configuração inicial · demonstração
          </p>
          <h2 className="mt-1 font-display text-2xl">Roteiro guiado do escritório</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Avance pelas etapas para conhecer identidade, equipe e operação. Esta navegação não
            altera dados nem ativa recursos.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Etapas do roteiro">
          {visibleSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              aria-current={activeStep === index ? "step" : undefined}
              onClick={() => setActiveStep(index)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${activeStep === index ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/40"}`}
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </nav>
        {active && (
          <div className="mt-5 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Etapa {activeStep + 1} de {visibleSteps.length}
            </p>
            <h3 className="mt-1 font-display text-xl">{active.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((value) => Math.max(0, value - 1))}
              >
                Anterior
              </Button>
              <Button asChild variant="outline">
                <Link to={active.to} params={{ org }}>
                  {active.action}
                </Link>
              </Button>
              <Button
                type="button"
                disabled={activeStep === visibleSteps.length - 1}
                onClick={() =>
                  setActiveStep((value) => Math.min(visibleSteps.length - 1, value + 1))
                }
              >
                Próxima etapa
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-display text-2xl">
              {complete} de {visibleSteps.length} etapas com dados
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Os indicadores refletem a amostra visível para o seu perfil.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">
            {Math.round((complete / visibleSteps.length) * 100)}%
          </span>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Progresso dos primeiros passos"
          aria-valuenow={complete}
          aria-valuemin={0}
          aria-valuemax={visibleSteps.length}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(complete / visibleSteps.length) * 100}%` }}
          />
        </div>
      </section>
      <ol className="grid gap-3 lg:grid-cols-2">
        {visibleSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="rounded-xl border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Etapa {index + 1}
                    </p>
                    {step.done ? (
                      <CheckCircle2 className="size-5 text-success" aria-label="Com dados" />
                    ) : (
                      <CircleDashed className="size-5 text-copper" aria-label="Sem dados" />
                    )}
                  </div>
                  <h2 className="mt-1 font-display text-xl">{step.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                  <Link
                    to={step.to}
                    params={{ org }}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {step.action}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        Este roteiro é visual e não cria contas, envia convites ou conclui configurações reais.
      </p>
    </div>
  );
}
