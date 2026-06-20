import { join } from "node:path";

/** Where chat attachments are stored on disk (served statically at /uploads). */
export const UPLOADS_DIR = join(process.cwd(), "uploads");
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB
