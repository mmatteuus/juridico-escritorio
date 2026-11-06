import { createFileRoute } from "@tanstack/react-router";
import { withAuth } from "@/components/withAuth"; // assumed HOC
import { CreditCard, LayoutTemplate } from "lucide-react";

export const Route = createFileRoute("/o/$org/financeiro")({
  component: FinancePage,
});

function FinancePage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="size-6 text-primary" />
          Financeiro
        </h1>
        <LayoutTemplate className="size-4 opacity-60" />
      </h1>

      <div className="grid gap-4">
        <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">Honorários Totais</h3>
              <p className="text-3xl font-bold text-primary">R$ 85.420,00</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">Parcelas em Aberto</h3>
              <p className="text-3xl font-bold text-destructive">R$ 32.150,00</p>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-destructive text-destructive-foreground">7 de 12</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t">
        <h2 className="font-medium mb-4">Últimas movimentações</h2>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm">Honorário sucumbente - Caso 123</p>
              <p className="text-xs text-muted-foreground">02/12/2026</p>
            </div>
            <span className="text-amber-600 text-sm">+R$ 2.500,00</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm">Reembolso de custas</p>
              <p className="text-xs text-muted-foreground">01/12/2026</p>
            </div>
            <span className="text-green-600 text-sm">+R$ 1.200,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const withAuthRoute = withAuth(Route);
