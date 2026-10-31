import type { Matter, RoleId } from "./types";

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
  if (matter.confidentiality === "sigilo_reforcado") {
    // Hierarchy never implies access: only explicit grant.
    return matter.grantRoles.includes(role);
  }
  if (matter.confidentiality === "restrito_a_equipe") {
    if (matter.grantRoles.includes(role)) return true;
    return !!memberId && matter.assignedMemberIds.includes(memberId);
  }
  if (role === "substituto" || role === "estagiario") {
    return !!memberId && matter.assignedMemberIds.includes(memberId);
  }
  return true;
}

export function canConfirmDeadline(role: RoleId): boolean {
  return LAWYER_ROLES.includes(role);
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

export function canCreateMatter(role: RoleId): boolean {
  return ["gestor", "socio", "coordenador", "advogado", "secretario"].includes(role);
}
