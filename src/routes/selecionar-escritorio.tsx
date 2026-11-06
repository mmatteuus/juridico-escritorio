import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Search, ShieldCheck } from "lucide-react";
import { DemoTag } from "@/components/office/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OFFICES, OFFICE_ACCESS_EXAMPLES } from "@/features/demo/fixtures";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { useDemo } from "@/features/demo/store";
import type { Office } from "@/features/demo/types";

export const Route = createFileRoute("/selecionar-escritorio")({
  head: () => ({
    meta: [{ title: "Selecionar escritório · JURIDO" }, { name: "robots", content: "noindex" }],
  }),
  component: SelectOffice,
});
const statusLabel = { ativo: "Ativo", pendente: "Pendente", suspenso: "Suspenso" } as const;
const ACTIVE_OFFICE_KEY = "jurido-demo-active-office";
type Status = keyof typeof statusLabel;
const choices = [
  ...OFFICES.map((office) => ({
    id: office.id,
    displayName: office.displayName,
    legalName: office.legalName,
    monogram: office.monogram,
    brandColor: office.brandColor,
    status: "ativo" as const,
    slug: office.slug,
  })),
  ...OFFICE_ACCESS_EXAMPLES.map((example) => ({ ...example, slug: null })),
];

function SelectOffice() {
  const { role } = useDemo();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "todos">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const id = window.sessionStorage.getItem(ACTIVE_OFFICE_KEY);
      setSelectedId(OFFICES.some((office) => office.id === id) ? id : null);
    } catch {
      setSelectedId(null);
    }
  }, []);
  const [pending, setPending] = useState<Office | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const selected = OFFICES.find((office) => office.id === selectedId);
  const filtered = choices.filter(
    (choice) =>
      (status === "todos" || choice.status === status) &&
      `${choice.displayName} ${choice.legalName}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
  );
  const enter = (office: Office) => {
    if (!selectedId || office.id === selectedId) {
      setSelectedId(office.id);
      try {
        window.sessionStorage.setItem(ACTIVE_OFFICE_KEY, office.id);
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
      navigate({ to: "/o/$org/inicio", params: { org: office.slug } });
    } else {
      setPending(office);
      setUnsaved(false);
    }
  };
  const confirmSwitch = () => {
    if (!pending) return;
    setSelectedId(pending.id);
    try {
      window.sessionStorage.setItem(ACTIVE_OFFICE_KEY, pending.id);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    navigate({ to: "/o/$org/inicio", params: { org: pending.slug } });
    setPending(null);
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <span className="font-display text-2xl font-semibold">
            JURIDO<span className="text-copper">.</span>
          </span>
          <DemoTag />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-medium sm:text-5xl">Escolha o escritório</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Cada ambiente demonstra sua própria equipe, clientes e casos. Selecione um vínculo ativo
            para continuar.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span>
              Perfil da demonstração: <strong>{ROLE_LABEL[role]}</strong>
            </span>
          </div>
          <Link to="/login" className="font-medium text-primary hover:underline">
            Trocar perfil
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar escritório"
              placeholder="Buscar escritório"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar vínculo"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
            value={status}
            onChange={(event) => setStatus(event.target.value as Status | "todos")}
          >
            <option value="todos">Todos os vínculos</option>
            {Object.entries(statusLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {filtered.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filtered.map((choice) => {
              const office = choice.slug
                ? OFFICES.find((item) => item.slug === choice.slug)
                : undefined;
              const active = choice.status === "ativo" && !!office;
              return (
                <article
                  key={choice.id}
                  className="flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="grid size-14 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white"
                      style={{ background: choice.brandColor }}
                    >
                      {choice.monogram}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl">{choice.displayName}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{choice.legalName}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    <span
                      className={
                        choice.status === "ativo"
                          ? "rounded-full bg-success-soft px-3 py-1 font-medium text-success"
                          : "rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground"
                      }
                    >
                      {statusLabel[choice.status]}
                    </span>
                    {active && (
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                        Perfil demo: {ROLE_LABEL[role]}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 flex-1 text-sm text-muted-foreground">
                    {choice.status === "pendente"
                      ? "Solicitação de vínculo aguardando aprovação. A entrada está indisponível."
                      : choice.status === "suspenso"
                        ? "Vínculo suspenso. A entrada está indisponível nesta demonstração."
                        : `${office!.units.length} unidade(s) · ${office!.practiceAreas.length} áreas de atuação`}
                  </p>
                  <Button
                    type="button"
                    className="mt-5 w-full justify-between"
                    variant={active ? "default" : "outline"}
                    disabled={!active}
                    onClick={() => office && enter(office)}
                  >
                    {!active
                      ? "Entrada indisponível"
                      : !selectedId || office!.id === selectedId
                        ? "Abrir escritório"
                        : "Trocar de escritório"}
                    {active && <ArrowRight className="size-4" />}
                  </Button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum vínculo encontrado. Ajuste a busca ou o filtro.
          </div>
        )}
        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="size-4" />
          Vínculos e dados fictícios para apresentação. A escolha não valida identidade ou
          autorização real.
        </p>
      </main>
      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar de escritório?</DialogTitle>
            <DialogDescription>
              Origem: {selected?.displayName ?? "Nenhum"}. Destino: {pending?.displayName ?? ""}.
              Somente os dados do destino serão exibidos após a troca.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={unsaved}
              onChange={(event) => setUnsaved(event.target.checked)}
              className="mt-1 size-4"
            />
            Simular alterações não salvas neste ambiente
          </label>
          {unsaved && (
            <p role="alert" className="text-sm text-copper">
              Alterações não salvas da demonstração não acompanham a troca de escritório.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmSwitch}>Confirmar troca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
