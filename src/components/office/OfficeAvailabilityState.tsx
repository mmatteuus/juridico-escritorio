import { Link } from "@tanstack/react-router";
import { ArrowLeft, CircleHelp, Home, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "unavailable" | "no-license";

export function OfficeAvailabilityState({ org, state }: { org: string; state: State }) {
  const unavailable = state === "unavailable";
  const title = unavailable ? "Serviço temporariamente indisponível" : "Recurso não incluído no plano";
  const description = unavailable
    ? "Este estado de demonstração representa uma indisponibilidade temporária. Não consultamos serviços externos nem o status operacional do escritório."
    : "Este estado de demonstração representa um recurso sem licença ativa. Nenhuma licença ou acesso foi alterado.";
  return <main className="mx-auto max-w-2xl px-4 py-8 sm:py-14">
    <section className="rounded-2xl border bg-card p-6 shadow-soft sm:p-9" aria-labelledby="availability-title">
      <div className="grid size-12 place-items-center rounded-xl bg-warning-soft text-warning"><ShieldAlert className="size-6" /></div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado demonstrativo</p>
      <h1 id="availability-title" className="mt-2 font-display text-3xl font-medium">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild><Link to="/o/$org/inicio" params={{ org }}><Home /> Voltar ao início</Link></Button>
        {unavailable && <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw /> Tentar novamente</Button>}
        <Button asChild variant="outline"><Link to="/o/$org/suporte" params={{ org }}><CircleHelp /> Falar com suporte</Link></Button>
      </div>
    </section>
    <Link to="/o/$org/conceitos" params={{ org }} className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Voltar aos estados demonstrativos</Link>
  </main>;
}
