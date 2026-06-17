import { ConfigService } from "@nestjs/config";
import { TokenCipherService } from "./token-cipher.service";

function makeCipher(): TokenCipherService {
  const config = {
    get: (key: string) => (key === "JWT_SECRET" ? "test-secret" : undefined),
  } as unknown as ConfigService;
  return new TokenCipherService(config);
}

describe("TokenCipherService", () => {
  it("round-trips a value back to the original", () => {
    const cipher = makeCipher();
    const encrypted = cipher.encrypt("gho_secrettoken");
    expect(encrypted).not.toContain("gho_secrettoken");
    expect(cipher.decrypt(encrypted)).toBe("gho_secrettoken");
  });

  it("uses a random IV so the same input encrypts differently each time", () => {
    const cipher = makeCipher();
    expect(cipher.encrypt("same")).not.toBe(cipher.encrypt("same"));
  });

  it("throws on a malformed payload", () => {
    const cipher = makeCipher();
    expect(() => cipher.decrypt("not-valid")).toThrow();
  });
});
