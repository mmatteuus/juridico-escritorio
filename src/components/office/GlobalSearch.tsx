import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { canSeeCnj, canSeeLegalDocs } from "@/features/demo/permissions";
import { useOfficeView } from "@/features/demo/store";
import type { Office } from "@/features/demo/types";

export function GlobalSearch({ office, open, onOpenChange }: { office: Office; open: boolean; onOpenChange: (v: boolean) => void }) {
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const go = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id } });
  };
  const goToProcess = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/processos/$id", params: { org: office.slug, id } });
  };
  const goToClient = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/clientes/$id", params: { org: office.slug, id } });
  };
  const goToIntake = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/atendimentos", params: { org: office.slug }, search: { intakeId: id } });
  };
  const goToTask = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/tarefas/$id", params: { org: office.slug, id } });
  };
  const goToDeadline = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/prazos/$id", params: { org: office.slug, id } });
  };
  const goToDocument = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/o/$org/documentos", params: { org: office.slug }, search: { docId: id } });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar em todo o escritório…" />
      <CommandList>
        <CommandEmpty>Nada encontrado neste escritório.</CommandEmpty>
        <CommandGroup heading="Casos">
          {v.matters.map((m) => (
            <CommandItem key={m.id} value={`${m.title} ${m.code} ${m.summary}`} onSelect={() => go(m.id)}>
              <span className="min-w-0 truncate">{m.title}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{m.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Clientes">
          {v.clients.map((c) => {
            const matterCount = v.matters.filter((matter) => matter.clientIds.includes(c.id)).length;
            return <CommandItem key={c.id} value={`${c.name} ${c.contact} ${c.kind}`} onSelect={() => goToClient(c.id)}>
              <span className="min-w-0 truncate">{c.name}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{matterCount ? `${matterCount} ${matterCount === 1 ? "caso" : "casos"}` : "Cliente"}</span>
            </CommandItem>;
          })}
        </CommandGroup>
        <CommandGroup heading="Atendimentos">
          {v.intakes.map((intake) => (
            <CommandItem key={intake.id} value={`${intake.name} ${intake.contact} ${intake.summary} ${intake.stage}`} onSelect={() => goToIntake(intake.id)}>
              <span className="min-w-0 truncate">{intake.name}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{intake.stage.replaceAll("_", " ")}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tarefas">
          {v.tasks.map((task) => (
            <CommandItem key={task.id} value={`${task.title} ${task.instructions ?? ""} ${v.memberName(task.assigneeId)}`} onSelect={() => goToTask(task.id)}>
              <span className="min-w-0 truncate">{task.title}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{v.memberName(task.assigneeId)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {canSeeCnj(v.role) && <CommandGroup heading="Prazos">
          {v.deadlines.map((deadline) => (
            <CommandItem key={deadline.id} value={`${deadline.title} ${deadline.sourceLabel} ${deadline.status} ${v.matterById(deadline.matterId)?.code ?? ""}`} onSelect={() => goToDeadline(deadline.id)}>
              <span className="min-w-0 truncate">{deadline.title}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{new Date(deadline.dueDate).toLocaleDateString("pt-BR")}</span>
            </CommandItem>
          ))}
        </CommandGroup>}
        {canSeeLegalDocs(v.role) && <CommandGroup heading="Documentos">
          {v.docs.map((doc) => (
            <CommandItem key={doc.id} value={`${doc.title} ${doc.category} ${doc.description ?? ""} ${v.matterById(doc.matterId)?.code ?? ""}`} onSelect={() => goToDocument(doc.id)}>
              <span className="min-w-0 truncate">{doc.title}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{v.matterById(doc.matterId)?.code ?? "Documento"}</span>
            </CommandItem>
          ))}
        </CommandGroup>}
        {canSeeCnj(v.role) && (
          <CommandGroup heading="Processos (CNJ de teste)">
            {v.proceedings.map((p) => (
              <CommandItem key={p.id} value={`${p.title ?? ""} ${p.cnjMasked ?? ""} ${p.court ?? ""} ${p.unit ?? ""} ${p.id}`} onSelect={() => goToProcess(p.id)}>
                <span>{p.title ?? "Processo sem título"}</span><span className="ml-auto tabular text-xs text-muted-foreground">{p.cnjMasked ?? "Sem CNJ"}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
