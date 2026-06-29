import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StoredFile {
  /** Stable storage key, e.g. "attachments/uuid.png" — persist THIS in the DB. */
  key: string;
  /** A directly-servable URL for the stored object. */
  url: string;
}

export interface PutOptions {
  body: Buffer;
  /** Logical folder/prefix: "attachments" | "resumes" | "interviews" | … */
  folder: string;
  /** Original filename — only the extension is used for the stored key. */
  originalName?: string;
  contentType?: string;
}

/**
 * One storage abstraction for every binary the app keeps (chat attachments,
 * resumes, interview recordings, generated files). Two interchangeable drivers,
 * chosen by STORAGE_DRIVER:
 *
 *   - "local" (default): writes under ./uploads, served by the API at /uploads.
 *   - "s3": uploads to an S3 (or S3-compatible: R2, MinIO, Spaces) bucket.
 *
 * The app runs fully on the local driver with no cloud credentials. Set
 * STORAGE_DRIVER=s3 plus the AWS_* vars to flip to S3 — no code changes.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: "local" | "s3";
  private readonly uploadsDir = join(process.cwd(), "uploads");

  // S3 config (only read when driver === "s3").
  private readonly s3?: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  /** Public base URL for objects (CDN or virtual-hosted bucket URL). */
  private readonly publicBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    const requested = (this.config.get<string>("STORAGE_DRIVER") ?? "local").toLowerCase();
    this.bucket = this.config.get<string>("AWS_S3_BUCKET") ?? "";
    this.region = this.config.get<string>("AWS_REGION") ?? "us-east-1";
    const accessKeyId = this.config.get<string>("AWS_ACCESS_KEY_ID") ?? "";
    const secretAccessKey = this.config.get<string>("AWS_SECRET_ACCESS_KEY") ?? "";
    const endpoint = this.config.get<string>("AWS_S3_ENDPOINT") || undefined;
    this.publicBaseUrl = this.config.get<string>("AWS_S3_PUBLIC_URL")?.replace(/\/$/, "") || null;

    // Fall back to local if S3 was requested but not fully configured, so the
    // app never crashes on a half-set environment.
    if (requested === "s3" && this.bucket && accessKeyId && secretAccessKey) {
      this.driver = "s3";
      this.s3 = new S3Client({
        region: this.region,
        endpoint,
        forcePathStyle: Boolean(endpoint), // S3-compatible (MinIO/R2) need path-style
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Storage driver: s3 (bucket "${this.bucket}", region "${this.region}")`);
    } else {
      this.driver = "local";
      if (requested === "s3") {
        this.logger.warn("STORAGE_DRIVER=s3 but AWS_S3_BUCKET / credentials are missing — using local disk.");
      }
    }
  }

  /** Store a file and return its key + a servable URL. */
  async put(opts: PutOptions): Promise<StoredFile> {
    const ext = extname(opts.originalName ?? "").slice(0, 12);
    const key = `${opts.folder}/${randomUUID()}${ext}`;

    if (this.driver === "s3" && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: opts.body,
          ContentType: opts.contentType,
        }),
      );
      return { key, url: this.publicUrl(key) };
    }

    // Local driver — write under ./uploads/<folder>/.
    const dir = join(this.uploadsDir, opts.folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(this.uploadsDir, key), opts.body);
    return { key, url: `/uploads/${key}` };
  }

  /** Delete a stored object by key (best-effort). */
  async remove(key: string): Promise<void> {
    try {
      if (this.driver === "s3" && this.s3) {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } else {
        await unlink(join(this.uploadsDir, key));
      }
    } catch {
      /* already gone — ignore */
    }
  }

  /** A directly-servable URL for a key (S3 public/CDN URL, or local path). */
  publicUrl(key: string): string {
    if (this.driver === "s3") {
      if (this.publicBaseUrl) return `${this.publicBaseUrl}/${key}`;
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    return `/uploads/${key}`;
  }

  /**
   * A time-limited signed GET URL — use for PRIVATE objects (resumes, interview
   * recordings) so they aren't world-readable. Falls back to the local path
   * when not on S3.
   */
  async signedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (this.driver === "s3" && this.s3) {
      return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
        expiresIn: expiresInSeconds,
      });
    }
    return `/uploads/${key}`;
  }

  get activeDriver(): "local" | "s3" {
    return this.driver;
  }
}
