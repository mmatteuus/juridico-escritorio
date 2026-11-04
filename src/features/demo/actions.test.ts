import { describe, expect, it } from "vitest";
import { buildFixtures } from "./fixtures";
import { rescheduleDeadline } from "./actions";

describe("deadline rules", () => {
  it("changing the date of a confirmed deadline sends it back to review", () => {
    const d = buildFixtures().deadlines.find((x) => x.status === "confirmado")!;
    const next = rescheduleDeadline(d, new Date().toISOString());
    expect(next.status).toBe("em_revisao");
    expect(next.version).toBe(d.version + 1);
  });
});
