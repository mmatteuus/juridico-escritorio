import { describe, expect, it } from "vitest";
import { buildFixtures } from "./fixtures";
import { canConfirmDeadline, canSeeCnj, canSeeMatter } from "./permissions";

const data = buildFixtures();
const sigilo = data.matters.find((m) => m.confidentiality === "sigilo_reforcado")!;

describe("demo permissions", () => {
  it("secretary cannot confirm a deadline, lawyer can", () => {
    expect(canConfirmDeadline("secretario")).toBe(false);
    expect(canConfirmDeadline("advogado")).toBe(true);
  });
  it("sigilo reforçado hidden from gestor without grant", () => {
    expect(canSeeMatter("gestor", sigilo)).toBe(false);
    expect(canSeeMatter("socio", sigilo, "a-m2")).toBe(true);
    expect(canSeeMatter("socio", sigilo)).toBe(false);
  });
  it("does not reveal normal cases by office membership alone", () => {
    const normal = data.matters.find(m => m.id === "a-k1")!;
    expect(canSeeMatter("secretario", normal, "a-m5")).toBe(false);
    expect(canSeeMatter("advogado", normal, "a-m4")).toBe(true);
    expect(canSeeMatter("gestor", normal, "a-m1")).toBe(true);
    expect(canSeeMatter("gestor", normal)).toBe(false);
  });
  it("financeiro does not see CNJ", () => {
    expect(canSeeCnj("financeiro")).toBe(false);
  });
  it("every fixture record belongs to an office", () => {
    expect(data.tasks.every((t) => t.officeId === "off-a" || t.officeId === "off-b")).toBe(true);
  });
});
