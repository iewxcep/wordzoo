import { Module } from "@nestjs/common";

import { GlobalModule } from "../global/global.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [GlobalModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
