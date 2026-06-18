import { Injectable } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for recruiter (CREDENTIALS) accounts. Uses Node's built-in
 * scrypt — strong and dependency-free. Stored format: `salt:derivedKey` (hex).
 */
@Injectable()
export class PasswordService {
  private readonly keyLen = 64;

  hash(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(password, salt, this.keyLen).toString("hex");
    return `${salt}:${derived}`;
  }

  verify(password: string, stored: string | null | undefined): boolean {
    if (!stored) return false;
    const [salt, key] = stored.split(":");
    if (!salt || !key) return false;
    const derived = scryptSync(password, salt, this.keyLen);
    const expected = Buffer.from(key, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }
}
