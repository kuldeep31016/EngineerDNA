import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

/**
 * File storage (chat attachments, resumes, interview recordings, …). Global so
 * any feature module can inject StorageService. Driver is chosen by env
 * (STORAGE_DRIVER=local|s3) — see StorageService.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
