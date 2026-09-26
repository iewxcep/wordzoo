import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";

import { appSettings, course, coursePack } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";
import { UserEntity } from "../user/user.decorators";
import { UserCourseProgressService } from "../user-course-progress/user-course-progress.service";
import { UpdateUserDto } from "./model/user.dto";

interface UserSettings {
  username?: string;
  avatar?: string;
}

const DEFAULT_USERNAME = "Learner";

@Injectable()
export class UserService {
  constructor(
    @Inject(DB) private db: DbType,
    private readonly userCourseProgressService: UserCourseProgressService,
  ) {}

  private async readSettings(userId: string): Promise<UserSettings> {
    const record = await this.db.query.appSettings.findFirst({
      where: eq(appSettings.key, userId),
    });

    if (!record?.value) return {};

    try {
      return JSON.parse(record.value) as UserSettings;
    } catch {
      return {};
    }
  }

  private async writeSettings(userId: string, settings: UserSettings) {
    const value = JSON.stringify(settings);
    await this.db
      .insert(appSettings)
      .values({ key: userId, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value } });
  }

  async findUser(uId: string) {
    const settings = await this.readSettings(uId);
    return {
      id: uId,
      username: settings.username ?? DEFAULT_USERNAME,
      email: null,
      avatar: settings.avatar ?? null,
    };
  }

  /**
   * 返回当前用户信息（单机模式只有一个本地用户）。
   */
  async findCurrentUser(uId: string) {
    return this.findUser(uId);
  }

  async updateUser(user: UserEntity, dto: UpdateUserDto) {
    const settings = await this.readSettings(user.userId);
    const next = { ...settings };
    if (dto.username !== undefined) next.username = dto.username;
    if (dto.avatar !== undefined) next.avatar = dto.avatar;
    await this.writeSettings(user.userId, next);
    return this.findUser(user.userId);
  }

  /**
   * 首次使用：保存用户名，并把默认课程包的第一课写入学习进度。
   */
  async setupNewUser(user: UserEntity, dto: UpdateUserDto) {
    if (dto.username) {
      await this.updateUser(user, dto);
    }

    const coursePackEntity = await this.db.query.coursePack.findFirst({
      where: eq(coursePack.creatorId, "local"),
      orderBy: [asc(coursePack.order)],
      with: {
        courses: {
          where: eq(course.order, 1),
        },
      },
    });

    if (!coursePackEntity || coursePackEntity.courses.length === 0) {
      throw new NotFoundException("默认课程包不存在，请先完成种子化");
    }

    const firstCourse = coursePackEntity.courses[0];
    await this.userCourseProgressService.upsert(
      user.userId,
      coursePackEntity.id,
      firstCourse.id,
      0,
    );

    return {
      username: dto.username ?? (await this.readSettings(user.userId)).username ?? DEFAULT_USERNAME,
      avatar: dto.avatar,
      coursePack: coursePackEntity,
    };
  }
}
