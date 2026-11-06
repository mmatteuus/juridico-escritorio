import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildFixtures, OFFICES } from "./fixtures";
import { canSeeCnj, canSeeDoc, canSeeMatter, ROLE_LABEL } from "./permissions";
import type { DemoData, Matter, Member, Office, PublicationReview, RoleId, Task, TimelineEvent } from "./types";

interface DemoState {
  data: DemoData;
  role: RoleId;
  setRole: (r: RoleId) => void;
  newMatterOpen: boolean;
  setNewMatterOpen: (v: boolean) => void;
  meuDiaOpen: boolean;
  setMeuDiaOpen: (v: boolean) => void;
  update: (fn: (d: DemoData) => DemoData) => void;
  reset: () => void;
}

const Ctx = createContext<DemoState | null>(null);
const ROLE_KEY = "jurido-demo-role";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(() => buildFixtures());
  const [role, setRoleState] = useState<RoleId>("gestor");
  const [newMatterOpen, setNewMatterOpen] = useState(false);
  const [meuDiaOpen, setMeuDiaOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(ROLE_KEY) as RoleId | null;
    if (saved && saved in ROLE_LABEL) setRoleState(saved);
  }, []);

  const setRole = useCallback((r: RoleId) => {
    setRoleState(r);
    window.localStorage.setItem(ROLE_KEY, r);
  }, []);

  const update = useCallback((fn: (d: DemoData) => DemoData) => setData((d) => fn(d)), []);
  const reset = useCallback(() => setData(buildFixtures()), []);

  const value = useMemo(
    () => ({ data, role, setRole, newMatterOpen, setNewMatterOpen, meuDiaOpen, setMeuDiaOpen, update, reset }),
    [data, role, setRole, newMatterOpen, meuDiaOpen, update, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

export function findOffice(slug: string): Office | undefined {
  return OFFICES.find((o) => o.slug === slug);
}

/** Office-scoped + permission-filtered view. Every list filters by officeId first. */
export function useOfficeView(office: Office) {
  const { data, role } = useDemo();
  return useMemo(() => {
    const me: Member | undefined = data.members.find((m) => m.officeId === office.id && m.role === role);
    const matters = data.matters.filter((m) => m.officeId === office.id && canSeeMatter(role, m, me?.id));
    const visible = new Set(matters.map((m) => m.id));
    const matterById = new Map(matters.map((m) => [m.id, m]));
    const inScope = <T extends { officeId: string; matterId?: string }>(arr: T[]) =>
      arr.filter((x) => x.officeId === office.id && (!x.matterId || visible.has(x.matterId)));
    const docs = inScope(data.docs).filter((doc) => {
      const matter = matterById.get(doc.matterId);
      return !!matter && canSeeDoc(role, doc, matter, me?.id);
    });
    const visibleDocIds = new Set(docs.map((doc) => doc.id));
    const canSeeOfficeQueue = ["gestor", "socio", "coordenador"].includes(role);
    const intakes = data.intakes.filter((intake) =>
      intake.officeId === office.id && (canSeeOfficeQueue || intake.assigneeId === me?.id || intake.requesterId === me?.id),
    );
    const visibleIntakeIds = new Set(intakes.map((intake) => intake.id));
    const tasks = inScope(data.tasks).filter((task) => !!task.matterId || task.assigneeId === me?.id || task.requesterId === me?.id || canSeeOfficeQueue);
    const userPreferences = data.userPreferences.find((preference) => preference.officeId === office.id && preference.memberId === me?.id);
    const notifications = inScope(data.notifications).filter((notification) =>
      (!notification.recipientMemberId || notification.recipientMemberId === me?.id || canSeeOfficeQueue) &&
      (!notification.taskId || tasks.some((task) => task.id === notification.taskId)) &&
      (!notification.docId || visibleDocIds.has(notification.docId)) &&
      (notification.priority === "alta" || userPreferences?.categories[notification.category] !== false) &&
      (canSeeCnj(role) || notification.category !== "prazo"),
    );
    const visibleClientIds = new Set(matters.flatMap((matter) => matter.clientIds));
    const clients = data.clients.filter((client) =>
      client.officeId === office.id && (visibleClientIds.has(client.id) || client.responsibleId === me?.id),
    );
    return {
      me,
      matterDocumentChecklists: data.matterDocumentChecklists.filter((checklist) => checklist.officeId === office.id && visible.has(checklist.matterId)),
      contractAnalysisDraft: data.contractAnalysisDrafts.find((draft) => draft.officeId === office.id && draft.memberId === me?.id),
      fiscalPreparationDraft: data.fiscalPreparationDrafts.find((draft) => draft.officeId === office.id && draft.memberId === me?.id),
      userPreferences,
      officeProfile: data.officeProfiles.find((profile) => profile.officeId === office.id),
      officeProfileRevisions: data.officeProfileRevisions
        .filter((revision) => revision.officeId === office.id)
        .sort((a, b) => b.proposedAt.localeCompare(a.proposedAt)),
      role,
      matters,
      intakes,
      conflicts: data.conflicts.filter((check) =>
        check.officeId === office.id && (!check.intakeId || visibleIntakeIds.has(check.intakeId)),
      ),
      clientPortalInvites: inScope(data.clientPortalInvites),
      collaboratorInvites: data.collaboratorInvites.filter((invite) => invite.officeId === office.id),
      teams: data.teams.filter((team) => team.officeId === office.id),
      supportTickets: data.supportTickets.filter((ticket) => ticket.officeId === office.id),
      securitySessions: data.securitySessions.filter((session) => session.officeId === office.id && session.memberId === me?.id),
      members: data.members.filter((m) => m.officeId === office.id),
      clients,
      proceedings: canSeeCnj(role) ? inScope(data.proceedings) : [],
      deadlines: canSeeCnj(role) ? inScope(data.deadlines) : [],
      publicationCoverage: canSeeCnj(role)
        ? data.publicationCoverage.filter((coverage) => coverage.officeId === office.id)
        : [],
      publicationReviews: canSeeCnj(role) ? inScope(data.publicationReviews) as PublicationReview[] : [],
      tasks,
      docs,
      models: data.models.filter((m) => m.officeId === office.id),
      mandates: inScope(data.mandates),
      delegations: inScope(data.delegations),
      messages: inScope(data.messages),
      receivables: inScope(data.receivables),
      timeline: inScope(data.timeline).filter((event) =>
        (canSeeCnj(role) || event.kind !== "prazo") &&
        (event.kind !== "documento" || (!!event.docId && visibleDocIds.has(event.docId))),
      ),
      notifications,
      appointments: data.appointments.filter((appointment) =>
        appointment.officeId === office.id &&
        (appointment.matterId
          ? visible.has(appointment.matterId)
          : appointment.assigneeId === me?.id || ["gestor", "socio", "coordenador"].includes(role)),
      ),
      memberName: (id?: string) => data.members.find((m) => m.id === id && m.officeId === office.id)?.name ?? "—",
      clientName: (id: string) => clients.find((c) => c.id === id)?.name ?? "—",
      areaName: (id: string) => office.practiceAreas.find((a) => a.id === id)?.name ?? id,
      matterById: (id?: string): Matter | undefined => matters.find((m) => m.id === id),
    };
  }, [data, role, office]);
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function timelineEvent(e: Omit<TimelineEvent, "id" | "at">): TimelineEvent {
  return { ...e, id: uid("ev"), at: new Date().toISOString() };
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

export function isOverdue(t: Pick<Task, "dueAt" | "status">) {
  return t.status !== "concluida" && new Date(t.dueAt) < new Date() && !isToday(t.dueAt);
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Whole calendar days from today until iso (negative = past). */
export function daysUntil(iso: string, now = new Date()) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(iso);
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}
