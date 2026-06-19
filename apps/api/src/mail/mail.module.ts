import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";

/**
 * Transactional email (SMTP via nodemailer). Global so any feature module can
 * inject MailService without re-importing. No-ops gracefully when SMTP is unset.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
