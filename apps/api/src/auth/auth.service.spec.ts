import { AuthService } from "./auth.service";

/**
 * Unit tests for the deterministic, dependency-free parts of AuthService.
 * Token rotation / cookie flows are covered by e2e tests (added later) since
 * they require a database and HTTP context.
 */
describe("AuthService.hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(AuthService.hashToken("abc")).toBe(AuthService.hashToken("abc"));
  });

  it("produces a 64-char hex SHA-256 digest", () => {
    const hash = AuthService.hashToken("some-refresh-token");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("never stores the raw token (hash differs from input)", () => {
    const raw = "super-secret-token";
    expect(AuthService.hashToken(raw)).not.toBe(raw);
  });

  it("yields different hashes for different inputs", () => {
    expect(AuthService.hashToken("token-a")).not.toBe(AuthService.hashToken("token-b"));
  });
});
