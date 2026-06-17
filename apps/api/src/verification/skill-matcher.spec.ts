import { canonicalTech } from "./skill-matcher";

describe("canonicalTech", () => {
  it("matches name variants to the same key", () => {
    expect(canonicalTech("React.js")).toBe(canonicalTech("ReactJS"));
    expect(canonicalTech("React")).toBe(canonicalTech("react.js"));
  });

  it("aligns Postgres and PostgreSQL", () => {
    expect(canonicalTech("Postgres")).toBe(canonicalTech("PostgreSQL"));
  });

  it("aligns short forms (TS/JS)", () => {
    expect(canonicalTech("TS")).toBe(canonicalTech("TypeScript"));
    expect(canonicalTech("JS")).toBe(canonicalTech("JavaScript"));
  });

  it("keeps distinct technologies distinct", () => {
    expect(canonicalTech("C++")).not.toBe(canonicalTech("C"));
    expect(canonicalTech("Java")).not.toBe(canonicalTech("JavaScript"));
  });
});
