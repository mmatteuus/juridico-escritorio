import { uid } from "./store";
import type { CollaboratorInvite, CollaboratorInviteStatus, DemoData, RoleId } from "./types";

type Update = (fn: (data: DemoData) => DemoData) => void;

/** Create a local-only collaborator invite; this never sends mail or creates an account. */
export function createCollaboratorInvite(
  update: Update,
  input: {
    officeId: string;
    email: string;
    role: RoleId;
    practiceAreaId: string;
    teamId?: string;
    validityDays: number;
    actor: string;
    createdByMemberId?: string;
  },
) {
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + input.validityDays * 24 * 60 * 60 * 1000).toISOString();
  const invite: CollaboratorInvite = {
    id: uid("collaborator-invite"),
    officeId: input.officeId,
    email: input.email.trim().toLocaleLowerCase("pt-BR"),
    role: input.role,
    practiceAreaId: input.practiceAreaId,
    ...(input.teamId ? { teamId: input.teamId } : {}),
    status: "pendente",
    ...(input.createdByMemberId ? { createdByMemberId: input.createdByMemberId } : {}),
    createdAt,
    expiresAt,
    history: [{ at: createdAt, actor: input.actor, action: "Preparou convite de colaborador (demo)" }],
  };
  update((data) => ({ ...data, collaboratorInvites: [invite, ...data.collaboratorInvites] }));
}

/** Change a demonstration invite state while recording the local history entry. */
export function changeCollaboratorInviteStatus(
  update: Update,
  invite: CollaboratorInvite,
  officeId: string,
  next: CollaboratorInviteStatus,
  actor: string,
) {
  if (next !== "aceito" && next !== "expirado" && next !== "revogado") return;
  const at = new Date().toISOString();
  const action = next === "aceito"
    ? "Simulou aceite; nenhuma conta ou membership foi criada"
    : next === "expirado"
      ? "Simulou expiração do convite"
      : "Revogou o convite demonstrativo";
  update((data) => ({
    ...data,
    collaboratorInvites: data.collaboratorInvites.map((current) =>
      current.id !== invite.id || current.officeId !== officeId ||
        (current.status !== "pendente" && !(next === "revogado" && current.status === "aceito"))
        ? current
        : {
            ...current,
            status: next,
            ...(next === "aceito" ? { acceptedAt: at } : {}),
            ...(next === "revogado" ? { revokedAt: at } : {}),
            history: [...current.history, { at, actor, action }],
          },
    ),
  }));
}
