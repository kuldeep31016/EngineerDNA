import type { Score } from "@engineerdna/shared";
import { computeCareer } from "./career-advisor";

const sc = (key: string, label: string, value: number): Score => ({
  key,
  label,
  value,
  level: "x",
  reasoning: "",
  evidenceRefs: [],
});

describe("computeCareer", () => {
  it("is unavailable with no DNA", () => {
    const r = computeCareer({ overall: 0, scores: [], topStrengths: [] });
    expect(r.available).toBe(false);
    expect(r.archetype.title).toBe("Emerging Engineer");
  });

  it("identifies a backend archetype and grounded roles", () => {
    const r = computeCareer({
      overall: 68,
      topStrengths: ["Backend Engineering", "Database Skills"],
      scores: [sc("backend", "Backend Engineering", 80), sc("database", "Database Skills", 70), sc("frontend", "Frontend Engineering", 20), sc("testing", "Testing", 15)],
    });
    expect(r.archetype.title).toContain("Backend");
    expect(r.roles.length).toBeGreaterThan(0);
    expect(r.roles[0]!.fit.length).toBeGreaterThan(0);
  });

  it("surfaces weak areas as skill gaps with recommendations", () => {
    const r = computeCareer({
      overall: 50,
      topStrengths: ["Backend Engineering"],
      scores: [sc("backend", "Backend Engineering", 75), sc("testing", "Testing", 10), sc("devops", "DevOps Readiness", 12)],
    });
    expect(r.skillGaps.some((g) => g.label === "Testing")).toBe(true);
    expect(r.skillGaps.every((g) => g.recommendation.length > 0)).toBe(true);
    expect(r.learnNext.length).toBeGreaterThan(0);
  });

  it("always includes algorithms in interview topics", () => {
    const r = computeCareer({ overall: 40, topStrengths: [], scores: [sc("backend", "Backend Engineering", 45)] });
    expect(r.interviewTopics).toContain("Data structures & algorithms");
  });
});
