import type { DeveloperEvidenceItem } from "@engineerdna/shared";
import { selectInterviewTopics } from "./interview-topics";

function item(partial: Partial<DeveloperEvidenceItem> & { technology: string }): DeveloperEvidenceItem {
  return {
    technology: partial.technology,
    category: partial.category ?? "FRAMEWORK",
    strength: partial.strength ?? "USED",
    confidence: partial.confidence ?? 0.9,
    repositoryCount: partial.repositories?.length ?? 1,
    repositories: partial.repositories ?? ["repo-a"],
    firstSeenAt: partial.firstSeenAt ?? null,
    proofs: partial.proofs ?? [],
  };
}

describe("selectInterviewTopics", () => {
  it("returns no topics when there is no USED evidence", () => {
    const topics = selectInterviewTopics([
      item({ technology: "React", strength: "MENTIONED" }),
    ]);
    expect(topics).toEqual([]);
  });

  it("maps USED technologies to their interview themes", () => {
    const topics = selectInterviewTopics([
      item({ technology: "JWT" }),
      item({ technology: "Redis" }),
      item({ technology: "Docker" }),
    ]);
    const themes = topics.map((t) => t.theme);
    expect(themes).toContain("Authentication & session security");
    expect(themes).toContain("Caching & in-memory data stores");
    expect(themes).toContain("Containerization & deployment");
  });

  it("groups multiple technologies under one theme", () => {
    const topics = selectInterviewTopics([
      item({ technology: "PostgreSQL", repositories: ["api"] }),
      item({ technology: "Prisma", repositories: ["api"] }),
    ]);
    const relational = topics.find((t) => t.theme === "Relational data modeling");
    expect(relational).toBeDefined();
    expect(relational!.techs).toEqual(expect.arrayContaining(["PostgreSQL", "Prisma"]));
  });

  it("orders stronger topics (more repos) first and caps at five", () => {
    const topics = selectInterviewTopics([
      item({ technology: "React", repositories: ["a", "b", "c"] }),
      item({ technology: "Redis", repositories: ["a"] }),
      item({ technology: "Docker", repositories: ["a", "b"] }),
      item({ technology: "GraphQL", repositories: ["a"] }),
      item({ technology: "Kafka", repositories: ["a"] }),
      item({ technology: "PyTorch", repositories: ["a"] }),
      item({ technology: "JWT", repositories: ["a"] }),
    ]);
    expect(topics).toHaveLength(5);
    expect(topics[0]!.theme).toBe("Frontend architecture & state management");
  });
});
