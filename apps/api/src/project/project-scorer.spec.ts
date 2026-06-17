import type { RepoEvidenceItem } from "@engineerdna/shared";
import { computeProjectIntelligence } from "./project-scorer";

const ev = (technology: string, category: RepoEvidenceItem["category"]): RepoEvidenceItem => ({
  technology,
  category,
  strength: "USED",
  confidence: 0.9,
  source: "GITHUB_REPO",
  proofs: [],
});

describe("computeProjectIntelligence", () => {
  it("is unavailable with no evidence and no report", () => {
    const r = computeProjectIntelligence({ repoName: "x", report: null, evidence: [] });
    expect(r.available).toBe(false);
  });

  it("scores a production-grade repo highly and gives reasons", () => {
    const r = computeProjectIntelligence({
      repoName: "payments-service",
      report: null,
      evidence: [
        ev("Docker", "DEPLOYMENT"),
        ev("Jest", "TESTING"),
        ev("PostgreSQL", "DATABASE"),
        ev("JWT", "AUTH"),
        ev("NestJS", "FRAMEWORK"),
      ],
    });
    expect(r.overall.value).toBeGreaterThan(60);
    expect(r.verdicts.find((v) => v.label === "Production-ready")?.positive).toBe(true);
    for (const d of r.dimensions) expect(d.reasoning.length).toBeGreaterThan(0);
  });

  it("flags missing tests in improvements", () => {
    const r = computeProjectIntelligence({
      repoName: "api",
      report: null,
      evidence: [ev("Express", "FRAMEWORK")],
    });
    expect(r.improvements.some((i) => /test/i.test(i))).toBe(true);
  });

  it("marks tutorial-named repos as likely a clone", () => {
    const r = computeProjectIntelligence({ repoName: "netflix-clone", report: null, evidence: [ev("React", "FRAMEWORK")] });
    expect(r.verdicts.find((v) => v.label === "Originality")?.positive).toBe(false);
  });
});
