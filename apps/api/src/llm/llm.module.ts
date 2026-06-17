import { Global, Module } from "@nestjs/common";
import { AnthropicService } from "./anthropic.service";

/** Global LLM access — any module can inject AnthropicService. */
@Global()
@Module({
  providers: [AnthropicService],
  exports: [AnthropicService],
})
export class LlmModule {}
