import { describe, expect, it } from "vitest";
import { daysUntil } from "./store";

describe("daysUntil", () => {
  const now = new Date(2026, 10, 5, 15, 0);
  it("is 0 for later the same day", () => expect(daysUntil(new Date(2026, 10, 5, 23).toISOString(), now)).toBe(0));
  it("is 1 for tomorrow morning", () => expect(daysUntil(new Date(2026, 10, 6, 8).toISOString(), now)).toBe(1));
  it("is negative for past days", () => expect(daysUntil(new Date(2026, 10, 3, 18).toISOString(), now)).toBe(-2));
});
