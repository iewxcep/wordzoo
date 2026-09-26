import { Body, Controller, Get, Put, Query, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { UpsertUserProgressDto } from "./model/user-progress.dto";
import { UserCourseProgressService } from "./user-course-progress.service";

@Controller("user-course-progress")
export class UserProgressController {
  constructor(private readonly userCourseProgressService: UserCourseProgressService) {}

  @UseGuards(AuthGuard)
  @Get("/recent-course-packs")
  async getUserRecentCoursePacks(@User() user: UserEntity, @Query("limit") limit: number) {
    const recentCoursePacks = await this.userCourseProgressService.getUserRecentCoursePacks(
      user.userId,
      limit || 3,
    );
    return recentCoursePacks;
  }

  @UseGuards(AuthGuard)
  @Get()
  async getProgress(@User() user: UserEntity, @Query("coursePackId") coursePackId: string) {
    if (!coursePackId) return { courseId: null, statementIndex: 0 };
    const progress = await this.userCourseProgressService.findProgressByCoursePack(
      user.userId,
      coursePackId,
    );
    return {
      courseId: progress?.courseId ?? null,
      statementIndex: progress?.statementIndex ?? 0,
    };
  }

  @UseGuards(AuthGuard)
  @Put()
  async upsert(@User() user: UserEntity, @Body() dto: UpsertUserProgressDto) {
    const result = await this.userCourseProgressService.upsert(
      user.userId,
      dto.coursePackId,
      dto.courseId,
      dto.statementIndex,
    );

    return result;
  }
}
