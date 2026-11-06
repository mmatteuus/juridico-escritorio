import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoProvider, useDemo, useOfficeView } from "./store";
import { OFFICES } from "./fixtures";

const officeA = OFFICES[0]!;
const officeB = OFFICES[1]!;
const collections = ["mandates", "delegations", "conflicts", "clientPortalInvites"] as const;

function useBothOffices() {
  const demo = useDemo();
  return { demo, a: useOfficeView(officeA), b: useOfficeView(officeB) };
}

beforeEach(() => window.localStorage.clear());

describe("new office demo collections", () => {
  it("keeps every new list within its office, including different seeded records", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    for (const collection of collections) {
      const listA = result.current.a[collection];
      const listB = result.current.b[collection];
      expect(listA.length, `${collection} should have office A fixtures`).toBeGreaterThan(0);
      expect(listB.length, `${collection} should have office B fixtures`).toBeGreaterThan(0);
      expect(listA.every(item => item.officeId === officeA.id), collection).toBe(true);
      expect(listB.every(item => item.officeId === officeB.id), collection).toBe(true);
      expect(listA.some(item => listB.some(other => other.id === item.id)), collection).toBe(false);
    }
  });

  it("rejects cross-office records even when they point to a visible case", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    const visibleCase = result.current.a.matters[0]!;
    const mandate = result.current.a.mandates[0]!;
    const delegation = result.current.a.delegations[0]!;
    const conflict = result.current.a.conflicts[0]!;
    const invite = result.current.a.clientPortalInvites[0]!;
    act(() => result.current.demo.update(data => ({
      ...data,
      mandates: [...data.mandates, { ...mandate, id: "cross-mandate", officeId: officeB.id, matterId: visibleCase.id }],
      delegations: [...data.delegations, { ...delegation, id: "cross-delegation", officeId: officeB.id, matterId: visibleCase.id }],
      conflicts: [...data.conflicts, { ...conflict, id: "cross-conflict", officeId: officeB.id }],
      clientPortalInvites: [...data.clientPortalInvites, { ...invite, id: "cross-invite", officeId: officeB.id, matterId: visibleCase.id }],
    })));
    for (const collection of collections) {
      expect(result.current.a[collection].every(item => !item.id.startsWith("cross-")), collection).toBe(true);
    }
    expect(result.current.b.conflicts.some(item => item.id === "cross-conflict")).toBe(true);
    expect(result.current.b.mandates.some(item => item.id === "cross-mandate")).toBe(false);
    expect(result.current.b.delegations.some(item => item.id === "cross-delegation")).toBe(false);
    expect(result.current.b.clientPortalInvites.some(item => item.id === "cross-invite")).toBe(false);
  });

  it("hides case-linked records when the active role cannot see the case", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    const hidden = result.current.demo.data.matters.find(m => m.officeId === officeA.id && m.confidentiality === "sigilo_reforcado" && !m.grantRoles.includes("gestor"))!;
    expect(hidden).toBeDefined();
    act(() => result.current.demo.setRole("gestor"));
    expect(result.current.a.matters.some(m => m.id === hidden.id)).toBe(false);
    const mandate = result.current.demo.data.mandates.find(m => m.officeId === officeA.id)!;
    const delegation = result.current.demo.data.delegations.find(d => d.officeId === officeA.id)!;
    const invite = result.current.demo.data.clientPortalInvites.find(i => i.officeId === officeA.id)!;
    act(() => result.current.demo.update(data => ({
      ...data,
      mandates: [...data.mandates, { ...mandate, id: "hidden-mandate", matterId: hidden.id }],
      delegations: [...data.delegations, { ...delegation, id: "hidden-delegation", matterId: hidden.id }],
      clientPortalInvites: [...data.clientPortalInvites, { ...invite, id: "hidden-invite", matterId: hidden.id }],
    })));
    expect(result.current.a.mandates.some(m => m.id === "hidden-mandate")).toBe(false);
    expect(result.current.a.delegations.some(d => d.id === "hidden-delegation")).toBe(false);
    expect(result.current.a.clientPortalInvites.some(i => i.id === "hidden-invite")).toBe(false);
  });
});

describe("document dossier access", () => {
  it("requires case access and an explicit role grant for restricted documents", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    const canSee = (role: Parameters<typeof result.current.demo.setRole>[0]) => {
      act(() => result.current.demo.setRole(role));
      return result.current.a.docs.some(doc => doc.id === "a-doc2");
    };
    expect(canSee("gestor")).toBe(true); // explicit document grant
    expect(canSee("socio")).toBe(false); // case grant alone is insufficient
    expect(canSee("coordenador")).toBe(true); // explicit document grant
    expect(canSee("advogado")).toBe(true); // explicit document grant
    expect(canSee("secretario")).toBe(true); // explicit document grant
    expect(canSee("financeiro")).toBe(false); // legal documents are unavailable
    expect(canSee("estagiario")).toBe(false); // case itself is unavailable
    act(() => result.current.demo.setRole("coordenador"));
    expect(result.current.b.matters.some(matter => matter.id === "b-k1")).toBe(true);
    expect(result.current.b.docs.some(doc => doc.id === "b-doc1")).toBe(false); // team assignment alone is insufficient
  });

  it("updates document role grants and keeps forged cross-office documents out of the view", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    const source = result.current.demo.data.docs.find(doc => doc.id === "a-doc2")!;
    act(() => result.current.demo.update(data => ({
      ...data,
      docs: [
        ...data.docs.map(doc => doc.id === source.id ? { ...doc, grantedRoles: ["socio" as const] } : doc),
        { ...source, id: "cross-doc", officeId: officeB.id, matterId: "a-k2", grantedRoles: ["socio"] },
      ],
    })));
    act(() => result.current.demo.setRole("socio"));
    expect(result.current.a.docs.some(doc => doc.id === source.id)).toBe(true);
    expect(result.current.a.docs.some(doc => doc.id === "cross-doc")).toBe(false);
    expect(result.current.b.docs.some(doc => doc.id === "cross-doc")).toBe(false);
    act(() => result.current.demo.setRole("gestor"));
    expect(result.current.a.docs.some(doc => doc.id === source.id)).toBe(false);
  });

  it("does not honor a document grant without membership in that office", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    act(() => result.current.demo.setRole("gestor"));
    expect(result.current.a.docs.some(doc => doc.id === "a-doc2")).toBe(true);
    act(() => result.current.demo.update(data => ({
      ...data,
      members: data.members.filter(member => !(member.officeId === officeA.id && member.role === "gestor")),
    })));
    expect(result.current.a.docs).toHaveLength(0);
    expect(result.current.b.docs.some(doc => doc.id === "b-doc1")).toBe(true);
  });
});

describe("case access by explicit scope", () => {
  it("hides normal cases and all linked records from an unassigned role", () => {
    const { result } = renderHook(useBothOffices, { wrapper: DemoProvider });
    act(() => result.current.demo.setRole("secretario"));
    expect(result.current.a.matters.some(matter => matter.id === "a-k1")).toBe(false);
    expect(result.current.a.tasks.some(task => task.matterId === "a-k1")).toBe(false);
    expect(result.current.a.deadlines.some(deadline => deadline.matterId === "a-k1")).toBe(false);
    expect(result.current.a.docs.some(doc => doc.matterId === "a-k1")).toBe(false);
    expect(result.current.a.matters.some(matter => matter.id === "a-k2")).toBe(true);
  });
});
