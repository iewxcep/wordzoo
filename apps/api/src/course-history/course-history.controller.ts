import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { CourseHistoryService } from "./course-history.service";

@Controller("course-history")
export class CourseHistoryController {
  constructor(private readonly courseHistoryService: CourseHistoryService) {}

  @UseGuards(AuthGuard)
  @Get("")
  courseCompletionCount(@User() user: UserEntity) {
    return this.courseHistoryService.findAll(user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(":coursePackId")
  getCoursePackHistory(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return this.courseHistoryService.findByCoursePackId(user.userId, coursePackId);
  }
}
