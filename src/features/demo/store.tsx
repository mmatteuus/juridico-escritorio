import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildFixtures, OFFICES } from "./fixtures";
import { canSeeMatter, ROLE_LABEL } from "./permissions";
import type { DemoData, Matter, Member, Office, RoleId, Task, TimelineEvent } from "./types";

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
    const inScope = <T extends { officeId: string; matterId?: string }>(arr: T[]) =>
      arr.filter((x) => x.officeId === office.id && (!x.matterId || visible.has(x.matterId)));
    return {
      me,
      role,
      matters,
      members: data.members.filter((m) => m.officeId === office.id),
      clients: data.clients.filter((c) => c.officeId === office.id),
      proceedings: inScope(data.proceedings),
      deadlines: inScope(data.deadlines),
      tasks: inScope(data.tasks),
      docs: inScope(data.docs),
      messages: inScope(data.messages),
      receivables: inScope(data.receivables),
      timeline: inScope(data.timeline),
      notifications: inScope(data.notifications),
      appointments: inScope(data.appointments),
      memberName: (id?: string) => data.members.find((m) => m.id === id)?.name ?? "—",
      clientName: (id: string) => data.clients.find((c) => c.id === id && c.officeId === office.id)?.name ?? "—",
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
