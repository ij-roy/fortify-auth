import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersRepo } from "./repos/users.repo";
import { SessionsRepo } from "./repos/sessions.repo";
import { RefreshRepo } from "./repos/refresh.repo";

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [AuthService, UsersRepo, SessionsRepo, RefreshRepo],
})
export class AuthModule {}
