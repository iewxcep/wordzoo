import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { CoursePackService } from "./course-pack.service";

@Controller("course-pack")
export class CoursePackController {
  constructor(private readonly coursePackService: CoursePackService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@User() user: UserEntity) {
    return await this.coursePackService.findAll(user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(":coursePackId")
  async findOne(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return await this.coursePackService.findOneWithCourses(user.userId, coursePackId);
  }

  @UseGuards(AuthGuard)
  @Get(":coursePackId/courses/:courseId")
  findCourse(
    @User() user: UserEntity,
    @Param("coursePackId") coursePackId: string,
    @Param("courseId") courseId: string,
  ) {
    return this.coursePackService.findCourse(user.userId, coursePackId, courseId);
  }

  @UseGuards(AuthGuard)
  @Get(":coursePackId/courses/:courseId/next")
  findNextCourse(@Param("coursePackId") coursePackId: string, @Param("courseId") courseId: string) {
    return this.coursePackService.findNextCourse(coursePackId, courseId);
  }

  @UseGuards(AuthGuard)
  @Post(":coursePackId/courses/:courseId/complete")
  CompleteCourse(
    @User() user: UserEntity,
    @Param("coursePackId") coursePackId: string,
    @Param("courseId") courseId: string,
  ) {
    return this.coursePackService.completeCourse(user.userId, coursePackId, courseId);
  }
}
