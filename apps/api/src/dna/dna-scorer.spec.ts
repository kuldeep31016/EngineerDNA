import type { DeveloperEvidenceItem } from "@engineerdna/shared";
import { computeDnaScores } from "./dna-scorer";

const item = (over: Partial<DeveloperEvidenceItem>): DeveloperEvidenceItem => ({
  technology: "X",
  category: "LIBRARY",
  strength: "USED",
  confidence: 0.9,
  repositoryCount: 1,
  repositories: ["repo"],
  firstSeenAt: null,
  proofs: [],
  ...over,
});

describe("computeDnaScores", () => {
  it("returns all dimensions with explanations", () => {
    const { scores } = computeDnaScores([]);
    expect(scores.length).toBeGreaterThanOrEqual(10);
    for (const s of scores) {
      expect(typeof s.reasoning).toBe("string");
      expect(s.reasoning.length).toBeGreaterThan(0);
    }
  });

  it("gives zero with no evidence", () => {
    const { overall, topStrengths } = computeDnaScores([]);
    expect(overall).toBe(0);
    expect(topStrengths).toEqual([]);
  });

  it("scores frontend when React is used", () => {
    const { scores } = computeDnaScores([
      item({ technology: "React", category: "FRAMEWORK" }),
      item({ technology: "TypeScript", category: "LANGUAGE" }),
    ]);
    const frontend = scores.find((s) => s.key === "frontend")!;
    expect(frontend.value).toBeGreaterThan(0);
    expect(frontend.evidenceRefs).toContain("React");
  });

  it("never produces a score without a reason", () => {
    const { scores } = computeDnaScores([item({ technology: "Docker", category: "DEPLOYMENT" })]);
    const devops = scores.find((s) => s.key === "devops")!;
    expect(devops.value).toBeGreaterThan(0);
    expect(devops.reasoning).toContain("Docker");
  });
});
