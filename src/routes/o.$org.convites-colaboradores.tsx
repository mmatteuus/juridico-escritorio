import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Clock3, Mail, ShieldAlert, UserPlus, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { createCollaboratorInvite, changeCollaboratorInviteStatus } from "@/features/demo/collaboratorInvites";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import type { CollaboratorInvite, CollaboratorInviteStatus, RoleId } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/convites-colaboradores")({
  head: () => ({ meta: [{ title: "Convites de colaboradores · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: CollaboratorInvitesPage,
});

const statusLabel: Record<CollaboratorInviteStatus, string> = {
  pendente: "Pendente",
  aceito: "Aceito · demo",
  expirado: "Expirado",
  revogado: "Revogado",
};
const statusTone: Record<CollaboratorInviteStatus, string> = {
  pendente: "bg-amber-500/10 text-amber-800",
  aceito: "bg-emerald-500/10 text-emerald-700",
  expirado: "bg-muted text-muted-foreground",
  revogado: "bg-destructive/10 text-destructive",
};
const inviteRoles: RoleId[] = ["socio", "coordenador", "advogado", "secretario", "substituto", "financeiro", "estagiario"];
const card = "rounded-xl border bg-card p-5 shadow-soft";

function CollaboratorInvitesPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("advogado");
  const [practiceAreaId, setPracticeAreaId] = useState(office.practiceAreas[0]?.id ?? "");
  const [teamId, setTeamId] = useState("");
  const [validityDays, setValidityDays] = useState("7");
  const [statusFilter, setStatusFilter] = useState<"todos" | CollaboratorInviteStatus>("todos");
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");
  const canManageInvites = view.role === "gestor" || view.role === "socio";
  const teams = view.teams.filter((team) => team.practiceAreaId === practiceAreaId);
  const rows = useMemo(() => view.collaboratorInvites
    .filter((invite) => (statusFilter === "todos" || invite.status === statusFilter) && `${invite.email} ${ROLE_LABEL[invite.role]} ${office.practiceAreas.find((area) => area.id === invite.practiceAreaId)?.name ?? ""} ${view.teams.find((team) => team.id === invite.teamId)?.name ?? ""}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [view, office.practiceAreas, statusFilter, query]);
  const pagination = useOfficePagination(rows, `${query}|${statusFilter}`);
  const reservedSeats = view.members.length + view.collaboratorInvites.filter((invite) => invite.status === "pendente" || invite.status === "aceito").length;
  const availableSeats = Math.max(0, office.memberSeatLimit - reservedSeats);
  const hasAvailableSeat = availableSeats > 0;

  if (!canManageInvites) return <DeniedState />;

  function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedEmail || !practiceAreaId || !office.practiceAreas.some((area) => area.id === practiceAreaId)) {
      setFormError("Informe um e-mail válido e uma área deste escritório.");
      return;
    }
    if (!hasAvailableSeat) {
      setFormError("O plano demonstrativo não tem assentos disponíveis para outro convite.");
      return;
    }
    if (teamId && !teams.some((team) => team.id === teamId)) {
      setFormError("Selecione uma equipe pertencente à área escolhida.");
      return;
    }
    if (view.collaboratorInvites.some((invite) => invite.email.toLocaleLowerCase("pt-BR") === normalizedEmail && ["pendente", "aceito"].includes(invite.status))) {
      setFormError("Já existe um convite pendente ou aceito para este e-mail neste escritório.");
      return;
    }
    createCollaboratorInvite(update, {
      officeId: office.id,
      email: normalizedEmail,
      role,
      practiceAreaId,
      ...(teamId ? { teamId } : {}),
      validityDays: Number(validityDays),
      actor: view.me?.name ?? "Gestão do escritório",
      ...(view.me?.id ? { createdByMemberId: view.me.id } : {}),
    });
    setEmail("");
    setRole("advogado");
    setPracticeAreaId(office.practiceAreas[0]?.id ?? "");
    setTeamId("");
    setValidityDays("7");
    setFormError("");
    setShowForm(false);
  }

  function changeStatus(invite: CollaboratorInvite, next: CollaboratorInviteStatus) {
    changeCollaboratorInviteStatus(update, invite, office.id, next, view.me?.name ?? "Gestão do escritório");
  }

  return <div className="space-y-5">
    <Link to="/o/$org/equipe" params={{ org }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Equipe</Link>
    <PageHeader title="Convites de colaboradores" subtitle={`${office.displayName} · convites internos de acesso à equipe`} actions={<Button onClick={() => { setFormError(""); setShowForm((current) => !current); }}><UserPlus className="size-4" /> Novo convite</Button>} />

    <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Resumo dos convites e assentos">
      <div className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">Assentos usados ou reservados</p><p className="mt-2 font-display text-3xl tabular-nums">{reservedSeats} / {office.memberSeatLimit}</p><p className="mt-1 text-xs text-muted-foreground">{availableSeats} disponível(is) · convite pendente ou aceito reserva 1 assento nesta demo</p></div>
      {(["pendente", "aceito", "expirado", "revogado"] as const).map((status) => <div key={status} className="rounded-xl border bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{statusLabel[status]}</p><p className="mt-2 font-display text-3xl tabular-nums">{view.collaboratorInvites.filter((invite) => invite.status === status).length}</p></div>)}
    </section>

    {showForm && <form onSubmit={createInvite} className={`${card} space-y-5`}>
      <div><h2 className="font-display text-xl">Preparar convite interno</h2><p className="mt-1 text-sm text-muted-foreground">O convite fica somente nesta demonstração. Nenhum e-mail é enviado e nenhum usuário ou membership é criado.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-1.5"><Label htmlFor="collaborator-email">E-mail profissional</Label><Input id="collaborator-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setFormError(""); }} placeholder="nome@escritorio.test" required /></div>
        <div className="grid gap-1.5"><Label htmlFor="collaborator-role">Função</Label><select id="collaborator-role" className="h-10 rounded-md border bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as RoleId)}>{inviteRoles.map((candidate) => <option key={candidate} value={candidate}>{ROLE_LABEL[candidate]}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="collaborator-area">Área jurídica</Label><select id="collaborator-area" className="h-10 rounded-md border bg-background px-3 text-sm" value={practiceAreaId} onChange={(event) => { setPracticeAreaId(event.target.value); setTeamId(""); }} required><option value="">Selecione uma área</option>{office.practiceAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="collaborator-team">Equipe</Label><select id="collaborator-team" className="h-10 rounded-md border bg-background px-3 text-sm" value={teamId} onChange={(event) => setTeamId(event.target.value)} disabled={!practiceAreaId}><option value="">Sem equipe específica</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="collaborator-validity">Validade do convite</Label><select id="collaborator-validity" className="h-10 rounded-md border bg-background px-3 text-sm" value={validityDays} onChange={(event) => setValidityDays(event.target.value)}><option value="1">1 dia</option><option value="3">3 dias</option><option value="7">7 dias</option><option value="14">14 dias</option></select></div>
      </div>
      {formError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
      <p className="text-xs text-muted-foreground">A capacidade de assentos é apenas uma regra ilustrativa local. Autenticação/MFA e criação de vínculo efetivo não estão conectadas.</p>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!hasAvailableSeat}><Mail className="size-4" /> Criar convite demo</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormError(""); }}>Cancelar</Button></div>
    </form>}

    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl">Histórico de convites</h2><p className="text-sm text-muted-foreground">Estados locais; aceite não cria conta nem concede acesso real.</p></div><div className="flex flex-wrap gap-2"><Input aria-label="Buscar convite interno" className="w-full sm:w-64" placeholder="Buscar e-mail, função ou área" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filtrar convites por status" className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="todos">Todos os status</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
    <SavedFilterViews officeId={office.id} role={view.role} collection="convites-colaboradores" currentValues={{ query, status: statusFilter }} onApply={(filters) => { setQuery(filters.query); setStatusFilter((["todos", ...Object.keys(statusLabel)] as string[]).includes(filters.status) ? filters.status as typeof statusFilter : "todos"); }} />

    {rows.length ? <><ul className="grid gap-3 lg:grid-cols-2">{pagination.items.map((invite) => {
      const area = office.practiceAreas.find((candidate) => candidate.id === invite.practiceAreaId);
      const team = view.teams.find((candidate) => candidate.id === invite.teamId && candidate.practiceAreaId === invite.practiceAreaId);
      return <li key={invite.id}><article className={`${card} h-full`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-semibold">{invite.email}</p><p className="mt-1 text-sm text-muted-foreground">{ROLE_LABEL[invite.role]} · {area?.name ?? "Área indisponível"}{team ? ` · ${team.name}` : " · sem equipe"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[invite.status]}`}>{statusLabel[invite.status]}</span></div><dl className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2"><div><dt>Criado</dt><dd className="mt-0.5 text-foreground">{fmtDateTime(invite.createdAt)}</dd></div><div><dt>Válido até</dt><dd className="mt-0.5 text-foreground">{fmtDateTime(invite.expiresAt)}</dd></div><div><dt>Preparado por</dt><dd className="mt-0.5 text-foreground">{view.memberName(invite.createdByMemberId)}</dd></div>{invite.acceptedAt && <div><dt>Aceite simulado</dt><dd className="mt-0.5 text-foreground">{fmtDateTime(invite.acceptedAt)}</dd></div>}</dl><ul className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">{invite.history.slice(-2).map((entry, index) => <li key={`${entry.at}-${index}`}>{fmtDateTime(entry.at)} · {entry.actor}: {entry.action}</li>)}</ul>{invite.status === "pendente" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => changeStatus(invite, "aceito")}><Check className="size-4" /> Simular aceite</Button><Button size="sm" variant="outline" onClick={() => changeStatus(invite, "expirado")}><Clock3 className="size-4" /> Simular expiração</Button><Button size="sm" variant="ghost" onClick={() => changeStatus(invite, "revogado")}><UserRoundX className="size-4" /> Revogar demo</Button></div>}{invite.status === "aceito" && <Button className="mt-4" size="sm" variant="outline" onClick={() => changeStatus(invite, "revogado")}><UserRoundX className="size-4" /> Revogar convite demo</Button>}</article></li>;
    })}</ul><OfficePaginationControls pagination={pagination} /></> : <EmptyState title="Nenhum convite neste filtro" hint="Crie um convite demonstrativo ou ajuste o filtro de status." />}

    <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />A autenticação do convidado, a aprovação de membership, a notificação real e a revogação server-side não são simuladas como concluídas. Esta tela não altera a equipe ativa.</p>
  </div>;
}
