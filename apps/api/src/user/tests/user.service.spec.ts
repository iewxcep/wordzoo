import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";

import { appSettings } from "@earthworm/schema";
import { insertCourse, insertCoursePack } from "../../../test/fixture/db";
import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { DB, DbType } from "../../global/providers/db.provider";
import { UserCourseProgressService } from "../../user-course-progress/user-course-progress.service";
import { UserService } from "../user.service";

describe("UserService", () => {
  let db: DbType;
  let userService: UserService;
  let userCourseProgressServiceMock: jest.Mocked<UserCourseProgressService>;

  beforeAll(async () => {
    const testHelper = await setupTesting();
    db = testHelper.db;
    userService = testHelper.userService;
    userCourseProgressServiceMock =
      testHelper.userCourseProgressService as jest.Mocked<UserCourseProgressService>;
  });

  afterAll(async () => {
    await cleanDB(db);
    await endDB();
  });

  beforeEach(async () => {
    await cleanDB(db);
    jest.clearAllMocks();
  });

  describe("findUser", () => {
    it("should return the local user profile with default username", async () => {
      const result = await userService.findUser("local-user");

      expect(result).toEqual({
        id: "local-user",
        username: "Learner",
        email: null,
        avatar: null,
      });
    });

    it("should return the stored username after update", async () => {
      await userService.updateUser({ userId: "local-user" }, { username: "cxr" });

      const result = await userService.findUser("local-user");

      expect(result.username).toBe("cxr");
    });
  });

  describe("findCurrentUser", () => {
    it("should return the current user info", async () => {
      const result = await userService.findCurrentUser("local-user");

      expect(result).toMatchObject({ id: "local-user", username: "Learner", email: null });
    });
  });

  describe("updateUser", () => {
    it("should persist username into app_settings", async () => {
      await userService.updateUser({ userId: "local-user" }, { username: "小明" });

      const record = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, "local-user"),
      });

      expect(JSON.parse(record.value)).toMatchObject({ username: "小明" });
    });
  });

  describe("setupNewUser", () => {
    it("should save username and upsert progress for the first course of the default pack", async () => {
      const coursePackEntity = await insertCoursePack(db, { creatorId: "local", order: 1 });
      const courseEntity = await insertCourse(db, coursePackEntity.id, { order: 1 });

      const result = await userService.setupNewUser(
        { userId: "local-user" },
        { username: "newUser", avatar: "custom-avatar.png" },
      );

      expect(result.username).toBe("newUser");
      expect(userCourseProgressServiceMock.upsert).toHaveBeenCalledWith(
        "local-user",
        coursePackEntity.id,
        courseEntity.id,
        0,
      );
    });

    it("should throw NotFoundException when the default pack is missing", async () => {
      await expect(
        userService.setupNewUser({ userId: "local-user" }, { username: "newUser" }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

async function setupTesting() {
  const userCourseProgressServiceMock = {
    upsert: jest.fn(),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: testImportModules,
    providers: [
      UserService,
      { provide: UserCourseProgressService, useValue: userCourseProgressServiceMock },
    ],
  }).compile();

  return {
    db: moduleRef.get<DbType>(DB),
    userService: moduleRef.get<UserService>(UserService),
    userCourseProgressService: moduleRef.get<UserCourseProgressService>(
      UserCourseProgressService,
    ),
  };
}
