import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Gavel, Link2, Search, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { canSeeCnj } from "@/features/demo/permissions";
import { findOffice, timelineEvent, uid, useDemo, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/processos")({
  head: () => ({ meta: [{ title: "Processos · JURIDO Escritórios" }, { name: "description", content: "Processos judiciais cadastrados manualmente." }, { name: "robots", content: "noindex" }] }),
  component: Processos,
});

type MatterFilter = "todos" | "com_caso" | "sem_caso";
const card = "rounded-xl border bg-card p-4 shadow-soft";

function formatCnj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 20) return null;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
}

function Processos() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [title, setTitle] = useState("");
  const [matterId, setMatterId] = useState("sem_caso");
  const [cnj, setCnj] = useState("");
  const [court, setCourt] = useState("");
  const [unit, setUnit] = useState("");
  const [proceedingClass, setProceedingClass] = useState("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [matterFilter, setMatterFilter] = useState<MatterFilter>("todos");

  if (!canSeeCnj(v.role)) return <DeniedState />;

  const linked = v.proceedings.filter((item) => item.matterId);
  const unlinked = v.proceedings.filter((item) => !item.matterId);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visible = v.proceedings.filter((item) => {
    const matter = item.matterId ? v.matterById(item.matterId) : undefined;
    const matchesMatter = matterFilter === "todos" || (matterFilter === "com_caso" ? !!item.matterId : !item.matterId);
    const haystack = [item.title, item.cnjMasked, item.court, item.unit, item.proceedingClass, matter?.code, matter?.title]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return matchesMatter && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) { toast.error("Informe o título do processo."); return; }
    const formattedCnj = cnj.trim() ? formatCnj(cnj) : undefined;
    if (cnj.trim() && !formattedCnj) { toast.error("O CNJ precisa ter 20 dígitos; não fazemos consulta ou validação oficial."); return; }
    if (formattedCnj && v.proceedings.some((item) => item.cnjMasked === formattedCnj)) {
      toast.error("Este número já consta na carteira visível deste escritório."); return;
    }
    const matter = matterId === "sem_caso" ? undefined : v.matters.find((item) => item.id === matterId);
    if (matterId !== "sem_caso" && !matter) { toast.error("Selecione um caso visível ou deixe o processo sem vínculo."); return; }
    const id = uid("p");
    update((data) => ({
      ...data,
      proceedings: [{
        id, officeId: office.id, ...(matter ? { matterId: matter.id } : {}), title: title.trim(),
        ...(formattedCnj ? { cnjMasked: formattedCnj } : {}), ...(court.trim() ? { court: court.trim() } : {}),
        ...(unit.trim() ? { unit: unit.trim() } : {}), ...(proceedingClass.trim() ? { proceedingClass: proceedingClass.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}), phase: "Cadastro inicial", sourceState: "manual_demo" as const,
      }, ...data.proceedings],
      timeline: [timelineEvent({ officeId: office.id, ...(matter ? { matterId: matter.id } : {}), actor: v.me?.name ?? "Equipe", kind: "cadastro", text: `Cadastrou o processo demonstrativo “${title.trim()}”${matter ? ` no caso ${matter.code}` : " sem caso vinculado"}.` }), ...data.timeline],
    }));
    setTitle(""); setCnj(""); setCourt(""); setUnit(""); setProceedingClass(""); setNotes(""); setMatterId("sem_caso");
    toast.success("Processo adicionado à demonstração");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Processos" subtitle="Registro manual demonstrativo. Um processo pode existir sem caso e não é consultado em tribunais." />
      <section aria-label="Resumo da carteira de processos" className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-sm text-muted-foreground">Processos visíveis</p><p className="mt-1 font-display text-2xl tabular">{v.proceedings.length}</p></div>
        <div className={card}><p className="flex items-center gap-2 text-sm text-muted-foreground"><Link2 className="size-4"/>Com caso vinculado</p><p className="mt-1 font-display text-2xl tabular">{linked.length}</p></div>
        <div className={card}><p className="flex items-center gap-2 text-sm text-muted-foreground"><Unlink className="size-4"/>Sem caso vinculado</p><p className="mt-1 font-display text-2xl tabular">{unlinked.length}</p></div>
      </section>

      <details className="rounded-xl border bg-card shadow-soft" open>
        <summary className="cursor-pointer px-4 py-3 font-semibold">Cadastrar processo demonstrativo</summary>
        <form onSubmit={submit} className="space-y-4 border-t p-4">
          <p className="text-sm text-muted-foreground">Preencha somente informações fictícias. CNJ é opcional; sua sintaxe não confirma existência ou autenticidade judicial.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2" htmlFor="process-title">Título do processo *<Input id="process-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required /></label>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="process-cnj">Número CNJ (opcional)<Input id="process-cnj" inputMode="numeric" value={cnj} onChange={(event) => setCnj(event.target.value)} placeholder="0000000-00.0000.0.00.0000" aria-describedby="process-cnj-help" /></label>
            <p id="process-cnj-help" className="self-end pb-2 text-xs text-muted-foreground">Aceita 20 dígitos com ou sem pontuação. Sem consulta oficial.</p>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="process-court">Tribunal<Input id="process-court" value={court} onChange={(event) => setCourt(event.target.value)} maxLength={100} /></label>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="process-unit">Unidade / vara<Input id="process-unit" value={unit} onChange={(event) => setUnit(event.target.value)} maxLength={100} /></label>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="process-class">Classe processual<Input id="process-class" value={proceedingClass} onChange={(event) => setProceedingClass(event.target.value)} maxLength={100} /></label>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="process-matter">Caso (opcional)<Select value={matterId} onValueChange={setMatterId}><SelectTrigger id="process-matter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sem_caso">Sem vínculo com caso</SelectItem>{v.matters.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} · {item.title}</SelectItem>)}</SelectContent></Select></label>
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2" htmlFor="process-notes">Observações<Input id="process-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} /></label>
          </div>
          <Button type="submit"><Gavel /> Adicionar à demonstração</Button>
        </form>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Buscar processos" placeholder="Buscar título, CNJ, tribunal, unidade, classe ou caso" value={query} onChange={(event) => setQuery(event.target.value)} className="bg-card pl-9" /></div>
        <Select value={matterFilter} onValueChange={(value) => setMatterFilter(value as MatterFilter)}><SelectTrigger className="w-full bg-card sm:w-52" aria-label="Filtrar vínculo com caso"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Com e sem caso</SelectItem><SelectItem value="com_caso">Com caso</SelectItem><SelectItem value="sem_caso">Sem caso</SelectItem></SelectContent></Select>
      </div>
      <div className="mt-3"><SavedFilterViews officeId={office.id} role={v.role} collection="processos" currentValues={{ query, matterFilter }} onApply={(filters) => { setQuery(filters.query); setMatterFilter(filters.matterFilter as MatterFilter); }} /></div>
      <p className="text-xs text-muted-foreground" aria-live="polite">Exibindo {visible.length} de {v.proceedings.length} processo(s) visível(is).</p>

      {visible.length === 0 ? <EmptyState title={v.proceedings.length ? "Nenhum processo encontrado" : "Nenhum processo visível"} hint={v.proceedings.length ? "Ajuste a busca ou o filtro de vínculo." : "Cadastre um processo fictício para iniciar a demonstração."} /> : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
            const matter = item.matterId ? v.matterById(item.matterId) : undefined;
            return <li key={item.id} className="rounded-xl border bg-card p-4 shadow-soft">
              <Link to="/o/$org/processos/$id" params={{ org, id: item.id }} className="break-words font-semibold text-primary hover:underline">{item.title || item.cnjMasked || "Processo sem título"}</Link>
              <p className="mt-1 break-all text-sm tabular text-muted-foreground">{item.cnjMasked ?? "Sem número CNJ"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{[item.court, item.unit, item.proceedingClass].filter(Boolean).join(" · ") || "Tribunal, unidade e classe não informados"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Fase: {item.phase || "Não informada"}</p>
              {matter ? <Link to="/o/$org/casos/$id" params={{ org, id: matter.id }} search={{ tab: "processos" }} className="mt-3 inline-block text-sm text-primary hover:underline">{matter.code} · {matter.title}</Link> : <p className="mt-3 text-sm text-muted-foreground">Sem caso vinculado</p>}
            </li>;
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Todos os registros são fictícios e editáveis somente nesta demonstração. Nenhum dado é consultado ou validado em fonte oficial.</p>
    </div>
  );
}
