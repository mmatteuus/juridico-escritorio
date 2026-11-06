import { timelineEvent } from "./store";
import type { Deadline, DemoData, TaskStatus } from "./types";

type Update = (fn: (d: DemoData) => DemoData) => void;

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  a_fazer: ["em_andamento"],
  em_andamento: ["aguardando_cliente", "aguardando_revisao"],
  aguardando_cliente: ["em_andamento", "aguardando_revisao"],
  aguardando_revisao: ["em_andamento", "concluida"],
  concluida: [],
};

export function canTransitionTask(current: TaskStatus, next: TaskStatus) {
  return TASK_TRANSITIONS[current].includes(next);
}

/** Apply a deadline change with history + timeline entry (DEMO only). */
export function changeDeadline(update: Update, d: Deadline, next: Partial<Deadline>, action: string, actor: string) {
  update((s) => ({
    ...s,
    deadlines: s.deadlines.map((x) =>
      x.id === d.id && x.officeId === d.officeId ? { ...x, ...next, history: [...x.history, { at: new Date().toISOString(), actor, action }] } : x,
    ),
    timeline: d.matterId ? [timelineEvent({ officeId: d.officeId, matterId: d.matterId, actor, kind: "prazo", text: `${action}: ${d.title}` }), ...s.timeline] : s.timeline,
  }));
}

/** Keep the current date effective until a professional approves the proposal. */
export function rescheduleDeadline(d: Deadline, isoDate: string, reason = ""):
  Partial<Deadline> {
  return {
    proposedDueDate: isoDate,
    proposedReason: reason.trim() || undefined,
    proposedVersion: d.version + 1,
    status: "em_revisao",
  };
}
