import { Module } from "@nestjs/common";

import { AdminModule } from "../admin/admin.module";
import { CourseHistoryModule } from "../course-history/course-history.module";
import { CoursePackModule } from "../course-pack/course-pack.module";
import { CourseModule } from "../course/course.module";
import { GlobalModule } from "../global/global.module";
import { MasteredElementModule } from "../mastered-element/mastered-element.module";
import { ToolModule } from "../tool/tool.module";
import { UserCourseProgressModule } from "../user-course-progress/user-course-progress.module";
import { UserLearningActivityModule } from "../user-learning-activity/user-learning-activity.module";
import { UserModule } from "../user/user.module";
import { RendererModule } from "../renderer.module";

const rendererModule = RendererModule.forRoot();

@Module({
  imports: [
    GlobalModule,
    UserModule,
    CoursePackModule,
    CourseModule,
    UserCourseProgressModule,
    UserLearningActivityModule,
    ToolModule,
    CourseHistoryModule,
    MasteredElementModule,
    AdminModule,
    ...(rendererModule ? [rendererModule] : []),
  ],
})
export class AppModule {}
