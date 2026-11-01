import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/office/badges";
import { OFFICES } from "@/features/demo/fixtures";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { useDemo } from "@/features/demo/store";
import type { RoleId } from "@/features/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · JURIDO Escritórios (demonstração)" },
      { name: "description", content: "Acesso de demonstração ao painel de gestão de escritórios de advocacia JURIDO." },
      { property: "og:title", content: "JURIDO Escritórios – demonstração" },
      { property: "og:description", content: "Painel de gestão diária para escritórios de advocacia, em modo demonstração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { role, setRole } = useDemo();
  const [office, setOffice] = useState(OFFICES[0].slug);
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <span className="font-display text-2xl text-sidebar-accent-foreground">JURIDO<span className="text-sidebar-primary">.</span></span>
        <div>
          <h1 className="font-display text-5xl leading-tight text-sidebar-accent-foreground">O dia do escritório,<br />em ordem.</h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/80">Casos, prazos, documentos e equipe num só lugar — com revisão profissional em cada etapa crítica.</p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Protótipo visual · sem backend · dados fictícios</p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <form
          className="w-full max-w-md space-y-6"
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/o/$org/inicio", params: { org: office } }); }}
        >
          <div><DemoTag /><h2 className="mt-3 font-display text-3xl">Entrar na demonstração</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sem senha. Escolha um escritório e um perfil fictícios.</p></div>
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Escritório</legend>
            {OFFICES.map((o) => (
              <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3", office === o.slug && "border-primary ring-1 ring-primary")}>
                <input type="radio" name="office" className="sr-only" checked={office === o.slug} onChange={() => setOffice(o.slug)} />
                <span className="grid size-9 place-items-center rounded-md font-display text-sm font-semibold text-primary-foreground" style={{ background: o.brandColor }}>{o.monogram}</span>
                <span className="text-sm font-medium">{o.legalName}</span>
              </label>
            ))}
          </fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Perfil</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                <label key={r} className={cn("cursor-pointer rounded-lg border bg-card px-3 py-2 text-sm", role === r && "border-primary bg-secondary font-semibold")}>
                  <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />{ROLE_LABEL[r]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" size="lg" className="w-full">Entrar <ArrowRight /></Button>
        </form>
      </main>
    </div>
  );
}
