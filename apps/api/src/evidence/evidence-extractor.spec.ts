import { extractEvidence } from "./evidence-extractor";

describe("extractEvidence", () => {
  const find = (items: ReturnType<typeof extractEvidence>, tech: string) =>
    items.find((i) => i.technology === tech);

  it("marks a detected language as USED", () => {
    const items = extractEvidence({ primaryLanguages: ["TypeScript"], filePaths: [], manifests: [] });
    expect(find(items, "TypeScript")?.strength).toBe("USED");
  });

  it("marks Docker as USED when a Dockerfile is present", () => {
    const items = extractEvidence({
      primaryLanguages: [],
      filePaths: ["Dockerfile", "src/index.ts"],
      manifests: [],
    });
    expect(find(items, "Docker")?.strength).toBe("USED");
    expect(find(items, "Docker")?.category).toBe("DEPLOYMENT");
  });

  it("marks a declared-but-unused dependency as MENTIONED", () => {
    const items = extractEvidence({
      primaryLanguages: [],
      filePaths: ["package.json"],
      manifests: [{ path: "package.json", content: JSON.stringify({ dependencies: { redis: "^4" } }) }],
    });
    expect(find(items, "Redis")?.strength).toBe("MENTIONED");
  });

  it("detects the database from a Prisma schema as USED", () => {
    const items = extractEvidence({
      primaryLanguages: [],
      filePaths: ["prisma/schema.prisma"],
      manifests: [
        {
          path: "prisma/schema.prisma",
          content: 'datasource db {\n  provider = "postgresql"\n}',
        },
      ],
    });
    expect(find(items, "PostgreSQL")?.strength).toBe("USED");
    expect(find(items, "Prisma")?.strength).toBe("USED");
  });

  it("upgrades React to USED when JSX/TSX files exist", () => {
    const items = extractEvidence({
      primaryLanguages: [],
      filePaths: ["src/App.tsx", "package.json"],
      manifests: [{ path: "package.json", content: JSON.stringify({ dependencies: { react: "^19" } }) }],
    });
    expect(find(items, "React")?.strength).toBe("USED");
  });

  it("merges signals for the same technology and keeps the strongest", () => {
    const items = extractEvidence({
      primaryLanguages: [],
      filePaths: ["next.config.mjs", "package.json"],
      manifests: [{ path: "package.json", content: JSON.stringify({ dependencies: { next: "^15" } }) }],
    });
    const next = find(items, "Next.js");
    expect(next?.strength).toBe("USED");
    // one merged entry, not two
    expect(items.filter((i) => i.technology === "Next.js")).toHaveLength(1);
  });
});
