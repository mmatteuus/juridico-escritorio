import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidentialityBadge, DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { findOffice, fmtDate, timelineEvent, useDemo, useOfficeView } from "@/features/demo/store";
import type { Confidentiality, Matter, RoleId } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/sigilo")({
  head: () => ({ meta: [{ title: "Visibilidade e sigilo · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Sigilo,
});
const levelLabel: Record<Confidentiality, string> = {
  normal: "Normal",
  restrito_a_equipe: "Restrito à equipe",
  sigilo_reforcado: "Sigilo reforçado",
};
const levels: Confidentiality[] = ["normal", "restrito_a_equipe", "sigilo_reforcado"];
const grantable: RoleId[] = ["gestor", "socio", "coordenador", "advogado", "secretario", "substituto", "financeiro", "estagiario"];

function Sigilo() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ level: Confidentiality; grants: RoleId[] } | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const canManage = ["gestor", "socio", "coordenador"].includes(view.role);
  const matters = useMemo(() => view.matters.filter(m =>
    (levelFilter === "todos" || m.confidentiality === levelFilter) &&
    `${m.code} ${m.title} ${m.clientIds.map(view.clientName).join(" ")}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  ), [view, query, levelFilter]);
  const current = view.matters.find(m => m.id === selectedId);
  function choose(matter: Matter) {
    setSelectedId(matter.id);
    setDraft({ level: matter.confidentiality, grants: [...matter.grantRoles] });
    setReason("");
    setNotice("");
  }
  function save() {
    if (!current || !draft || !canManage || !reason.trim()) return;
    // Explicit grant is required for every role allowed to see reinforced confidentiality.
    if (draft.level === "sigilo_reforcado" && draft.grants.length === 0) {
      setNotice("Selecione pelo menos um perfil com concessão explícita para sigilo reforçado.");
      return;
    }
    const before = current.confidentiality;
    const grants = draft.grants;
    update(data => ({
      ...data,
      matters: data.matters.map(m => m.id === current.id && m.officeId === office.id
        ? { ...m, confidentiality: draft.level, grantRoles: grants, updatedAt: new Date().toISOString() }
        : m),
      timeline: [...data.timeline, timelineEvent({
        officeId: office.id, matterId: current.id, actor: view.me?.name ?? "Equipe",
        kind: "observacao", text: `Visibilidade alterada de ${levelLabel[before]} para ${levelLabel[draft.level]}. Motivo: ${reason.trim()}`,
      })],
    }));
    setNotice("Classificação atualizada nesta demonstração. O caso pode deixar de aparecer se o perfil perder acesso.");
    setReason("");
  }
  if (!canManage) return <DeniedState />;
  return <div className="space-y-5">
    <PageHeader title="Visibilidade e sigilo" subtitle="Classifique casos visíveis e revise concessões explícitas por perfil" />
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium"><LockKeyhole className="size-4" /> Acesso por caso</p>
      <p className="mt-1 text-muted-foreground">O acesso exige atribuição ou concessão explícita, inclusive nos casos normais. Sigilo reforçado exige concessão própria. Esta tela mostra somente casos que seu perfil já pode visualizar.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {levels.map(level => <div key={level} className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{levelLabel[level]}</p><p className="mt-2 font-display text-3xl">{view.matters.filter(m => m.confidentiality === level).length}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" aria-label="Buscar caso visível" placeholder="Buscar caso, código ou cliente" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <select className="rounded-md border bg-background px-3 text-sm" aria-label="Filtrar classificação" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}><option value="todos">Todas as classificações</option>{levels.map(level => <option key={level} value={level}>{levelLabel[level]}</option>)}</select>
    </div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-xl border bg-card p-4 shadow-soft"><h2 className="mb-3 font-display text-xl">Casos visíveis</h2>{matters.length ? <div className="space-y-2">{matters.map(m => <button key={m.id} type="button" onClick={() => choose(m)} className={`w-full rounded-lg border p-3 text-left hover:border-primary/40 ${current?.id === m.id ? "border-primary bg-primary/5" : ""}`}><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{m.title}</span><ConfidentialityBadge value={m.confidentiality} /></div><p className="mt-1 text-xs text-muted-foreground">{m.code} · {m.clientIds.map(view.clientName).join(", ")} · atual. {fmtDate(m.updatedAt)}</p></button>)}</div> : <EmptyState title="Nenhum caso visível encontrado" hint="Ajuste a busca ou o filtro de classificação." />}</section>
      <section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Revisar classificação</h2>{current && draft ? <div className="mt-4 space-y-4 text-sm"><div><p className="font-medium">{current.title}</p><Link to="/o/$org/casos/$id" params={{ org, id: current.id }} className="text-xs text-primary hover:underline">Abrir caso {current.code}</Link></div><label className="grid gap-1 font-medium">Classificação<select className="rounded-md border bg-background p-2 font-normal" value={draft.level} onChange={e => setDraft({ ...draft, level: e.target.value as Confidentiality })}>{levels.map(level => <option key={level} value={level}>{levelLabel[level]}</option>)}</select></label><div><p className="mb-2 font-medium">Perfis com concessão explícita</p><div className="grid gap-2 sm:grid-cols-2">{grantable.map(role => <label key={role} className="flex items-center gap-2 rounded-md border p-2"><input type="checkbox" checked={draft.grants.includes(role)} onChange={e => setDraft({ ...draft, grants: e.target.checked ? [...draft.grants, role] : draft.grants.filter(r => r !== role) })} /><span>{ROLE_LABEL[role]}</span></label>)}</div><p className="mt-2 text-xs text-muted-foreground">Atribuição direta libera casos normais ou restritos à equipe; sigilo reforçado exige concessão expressa. O papel concede acesso demonstrativo a todos os membros desse perfil no escritório.</p></div><label className="grid gap-1 font-medium">Motivo da alteração<textarea className="min-h-20 rounded-md border bg-background p-2 font-normal" value={reason} onChange={e => setReason(e.target.value)} placeholder="Registre por que a visibilidade mudou" /></label><Button onClick={save} disabled={!reason.trim()}><ShieldCheck /> Salvar classificação demo</Button>{notice && <p role="status" className="text-xs text-primary">{notice}</p>}</div> : <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center text-muted-foreground"><Eye className="size-8" /><p className="text-sm">Selecione um caso para revisar a visibilidade.</p></div>}</section>
    </div>
  </div>;
}
