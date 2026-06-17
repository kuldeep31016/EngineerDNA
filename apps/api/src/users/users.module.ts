import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";

/** User persistence. Consumed by the auth module today; HTTP routes later. */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
