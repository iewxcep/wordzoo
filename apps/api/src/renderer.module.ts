import { DynamicModule, Module } from "@nestjs/common";
import { ServeStaticModule, ServeStaticModuleOptions } from "@nestjs/serve-static";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * 解析 RENDERER_DIR（相对路径先按 cwd、再按仓库根解析）。
 */
function resolveRendererDir(): string | null {
  const dir = process.env.RENDERER_DIR;
  if (!dir) return null;

  const candidates = path.isAbsolute(dir)
    ? [dir]
    : [
        path.resolve(process.cwd(), dir),
        path.resolve(__dirname, "../../../../", dir),
        path.resolve(__dirname, "../../../", dir),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * 静态托管 nuxt generate 的渲染层产物；
 * 未设置 RENDERER_DIR 时不启用。必须在 AppModule 中最后 import，
 * 保证其通配路由注册在所有 API 路由之后。
 */
@Module({})
export class RendererModule {
  static forRoot(): DynamicModule | null {
    const rendererDir = resolveRendererDir();
    if (!rendererDir) return null;

    return {
      module: RendererModule,
      imports: [
        ServeStaticModule.forRootAsync({
          useFactory: (): ServeStaticModuleOptions[] => [
            {
              rootPath: rendererDir,
              serveStaticOptions: { index: "index.html", fallthrough: true },
            },
          ],
        }),
      ],
    };
  }
}
