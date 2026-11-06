import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { OFFICES } from "./fixtures";
import { DemoProvider, useDemo, useOfficeView } from "./store";

function useSessions() {
  const demo = useDemo();
  return {
    demo,
    a: useOfficeView(OFFICES[0]!),
    b: useOfficeView(OFFICES[1]!),
  };
}

beforeEach(() => window.localStorage.clear());

describe("security session demo scope", () => {
  it("limits each session list to the active office and member, including after role changes", () => {
    const { result } = renderHook(useSessions, { wrapper: DemoProvider });
    expect(result.current.a.securitySessions).toHaveLength(3);
    expect(result.current.b.securitySessions).toHaveLength(3);
    expect(result.current.a.securitySessions.every((session) => session.officeId === "off-a" && session.memberId === result.current.a.me?.id)).toBe(true);
    expect(result.current.b.securitySessions.every((session) => session.officeId === "off-b" && session.memberId === result.current.b.me?.id)).toBe(true);

    act(() => result.current.demo.setRole("advogado"));
    expect(result.current.a.securitySessions).toHaveLength(0);
    expect(result.current.b.securitySessions).toHaveLength(0);
  });

  it("keeps forged sessions for another member out of the visible office list", () => {
    const { result } = renderHook(useSessions, { wrapper: DemoProvider });
    const example = result.current.a.securitySessions[0]!;
    act(() => result.current.demo.update((data) => ({
      ...data,
      securitySessions: [
        ...data.securitySessions,
        { ...example, id: "other-member", memberId: "a-m2" },
        { ...example, id: "other-office", officeId: "off-b" },
      ],
    })));
    expect(result.current.a.securitySessions.some((session) => session.id.startsWith("other-"))).toBe(false);
    expect(result.current.b.securitySessions.some((session) => session.id.startsWith("other-"))).toBe(false);
  });
});
