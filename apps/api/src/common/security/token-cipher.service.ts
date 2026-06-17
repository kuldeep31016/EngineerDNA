import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Symmetric encryption for secrets we must store and reuse (GitHub access
 * tokens). Uses AES-256-GCM. The key comes from ENCRYPTION_KEY (64 hex chars);
 * if unset, it is derived from JWT_SECRET so local dev works out of the box.
 * Output format: base64(iv).base64(authTag).base64(ciphertext)
 */
@Injectable()
export class TokenCipherService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hexKey = config.get<string>("ENCRYPTION_KEY");
    this.key =
      hexKey && hexKey.length === 64
        ? Buffer.from(hexKey, "hex")
        : createHash("sha256")
            .update(config.get<string>("JWT_SECRET") ?? "dev-insecure-secret")
            .digest();
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error("Malformed encrypted payload");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}
