import type { Doc, Matter, RoleId, Task } from "./types";

/** DEMO-only UX permissions. Not a security mechanism — real checks belong on the server. */

export const ROLE_LABEL: Record<RoleId, string> = {
  gestor: "Gestora / proprietária",
  socio: "Sócio advogado",
  coordenador: "Coordenador de área",
  advogado: "Advogado",
  secretario: "Secretária",
  substituto: "Substituto temporário",
  financeiro: "Financeiro",
  estagiario: "Estagiário",
};

const LAWYER_ROLES: RoleId[] = ["socio", "coordenador", "advogado"];

export function canSeeMatter(role: RoleId, matter: Matter, memberId?: string): boolean {
  if (!memberId) return false;
  if (matter.confidentiality === "sigilo_reforcado") {
    // Hierarchy never implies access: only explicit grant.
    return matter.grantRoles.includes(role);
  }
  // Ordinary and team-restricted cases need a direct assignment or an explicit role grant.
  return matter.assignedMemberIds.includes(memberId) || matter.grantRoles.includes(role);
}

export function canConfirmDeadline(role: RoleId): boolean {
  return LAWYER_ROLES.includes(role);
}

export function canApproveTask(role: RoleId): boolean {
  return LAWYER_ROLES.includes(role);
}

export function canDelegateTask(role: RoleId): boolean {
  return [...LAWYER_ROLES, "gestor"].includes(role);
}

export function canManageTask(role: RoleId, task: Pick<Task, "assigneeId" | "requesterId">, memberId?: string): boolean {
  return canDelegateTask(role) || (!!memberId && (task.assigneeId === memberId || task.requesterId === memberId));
}

export function canProposeDeadline(role: RoleId): boolean {
  return LAWYER_ROLES.includes(role) || role === "secretario" || role === "gestor";
}

export function canSeeFinance(role: RoleId): boolean {
  return role === "gestor" || role === "socio" || role === "financeiro";
}

export function canSeeCnj(role: RoleId): boolean {
  return role !== "financeiro";
}

export function canSeeLegalDocs(role: RoleId): boolean {
  return role !== "financeiro";
}

/** Document access is scoped by office, case, and the document's own restriction. */
export function canSeeDoc(role: RoleId, doc: Doc, matter: Matter | undefined, memberId?: string): boolean {
  if (matter && (doc.officeId !== matter.officeId || (doc.matterId && doc.matterId !== matter.id))) return false;
  if (doc.matterId && !matter) return false;
  if (!memberId) return false;
  if (!canSeeLegalDocs(role) || (matter && !canSeeMatter(role, matter, memberId))) return false;
  if (doc.visibility !== "restrito") return true;
  return !!doc.grantedRoles?.includes(role);
}

export function canApproveIntake(role: RoleId): boolean {
  return LAWYER_ROLES.includes(role) || role === "gestor";
}

export function canCreateMatter(role: RoleId): boolean {
  return ["gestor", "socio", "coordenador", "advogado", "secretario"].includes(role);
}
