import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Request, Response, NextFunction } from "express";

import { AppModule } from "./app/app.module";
import { appGlobalMiddleware } from "./app/useGlobal";
import { migrateDB, setupDB } from "./common/db";
import { SeedService } from "./common/seed.service";

// 课程包导入文件可达数 MB（一包 55 课、近 9000 条语句）
const JSON_BODY_LIMIT = "20mb";

/**
 * Single-origin hosting: frontend pages (/course-pack, /mastered-elements,
 * /admin, ...) collide with API GET routes. Browser navigations send
 * `Accept: text/html`, data requests do not — give HTML navigation the SPA
 * shell before the API router can answer with JSON.
 */
function spaHtmlFallback(app: NestExpressApplication): void {
  const rendererDir = process.env.RENDERER_DIR;
  if (!rendererDir) return;
  const indexHtml = require("node:path").join(rendererDir, "index.html");
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/docs") &&
      (req.headers.accept ?? "").includes("text/html")
    ) {
      res.sendFile(indexHtml);
      return;
    }
    next();
  });
}

async function bootstrap() {
  // 1. 建库 + 跑迁移
  const db = await setupDB();
  await migrateDB(db);

  // 2. 种子化默认课程包
  const seedService = new SeedService(db);
  await seedService.seedDefaultCoursePack();

  // 3. 启动 HTTP 服务（静态托管渲染层由 RendererModule/ServeStaticModule 处理）
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/],
  });

  // 先于 Nest 路由注册，覆盖默认 100kb 限制（Nest 自带 parser 检测到 _body 后跳过）
  app.use(require("express").json({ limit: JSON_BODY_LIMIT }));

  spaHtmlFallback(app);
  appGlobalMiddleware(app);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, "127.0.0.1");
}

bootstrap();
