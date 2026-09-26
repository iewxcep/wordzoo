import { Module } from "@nestjs/common";

import { CourseHistoryModule } from "../course-history/course-history.module";
import { CourseModule } from "../course/course.module";
import { CoursePackController } from "./course-pack.controller";
import { CoursePackService } from "./course-pack.service";

@Module({
  imports: [CourseModule, CourseHistoryModule],
  providers: [CoursePackService],
  controllers: [CoursePackController],
})
export class CoursePackModule {}
