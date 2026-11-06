import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Timer, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/o/$org/tarefas")({
  component: TasksPage,
});

function TasksPage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListChecks className="size-6 text-primary" />
          Minhas Tarefas
        </h1>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">3 Pendentes</span>
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">12 Concluídas</span>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">Análise de contrato - Caso 12345</h3>
              <p className="text-sm text-muted-foreground">Prazo: Amanhã, 18:00</p>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-destructive text-destructive-foreground">Urgente</span>
          </div>
        </div>
        <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">Protocolo de petição inicial</h3>
              <p className="text-sm text-muted-foreground">Prazo: 05/12/2026</p>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-secondary text-secondary-foreground">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

