import { timelineEvent } from "./store";
import type { Deadline, DemoData } from "./types";

type Update = (fn: (d: DemoData) => DemoData) => void;

/** Apply a deadline change with history + timeline entry (DEMO only). */
export function changeDeadline(update: Update, d: Deadline, next: Partial<Deadline>, action: string, actor: string) {
  update((s) => ({
    ...s,
    deadlines: s.deadlines.map((x) =>
      x.id === d.id ? { ...x, ...next, history: [...x.history, { at: new Date().toISOString(), actor, action }] } : x,
    ),
    timeline: [timelineEvent({ officeId: d.officeId, matterId: d.matterId, actor, kind: "prazo", text: `${action}: ${d.title}` }), ...s.timeline],
  }));
}

/** Changing the date of a deadline always returns it to review. */
export function rescheduleDeadline(d: Deadline, isoDate: string): Partial<Deadline> {
  const next: Partial<Deadline> = { dueDate: isoDate, version: d.version + 1 };
  if (d.status === "confirmado" || d.status === "proposto") next.status = "em_revisao";
  return next;
}
