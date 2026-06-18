import { Module } from "@nestjs/common";
import { OssController } from "./oss.controller";
import { OssService } from "./oss.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { GithubModule } from "../github/github.module";

/**
 * Open Source Recommendation (Module 17). Matches verified skills to real GitHub
 * repositories and good-first issues via the GitHub Search API. No LLM.
 */
@Module({
  imports: [EvidenceModule, GithubModule],
  controllers: [OssController],
  providers: [OssService],
  exports: [OssService],
})
export class OssModule {}
