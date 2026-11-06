import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

const QUICK_ACTIONS = [
  { label: "Novo Atendimento", to: "/o/$org/atendimentos", search: { novo: true } },
  { label: "Novo Caso", to: "/o/$org/casos", search: { novo: true } },
  { label: "Nova Tarefa", to: "/o/$org/tarefas", search: { novo: true } },
  { label: "Novo Cliente", to: "/o/$org/clientes", search: { novo: true } },
];

export function useQuickAction() {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const open = React.useCallback(() => {
    triggerRef.current?.click();
  }, []);
  return open;
}

export function QuickActionFab() {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 z-50 shadow-lg h-12 w-12 rounded-full"
          aria-label="Ações rápidas"
        >
          <Plus className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {QUICK_ACTIONS.map((action, i) => (
          <React.Fragment key={action.label}>
            <DropdownMenuItem asChild>
              <Link
                to={action.to}
                search={action.search}
                className="flex items-center w-full"
              >
                {action.label}
              </Link>
            </DropdownMenuItem>
            {i < QUICK_ACTIONS.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
