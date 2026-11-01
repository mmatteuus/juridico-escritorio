import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { canSeeCnj } from "@/features/demo/permissions";
import { useOfficeView } from "@/features/demo/store";
import type { Office } from "@/features/demo/types";

export function GlobalSearch({ office, open, onOpenChange }: { office: Office; open: boolean; onOpenChange: (v: boolean) => void }) {
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const go = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id } });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={`Buscar em ${office.displayName}…`} />
      <CommandList>
        <CommandEmpty>Nada encontrado neste escritório.</CommandEmpty>
        <CommandGroup heading="Casos">
          {v.matters.map((m) => (
            <CommandItem key={m.id} value={`${m.title} ${m.code}`} onSelect={() => go(m.id)}>
              {m.title} <span className="ml-auto text-xs text-muted-foreground">{m.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Clientes">
          {v.clients.map((c) => {
            const m = v.matters.find((x) => x.clientIds.includes(c.id));
            return (
              <CommandItem key={c.id} value={c.name} disabled={!m} onSelect={() => m && go(m.id)}>
                {c.name}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {canSeeCnj(v.role) && (
          <CommandGroup heading="Processos (CNJ de teste)">
            {v.proceedings.map((p) => (
              <CommandItem key={p.id} value={p.cnjMasked ?? p.id} onSelect={() => go(p.matterId)}>
                <span className="tabular">{p.cnjMasked}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
