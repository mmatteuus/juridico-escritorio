import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CircleHelp, Home, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { findOffice, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/acesso-negado")({
  head: () => ({ meta: [{ title: "Acesso restrito · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: AccessDenied,
});

function AccessDenied() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  return <div className="mx-auto max-w-2xl py-8 sm:py-14">
    <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-9">
      <div className="grid size-12 place-items-center rounded-xl bg-destructive-soft text-destructive"><LockKeyhole className="size-6" /></div>
      <h1 className="mt-5 font-display text-3xl font-medium">Acesso restrito</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">O perfil <strong className="text-foreground">{ROLE_LABEL[view.role]}</strong> não pode visualizar esta informação no escritório {office.displayName}. A classificação de sigilo, a equipe responsável e as concessões explícitas podem limitar o acesso.</p>
      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4" /> Privacidade preservada</div><p className="mt-1 text-muted-foreground">Nenhum dado do caso, cliente ou documento bloqueado é mostrado nesta tela. Na demonstração, a troca de perfil no menu superior permite comparar as visões autorizadas.</p></div>
      <div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link to="/o/$org/inicio" params={{ org }}><Home /> Voltar ao início</Link></Button><Button asChild variant="outline"><Link to="/o/$org/suporte" params={{ org }}><CircleHelp /> Preciso de ajuda</Link></Button></div>
    </div>
    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3" /> Se você esperava ter acesso, consulte o gestor do escritório para revisar sua atribuição ou concessão.</p>
  </div>;
}
